import logging
from typing import Dict, Any, Optional
from backend.tools.python_tool import PythonDataTool

logger = logging.getLogger(__name__)


class DataAnalysisTool:
    """
    Tool 3 — Data Analysis Tool
    Python/Pandas-based analysis tool for tasks involving:
    - calculations
    - comparisons
    - tabular computations
    - numerical analysis on CSV, XLSX, JSON datasets
    """
    @staticmethod
    def run_analysis(code: str, data_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        logger.info("Executing DataAnalysisTool pandas runner.")
        return PythonDataTool.execute_pandas_code(code=code, data_context=data_context)
