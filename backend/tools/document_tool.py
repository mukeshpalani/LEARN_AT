import logging
from typing import List, Dict, Any, Optional
from backend.rag.retrieval import QdrantVectorStore

logger = logging.getLogger(__name__)


class DocumentSearchTool:
    def __init__(self, vector_store: Optional[QdrantVectorStore] = None):
        self.vector_store = vector_store or QdrantVectorStore.get_instance()

    def search_documents(
        self,
        query: str,
        limit: int = 5,
        filter_document_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        logger.info(f"Document search tool query: '{query}' limit={limit}")
        return self.vector_store.search(
            query=query,
            limit=limit,
            filter_document_id=filter_document_id
        )
