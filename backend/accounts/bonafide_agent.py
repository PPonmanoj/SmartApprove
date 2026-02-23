import os
import fitz  # PyMuPDF
from typing import TypedDict, Dict, List, Optional, Union
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field

# Load API key from environment (set in .env)
_groq_key   = os.environ.get("GROQ_API_KEY")
_gemini_key = os.environ.get("GOOGLE_API_KEY")

if _groq_key:
    from langchain_groq import ChatGroq
    llm = ChatGroq(model="llama-3.1-8b-instant", api_key=_groq_key)
elif _gemini_key:
    from langchain_google_genai import ChatGoogleGenerativeAI
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", temperature=0, google_api_key=_gemini_key)
else:
    raise RuntimeError("No LLM API key found. Set GROQ_API_KEY or GOOGLE_API_KEY in backend/.env")


# ── Schemas ─────────────────────────────────────────────────────────────────
class BonafideDetails(BaseModel):
    name:          Optional[str]  = Field(None, description="Student's full name")
    roll_number:   Optional[str]  = Field(None, description="Student's unique roll number")
    department:    Optional[str]  = Field(None, description="Academic department or class")
    reason:        Optional[str]  = Field(None, description="The purpose for requesting the bonafide")
    has_signature: bool           = Field(False, description="Whether a student signature is present")
    explanation:   Optional[str]  = Field(None, description="1-2 sentence AI reasoning for approval/rejection")

class InternFormDetails(BaseModel):
    name:                  Optional[str]              = Field(None)
    roll_number:           Optional[str]              = Field(None)
    department:            Optional[str]              = Field(None)
    company_name:          Optional[str]              = Field(None)
    duration:              Optional[str]              = Field(None)
    incomplete_courses:    Optional[Union[List[str], str]] = Field(None)
    location:              Optional[str]              = Field(None)
    stay_arrangement:      Optional[str]              = Field(None)
    has_signature:         bool                       = Field(False)
    offer_letter_valid:    bool                       = Field(False)
    offer_text_excerpt:    Optional[str]              = Field(None)
    missing_offer_elements: List[str]                 = Field(default_factory=list)
    suspicious_indicators:  List[str]                 = Field(default_factory=list)
    confidence:            float                      = Field(0.0)
    explanation:           Optional[str]              = Field(None)


# ── State ────────────────────────────────────────────────────────────────────
class BonafideState(TypedDict):
    raw_text:         str
    purpose:          str   # "bonafide" or "internship"
    extracted_data:   Dict
    checklist_results: Dict[str, str]
    is_valid:         bool
    iterations:       int


# ── PDF Utility ──────────────────────────────────────────────────────────────
def get_pdf_text(path: str) -> str:
    text = ""
    with fitz.open(path) as doc:
        for page in doc:
            text += page.get_text()
    return text


