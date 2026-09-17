import logging
from typing import Dict, Any, List
from backend.tools.web_search import WebSearchTool

logger = logging.getLogger(__name__)


class ResearchAgent:
    @staticmethod
    def run(query: str) -> List[Dict[str, Any]]:
        logger.info(f"Running Research Agent for query: '{query}'")
        search_results = WebSearchTool.search(query=query, max_results=5)
        logger.info(f"Research Agent fetched {len(search_results)} web search results.")
        return search_results
