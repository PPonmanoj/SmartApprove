import os
import json
from typing import TypedDict, Dict, Optional
from pydantic import BaseModel, Field
import fitz  # PyMuPDF for PDF extraction
import re

from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI

os.environ["GOOGLE_API_KEY"] = ""
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)

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
    expected: Dict[str, Optional[str]]  # supplied expected values: name, roll_number, department

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
    The prompt now also receives the expected values so the LLM can prefer matching fields,
    but the final verification is performed in the auditor_node.
    """
    structured_llm = llm.with_structured_output(BonafideDetails)
    expected = state.get("expected", {}) or {}
    prompt = (
        "Extract the following fields from this college bonafide letter and provide a short 1-2 sentence "
        "'explanation' stating why it should be APPROVED or REJECTED.\n\n"
        "Fields: name, roll_number, department, reason, has_signature (true/false), explanation\n\n"
        f"Text:\n\n{state['raw_text']}\n\n"
        "NOTE: You are also given the expected student details (for verification):\n"
        f"Expected name: {expected.get('name')}\n"
        f"Expected roll_number: {expected.get('roll_number')}\n"
        f"Expected department/class code: {expected.get('department')}\n\n"
        "Extract the fields as present in the document. Do NOT guess the expected values — just extract what you see. "
        "The auditor will compare extracted values to the expected values and report matches/mismatches."
    )
    print(expected)
    data = structured_llm.invoke(prompt)
    extracted = data.dict() if hasattr(data, "dict") else dict(data)
    return {"extracted_data": extracted, "iterations": state.get("iterations", 0) + 1, "expected": expected}

# --- NODE 2: Auditor Agent (builds checklist including AI reasoning) ---
def auditor_node(state: BonafideState):
    data = state.get("extracted_data", {}) or {}
    expected = state.get("expected", {}) or {}

    def norm(s):
        return "".join(ch for ch in (s or "").lower() if ch.isalnum())

    def tokenize(s: Optional[str]):
        s = (s or "")
        # split into alphanumeric tokens (preserve letters/numbers)
        return [t.upper() for t in re.findall(r'\w+', s)]

    # map common abbreviations to their expanded token lists
    ABBR_EXPANSIONS = {
        "CSE": ["COMPUTER", "SCIENCE", "ENGINEERING"],
        "IT": ["INFORMATION", "TECHNOLOGY"],
        "AI": ["ARTIFICIAL", "INTELLIGENCE"],
        "ML": ["MACHINE", "LEARNING"],
        "ECE": ["ELECTRONICS", "COMMUNICATION", "ENGINEERING"],
        "EE": ["ELECTRICAL", "ENGINEERING"],
        # add more if needed
    }

    def expand_tokens(tokens):
        out = []
        for t in tokens:
            out.append(t)
            if t in ABBR_EXPANSIONS:
                out.extend([w.upper() for w in ABBR_EXPANSIONS[t]])
        return set(out)

    def dept_equivalent(extracted_val: Optional[str], expected_val: Optional[str]) -> bool:
        if not expected_val or not extracted_val:
            return False
        toks_exp = tokenize(expected_val)
        toks_ext = tokenize(extracted_val)
        if not toks_exp or not toks_ext:
            return False

        set_exp = expand_tokens(toks_exp)
        set_ext = set(toks_ext)

        # direct subset (expected tokens present in extracted)
        if set_exp.issubset(set_ext):
            return True

        # intersection ratio heuristic
        inter = set_exp.intersection(set_ext)
        if len(inter) / max(1, len(set_exp)) >= 0.6:
            return True

        # also accept if key tokens like degree + major both appear
        # e.g., BE + COMPUTER/SCIENCE/ENGINEERING
        if "BE" in set_exp:
            major_tokens = {"COMPUTER", "SCIENCE", "ENGINEERING", "INFORMATION", "TECHNOLOGY"}
            if len(major_tokens.intersection(set_ext)) >= 2:
                return True

        return False

    # name match: require non-empty and normalized equality
    name_found = bool(data.get("name"))
    name_match = name_found and expected.get("name") and norm(data.get("name")) == norm(expected.get("name"))

    roll_found = bool(data.get("roll_number"))
    roll_match = roll_found and expected.get("roll_number") and norm(data.get("roll_number")) == norm(expected.get("roll_number"))

    dept_found = bool(data.get("department"))
    dept_match = False
    if expected.get("department") and data.get("department"):
        dept_match = dept_equivalent(data.get("department"), expected.get("department"))

    checklist = {
        "Name": ("✅" if name_found and name_match else
                 ("❌ Mismatch: found '{}' instead of '{}'".format(data.get("name"), expected.get("name")) if name_found else "❌ Missing")),
        "Roll No": ("✅" if roll_found and roll_match else
                    ("❌ Mismatch: found '{}' instead of '{}'".format(data.get("roll_number"), expected.get("roll_number")) if roll_found else "❌ Missing")),
        "Dept": ("✅" if dept_found and dept_match else
                 ("❌ Mismatch: found '{}' instead of '{}'".format(data.get("department"), expected.get("department")) if dept_found else "❌ Missing")),
        "Reason": f"✅" if data.get('reason') else "❌ Missing",
        "Signature": "✅" if data.get('has_signature') else "❌ Missing",
        "AI Reasoning": data.get('explanation', "N/A")
    }

    # determine validity: require Name, Roll No, Dept all present and matched (✅)
    core_ok = all((v.startswith("✅") for k, v in checklist.items() if k in ("Name", "Roll No", "Dept")))
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
def run_bonafide_graph_from_text(raw_text: str, expected: Optional[Dict[str, Optional[str]]] = None):
    final_state = bonafide_app.invoke({
        "raw_text": raw_text,
        "iterations": 0,
        "expected": expected or {}
    })
    extracted = final_state.get("extracted_data", {}) or {}
    checklist = final_state.get("checklist_results", {}) or {}
    is_valid = bool(final_state.get("is_valid", False))
    explanation = extracted.get("explanation") if isinstance(extracted, dict) else None
    extracted = dict(extracted)
    extracted["explanation"] = explanation or ""
    # include match flags for frontend convenience
    extracted["_name_matched"] = checklist.get("Name", "").startswith("✅")
    extracted["_roll_matched"] = checklist.get("Roll No", "").startswith("✅")
    extracted["_dept_matched"] = checklist.get("Dept", "").startswith("✅")
    return {
        "extracted": extracted,
        "checklist": checklist,
        "is_valid": is_valid,
        "iterations": final_state.get("iterations", 0)
    }