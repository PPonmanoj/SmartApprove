import os
import json
from typing import TypedDict, Dict, Optional
from pydantic import BaseModel, Field
import fitz  # PyMuPDF for PDF extraction

from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI

os.environ["GOOGLE_API_KEY"] = "AIzaSyDF_wAdV-hachwiel-NbnEFwQrwysvQTjE"
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", temperature=0)

# --- UPDATED: structured schema includes explanation ---
class BonafideDetails(BaseModel):
    name: Optional[str] = Field(None, description="Student's full name")
    roll_number: Optional[str] = Field(None, description="Student's unique roll number")
    department: Optional[str] = Field(None, description="Academic department or class")
    reason: Optional[str] = Field(None, description="The purpose for requesting the bonafide")
    has_signature: Optional[bool] = Field(False, description="Whether a student signature is present")
    explanation: Optional[str] = Field(None, description="Short reason (1-2 sentences) for approval/rejection by the AI")

# Agent state remains the same
class BonafideState(TypedDict):
    raw_text: str
    extracted_data: Dict
    checklist_results: Dict[str, str]
    is_valid: bool
    iterations: int

# Utility: PDF text extraction (assumes fitz imported above)
def get_pdf_text(path: str) -> str:
    text = ""
    with fitz.open(path) as doc:
        for page in doc:
            text += page.get_text()
    return text

# --- NODE 1: Extractor Agent (simple, explicit prompt) ---
def extractor_node(state: BonafideState):
    """
    Use structured LLM output to return:
    { name, roll_number, department, reason, has_signature, explanation }
    The prompt is short and explicit (no complex chaining).
    """
    structured_llm = llm.with_structured_output(BonafideDetails)
    prompt = (
        "Extract the following fields from this college bonafide letter and provide a short 1-2 sentence "
        "'explanation' stating why it should be APPROVED or REJECTED.\n\n"
        "Fields: name, roll_number, department, reason, has_signature (true/false), explanation\n\n"
        f"Text:\n\n{state['raw_text']}"
    )
    data = structured_llm.invoke(prompt)
    extracted = data.dict() if hasattr(data, "dict") else dict(data)
    return {"extracted_data": extracted, "iterations": state.get("iterations", 0) + 1}

# --- NODE 2: Auditor Agent (builds checklist including AI reasoning) ---
def auditor_node(state: BonafideState):
    data = state.get("extracted_data", {}) or {}
    checklist = {
        "Name": f"✅" if data.get('name') else "❌ Missing",
        "Roll No": f"✅" if data.get('roll_number') else "❌ Missing",
        "Dept": f"✅" if data.get('department') else "❌ Missing",
        "Reason": f"✅" if data.get('reason') else "❌ Missing",
        "Signature": "✅" if data.get('has_signature') else "❌ Missing",
        "AI Reasoning": data.get('explanation', "N/A")
    }
    # determine validity: require all core fields (except AI Reasoning) to be present (✅)
    core_ok = all(("✅" in v) for k, v in checklist.items() if k != "AI Reasoning")
    return {"checklist_results": checklist, "is_valid": core_ok}

# --- LOGIC: Should we retry or end? (same simple rule) ---
def should_continue(state: BonafideState):
    if state.get("is_valid") or state.get("iterations", 0) >= 2:
        return END
    return "extract"

# --- BUILD GRAPH (extract -> audit -> conditional loop) ---
builder = StateGraph(BonafideState)
builder.add_node("extract", extractor_node)
builder.add_node("audit", auditor_node)

builder.set_entry_point("extract")
builder.add_edge("extract", "audit")
builder.add_conditional_edges("audit", should_continue, {"extract": "extract", END: END})
bonafide_app = builder.compile()

# --- RUNNER: convenience to execute graph and normalize output for frontend ---
def run_bonafide_graph_from_text(raw_text: str):
    final_state = bonafide_app.invoke({
        "raw_text": raw_text,
        "iterations": 0
    })
    extracted = final_state.get("extracted_data", {}) or {}
    checklist = final_state.get("checklist_results", {}) or {}
    is_valid = bool(final_state.get("is_valid", False))
    # ensure explanation is present in extracted for frontend retrieval
    explanation = extracted.get("explanation") if isinstance(extracted, dict) else None
    extracted = dict(extracted)  # copy to avoid mutation
    extracted["explanation"] = explanation or ""
    return {
        "extracted": extracted,
        "checklist": checklist,
        "is_valid": is_valid,
        "iterations": final_state.get("iterations", 0)
    }
#