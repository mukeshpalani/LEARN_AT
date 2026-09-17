import sys
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.database.connection import init_db
from backend.api import documents, chat, tasks, reports, evaluation, email

# Configure UTF-8 encoding for stdout and stderr on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Configure logging
stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    handlers=[stream_handler]
)
logger = logging.getLogger("KnowledgePilot")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} Backend Engine...")
    init_db()
    logger.info("Database initialized successfully.")
    
    # Auto-sync existing files in documents directory
    try:
        from backend.database.connection import SessionLocal
        from backend.rag.ingestion import IngestionPipeline
        with SessionLocal() as db:
            pipeline = IngestionPipeline(db)
            synced = pipeline.sync_documents_dir()
            if synced > 0:
                logger.info(f"Auto-synced {synced} documents from disk.")
    except Exception as e:
        logger.warning(f"Startup document auto-sync notice: {e}")
        
    yield
    logger.info("Shutting down KnowledgePilot Backend Engine.")


app = FastAPI(
    title=settings.APP_NAME,
    description="Multi-Agent Retrieval-Augmented Intelligence System for Autonomous Document Analysis, Research and Decision Support",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(tasks.router)
app.include_router(reports.router)
app.include_router(evaluation.router)
app.include_router(email.router)


@app.get("/")
def root():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "environment": settings.ENV,
        "llm_provider": settings.LLM_PROVIDER,
        "embedding_provider": settings.EMBEDDING_PROVIDER,
        "qdrant_mode": settings.QDRANT_MODE,
        "web_research_enabled": settings.ENABLE_WEB_RESEARCH
    }
