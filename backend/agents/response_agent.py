import logging
from typing import Dict, Any, List
from backend.services.llm_service import LLMService

logger = logging.getLogger(__name__)


class ResponseAgent:
    @staticmethod
    def consolidate_citations(retrieved_context: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Groups chunks by document filename and consolidates page numbers into clean displays:
        - Single page: 'Page 1'
        - Contiguous range: 'Pages 1–3'
        - Multiple pages: 'Pages 1, 4, 7'
        """
        doc_map: Dict[str, Dict[str, Any]] = {}

        for ctx in retrieved_context:
            doc_name = ctx.get("document", "Unknown Document")
            page_num = ctx.get("page", 1)
            doc_id = ctx.get("document_id", "")
            chunk_id = ctx.get("chunk_id", "")
            evidence_text = ctx.get("evidence", "")

            if doc_name not in doc_map:
                doc_map[doc_name] = {
                    "document": doc_name,
                    "document_id": doc_id,
                    "pages": set(),
                    "chunks": []
                }
            
            try:
                doc_map[doc_name]["pages"].add(int(page_num))
            except (ValueError, TypeError):
                pass
                
            doc_map[doc_name]["chunks"].append({
                "chunk_id": chunk_id,
                "page": page_num,
                "evidence": evidence_text
            })

        consolidated = []
        for doc_name, data in doc_map.items():
            sorted_pages = sorted(list(data["pages"]))
            if not sorted_pages:
                pages_display = "Page 1"
            elif len(sorted_pages) == 1:
                pages_display = f"Page {sorted_pages[0]}"
            else:
                # Check if contiguous range
                min_p, max_p = sorted_pages[0], sorted_pages[-1]
                if max_p - min_p + 1 == len(sorted_pages):
                    pages_display = f"Pages {min_p}–{max_p}"
                else:
                    pages_display = f"Pages {', '.join(str(p) for p in sorted_pages)}"

            formatted_source = f"• {doc_name} — {pages_display}"
            consolidated.append({
                "document": doc_name,
                "document_id": data["document_id"],
                "pages": sorted_pages,
                "pages_display": pages_display,
                "formatted_source": formatted_source,
                "chunks": data["chunks"]
            })

        return consolidated

    @staticmethod
    def generate_response(
        query: str,
        retrieved_context: List[Dict[str, Any]],
        data_results: Dict[str, Any] = None,
        research_results: List[Dict[str, Any]] = None,
        verification_results: Dict[str, Any] = None,
        plan: Dict[str, Any] = None,
        email_draft: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        logger.info(f"Running Response Agent for query: '{query}'")

        # Handle Email Tool output formatting (SEND, DRAFT, CLARIFY, FAILED)
        if email_draft:
            from backend.tools.email_tool import sanitize_email_text
            status_val = email_draft.get("status", "drafted")

            if status_val == "clarify":
                final_resp = email_draft.get("clarification_prompt", "Who should I send it to?")
                return {
                    "final_response": final_resp,
                    "citations": [],
                    "email_draft": email_draft
                }

            recip = email_draft.get("recipient", "recipient@example.com")
            subj = sanitize_email_text(email_draft.get("subject", "Response to your email"))
            body = sanitize_email_text(email_draft.get("body", ""))
            reasoning = sanitize_email_text(email_draft.get("reasoning", ""))
            err_detail = email_draft.get("error", "")

            if status_val == "sent":
                final_resp = (
                    f"✓ Email sent successfully to {recip}.\n\n"
                    f"**Subject:** {subj}\n\n"
                    f"**Message Body:**\n\n{body}"
                )
            elif status_val == "failed":
                final_resp = f"✗ Email could not be sent. Reason: {err_detail or 'Gmail authorization required.'}"
            else:
                final_resp = (
                    f"### Email Draft Generated\n\n"
                    f"**To:** `{recip}`\n"
                    f"**Subject:** {subj}\n\n"
                    f"**Message Body:**\n\n{body}"
                )

            return {
                "final_response": final_resp,
                "citations": [],
                "email_draft": email_draft
            }

        # 1. Consolidate sources and check evidence presence
        consolidated_sources = ResponseAgent.consolidate_citations(retrieved_context)
        has_evidence = len(retrieved_context) > 0 or (data_results and data_results.get("summary")) or len(research_results or []) > 0

        # Grounding check: if verification explicitly failed or no evidence found
        if not has_evidence:
            no_evidence_msg = "I couldn't find enough information in the uploaded documents to answer this accurately."
            return {
                "final_response": no_evidence_msg,
                "citations": []
            }

        # Format internal evidence context for LLM synthesis (hidden from user)
        evidence_snippets = []
        for c in consolidated_sources:
            for chk in c["chunks"]:
                evidence_snippets.append(f"Document: {c['document']} ({c['pages_display']})\nContent: {chk['evidence']}")

        if data_results and data_results.get("summary"):
            evidence_snippets.append(f"Structured Data Result:\n{data_results.get('summary')}")

        if research_results:
            for r in research_results:
                if r.get("url") != "N/A":
                    evidence_snippets.append(f"External Source: {r.get('title')} ({r.get('url')})\nSnippet: {r.get('snippet')}")

        internal_evidence_text = "\n\n---\n\n".join(evidence_snippets)

        prompt = f"""You are KnowledgePilot's Response Generator.
Your task is to answer the user's goal by synthesizing the verified evidence below into a clean, natural, and coherent response.

User Goal / Query: "{query}"

Verified Internal Evidence Context:
{internal_evidence_text}

CRITICAL RULES FOR RESPONSE GENERATION:
1. Write a natural, direct, and well-structured answer tailored to the user's request.
2. DO NOT output raw chunk listings, snippet quotes, or headers like "Based on uploaded document evidence: filename (Page X): Abstract...".
3. DO NOT repeat identical sentences or duplicate information from different chunks.
4. Format output cleanly using Markdown (paragraphs, bullet points, checklists with ☐ if user requested a checklist/requirements, or tables for comparisons).
5. Append a `\n\n### Sources\n` section at the end listing consolidated sources strictly in this format:
• Filename — Page X (or Pages X–Y)
6. Do NOT invent information outside the provided evidence.
"""

        response_text = LLMService.generate(
            prompt=prompt,
            system_prompt="You are an expert AI response synthesizer. Always produce clean, natural markdown answers without raw snippet dumps."
        )

        # 2. Fallback Synthesis (when LLM is simulated or offline)
        if not response_text or response_text.startswith("[Simulated") or response_text.startswith("[Local Engine"):
            clean_paragraphs = []
            
            # Extract key text lines from retrieved context, cleaning out raw chunk headings
            seen_sentences = set()
            for ctx in retrieved_context:
                text = ctx.get("evidence", "").strip()
                lines = text.split("\n")
                for line in lines:
                    line_clean = line.strip()
                    # Skip header-like lines
                    if not line_clean or line_clean.lower().startswith("page ") or line_clean.lower().startswith("section "):
                        continue
                    if line_clean not in seen_sentences:
                        seen_sentences.add(line_clean)
                        clean_paragraphs.append(line_clean)

            # Synthesize into clean prose
            body_text = "\n\n".join(clean_paragraphs[:6]) if clean_paragraphs else f"Information for '{query}' retrieved from knowledge base."
            
            if data_results and data_results.get("summary"):
                body_text += f"\n\n**Data Analysis Summary**:\n{data_results.get('summary')}"

            # Append clean consolidated sources
            sources_lines = ["\n\n### Sources"]
            for src in consolidated_sources:
                sources_lines.append(src["formatted_source"])

            response_text = body_text + "\n" + "\n".join(sources_lines)

        # Build clean consolidated citation objects list (one per document)
        flat_citations = []
        cit_id = 1
        for src in consolidated_sources:
            first_chunk = src["chunks"][0] if src["chunks"] else {}
            flat_citations.append({
                "citation_id": cit_id,
                "document": src["document"],
                "document_id": src["document_id"],
                "page": first_chunk.get("page", 1),
                "chunk_id": first_chunk.get("chunk_id", f"c_{cit_id}"),
                "evidence": first_chunk.get("evidence", ""),
                "pages_display": src["pages_display"],
                "formatted_source": src["formatted_source"]
            })
            cit_id += 1

        return {
            "final_response": response_text.strip(),
            "citations": flat_citations,
            "consolidated_sources": consolidated_sources
        }
