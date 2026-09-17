import logging
import datetime
from typing import List, Dict, Any
from backend.config import settings

logger = logging.getLogger(__name__)


class WebSearchTool:
    @staticmethod
    def search(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        if not settings.ENABLE_WEB_RESEARCH:
            logger.info("Web research is disabled via configuration (ENABLE_WEB_RESEARCH=false).")
            return [{
                "title": "Web Search Disabled",
                "url": "N/A",
                "snippet": "External web research is disabled in system configuration.",
                "timestamp": datetime.datetime.now().isoformat()
            }]

        try:
            from duckduckgo_search import DDGS
            logger.info(f"Executing web research query: '{query}'")
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=max_results))

            formatted_results = []
            for r in results:
                formatted_results.append({
                    "title": r.get("title", ""),
                    "url": r.get("href", r.get("link", "")),
                    "snippet": r.get("body", r.get("snippet", "")),
                    "timestamp": datetime.datetime.now().isoformat()
                })
            return formatted_results

        except Exception as e:
            logger.error(f"Web search failed: {str(e)}")
            return [{
                "title": "Search Error",
                "url": "N/A",
                "snippet": f"Web search could not be completed: {str(e)}",
                "timestamp": datetime.datetime.now().isoformat()
            }]
