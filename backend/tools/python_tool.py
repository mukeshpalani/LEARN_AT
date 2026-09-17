import sys
import io
import logging
import pandas as pd
import numpy as np
import json
from typing import Dict, Any

logger = logging.getLogger(__name__)


class PythonDataTool:
    @staticmethod
    def execute_pandas_code(code: str, data_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Executes Python/Pandas data manipulation code safely in a restricted global scope.
        data_context can contain loaded DataFrames or dicts (e.g. {'df': pd.DataFrame(...)})
        """
        local_scope = {
            "pd": pd,
            "np": np,
            "json": json,
            **(data_context or {})
        }
        
        # Buffer stdout
        old_stdout = sys.stdout
        redirected_output = io.StringIO()
        sys.stdout = redirected_output

        try:
            # Clean code fences if LLM generated them
            cleaned_code = code.strip()
            if cleaned_code.startswith("```python"):
                cleaned_code = cleaned_code[9:]
            if cleaned_code.startswith("```"):
                cleaned_code = cleaned_code[3:]
            if cleaned_code.endswith("```"):
                cleaned_code = cleaned_code[:-3]
            cleaned_code = cleaned_code.strip()

            exec(cleaned_code, {"__builtins__": {
                "__import__": __import__, "range": range, "len": len, "str": str, "int": int, "float": float,
                "list": list, "dict": dict, "set": set, "sum": sum, "max": max,
                "min": min, "round": round, "abs": abs, "enumerate": enumerate,
                "zip": zip, "print": print, "isinstance": isinstance
            }}, local_scope)

            sys.stdout = old_stdout
            stdout_str = redirected_output.getvalue()

            # Find result variable if assigned or returned in scope
            result = local_scope.get("result", stdout_str)
            if isinstance(result, (pd.DataFrame, pd.Series)):
                result_repr = result.to_string()
            else:
                result_repr = str(result)

            return {
                "success": True,
                "stdout": stdout_str,
                "result": result_repr,
                "error": None
            }

        except Exception as e:
            sys.stdout = old_stdout
            logger.error(f"Pandas code execution error: {str(e)}", exc_info=True)
            return {
                "success": False,
                "stdout": redirected_output.getvalue(),
                "result": None,
                "error": str(e)
            }
