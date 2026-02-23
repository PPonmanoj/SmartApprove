import os
import fitz
from typing import Dict, TypedDict, Optional, List, Union
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field

# Load API keys from environment
_gemini_key = os.environ.get("GOOGLE_API_KEY")
_groq_key = os.environ.get("GROQ_API_KEY")

# Initialize both LLMs if keys are available
llm_gemini = None
llm_groq = None

if _gemini_key:
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        llm_gemini = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            temperature=0,
            google_api_key=_gemini_key
        )
    except ImportError:
        print("WARNING: langchain-google-genai not installed. Gemini unavailable.")

if _groq_key:
    try:
        from langchain_groq import ChatGroq
        llm_groq = ChatGroq(
            model="llama-3.1-8b-instant",
            api_key=_groq_key,
            temperature=0
        )
    except ImportError:
        print("WARNING: langchain-groq not installed. Groq unavailable.")


# ═══════════════════════════════════════════════════════════════════════════
#  PYDANTIC SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════

class BonafideDetails(BaseModel):
    name: Optional[str] = Field(description="Student's full name")
    roll_number: Optional[str] = Field(description="Student's unique roll number")
    department: Optional[str] = Field(description="Academic department or class")
    reason: Optional[str] = Field(description="Purpose for requesting the bonafide")
    has_signature: bool = Field(description="Whether a student signature is present")
    explanation: Optional[str] = Field(description="1-2 sentence AI explanation of extraction")


class InternshipDetails(BaseModel):
    name: Optional[str] = Field(description="Student's full name")
    roll_number: Optional[str] = Field(description="Student's unique roll number")
    department: Optional[str] = Field(description="Academic department or class")
    company_name: Optional[str] = Field(description="Name of the company")
    duration: Optional[str] = Field(description="Duration of the internship")
    incomplete_courses: Optional[Union[List[str], str]] = Field(description="List of incomplete courses")
    location: Optional[str] = Field(description="Location of the internship")
    stay_arrangement: Optional[str] = Field(description="Stay arrangement details")
    has_signature: bool = Field(description="Whether student signature is present")
    offer_letter_valid: bool = Field(description="Whether offer letter is valid")
    offer_text_excerpt: Optional[str] = Field(description="Short excerpt proving the offer")
    missing_offer_elements: List[str] = Field(default_factory=list)
    suspicious_indicators: List[str] = Field(default_factory=list)
    confidence: float = Field(description="Confidence score 0.0-1.0")


class AgentState(TypedDict):
    raw_text: str
    purpose: str  # "bonafide" or "internship"
    extracted_data: Dict
    checklist_results: Dict[str, str]
    is_valid: bool
    iterations: int


# ═══════════════════════════════════════════════════════════════════════════
#  UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def get_pdf_text(path: str) -> str:
    """Extract text from PDF file"""
    text = ""
    with fitz.open(path) as doc:
        for page in doc:
            text += page.get_text()
    return text


def select_llm(model_name: str = "gemini"):
    """Select appropriate LLM based on model name"""
    if model_name == "groq" and llm_groq:
        return llm_groq
    elif model_name == "gemini" and llm_gemini:
        return llm_gemini
    elif llm_gemini:
        return llm_gemini  # fallback
    elif llm_groq:
        return llm_groq  # fallback
    else:
        raise RuntimeError("No AI model available. Set GOOGLE_API_KEY or GROQ_API_KEY in .env")


# ═══════════════════════════════════════════════════════════════════════════
#  AGENT NODES
# ═══════════════════════════════════════════════════════════════════════════

def extractor_node(state: AgentState):
    """Extract structured data from document text"""
    llm = select_llm(state.get("model_preference", "gemini"))
    
    if state["purpose"] == "bonafide":
        structured_llm = llm.with_structured_output(BonafideDetails)
        prompt = (
            "You are an auditor verifying college bonafide certificates. Extract the following:\n\n"
            f"DOCUMENT TEXT:\n{state['raw_text']}\n\n"
            "STRICT RULES:\n"
            "1. Name: Extract ONLY if explicitly labeled 'Student Name:', 'Name of Student:'. Return null if absent.\n"
            "2. Roll Number: Extract ONLY if labeled 'Roll No', 'Registration No', 'Enrolment No'. Return null if unclear.\n"
            "3. Department: Extract ONLY if labeled 'Department', 'Faculty', 'School', 'Branch'. Return null if absent.\n"
            "4. Reason: Extract ONLY if PURPOSE is explicitly stated (e.g., 'Reason: Bank'). Return null if not stated.\n"
            "5. Signature: Return TRUE only if signature is CLEARLY VISIBLE or explicitly marked. FALSE otherwise.\n"
            "6. Explanation: Brief 1-2 sentence explanation of what you found.\n\n"
            "A valid bonafide MUST have ALL: Name, Roll No, Dept, Reason, Signature.\n"
        )
    else:  # internship
        structured_llm = llm.with_structured_output(InternshipDetails)
        prompt = (
            "You are an auditor verifying internship forms. Extract the following:\n\n"
            f"DOCUMENT TEXT:\n{state['raw_text']}\n\n"
            "STRICT RULES:\n"
            "1. Extract student name, roll number, department ONLY if explicitly labeled.\n"
            "2. Company Name: Extract ONLY if clearly indicated (not blank form field).\n"
            "3. Duration: Extract ONLY if explicitly stated (e.g., '6 months', 'Jan-Mar').\n"
            "4. Incomplete Courses: Return list ONLY if courses are listed. Null if none.\n"
            "5. Location/Stay: Extract ONLY if explicitly provided.\n"
            "6. Signature: TRUE only if student signature is CLEARLY PRESENT.\n"
            "7. Offer Valid: TRUE ONLY if document has:\n"
            "   - Clear offer language ('we offer', 'pleased to offer') AND\n"
            "   - Company letterhead/signature OR formal structure\n"
            "   - If only student-filled fields, return FALSE.\n"
            "8. Offer Excerpt: If valid, extract <=200 char proof. Else null.\n"
            "9. Missing Elements: List from ['offer_language','authorization_signature','company_letterhead','position','start_date','salary']\n"
            "10. Suspicious: List reasons to distrust (e.g., 'no letterhead', 'no signature').\n"
            "11. Confidence: 0.0-1.0 score.\n\n"
            "Valid internship MUST have: Name, Roll No, Dept, Company, Duration, Signature, AND offer_letter_valid=TRUE.\n"
        )
    
    data = structured_llm.invoke(prompt)
    return {
        "extracted_data": data.model_dump(),
        "iterations": state.get("iterations", 0) + 1
    }


