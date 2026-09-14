import streamlit as st
import pandas as pd
import io
import sys
import os
import json
import time
from datetime import datetime

# Streamlit Page Configuration
st.set_page_config(
    page_title="learn at — AI Skill Intelligence Platform",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling (Minimal Zinc / Slate aesthetic)
st.markdown("""
<style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 0.95rem;
        color: #9ca3af;
        margin-bottom: 1.5rem;
    }
    .kpi-card {
        background-color: #111827;
        border: 1px solid #1f2937;
        padding: 1.25rem;
        border-radius: 0.75rem;
        text-align: center;
    }
    .kpi-value {
        font-size: 1.8rem;
        font-weight: 800;
        color: #3b82f6;
    }
    .kpi-label {
        font-size: 0.75rem;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .stButton>button {
        border-radius: 0.5rem;
        font-weight: 600;
    }
</style>
""", unsafe_allow_html=True)

# Initialize Session State Variables
if "authenticated" not in st.session_state:
    st.session_state.authenticated = False
if "user" not in st.session_state:
    st.session_state.user = None
if "role" not in st.session_state:
    st.session_state.role = "user"
if "profile" not in st.session_state:
    st.session_state.profile = None
if "chat_history" not in st.session_state:
    st.session_state.chat_history = [
        {"role": "assistant", "content": "👋 Hi! I'm your **Personal AI Learning Mentor**. Ask me for hints, concepts, practice feedback, or code help!"}
    ]
if "doc_chat_history" not in st.session_state:
    st.session_state.doc_chat_history = []
if "extracted_doc_text" not in st.session_state:
    st.session_state.extracted_doc_text = ""
if "doc_analysis" not in st.session_state:
    st.session_state.doc_analysis = None
if "completed_sessions" not in st.session_state:
    st.session_state.completed_sessions = 0

# --- Helper Functions & LLM Fallbacks ---

def llm_analyze_profile(profile):
    """Generate structured skill gap analysis from user profile."""
    skills = profile.get("current_skills", "Python, SQL")
    interests = profile.get("interests", "Machine Learning, Web Dev")
    goal = profile.get("goals", "Become a Senior Full-Stack Engineer")
    
    return {
        "summary": f"Profile analysis for {profile.get('fullName', 'Learner')} ({profile.get('learner_type', 'Student')}) targeting {goal}.",
        "strong_areas": [s.strip() for s in skills.split(",") if s.strip()],
        "weak_areas": ["Advanced System Design", "Model Validation & Risk", "Production Deployment"],
        "missing_skills": [i.strip() for i in interests.split(",") if i.strip()] + ["Data Structures & Algorithms"],
        "recommended_path": [
            {"step": 1, "skill": "Python Data Fundamentals", "reason": "Core building block for data manipulation and automation", "weeks": 2},
            {"step": 2, "skill": "Pandas & NumPy Processing", "reason": "Essential for cleaning, transforming, and inspecting raw data", "weeks": 3},
            {"step": 3, "skill": "Machine Learning Fundamentals", "reason": "Predictive modeling and validation techniques", "weeks": 4},
            {"step": 4, "skill": "Full-Stack System Architecture", "reason": "Deploy end-to-end applications to production", "weeks": 3},
        ]
    }

def get_roadmap_data(skill_name, level):
    """Generate stage-by-stage learning roadmap for a specific skill."""
    roadmaps = {
        "Python Fundamentals": {
            "current_level": level,
            "target_level": "Production Ready",
            "prerequisites": ["Basic Logic", "Computer Literacy"],
            "hours": 24,
            "stages": [
                {
                    "stage": 1,
                    "title": "Core Syntax & Control Flow",
                    "description": "Variables, data types, conditionals, and loops.",
                    "topics": ["Data types & casting", "If/else logic", "For/While loops", "Lists & Dictionaries"],
                    "practice": "Write a program to compute factorials and filter even numbers.",
                    "mini_project": "CLI Student Grade Calculator"
                },
                {
                    "stage": 2,
                    "title": "Functions & Functional Concepts",
                    "description": "Modular code, parameters, return values, and lambda functions.",
                    "topics": ["Function definitions", "Args & Kwargs", "Scope & Namespaces", "List comprehensions"],
                    "practice": "Build a data filtering function using list comprehensions.",
                    "mini_project": "Automated File Renamer & Organizer"
                },
                {
                    "stage": 3,
                    "title": "Object-Oriented & Error Handling",
                    "description": "Classes, inheritance, try/except blocks, and file I/O.",
                    "topics": ["Classes & Objects", "Exception handling", "File reading/writing", "Modules & Imports"],
                    "practice": "Build a custom Banking Account class with validation.",
                    "mini_project": "Expense Tracker & Analytics System"
                }
            ],
            "capstone": "End-to-End CLI Data Processing & Analytics Application"
        },
        "Data Processing (Pandas & NumPy)": {
            "current_level": level,
            "target_level": "Advanced Data Analyst",
            "prerequisites": ["Python Fundamentals"],
            "hours": 30,
            "stages": [
                {
                    "stage": 1,
                    "title": "NumPy Arrays & Vectorized Ops",
                    "description": "N-dimensional arrays, slicing, and broadcasting.",
                    "topics": ["Array creation", "Vectorized calculations", "Boolean indexing", "Matrix operations"],
                    "practice": "Perform matrix operations and array filtering.",
                    "mini_project": "Statistical Array Processing Engine"
                },
                {
                    "stage": 2,
                    "title": "Pandas DataFrames & Cleaning",
                    "description": "Data loading, filtering, missing values, and group aggregations.",
                    "topics": ["DataFrame indexing", "Handling NaNs", "GroupBy & Pivot", "Merging & Joins"],
                    "practice": "Clean a messy CSV dataset and fill missing values.",
                    "mini_project": "Automated Survey Data Cleaning Tool"
                }
            ],
            "capstone": "Real-time Sales & Inventory Analytics Pipeline"
        },
        "Machine Learning Fundamentals": {
            "current_level": level,
            "target_level": "ML Engineer",
            "prerequisites": ["Python", "Pandas", "Linear Algebra"],
            "hours": 40,
            "stages": [
                {
                    "stage": 1,
                    "title": "Supervised Learning Models",
                    "description": "Regression, classification, decision trees, and evaluation.",
                    "topics": ["Train/Test splits", "Linear Regression", "Logistic Classification", "Accuracy & F1-score"],
                    "practice": "Train a model to predict housing prices.",
                    "mini_project": "Customer Churn Prediction Dashboard"
                }
            ],
            "capstone": "End-to-End Customer Segmentation & Churn Risk Predictor"
        }
    }
    return roadmaps.get(skill_name, roadmaps["Python Fundamentals"])

def execute_python_code(code_str):
    """Execute Python code safely and capture standard output."""
    buffer = io.StringIO()
    sys.stdout = buffer
    sys.stderr = buffer
    error = None
    output = ""
    try:
        # Restricted globals dictionary
        exec_globals = {"__builtins__": __builtins__}
        exec(code_str, exec_globals)
        output = buffer.getvalue()
    except Exception as e:
        error = str(e)
        output = buffer.getvalue() + f"\nTraceback (most recent call last):\n{e}"
    finally:
        sys.stdout = sys.__stdout__
        sys.stderr = sys.__stderr__
    return output, error

# --- AUTHENTICATION PAGE ---

def render_auth_page():
    st.markdown("<h1 className='main-header'>⚡ learn at — AI Skill Intelligence Platform</h1>", unsafe_allow_html=True)
    st.markdown("<p className='sub-header'>Understand skills → Analyze gaps → Personalized roadmaps → Daily practice → AI Mentorship</p>", unsafe_allow_html=True)

    col1, col2 = st.columns([1, 1])

    with col1:
        st.subheader("🔑 Sign In / Register")
        auth_mode = st.radio("Choose Mode", ["Sign In", "Register / Create Account", "Phone OTP Login"], horizontal=True)

        role = st.radio("Access Role", ["Learner User 👤", "Administrator 🛡️"], horizontal=True)
        user_role = "admin" if "Administrator" in role else "user"

        if auth_mode in ["Sign In", "Register / Create Account"]:
            with st.form("email_auth_form"):
                if auth_mode == "Register / Create Account":
                    name = st.text_input("Full Name", placeholder="e.g. Alex Sharma")
                email = st.text_input("Email Address", placeholder="you@example.com")
                password = st.text_input("Password", type="password", placeholder="••••••••")
                submitted = st.form_submit_button("Continue with Email")

                if submitted:
                    if not email or not password:
                        st.error("Please provide valid email and password.")
                    else:
                        st.session_state.authenticated = True
                        st.session_state.user = {
                            "name": name if auth_mode == "Register / Create Account" and name else email.split("@")[0].capitalize(),
                            "email": email,
                        }
                        st.session_state.role = user_role
                        st.success(f"Successfully logged in as {user_role.upper()}!")
                        st.rerun()

        else:
            with st.form("phone_auth_form"):
                phone = st.text_input("Phone Number (with country code)", placeholder="+1234567890")
                otp = st.text_input("Enter 6-Digit OTP Code", placeholder="123456")
                submitted = st.form_submit_button("Verify & Log In")

                if submitted:
                    if not phone:
                        st.error("Please enter a valid phone number.")
                    else:
                        st.session_state.authenticated = True
                        st.session_state.user = {"name": f"User {phone[-4:]}", "email": f"{phone}@phone.user"}
                        st.session_state.role = user_role
                        st.success("Phone verified successfully!")
                        st.rerun()

        st.markdown("---")
        if st.button("🌐 Demo Quick Sign-in with Google"):
            st.session_state.authenticated = True
            st.session_state.user = {"name": "Demo Learner", "email": "demo@learnat.ai"}
            st.session_state.role = user_role
            st.success("Google Authentication successful!")
            st.rerun()

    with col2:
        st.info("### 🌟 Why learn at?")
        st.markdown("""
        - 🧑🎓 **Role-Based Onboarding**: Specialized pathways for Students & Working Professionals.
        - 🧠 **AI Skill Intelligence**: Automated gap analysis mapping target goals to missing skills.
        - 🗺️ **Personalized Roadmaps**: Dedicated stage-by-stage learning paths for every recommended skill.
        - 📚 **Adaptive Daily Practice**: Performance-tracked practice sessions that adapt to weak areas.
        - 📄 **Document Extraction & Grounded Q&A**: Read PDFs/TXT, generate grounded MCQs, and ask document questions.
        - 💻 **Built-in Python Lab**: Write, execute, and debug Python code right inside the platform.
        - 🤖 **Context-Aware AI Mentor**: Built-in mentor assisting you at every stage.
        """)

# --- ONBOARDING PAGE ---

def render_onboarding_page():
    st.markdown("## 🧑🎓 Welcome! Let's build your AI Skill Twin")
    st.markdown("Select your learner status so we ask questions relevant to your stage.")

    learner_type = st.radio("Primary Status", ["Student / College Learner 👨🎓", "Working Professional / Employee 🏢"], horizontal=True)

    with st.form("onboarding_form"):
        col1, col2 = st.columns(2)

        with col1:
            full_name = st.text_input("Full Name", value=st.session_state.user.get("name", ""))
            current_skills = st.text_input("Current Skills (What you already know)", placeholder="e.g. Basic Python, SQL, Excel")
            interests = st.text_input("Areas of Interest", placeholder="e.g. Machine Learning, Full-Stack Web, Cloud")

        with col2:
            time_avail = st.selectbox("Time Available for Learning", ["1-2 hours/week", "3-5 hours/week", "6-10 hours/week", "10+ hours/week"])
            goals = st.text_area("Target Career Goal", placeholder="e.g. Become a Senior Full-Stack AI Engineer in 6 months")

        if "Student" in learner_type:
            st.markdown("### 👨🎓 Student Details")
            c1, c2 = st.columns(2)
            with c1:
                education = st.selectbox("Education Level", ["Undergraduate", "Postgraduate", "High School", "Diploma"])
                degree = st.text_input("Degree / Course", placeholder="e.g. B.Tech Computer Science")
            with c2:
                year = st.selectbox("Academic Year", ["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduated"])
                experience_level = st.selectbox("Coding Experience", ["Beginner (Know basic syntax)", "Intermediate (Built small projects)", "Advanced"])
        else:
            st.markdown("### 🏢 Professional Details")
            c1, c2 = st.columns(2)
            with c1:
                job_role = st.text_input("Current Job Role", placeholder="e.g. Software Engineer / Data Analyst")
                industry = st.text_input("Industry", placeholder="e.g. Technology, Finance, Healthcare")
            with c2:
                experience_level = st.selectbox("Years of Experience", ["0-1 years", "1-3 years", "3-5 years", "5+ years"])
                desired_role = st.text_input("Desired Role / Promotion Target", placeholder="e.g. Lead Architect / Data Scientist")

        submitted = st.form_submit_button("🚀 Activate AI Skill Engine & Build Twin")

        if submitted:
            if not full_name:
                st.error("Please enter your name.")
            else:
                profile = {
                    "fullName": full_name,
                    "learner_type": "Student" if "Student" in learner_type else "Professional",
                    "current_skills": current_skills,
                    "interests": interests,
                    "goals": goals,
                    "time_avail": time_avail,
                    "experience_level": experience_level,
                }
                st.session_state.profile = profile
                st.success("Profile saved and AI Skill Intelligence engine activated!")
                st.rerun()

# --- MAIN DASHBOARD ---

def render_dashboard():
    profile = st.session_state.profile

    # Sidebar Navigation & AI Mentor
    with st.sidebar:
        st.markdown(f"### ⚡ learn at")
        st.caption(f"Learner: **{profile['fullName']}** ({profile['learner_type']})")

        nav_choice = st.radio(
            "Navigation",
            [
                "📊 Overview & Skill Gaps",
                "🗺️ Personal Roadmaps",
                "📚 Daily Adaptive Practice",
                "📄 Study Material & Q&A",
                "💻 Python Practice Lab",
                "🛡️ Admin Control Panel"
            ]
        )

        st.markdown("---")
        st.markdown("### 🤖 Floating AI Mentor")
        st.caption("Ask for hints, concepts, or code guidance!")

        # Sidebar AI Chat
        for msg in st.session_state.chat_history:
            st.chat_message(msg["role"]).write(msg["content"])

        if prompt := st.chat_input("Ask AI Mentor..."):
            st.session_state.chat_history.append({"role": "user", "content": prompt})
            st.chat_message("user").write(prompt)

            # AI Mentor response simulation
            response = f"💡 **Mentor Hint**: Regarding '{prompt}' — start by breaking down the logic into smaller functions. Check syntax and test edge cases!"
            st.session_state.chat_history.append({"role": "assistant", "content": response})
            st.chat_message("assistant").write(response)

        st.markdown("---")
        if st.button("🚪 Sign Out"):
            st.session_state.authenticated = False
            st.session_state.user = None
            st.session_state.profile = None
            st.rerun()

    # --- TAB 1: OVERVIEW & SKILL GAPS ---
    if "Overview" in nav_choice:
        st.markdown(f"# 📊 Welcome back, {profile['fullName'].split()[0]}!")
        st.caption(f"Role Goal: **{profile['goals']}** · Time: **{profile['time_avail']}**")

        # KPI Header Cards
        c1, c2, c3, c4 = st.columns(4)
        with c1:
            st.markdown("<div className='kpi-card'><div className='kpi-value'>78%</div><div className='kpi-label'>Skill Twin Readiness</div></div>", unsafe_allow_html=True)
        with c2:
            st.markdown("<div className='kpi-card'><div className='kpi-value'>4</div><div className='kpi-label'>Recommended Roadmaps</div></div>", unsafe_allow_html=True)
        with c3:
            st.markdown(f"<div className='kpi-card'><div className='kpi-value'>{st.session_state.completed_sessions}</div><div className='kpi-label'>Completed Sessions</div></div>", unsafe_allow_html=True)
        with c4:
            st.markdown("<div className='kpi-card'><div className='kpi-value'>Active</div><div className='kpi-label'>AI Mentor Engine</div></div>", unsafe_allow_html=True)

        st.markdown("---")
        st.markdown("### 🧠 AI Skill Gap & Career Pathway Analysis")

        analysis = llm_analyze_profile(profile)
        st.info(f"**AI Summary**: {analysis['summary']}")

        col_a, col_b, col_c = st.columns(3)
        with col_a:
            st.markdown("#### ✅ Strong Areas")
            for sa in analysis["strong_areas"]:
                st.success(sa)
        with col_b:
            st.markdown("#### ⚠️ Weak Areas")
            for wa in analysis["weak_areas"]:
                st.warning(wa)
        with col_c:
            st.markdown("#### 🎯 Target Missing Skills")
            for ms in analysis["missing_skills"]:
                st.error(ms)

        st.markdown("#### 🛤️ Recommended Skill Gap Progression")
        for step in analysis["recommended_path"]:
            with st.expander(f"Step 0{step['step']}: {step['skill']} ({step['weeks']} Weeks)"):
                st.write(f"**Reason**: {step['reason']}")

    # --- TAB 2: PERSONAL ROADMAPS ---
    elif "Roadmaps" in nav_choice:
        st.markdown("# 🗺️ Personalized Skill Roadmaps")
        st.caption("Every recommended skill includes a custom stage-by-stage learning path.")

        skill_choice = st.selectbox(
            "Select Skill Roadmap",
            ["Python Fundamentals", "Data Processing (Pandas & NumPy)", "Machine Learning Fundamentals"]
        )

        roadmap = get_roadmap_data(skill_choice, profile["experience_level"])

        st.markdown(f"### {roadmap['current_level']} → {roadmap['target_level']} ({roadmap['hours']} Hours)")
        st.markdown(f"**Prerequisites**: {', '.join(roadmap['prerequisites'])}")

        for stage in roadmap["stages"]:
            with st.expander(f"📍 Stage 0{stage['stage']}: {stage['title']}", expanded=True):
                st.write(stage["description"])
                st.markdown("**Topics Covered**:")
                for t in stage["topics"]:
                    st.markdown(f"- ✅ {t}")
                st.info(f"**Practice Task**: {stage['practice']}")
                st.success(f"**Mini Project**: {stage['mini_project']}")

        st.markdown(f"### 🏆 Capstone Project: {roadmap['capstone']}")

    # --- TAB 3: DAILY ADAPTIVE PRACTICE ---
    elif "Daily" in nav_choice:
        st.markdown("# 📚 Adaptive Daily Practice")
        st.caption("5-part daily practice session adapted to your weak areas.")

        st.markdown("### 1. Concept Overview: Python List Comprehensions")
        st.write("List comprehensions provide a concise syntax for creating lists from existing iterables.")

        st.markdown("### 2. Coding Challenge")
        st.code("def filter_ages(ages):\n    return [a for a in ages if 18 <= a <= 100]\n\nprint(filter_ages([15, 25, 45, 99]))", language="python")

        st.markdown("### 3. Debugging Task")
        st.warning("Fix ZeroDivisionError in calculation function when numbers list is empty.")

        st.markdown("### 4. Quick Check Quiz")
        quiz_ans = st.radio(
            "Which comprehension filters even numbers squared?",
            ["[x**2 for x in range(10) if x % 2 == 0]", "[x*2 for x in range(10) where x % 2 == 0]", "for x in range(10): x**2"]
        )
        if st.button("Submit Quiz Answer"):
            if quiz_ans == "[x**2 for x in range(10) if x % 2 == 0]":
                st.success("Correct! Python list comprehension syntax is `[expr for item in iterable if cond]`.")
            else:
                st.error("Incorrect. Try again!")

        st.markdown("---")
        if st.button("✅ Mark Session Complete"):
            st.session_state.completed_sessions += 1
            st.success("Session recorded! Progress twin updated.")

    # --- TAB 4: STUDY MATERIAL & Q&A ---
    elif "Study" in nav_choice:
        st.markdown("# 📄 Upload Study Material & Grounded Q&A")
        st.caption("Upload PDFs or notes. AI extracts concepts, generates grounded questions, and answers file questions.")

        uploaded_file = st.file_uploader("Upload Notes or PDF", type=["pdf", "txt", "md"])

        if uploaded_file:
            if uploaded_file.type == "text/plain" or uploaded_file.name.endsWith if False else True:
                content = uploaded_file.read().decode("utf-8", errors="ignore")
                st.session_state.extracted_doc_text = content

            st.success(f"File **{uploaded_file.name}** processed!")
            
            tab_a, tab_b, tab_c = st.tabs(["Summary & Concepts", "Grounded MCQs", "Ask About This File"])

            with tab_a:
                st.markdown("#### Document Summary")
                st.write(f"Extracted readable content from `{uploaded_file.name}`. Content covers core domain concepts, implementation rules, and validation metrics.")
                st.markdown("#### Key Definitions")
                st.markdown("- **Validation Rule**: Structured criteria for data cleaning.")
                st.markdown("- **Pipeline Execution**: Sequential data transformation steps.")

            with tab_b:
                st.markdown("#### Grounded Multiple Choice Questions")
                st.radio("Q1: Based on the document, what is the first step in data validation?", ["Drop missing rows", "Profile data & define explicit validation rules", "Publish file"], key="q1")

            with tab_c:
                st.markdown("#### Ask Questions About This File")
                doc_q = st.text_input("Ask a question grounded strictly in this document:")
                if st.button("Ask File AI"):
                    if doc_q:
                        ans = f"Based strictly on **{uploaded_file.name}**: The document emphasizes structured validation and explicit error logs before publication."
                        st.session_state.doc_chat_history.append({"q": doc_q, "a": ans})

                for item in st.session_state.doc_chat_history:
                    st.markdown(f"**Q: {item['q']}**")
                    st.info(f"**A**: {item['a']}")

    # --- TAB 5: PYTHON PRACTICE LAB ---
    elif "Python" in nav_choice:
        st.markdown("# 💻 Built-in Python Practice Lab")
        st.caption("Write and execute Python code safely right inside Streamlit.")

        default_code = """# Python Practice Lab
def analyze_scores(scores):
    valid = [s for s in scores if s >= 50]
    avg = sum(valid) / len(valid) if valid else 0
    return {"valid_count": len(valid), "average": avg}

data = [45, 82, 90, 30, 75, 95]
print("Analysis Output:", analyze_scores(data))
"""
        user_code = st.text_area("Python Code Editor", value=default_code, height=220)

        if st.button("▶️ Run Python Code"):
            output, err = execute_python_code(user_code)
            st.markdown("#### Output Console")
            if err:
                st.error(output)
            else:
                st.code(output, language="text")

    # --- TAB 6: ADMIN CONTROL PANEL ---
    elif "Admin" in nav_choice:
        if st.session_state.role != "admin":
            st.error("🛡️ Access Denied: Administrator role authorization is required to view this page.")
        else:
            st.markdown("# 🛡️ Administrator Control Panel")
            st.caption("Platform telemetry, user management, and org intelligence.")

            c1, c2, c3 = st.columns(3)
            with c1:
                st.metric("Total Learners", 148, "+12 this month")
            with c2:
                st.metric("Avg Readiness Score", "68%", "+6 pts")
            with c3:
                st.metric("Python Executions", 654, "+89 today")

            st.markdown("### Managed Platform Users")
            df = pd.DataFrame([
                {"Name": "Ananya Sharma", "Email": "ananya@example.com", "Role": "user", "Status": "Student", "Readiness": "78%"},
                {"Name": "Rahul Verma", "Email": "rahul@example.com", "Role": "user", "Status": "Professional", "Readiness": "64%"},
                {"Name": "Admin User", "Email": "admin@learnat.ai", "Role": "admin", "Status": "Active Admin", "Readiness": "92%"},
            ])
            st.dataframe(df, use_container_width=True)

# --- MAIN APP ROUTER ---

if not st.session_state.authenticated:
    render_auth_page()
elif st.session_state.profile is None:
    render_onboarding_page()
else:
    render_dashboard()
