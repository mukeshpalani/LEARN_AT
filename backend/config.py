import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "KnowledgePilot"
    ENV: str = "development"
    LOG_LEVEL: str = "INFO"

    # LLM Settings
    LLM_PROVIDER: str = "gemini" # gemini, openai, ollama
    LLM_MODEL: str = "gemini-2.5-flash"
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # Embedding Settings
    EMBEDDING_PROVIDER: str = "local" # local, gemini, openai
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # Vector DB Settings
    QDRANT_MODE: str = "local" # local, remote
    QDRANT_STORAGE_PATH: str = "./qdrant_db"
    QDRANT_URL: Optional[str] = None
    QDRANT_API_KEY: Optional[str] = None
    COLLECTION_NAME: str = "knowledge_pilot"

    # Database Settings
    DATABASE_URL: str = "sqlite:///./knowledgepilot.db"

    # Web Research Settings
    ENABLE_WEB_RESEARCH: bool = True

    # Directories
    DOCUMENTS_DIR: str = "./documents"
    REPORTS_DIR: str = "./generated_reports"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

# Ensure required directories exist
Path(settings.DOCUMENTS_DIR).mkdir(parents=True, exist_ok=True)
Path(settings.REPORTS_DIR).mkdir(parents=True, exist_ok=True)
Path(settings.QDRANT_STORAGE_PATH).mkdir(parents=True, exist_ok=True)
