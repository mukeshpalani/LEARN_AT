import os
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database.models import Document, DocumentChunk
from backend.rag.parser import DocumentParser
from backend.rag.chunking import ChunkingEngine
from backend.rag.retrieval import QdrantVectorStore

logger = logging.getLogger(__name__)


class IngestionPipeline:
    def __init__(self, db: Session, vector_store: Optional[QdrantVectorStore] = None):
        self.db = db
        self.vector_store = vector_store or QdrantVectorStore.get_instance()
        self.chunker = ChunkingEngine(chunk_size=600, overlap=100)

    def process_file(
        self,
        file_path: str,
        filename: str,
        category: str = "general"
    ) -> Document:
        path = Path(file_path)
        file_size = path.stat().st_size
        file_type = path.suffix.replace(".", "").lower()

        # Create database record
        doc_record = Document(
            filename=filename,
            file_type=file_type,
            file_size_bytes=file_size,
            category=category,
            status="processing"
        )
        self.db.add(doc_record)
        self.db.commit()
        self.db.refresh(doc_record)

        try:
            # 1. Parse document
            logger.info(f"Parsing document {filename}...")
            parsed_doc = DocumentParser.parse_file(file_path, filename)

            # 2. Chunk document
            logger.info(f"Chunking document {filename}...")
            chunks = self.chunker.chunk_document(parsed_doc, doc_record.id)

            # 3. Embed & Store in Qdrant
            logger.info(f"Upserting {len(chunks)} chunks into Qdrant for {filename}...")
            self.vector_store.upsert_chunks(chunks)

            # 4. Save chunk records to relational DB
            db_chunks = []
            for chunk in chunks:
                db_chunks.append(
                    DocumentChunk(
                        document_id=doc_record.id,
                        chunk_id=chunk.chunk_id,
                        chunk_text=chunk.content,
                        page_number=chunk.page_number,
                        metadata_json=chunk.metadata
                    )
                )
            self.db.add_all(db_chunks)

            # Update document status
            doc_record.status = "processed"
            doc_record.chunk_count = len(chunks)
            self.db.commit()
            self.db.refresh(doc_record)

            logger.info(f"Document {filename} successfully ingested with ID {doc_record.id}")
            return doc_record

        except Exception as e:
            logger.error(f"Ingestion failed for {filename}: {str(e)}", exc_info=True)
            doc_record.status = "error"
            doc_record.error_message = str(e)
            self.db.commit()
            raise e

    def delete_file(self, document_id: str) -> bool:
        """Deletes a document, its DB chunks, vector DB chunks, and disk file."""
        doc = self.db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return False

        # 1. Delete vector entries from Qdrant
        self.vector_store.delete_document_vectors(document_id)

        # 2. Delete file on disk if present
        disk_path = Path(settings.DOCUMENTS_DIR) / doc.filename
        if disk_path.exists():
            try:
                disk_path.unlink()
            except Exception as e:
                logger.warning(f"Could not delete physical file {disk_path}: {e}")

        # 3. Delete from DB (cascades to document_chunks)
        self.db.delete(doc)
        self.db.commit()

        logger.info(f"Successfully deleted document ID {document_id}")
        return True

    def sync_documents_dir(self) -> int:
        """Scans settings.DOCUMENTS_DIR and ingests any unindexed files into SQLite and Qdrant."""
        doc_dir = Path(settings.DOCUMENTS_DIR)
        if not doc_dir.exists():
            return 0

        supported_exts = {".pdf", ".docx", ".doc", ".txt", ".csv", ".xlsx", ".xls", ".json"}
        existing_filenames = {doc.filename for doc in self.db.query(Document.filename).all()}

        synced_count = 0
        for fpath in doc_dir.iterdir():
            if fpath.is_file() and fpath.suffix.lower() in supported_exts:
                if fpath.name not in existing_filenames:
                    try:
                        logger.info(f"Auto-syncing document from disk: {fpath.name}")
                        self.process_file(str(fpath), fpath.name)
                        synced_count += 1
                    except Exception as e:
                        logger.warning(f"Failed to auto-sync {fpath.name}: {e}")

        logger.info(f"Auto-sync completed. Synced {synced_count} new documents.")
        return synced_count

