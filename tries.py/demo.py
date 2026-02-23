import os
import fitz
import threading
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from PIL import Image, ImageTk
from typing import TypedDict, Dict, Optional
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

# --- AI BACKEND ---
os.environ["GOOGLE_API_KEY"] = "AIzaSyDQ0xXxYWk0Y2rMZbOUC-UZmLIhzVnVF6A"
llm = ChatGoogleGenerativeAI(model="gemini-3-flash-preview", temperature=0)

class BonafideDetails(BaseModel):
    name: Optional[str] = Field(description="Student's full name")
    roll_number: Optional[str] = Field(description="Student's unique roll number")
    department: Optional[str] = Field(description="Academic department or class")
    reason: Optional[str] = Field(description="The purpose for requesting the bonafide")
    has_signature: bool = Field(description="Whether a student signature is present")
    explanation: str = Field(description="Detailed reason for acceptance/rejection")

class BonafideState(TypedDict):
    raw_text: str
    extracted_data: Dict
    checklist_results: Dict[str, str]
    is_valid: bool
    iterations: int

def extractor_node(state: BonafideState):
    structured_llm = llm.with_structured_output(BonafideDetails)
    prompt = f"Extract details and audit this letter:\n\n{state['raw_text']}"
    data = structured_llm.invoke(prompt)
    return {"extracted_data": data.dict(), "iterations": state.get("iterations", 0) + 1}

def auditor_node(state: BonafideState):
    data = state["extracted_data"]
    checklist = {
        "Name": f"✅ {data.get('name')}" if data.get('name') else "❌ Missing",
        "Roll No": f"✅ {data.get('roll_number')}" if data.get('roll_number') else "❌ Missing",
        "Dept": f"✅ {data.get('department')}" if data.get('department') else "❌ Missing",
        "Reason": f"✅ {data.get('reason')}" if data.get('reason') else "❌ Missing",
        "Signature": "✅ Present" if data.get('has_signature') else "❌ Missing",
        "AI Reasoning": data.get('explanation', "N/A")
    }
    return {"checklist_results": checklist, "is_valid": all("✅" in v for k, v in checklist.items() if k != "AI Reasoning")}

def should_continue(state: BonafideState):
    if state["is_valid"] or state["iterations"] >= 2: return END
    return "extract"

builder = StateGraph(BonafideState)
builder.add_node("extract", extractor_node); builder.add_node("audit", auditor_node)
builder.set_entry_point("extract"); builder.add_edge("extract", "audit")
builder.add_conditional_edges("audit", should_continue, {"extract": "extract", END: END})
bonafide_app = builder.compile()


