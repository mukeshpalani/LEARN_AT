import uuid
from typing import List, Dict, Any
from backend.rag.parser import ParsedDocument


class Chunk:
    def __init__(
        self,
        chunk_id: str,
        document_id: str,
        filename: str,
        file_type: str,
        page_number: int,
        content: str,
        metadata: Dict[str, Any]
    ):
        self.chunk_id = chunk_id
        self.document_id = document_id
        self.filename = filename
        self.file_type = file_type
        self.page_number = page_number
        self.content = content
        self.metadata = metadata


class ChunkingEngine:
    def __init__(self, chunk_size: int = 600, overlap: int = 100):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk_document(self, doc: ParsedDocument, document_id: str) -> List[Chunk]:
        chunks: List[Chunk] = []
        chunk_idx = 0

        for page in doc.pages:
            text = page.content.strip()
            if not text:
                continue

            # Split page text into overlapping windows
            page_chunks = self._split_text(text)

            for text_chunk in page_chunks:
                chunk_id = f"{document_id}_p{page.page_number}_c{chunk_idx}"
                metadata = {
                    "document_id": document_id,
                    "filename": doc.filename,
                    "file_type": doc.file_type,
                    "page_number": page.page_number,
                    "chunk_id": chunk_id,
                    "source_type": doc.file_type,
                    **page.metadata
                }

                chunks.append(
                    Chunk(
                        chunk_id=chunk_id,
                        document_id=document_id,
                        filename=doc.filename,
                        file_type=doc.file_type,
                        page_number=page.page_number,
                        content=text_chunk,
                        metadata=metadata
                    )
                )
                chunk_idx += 1

        return chunks

    def _split_text(self, text: str) -> List[str]:
        """Recursive character text splitter logic."""
        if len(text) <= self.chunk_size:
            return [text]

        chunks = []
        start = 0
        while start < len(text):
            end = start + self.chunk_size
            if end >= len(text):
                chunks.append(text[start:].strip())
                break

            # Try to break at paragraph, line, or space boundary
            break_pos = text.rfind("\n\n", start, end)
            if break_pos == -1 or break_pos <= start:
                break_pos = text.rfind("\n", start, end)
            if break_pos == -1 or break_pos <= start:
                break_pos = text.rfind(" ", start, end)
            if break_pos == -1 or break_pos <= start:
                break_pos = end

            chunks.append(text[start:break_pos].strip())
            start = max(start + 1, break_pos - self.overlap)

        return [c for c in chunks if c]