# ── Extractor Node ───────────────────────────────────────────────────────────
def extractor_node(state: BonafideState):
    if state["purpose"] == "bonafide":
        structured_llm = llm.with_structured_output(BonafideDetails)
        prompt = (
            "You are an auditor verifying college bonafide certificates. Extract and validate the following from the document:\n\n"
            "DOCUMENT TEXT:\n" + state["raw_text"] + "\n\n"
            "STRICT EXTRACTION RULES:\n"
            "1. Name: Extract ONLY if explicitly labeled 'Student Name:', 'Name of Student:', or similar. Return null if absent.\n"
            "2. Roll Number: Extract ONLY if labeled 'Roll No', 'Registration No', 'Enrolment No'. Return null if absent.\n"
            "3. Department: Extract ONLY if labeled 'Department', 'Faculty', 'Branch'. Return null if absent.\n"
            "4. Reason: Extract ONLY explicitly stated PURPOSE. Return null if not explicitly stated.\n"
            "5. Has Signature: TRUE only if student signature CLEARLY VISIBLE. FALSE otherwise.\n"
            "6. Explanation: 1-2 sentences on why this should be APPROVED or REJECTED.\n"
            "Return ONLY valid JSON with fields: name, roll_number, department, reason, has_signature, explanation."
        )
    else:
        structured_llm = llm.with_structured_output(InternFormDetails)
        prompt = (
            "You are an auditor verifying internship forms. Extract and validate:\n\n"
            "DOCUMENT TEXT:\n" + state["raw_text"] + "\n\n"
            "STRICT RULES:\n"
            "1. Name: Extract ONLY if explicitly labeled. Return null if absent.\n"
            "2. Roll Number: Extract ONLY if labeled 'Roll No'. Return null if absent.\n"
            "3. Company: Return null if blank/unclear.\n"
            "4. Duration: Extract ONLY if explicitly stated. Return null if blank.\n"
            "5. Offer Letter Valid: TRUE ONLY if document has offer language AND company letterhead/signature.\n"
            "6. Has Signature: TRUE only if student signature clearly present.\n"
            "7. Confidence: 0.0-1.0. Lower if fields are unclear.\n"
            "8. Explanation: 1-2 sentences on approval/rejection reasoning.\n"
            "Return ONLY valid JSON."
        )

    data = structured_llm.invoke(prompt)
    return {"extracted_data": data.model_dump(), "iterations": state.get("iterations", 0) + 1}


# ── Auditor Node ─────────────────────────────────────────────────────────────
def auditor_node(state: BonafideState):
    data = state["extracted_data"]
    if state["purpose"] == "bonafide":
        checklist = {
            "Name":      "✅" if data.get("name")          else "❌ Missing",
            "Roll No":   "✅" if data.get("roll_number")   else "❌ Missing",
            "Dept":      "✅" if data.get("department")    else "❌ Missing",
            "Reason":    "✅" if data.get("reason")        else "❌ Missing",
            "Signature": "✅" if data.get("has_signature") else "❌ Missing",
        }
    else:
        checklist = {
            "Name":               "✅" if data.get("name")              else "❌ Missing",
            "Roll No":            "✅" if data.get("roll_number")       else "❌ Missing",
            "Dept":               "✅" if data.get("department")        else "❌ Missing",
            "Company":            "✅" if data.get("company_name")      else "❌ Missing",
            "Duration":           "✅" if data.get("duration")          else "❌ Missing",
            "Offer Letter Valid": "✅" if data.get("offer_letter_valid") else "❌ Missing",
            "Student Signature":  "✅" if data.get("has_signature")     else "❌ Missing",
        }
    is_complete = all("✅" in v for v in checklist.values())
    return {"checklist_results": checklist, "is_valid": is_complete}


# ── Retry Logic ──────────────────────────────────────────────────────────────
def should_continue(state: BonafideState):
    if state.get("is_valid") or state.get("iterations", 0) >= 2:
        return END
    return "extract"


# ── Graph ────────────────────────────────────────────────────────────────────
builder = StateGraph(BonafideState)
builder.add_node("extract", extractor_node)
builder.add_node("audit",   auditor_node)
builder.set_entry_point("extract")
builder.add_edge("extract", "audit")
builder.add_conditional_edges("audit", should_continue, {"extract": "extract", END: END})
bonafide_app = builder.compile()


# ── Public Runner ────────────────────────────────────────────────────────────
def run_bonafide_graph_from_text(raw_text: str, purpose: str = "bonafide") -> dict:
    final_state = bonafide_app.invoke({"raw_text": raw_text, "purpose": purpose, "iterations": 0})
    extracted   = dict(final_state.get("extracted_data", {}) or {})
    checklist   = final_state.get("checklist_results", {}) or {}
    is_valid    = bool(final_state.get("is_valid", False))
    extracted.setdefault("explanation", "")
    return {
        "extracted":  extracted,
        "checklist":  checklist,
        "is_valid":   is_valid,
        "iterations": final_state.get("iterations", 0),
    }