def auditor_node(state: AgentState):
    """Build checklist and validate completeness"""
    data = state["extracted_data"]
    
    if state["purpose"] == "bonafide":
        checklist = {
            "Name": "✅" if data.get("name") else "❌ Missing",
            "Roll No": "✅" if data.get("roll_number") else "❌ Missing",
            "Department": "✅" if data.get("department") else "❌ Missing",
            "Reason": "✅" if data.get("reason") else "❌ Missing",
            "Signature": "✅" if data.get("has_signature") else "❌ Missing"
        }
        is_complete = all("✅" in v for v in checklist.values())
    else:  # internship
        checklist = {
            "Name": "✅" if data.get("name") else "❌ Missing",
            "Roll No": "✅" if data.get("roll_number") else "❌ Missing",
            "Department": "✅" if data.get("department") else "❌ Missing",
            "Company": "✅" if data.get("company_name") else "❌ Missing",
            "Duration": "✅" if data.get("duration") else "❌ Missing",
            "Offer Letter Valid": "✅" if data.get("offer_letter_valid") else "❌ Invalid/Missing",
            "Student Signature": "✅" if data.get("has_signature") else "❌ Missing"
        }
        is_complete = all("✅" in v for v in checklist.values())
    
    return {"checklist_results": checklist, "is_valid": is_complete}


def should_continue(state: AgentState):
    """Conditional edge: retry if invalid and iterations < 2"""
    if state["is_valid"] or state["iterations"] >= 2:
        return END
    return "extract"


# ═══════════════════════════════════════════════════════════════════════════
#  GRAPH CONSTRUCTION
# ═══════════════════════════════════════════════════════════════════════════

builder = StateGraph(AgentState)
builder.add_node("extract", extractor_node)
builder.add_node("audit", auditor_node)

builder.set_entry_point("extract")
builder.add_edge("extract", "audit")
builder.add_conditional_edges("audit", should_continue, {"extract": "extract", END: END})

agent_app = builder.compile()


# ═══════════════════════════════════════════════════════════════════════════
#  PUBLIC API
# ═══════════════════════════════════════════════════════════════════════════

def run_agent_from_text(document_text: str, purpose: str = "bonafide", model: str = "gemini") -> Dict:
    """
    Run the AI agent pipeline on document text.
    
    Args:
        document_text: Raw text extracted from PDF
        purpose: "bonafide" or "internship"
        model: "gemini" or "groq"
    
    Returns:
        Dict with keys: extracted, checklist, is_valid, iterations, confidence
    """
    final_state = agent_app.invoke({
        "raw_text": document_text,
        "purpose": purpose,
        "model_preference": model,
        "iterations": 0
    })
    
    result = {
        "extracted": final_state.get("extracted_data", {}),
        "checklist": final_state.get("checklist_results", {}),
        "is_valid": final_state.get("is_valid", False),
        "iterations": final_state.get("iterations", 0)
    }
    
    # Add confidence if available (internship only)
    if purpose == "internship" and "confidence" in result["extracted"]:
        result["confidence"] = result["extracted"]["confidence"]
    
    return result


def run_agent_from_pdf(pdf_path: str, purpose: str = "bonafide", model: str = "gemini") -> Dict:
    """
    Run the AI agent pipeline on a PDF file.
    
    Args:
        pdf_path: Path to PDF file
        purpose: "bonafide" or "internship"
        model: "gemini" or "groq"
    
    Returns:
        Dict with keys: extracted, checklist, is_valid, iterations, confidence
    """
    document_text = get_pdf_text(pdf_path)
    return run_agent_from_text(document_text, purpose, model)
