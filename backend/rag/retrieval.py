import logging
import uuid
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from backend.config import settings
from backend.rag.embeddings import EmbeddingManager
from backend.rag.chunking import Chunk

logger = logging.getLogger(__name__)


class QdrantVectorStore:
    _shared_client: Optional[QdrantClient] = None
    _shared_instance: Optional['QdrantVectorStore'] = None

    @classmethod
    def get_instance(cls, embedding_manager: Optional[EmbeddingManager] = None) -> 'QdrantVectorStore':
        if cls._shared_instance is None:
            cls._shared_instance = QdrantVectorStore(embedding_manager=embedding_manager)
        return cls._shared_instance

    def __init__(self, embedding_manager: Optional[EmbeddingManager] = None):
        self.embedding_manager = embedding_manager or EmbeddingManager()
        self.collection_name = settings.COLLECTION_NAME

        if QdrantVectorStore._shared_client is not None:
            self.client = QdrantVectorStore._shared_client
        else:
            if settings.QDRANT_MODE == "remote" and settings.QDRANT_URL:
                logger.info(f"Connecting to remote Qdrant at {settings.QDRANT_URL}")
                self.client = QdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY)
            else:
                logger.info(f"Initializing local Qdrant at path {settings.QDRANT_STORAGE_PATH}")
                try:
                    self.client = QdrantClient(path=settings.QDRANT_STORAGE_PATH)
                except Exception as lock_err:
                    logger.warning(f"Storage path locked ({lock_err}), using in-memory Qdrant instance for session.")
                    self.client = QdrantClient(location=":memory:")
            QdrantVectorStore._shared_client = self.client

        QdrantVectorStore._shared_instance = self
        self._ensure_collection()

    def _ensure_collection(self):
        dim = self.embedding_manager.get_dimension()
        collections = self.client.get_collections().collections
        exists = any(c.name == self.collection_name for c in collections)

        if not exists:
            logger.info(f"Creating Qdrant collection '{self.collection_name}' with vector size {dim}")
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=qmodels.VectorParams(
                    size=dim,
                    distance=qmodels.Distance.COSINE
                )
            )

    def upsert_chunks(self, chunks: List[Chunk]) -> None:
        if not chunks:
            return

        texts = [c.content for c in chunks]
        embeddings = self.embedding_manager.embed_texts(texts)

        points = []
        for idx, (chunk, vector) in enumerate(zip(chunks, embeddings)):
            # Convert str chunk_id to UUID integer or valid UUID string for Qdrant
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk.chunk_id))
            payload = {
                "document_id": chunk.document_id,
                "filename": chunk.filename,
                "file_type": chunk.file_type,
                "page_number": chunk.page_number,
                "chunk_id": chunk.chunk_id,
                "text": chunk.content,
                **chunk.metadata
            }
            points.append(
                qmodels.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload
                )
            )

        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )
        logger.info(f"Successfully upserted {len(points)} vector chunks into Qdrant.")

    def search(
        self,
        query: str,
        limit: int = 5,
        filter_document_id: Optional[str] = None,
        filter_category: Optional[str] = None,
        score_threshold: float = 0.3
    ) -> List[Dict[str, Any]]:
        query_vector = self.embedding_manager.embed_query(query)

        qfilter = None
        conditions = []
        if filter_document_id:
            conditions.append(
                qmodels.FieldCondition(
                    key="document_id",
                    match=qmodels.MatchValue(value=filter_document_id)
                )
            )
        if filter_category:
            conditions.append(
                qmodels.FieldCondition(
                    key="category",
                    match=qmodels.MatchValue(value=filter_category)
                )
            )

        if conditions:
            qfilter = qmodels.Filter(must=conditions)

        try:
            if hasattr(self.client, "query_points"):
                search_res = self.client.query_points(
                    collection_name=self.collection_name,
                    query=query_vector,
                    query_filter=qfilter,
                    limit=limit,
                    score_threshold=score_threshold
                )
                search_results = search_res.points
            else:
                search_results = self.client.search(
                    collection_name=self.collection_name,
                    query_vector=query_vector,
                    query_filter=qfilter,
                    limit=limit,
                    score_threshold=score_threshold
                )
        except Exception as e:
            logger.error(f"Qdrant search error: {e}")
            search_results = []

        results = []
        for hit in search_results:
            results.append({
                "score": getattr(hit, "score", 0.0),
                "chunk_id": hit.payload.get("chunk_id"),
                "document_id": hit.payload.get("document_id"),
                "filename": hit.payload.get("filename"),
                "page_number": hit.payload.get("page_number", 1),
                "text": hit.payload.get("text", ""),
                "payload": hit.payload
            })

        return results

    def delete_document_vectors(self, document_id: str) -> None:
        """Removes all vectors belonging to document_id."""
        logger.info(f"Deleting vector chunks for document_id={document_id}")
        self.client.delete(
            collection_name=self.collection_name,
            points_selector=qmodels.FilterSelector(
                filter=qmodels.Filter(
                    must=[
                        qmodels.FieldCondition(
                            key="document_id",
                            match=qmodels.MatchValue(value=document_id)
                        )
                    ]
                )
            )
        )
