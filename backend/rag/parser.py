import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import pandas as pd
from pypdf import PdfReader
import docx

logger = logging.getLogger(__name__)


class ParsedPage:
    def __init__(self, page_number: int, content: str, metadata: Optional[Dict[str, Any]] = None):
        self.page_number = page_number
        self.content = content
        self.metadata = metadata or {}


class ParsedDocument:
    def __init__(self, filename: str, file_type: str, pages: List[ParsedPage], raw_data: Optional[Any] = None):
        self.filename = filename
        self.file_type = file_type
        self.pages = pages
        self.raw_data = raw_data


class DocumentParser:
    @staticmethod
    def parse_file(file_path: str, filename: str) -> ParsedDocument:
        path = Path(file_path)
        ext = path.suffix.lower()

        if ext == ".pdf":
            return DocumentParser._parse_pdf(file_path, filename)
        elif ext in [".docx", ".doc"]:
            return DocumentParser._parse_docx(file_path, filename)
        elif ext == ".txt":
            return DocumentParser._parse_txt(file_path, filename)
        elif ext == ".csv":
            return DocumentParser._parse_csv(file_path, filename)
        elif ext in [".xlsx", ".xls"]:
            return DocumentParser._parse_excel(file_path, filename)
        elif ext == ".json":
            return DocumentParser._parse_json(file_path, filename)
        else:
            raise ValueError(f"Unsupported file format: {ext}")

    @staticmethod
    def _parse_pdf(file_path: str, filename: str) -> ParsedDocument:
        reader = PdfReader(file_path)
        pages = []
        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            pages.append(ParsedPage(page_number=idx + 1, content=text.strip()))
        return ParsedDocument(filename=filename, file_type="pdf", pages=pages)

    @staticmethod
    def _parse_docx(file_path: str, filename: str) -> ParsedDocument:
        doc = docx.Document(file_path)
        full_text = []

        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text.strip())

        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join([cell.text.strip() for cell in row.cells if cell.text.strip()])
                if row_text:
                    full_text.append(row_text)

        content = "\n\n".join(full_text)
        # For docx, default to single page unless page break found
        pages = [ParsedPage(page_number=1, content=content)]
        return ParsedDocument(filename=filename, file_type="docx", pages=pages)

    @staticmethod
    def _parse_txt(file_path: str, filename: str) -> ParsedDocument:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        pages = [ParsedPage(page_number=1, content=content.strip())]
        return ParsedDocument(filename=filename, file_type="txt", pages=pages)

    @staticmethod
    def _parse_csv(file_path: str, filename: str) -> ParsedDocument:
        df = pd.read_csv(file_path)
        summary = f"CSV File with {len(df)} rows and columns: {', '.join(df.columns)}\n\n"
        preview = df.head(100).to_string()
        full_content = summary + preview
        pages = [ParsedPage(page_number=1, content=full_content)]
        return ParsedDocument(filename=filename, file_type="csv", pages=pages, raw_data=df.to_dict(orient="records"))

    @staticmethod
    def _parse_excel(file_path: str, filename: str) -> ParsedDocument:
        excel_file = pd.ExcelFile(file_path)
        pages = []
        raw_sheets = {}

        for idx, sheet_name in enumerate(excel_file.sheet_names):
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            summary = f"Sheet '{sheet_name}' - {len(df)} rows, columns: {', '.join(df.columns)}\n\n"
            content = summary + df.to_string()
            pages.append(ParsedPage(page_number=idx + 1, content=content, metadata={"sheet_name": sheet_name}))
            raw_sheets[sheet_name] = df.to_dict(orient="records")

        return ParsedDocument(filename=filename, file_type="xlsx", pages=pages, raw_data=raw_sheets)

    @staticmethod
    def _parse_json(file_path: str, filename: str) -> ParsedDocument:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            data = json.load(f)

        content = json.dumps(data, indent=2)
        pages = [ParsedPage(page_number=1, content=content)]
        return ParsedDocument(filename=filename, file_type="json", pages=pages, raw_data=data)
