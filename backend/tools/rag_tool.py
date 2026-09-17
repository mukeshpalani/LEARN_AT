import logging
from typing import List, Dict, Any, Optional
from backend.rag.retrieval import QdrantVectorStore

logger = logging.getLogger(__name__)


class RAGTool:
    """
    Tool 2 — RAG Retrieval Tool
    Retrieves relevant sections/chunks from selected vector documents with preserved metadata:
    - filename
    - page_number (1-based for PDF)
    - chunk_id
    - document_id
    - evidence text
    """
    def __init__(self, vector_store: Optional[QdrantVectorStore] = None):
        self.vector_store = vector_store or QdrantVectorStore.get_instance()

    def retrieve_chunks(
        self,
        query: str,
        limit: int = 6,
        filter_document_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        logger.info(f"Executing RAGTool for query: '{query}', limit={limit}, doc_filter={filter_document_id}")
        raw_chunks = self.vector_store.search(
            query=query,
            limit=limit,
            filter_document_id=filter_document_id
        )

        formatted_chunks = []
        for idx, chunk in enumerate(raw_chunks, start=1):
            formatted_chunks.append({
                "chunk_num": idx,
                "document": chunk.get("filename", "Unknown Document"),
                "document_id": chunk.get("document_id", ""),
                "page": chunk.get("page_number", 1),
                "chunk_id": chunk.get("chunk_id", ""),
                "evidence": chunk.get("text", ""),
                "score": round(float(chunk.get("score", 0.0)), 4)
            })

        logger.info(f"RAGTool retrieved {len(formatted_chunks)} relevant evidence chunks.")
        return formatted_chunks
