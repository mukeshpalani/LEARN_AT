import os
from pathlib import Path
from fpdf import FPDF
import pandas as pd

doc_dir = Path("./documents")
doc_dir.mkdir(parents=True, exist_ok=True)


def create_pdf(filename: str, title: str, sections: list):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", style="B", size=16)
    pdf.cell(0, 10, txt=title, ln=True, align="C")
    pdf.ln(5)

    for page_no, text_content in enumerate(sections, start=1):
        if page_no > 1:
            pdf.add_page()
        pdf.set_font("Helvetica", style="B", size=12)
        pdf.cell(0, 8, txt=f"Page {page_no}", ln=True)
        pdf.ln(2)
        pdf.set_font("Helvetica", size=10)
        pdf.multi_cell(0, 6, txt=text_content)
        pdf.ln(4)

    filepath = doc_dir / filename
    pdf.output(str(filepath))
    print(f"Created demo PDF: {filepath}")


# 1. College_Regulations.pdf
create_pdf(
    "College_Regulations.pdf",
    "COLLEGE GENERAL REGULATIONS AND COMPLIANCE",
    [
        "Section 1: Admission and Student Conduct Rules.\nAll enrolled students must abide by academic integrity guidelines. Official identification document and certified high school diploma are required upon registration.",
        "Section 2: Financial Aid and Governance.\nStudents receiving institutional aid must maintain a minimum GPA of 3.5. Required documentation includes identity proof, income certificate, and academic transcript."
    ]
)

# 2. Scholarship_Guidelines.pdf
create_pdf(
    "Scholarship_Guidelines.pdf",
    "SCHOLARSHIP ELIGIBILITY AND APPLICATION GUIDELINES",
    [
        "Scholarship Overview:\nThe Merit Excellence Scholarship provides up to 100% tuition coverage for qualified applicants.",
        "Page 7 - Eligibility Requirements and Application Checklist:\n"
        "To apply for the Merit Excellence Scholarship, applicants must submit the following documents:\n"
        "1. Official Scholarship Application Form\n"
        "2. Academic Records and Transcripts (minimum GPA 3.50)\n"
        "3. Valid Government Identity Document (Passport or National ID)\n"
        "4. Required Recommendation Certificate from Academic Supervisor\n"
        "Note: Applications missing any required document will be rejected."
    ]
)

# 3. Academic_Handbook.pdf
create_pdf(
    "Academic_Handbook.pdf",
    "ACADEMIC HANDBOOK & PROGRAM DIRECTORY",
    [
        "Chapter 1: Degree Requirements.\nUndergraduate programs require 120 course credits and completion of a final capstone project.",
        "Chapter 2: Grading Systems & Honors.\nHonors distinction is awarded for GPA 3.8 and above. Attendance regulations strictly apply across all academic departments."
    ]
)

# 4. Attendance_Policy.pdf
create_pdf(
    "Attendance_Policy.pdf",
    "COLLEGE MANDATORY ATTENDANCE POLICY",
    [
        "Section 1: General Attendance Rule.\nRegular class attendance is compulsory for all enrolled courses.",
        "Page 14 - Mandatory Minimum Attendance Requirement:\n"
        "All scholarship holders and full-time students MUST maintain a minimum of 75% class attendance throughout the semester.\n"
        "Students falling below the 75% attendance threshold will forfeit scholarship eligibility and face academic probation."
    ]
)

# 5. Student_Records.csv
df_students = pd.DataFrame([
    {"student_id": "S101", "name": "Alice Smith", "gpa": 3.8, "attendance_percent": 92.0, "status": "Eligible"},
    {"student_id": "S102", "name": "Bob Jones", "gpa": 3.6, "attendance_percent": 71.5, "status": "Below Requirement"},
    {"student_id": "S103", "name": "Charlie Brown", "gpa": 3.4, "attendance_percent": 88.0, "status": "Ineligible GPA"},
    {"student_id": "S104", "name": "Diana Prince", "gpa": 3.9, "attendance_percent": 68.0, "status": "Below Requirement"},
    {"student_id": "S105", "name": "Evan Wright", "gpa": 3.75, "attendance_percent": 95.0, "status": "Eligible"}
])
df_students.to_csv(doc_dir / "Student_Records.csv", index=False)
print("Created demo CSV: Student_Records.csv")

# 6. AI_Sign_Language_Assistant_Project_Synopsis.docx
import docx
doc = docx.Document()
doc.add_heading("AI SIGN LANGUAGE ASSISTANT - PROJECT SYNOPSIS", 0)
doc.add_heading("Abstract & System Overview", level=1)
doc.add_paragraph(
    "The AI Sign Language Assistant is an innovative system designed to bridge communication gaps for deaf and mute communities. "
    "It focuses on real-time sign language recognition using dual-hand tracking and continuous gesture translation."
)
doc.add_heading("Key Features & Capabilities", level=1)
doc.add_paragraph(
    "1. Dual-Hand Real-time Tracking: Uses computer vision models to track complex 3D hand gestures.\n"
    "2. Continuous Sign Recognition: Converts sequences of signs into natural spoken language sentences.\n"
    "3. AI-Assisted Learning Module: Provides interactive feedback to help users learn sign language.\n"
    "4. AI Avatar Communicator: Generates an animated 3D avatar that communicates using sign language with synchronized captions and speech."
)
doc.save(doc_dir / "AI_Sign_Language_Assistant_Project_Synopsis.docx")
print("Created demo DOCX: AI_Sign_Language_Assistant_Project_Synopsis.docx")