# --- TKINTER GUI ---
class BonafideApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Bonafide Auditor Pro")
        self.root.geometry("1100x950")
        self.root.configure(bg="#1e1e1e")
        self.current_pdf_path = None

        # Custom Styling
        style = ttk.Style()
        style.theme_use("clam")
        style.configure("Treeview", background="#252526", foreground="#cccccc", 
                        fieldbackground="#252526", borderwidth=0, rowheight=40) # Increased rowheight
        style.configure("Treeview.Heading", background="#333333", foreground="#ffffff", borderwidth=0)

        # Header
        self.header = tk.Frame(root, bg="#2d2d2d", pady=15)
        self.header.pack(fill=tk.X)
        tk.Label(self.header, text="BONAFIDE AUDITOR", font=("Consolas", 18, "bold"), bg="#2d2d2d", fg="#007acc").pack()
        
        # Controls
        btn_frame = tk.Frame(root, bg="#252526", pady=10)
        btn_frame.pack(fill=tk.X)
        
        # Updated Button Styles for Visibility
        self.upload_btn = tk.Button(btn_frame, text="UPLOAD PDF", command=self.start_processing, 
                                   bg="#007acc", fg="black", activebackground="#005a9e", 
                                   activeforeground="black", font=("Segoe UI", 10, "bold"), 
                                   borderwidth=0, padx=20, pady=8, cursor="hand2")
        self.upload_btn.pack(side=tk.LEFT, padx=20)
        
        self.fullscreen_btn = tk.Button(btn_frame, text="FULL SCREEN", command=self.open_fullscreen, 
                                       bg="#3e3e42", fg="black", activebackground="#505050", 
                                       activeforeground="white", font=("Segoe UI", 10), 
                                       borderwidth=0, padx=20, pady=8, state="disabled", cursor="hand2")
        self.fullscreen_btn.pack(side=tk.LEFT, padx=10)

        self.status_label = tk.Label(root, text="Ready for upload...", font=("Consolas", 10), bg="#1e1e1e", fg="#858585")
        self.status_label.pack(pady=5)

        # Table with Column wrapping logic
        self.tree = ttk.Treeview(root, columns=("Field", "Status"), show="headings", height=8)
        self.tree.heading("Field", text="VERIFICATION FIELD")
        self.tree.heading("Status", text="RESULT / AI REASONING")
        self.tree.column("Field", width=180, anchor="nw")
        self.tree.column("Status", width=850, anchor="nw") # Large width to prevent cutoff
        self.tree.pack(pady=10, padx=40)

        self.decision_label = tk.Label(root, text="", font=("Consolas", 14, "bold"), bg="#1e1e1e")
        self.decision_label.pack(pady=5)

        self.preview_frame = tk.LabelFrame(root, text=" DOCUMENT PREVIEW ", bg="#1e1e1e", fg="#007acc", font=("Consolas", 10, "bold"))
        self.canvas = tk.Canvas(self.preview_frame, bg="#252526", highlightthickness=0)
        self.canvas.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

    def start_processing(self):
        path = filedialog.askopenfilename(filetypes=[("PDF Files", "*.pdf")])
        if path:
            self.current_pdf_path = path
            self.clear_ui()
            self.preview_frame.pack(pady=10, fill=tk.BOTH, expand=True, padx=40)
            self.display_pdf(path)
            self.status_label.config(text="AI INFERENCING IN PROGRESS...", fg="#d7ba7d")
            self.upload_btn.config(state="disabled")
            threading.Thread(target=self.run_ai, args=(path,), daemon=True).start()

    def display_pdf(self, path, target_canvas=None):
        doc = fitz.open(path)
        page = doc.load_page(0)
        pix = page.get_pixmap(matrix=fitz.Matrix(1.1, 1.1))
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        img.thumbnail((700, 700))
        photo = ImageTk.PhotoImage(img)
        canvas = target_canvas if target_canvas else self.canvas
        canvas.delete("all")
        canvas.create_image(0, 0, anchor="nw", image=photo)
        canvas.image = photo
        self.fullscreen_btn.config(state="normal")

    def open_fullscreen(self):
        if not self.current_pdf_path: return
        fs_window = tk.Toplevel(self.root); fs_window.configure(bg="#1e1e1e"); fs_window.state('zoomed')
        fs_canvas = tk.Canvas(fs_window, bg="#1e1e1e", highlightthickness=0)
        fs_canvas.pack(fill=tk.BOTH, expand=True)
        self.display_pdf(self.current_pdf_path, target_canvas=fs_canvas)

    def run_ai(self, path):
        try:
            doc = fitz.open(path)
            text = "".join([page.get_text() for page in doc])
            final_state = bonafide_app.invoke({"raw_text": text, "iterations": 0})
            self.root.after(0, self.update_ui, final_state)
        except Exception as e:
            print(e)
            self.root.after(0, lambda: messagebox.showerror("AI Error", str(e)))

    def update_ui(self, state):
        self.status_label.config(text="AUDIT COMPLETE ✅", fg="#4ec9b0")
        self.upload_btn.config(state="normal")
        for field, status in state["checklist_results"].items():
            self.tree.insert("", "end", values=(field, status))
        
        if state["is_valid"]:
            self.decision_label.config(text="SYSTEM DECISION: ALL FIELDS MATCHED", fg="#4ec9b0")
        else:
            self.decision_label.config(text="SYSTEM DECISION: FIELDS MISSING", fg="#f44747")

    def clear_ui(self):
        for item in self.tree.get_children(): self.tree.delete(item)
        self.decision_label.config(text="")
        self.preview_frame.pack_forget()

if __name__ == "__main__":
    root = tk.Tk(); app = BonafideApp(root); root.mainloop()
