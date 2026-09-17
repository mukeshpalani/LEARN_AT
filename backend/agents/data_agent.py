import os
import logging
from pathlib import Path
from typing import Dict, Any, List
import pandas as pd
from backend.config import settings
from backend.tools.python_tool import PythonDataTool
from backend.services.llm_service import LLMService

logger = logging.getLogger(__name__)


class DataAgent:
    @staticmethod
    def run(query: str) -> Dict[str, Any]:
        logger.info(f"Running Data Analysis Agent for query: '{query}'")

        # Scan documents directory for CSV / XLSX / JSON files
        doc_dir = Path(settings.DOCUMENTS_DIR)
        structured_files = list(doc_dir.glob("*.csv")) + list(doc_dir.glob("*.xlsx")) + list(doc_dir.glob("*.json"))

        if not structured_files:
            logger.info("No CSV/XLSX/JSON files found for Data Agent.")
            return {
                "has_data": False,
                "summary": "No structured dataset (CSV/XLSX/JSON) available in the knowledge base.",
                "calculation_result": None
            }

        # Load data context
        data_context = {}
        file_summaries = []

        for fpath in structured_files:
            try:
                fname = fpath.name
                ext = fpath.suffix.lower()
                var_name = fpath.stem.replace(" ", "_").replace("-", "_").lower()

                if ext == ".csv":
                    df = pd.read_csv(fpath)
                    data_context[var_name] = df
                    file_summaries.append(f"DataFrame '{var_name}' from {fname}: columns={list(df.columns)}, rows={len(df)}")
                elif ext in [".xlsx", ".xls"]:
                    excel_file = pd.ExcelFile(fpath)
                    for sname in excel_file.sheet_names:
                        df = pd.read_excel(excel_file, sheet_name=sname)
                        sheet_var = f"{var_name}_{sname.replace(' ', '_').lower()}"
                        data_context[sheet_var] = df
                        file_summaries.append(f"DataFrame '{sheet_var}' from {fname} [{sname}]: columns={list(df.columns)}, rows={len(df)}")
            except Exception as e:
                logger.warning(f"Could not load structured file {fpath}: {e}")

        if not data_context:
            return {
                "has_data": False,
                "summary": "Failed to parse structured datasets.",
                "calculation_result": None
            }

        # Generate pandas code prompt
        summaries_text = "\n".join(file_summaries)
        prompt = f"""You are a Python Pandas Data Scientist.
Given the available DataFrames:
{summaries_text}

User Query: "{query}"

Write Python code using pandas (`pd`) to calculate the exact answer requested.
Save the final formatted answer string or metric in a variable called `result`.
Example code:
df = data_context['attendance_policy']
filtered = df[df['attendance'] < 75]
result = f"Found {{len(filtered)}} students below 75%: {{filtered['name'].tolist()}}"

Return ONLY executable Python code inside code fence.
"""
        generated_code = LLMService.generate(prompt)

        # Execute code via PythonDataTool
        exec_out = PythonDataTool.execute_pandas_code(generated_code, data_context=data_context)

        return {
            "has_data": True,
            "query": query,
            "file_summaries": file_summaries,
            "generated_code": generated_code,
            "execution_out": exec_out,
            "summary": exec_out.get("result", exec_out.get("stdout", "Calculation executed."))
        }
