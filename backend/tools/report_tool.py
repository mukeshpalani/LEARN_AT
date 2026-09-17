import logging
from typing import Dict, Any, List, Optional
from backend.agents.report_agent import ReportAgent

logger = logging.getLogger(__name__)


class ReportTool:
    """
    Tool 4 — Report / Output Tool
    Converts agent results into structured executive outputs:
    - Brief
    - Summary
    - Checklist
    - Comparison
    - Formal Report (Markdown, DOCX, PDF)
    """
    @staticmethod
    def format_output(
        title: str,
        query: str,
        content: str,
        citations: List[Dict[str, Any]],
        format_type: str = "markdown"
    ) -> Dict[str, Any]:
        logger.info(f"Executing ReportTool for '{title}' format={format_type}")
        return ReportAgent.generate_report(
            title=title,
            query=query,
            final_response=content,
            citations=citations,
            format_type=format_type
        )
