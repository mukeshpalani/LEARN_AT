import logging
from typing import List, Union
from backend.config import settings

logger = logging.getLogger(__name__)


class EmbeddingManager:
    def __init__(self):
        self.provider = settings.EMBEDDING_PROVIDER
        self.model_name = settings.EMBEDDING_MODEL
        self._local_model = None

    def _get_local_model(self):
        if self._local_model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading local SentenceTransformer model: {self.model_name}")
                self._local_model = SentenceTransformer(self.model_name)
            except Exception as e:
                logger.warning(f"Failed to load sentence-transformers ({e}). Falling back to dummy embedding.")
                self._local_model = "dummy"
        return self._local_model

    def get_dimension(self) -> int:
        if self.provider == "local":
            model = self._get_local_model()
            if hasattr(model, "get_embedding_dimension"):
                return model.get_embedding_dimension()
            return model.get_sentence_embedding_dimension()
        elif self.provider == "openai":
            return 1536
        elif self.provider == "gemini":
            return 768
        return 384

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        if self.provider == "local":
            model = self._get_local_model()
            if model == "dummy":
                return [[0.0] * 384 for _ in texts]
            embeddings = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
            return embeddings.tolist()
        
        elif self.provider == "gemini":
            try:
                from langchain_google_genai import GoogleGenerativeAIEmbeddings
                embedder = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=settings.GEMINI_API_KEY)
                return embedder.embed_documents(texts)
            except Exception as e:
                logger.error(f"Gemini embedding failed ({e}), using local fallback.")
                return self.embed_texts_local(texts)

        elif self.provider == "openai":
            try:
                from langchain_openai import OpenAIEmbeddings
                embedder = OpenAIEmbeddings(model="text-embedding-3-small", api_key=settings.OPENAI_API_KEY)
                return embedder.embed_documents(texts)
            except Exception as e:
                logger.error(f"OpenAI embedding failed ({e}), using local fallback.")
                return self.embed_texts_local(texts)

        return [[0.0] * 384 for _ in texts]

    def embed_texts_local(self, texts: List[str]) -> List[List[float]]:
        model = self._get_local_model()
        if model == "dummy":
            return [[0.0] * 384 for _ in texts]
        embeddings = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
        return embeddings.tolist()

    def embed_query(self, query: str) -> List[float]:
        results = self.embed_texts([query])
        return results[0] if results else [0.0] * self.get_dimension()
