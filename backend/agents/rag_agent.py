import logging
from typing import Dict, Any, List, Optional
from backend.rag.retrieval import QdrantVectorStore

logger = logging.getLogger(__name__)


class RAGAgent:
    def __init__(self, vector_store: Optional[QdrantVectorStore] = None):
        self.vector_store = vector_store or QdrantVectorStore.get_instance()

    def run(self, query: str, plan: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        logger.info(f"Running RAG Agent for query: '{query}'")

        # Perform hybrid vector search
        raw_chunks = self.vector_store.search(query=query, limit=8)

        evidence_sources = []
        seen_texts = set()

        for chunk in raw_chunks:
            text = chunk.get("text", "").strip()
            # Simple hash check to deduplicate exact or overlapping chunks
            text_key = text[:100].lower()
            if text_key in seen_texts:
                continue
            seen_texts.add(text_key)

            evidence_sources.append({
                "document": chunk.get("filename", "Unknown Document"),
                "document_id": chunk.get("document_id", ""),
                "page": chunk.get("page_number", 1),
                "chunk_id": chunk.get("chunk_id", ""),
                "evidence": text,
                "score": round(float(chunk.get("score", 0.0)), 4)
            })

        # Rank evidence sources by score descending
        evidence_sources.sort(key=lambda x: x["score"], reverse=True)

        logger.info(f"RAG Agent retrieved and deduplicated {len(evidence_sources)} evidence chunks.")
        return evidence_sources
