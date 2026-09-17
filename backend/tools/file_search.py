import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.config import settings
from backend.database.models import Document
from backend.rag.retrieval import QdrantVectorStore

logger = logging.getLogger(__name__)


class FileSearchTool:
    """
    Tool 1 — File Search
    Finds the most relevant files from uploaded documents based on:
    - filename keyword matching
    - document metadata / file type
    - semantic vector similarity
    - query context
    """
    def __init__(self, db: Optional[Session] = None, vector_store: Optional[QdrantVectorStore] = None):
        self.db = db
        self.vector_store = vector_store or QdrantVectorStore.get_instance()

    def search_files(
        self,
        query: str,
        limit: int = 5,
        file_types: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        logger.info(f"Executing FileSearchTool for query: '{query}'")
        q_lower = query.lower()

        matched_files = []

        # 1. Query database for filename/metadata keyword matches if DB session provided
        if self.db:
            try:
                db_docs = self.db.query(Document).filter(Document.status == "processed").all()
                for doc in db_docs:
                    score = 0.0
                    fn_lower = doc.filename.lower()
                    # Check filename tokens
                    words = [w for w in q_lower.replace("_", " ").replace("-", " ").split() if len(w) > 2]
                    for w in words:
                        if w in fn_lower:
                            score += 0.3
                    
                    if file_types and doc.file_type in file_types:
                        score += 0.2

                    if score > 0:
                        matched_files.append({
                            "document_id": doc.id,
                            "filename": doc.filename,
                            "file_type": doc.file_type,
                            "category": doc.category,
                            "score": min(score, 1.0),
                            "match_reason": "Filename/metadata keyword match"
                        })
            except Exception as e:
                logger.warning(f"Database file search error: {e}")

        # 2. Semantic vector search across document chunks
        try:
            semantic_results = self.vector_store.search(query=query, limit=limit * 2)
            doc_scores: Dict[str, Dict[str, Any]] = {}
            
            for res in semantic_results:
                doc_id = res.get("document_id") or res.get("filename")
                score = res.get("score", 0.0)
                fname = res.get("filename", "Unknown")

                if doc_id not in doc_scores:
                    doc_scores[doc_id] = {
                        "document_id": doc_id,
                        "filename": fname,
                        "file_type": Path(fname).suffix.replace(".", "").lower() if fname else "pdf",
                        "max_score": score,
                        "chunk_matches": 1,
                        "sample_snippet": res.get("text", "")[:150]
                    }
                else:
                    doc_scores[doc_id]["max_score"] = max(doc_scores[doc_id]["max_score"], score)
                    doc_scores[doc_id]["chunk_matches"] += 1

            for doc_info in doc_scores.values():
                # Avoid duplicate entries if already added by metadata match
                if not any(f["filename"] == doc_info["filename"] for f in matched_files):
                    matched_files.append({
                        "document_id": doc_info["document_id"],
                        "filename": doc_info["filename"],
                        "file_type": doc_info["file_type"],
                        "score": round(float(doc_info["max_score"]), 3),
                        "chunk_matches": doc_info["chunk_matches"],
                        "sample_snippet": doc_info["sample_snippet"],
                        "match_reason": "Semantic content relevance"
                    })
        except Exception as e:
            logger.warning(f"Semantic file search error: {e}")

        # Sort by relevance score descending
        matched_files.sort(key=lambda x: x.get("score", 0.0), reverse=True)
        return matched_files[:limit]
