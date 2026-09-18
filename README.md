# 🎓 GMRIT Academic Hub — AI-Powered Academic Operating System

[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI Ready](https://img.shields.io/badge/Backend-FastAPI%20%28Python%29-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20pgvector-336791?logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)

An enterprise-grade Academic CRM & AI platform built for higher education institutions (specifically modeled for GMR Institute of Technology). It combines **Institutional Role-Based Access Control (RBAC)**, **Curriculum Management**, **Interactive Coding Assessment Engine**, and an **AI RAG (Retrieval-Augmented Generation) Assistant** with source citations.

---

## 📑 Table of Contents
- [Project Overview](#-project-overview)
- [System Architecture & Tech Stack](#-system-architecture--tech-stack)
- [Core Features](#-core-features)
  - [1. Student Portal](#1-student-portal)
  - [2. Faculty Portal](#2-faculty-portal)
  - [3. Administrative Control Center](#3-administrative-control-center)
  - [4. AI RAG Knowledge Assistant](#4-ai-rag-knowledge-assistant)
  - [5. Institutional Coding Sandbox](#5-institutional-coding-sandbox)
- [Default Demo Credentials](#-default-demo-credentials)
- [Getting Started & Running the Project](#-getting-started--running-the-project)
  - [Frontend (React + Vite) Setup](#frontend-react--vite-setup)
  - [Target Backend (Python FastAPI + PostgreSQL) Setup](#target-backend-python-fastapi--postgresql-setup)
- [Project Directory Structure](#-project-directory-structure)
- [Roadmap & API Integration](#-roadmap--api-integration)

---

## 🌟 Project Overview

The **GMRIT Academic Hub** is designed to unify fragmented university services into a single modern dashboard. It replaces scattered portals for:
* **Academic Regulations & Curriculum:** R20 and R23 syllabus exploration, course catalogs, and credit distributions.
* **Previous Year Question Papers (PYQs):** Semester-wise question paper repository with AI search.
* **Student & Faculty Analytics:** Live gradebook (CGPA/SGPA), attendance tracking, weak-subject alerts, and class performance aggregates.
* **Hands-on Coding Practice:** Integrated browser IDE with real-time test case validation for programming courses.
* **Institutional AI Copilot:** RAG assistant answering curriculum questions with strict source citations (document name, page number).

---

## 🏛️ System Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (SPA)                                 │
│  - React 18.3 + Vite 6                                                 │
│  - Custom Design System (Vanilla CSS, Glassmorphism, Dark Mode)        │
│  - Lucide Icons + Google Fonts (Plus Jakarta Sans & JetBrains Mono)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API / SSE (Streaming)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       TARGET BACKEND (PYTHON)                          │
│  - Framework: FastAPI (Async, High-throughput, Auto OpenAPI/Swagger)   │
│  - Authentication: OAuth2 with JWT & Refresh Tokens (RBAC)             │
│  - Code Sandbox: Isolated Docker execution worker or Judge0 API        │
│  - RAG Engine: LlamaIndex / LangChain + SentenceTransformers/OpenAI    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL + pgvector)                    │
│  - Relational: Users, Enrollments, Grades, Attendance, Audit Logs      │
│  - Vector Embeddings: Syllabus chunks, PYQ embeddings, lecture notes   │
└────────────────────────────────────────────────────────────────────────┘
```

### 💻 Frontend Tech Stack
* **Framework:** React 18.3.1
* **Bundler & Dev Server:** Vite 6.2.0
* **Icons:** `lucide-react`
* **Styling:** Custom Vanilla CSS design tokens (`src/index.css`) with responsive sidebar, command palette, and dark glassmorphism.
* **State & Navigation:** View-state router with persistent session storage.

### 🐍 Target Backend Tech Stack (Python)
* **Framework:** **FastAPI** (`Python 3.10+`)
* **ORM:** **SQLAlchemy 2.0** / **SQLModel** with asyncpg
* **Database:** **PostgreSQL** with **`pgvector`** extension
* **AI / RAG Pipeline:** **LlamaIndex** / **LangChain** + **Google Gemini API** or **OpenAI API**
* **PDF Ingestion & OCR:** `pypdf`, `pdfplumber`, `unstructured`
* **Code Sandbox:** Docker SDK or Judge0 API for sandboxed compilation (Python, C, C++, Java)

---

## 🚀 Core Features

### 1. Student Portal
* **Live Academic Dashboard:** Visual CGPA card, attendance gauge (warning below 75%), active credits, and pending assignments.
* **Syllabus Explorer:** Department-wise, semester-wise unit breakdowns, reference textbooks, and outcome mapping.
* **PYQ Archive:** Filter question papers by regulation, year, subject, and exam type (Mid-1, Mid-2, Semester End).
* **Coding Practice & Contests:** Real-time code editor with test cases, custom input, and instant submission verdict.
* **Infographics & Career Roadmaps:** Interactive learning paths tailored to specialization tracks.

### 2. Faculty Portal
* **Class Roster & Monitoring:** Overview of student attendance, performance trends, and at-risk student warnings.
* **Assessment Management:** Create and schedule coding challenges, quizzes, and track submission progress.
* **Resource Publishing:** Upload and distribute lecture notes, syllabus updates, and sample solutions.
* **Academic Analytics:** Subject pass percentage, median CGPA distribution, and assessment score histograms.

### 3. Administrative Control Center
* **Role-Based User Management:** Add, edit, suspend, or reset credentials for Students, Faculty, and Staff.
* **RAG Knowledge Base Manager:** Ingest new curriculum PDFs, inspect chunking quality, and monitor vector embeddings.
* **Audit & Compliance Logs:** Real-time security logs tracking login events, data modifications, and privilege escalations.
* **Platform Health Metrics:** Active sessions, token usage, API latency, and system resource monitors.

### 4. AI RAG Knowledge Assistant
* Located in `src/components/ai/RagChatbot.jsx`.
* Semantic retrieval over university regulations (e.g., R20/R23 attendance rules, re-evaluation policies).
* **Transparent Citations:** Displays retrieval steps, matched documents, and page references for academic integrity.

### 5. Institutional Coding Sandbox
* Located in `src/components/coding/CodingPracticeView.jsx`.
* Multi-language support (C, C++, Java, Python, JavaScript).
* Validates code against public test cases and hidden test cases with execution time and memory limits.

---

## 🔑 Default Demo Credentials

The platform includes preconfigured institutional roles for immediate demonstration:

| Role | Email / ID | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Student** | `student@gmrit.edu.in` *(or `23A81A0501`)* | `student123` | Student Dashboard, Syllabus, PYQs, Coding IDE, AI Bot |
| **Faculty** | `faculty@gmrit.edu.in` *(or `GMR-CSE-1042`)* | `faculty123` | Student Monitoring, Analytics, Assessment Creation |
| **Administrator** | `admin@gmrit.edu.in` *(or `admin`)* | `admin123` | Full access, User Manager, RAG Base, Audit Logs |

---

## 🛠️ Getting Started & Running the Project

### Frontend (React + Vite) Setup

#### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

#### Steps
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Aditya-Dosapati/CRM-Platform.git
   cd CRM-Platform
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   The application will be live at `http://localhost:5173/`.

4. **Build for production:**
   ```bash
   npm run build
   npm run preview
   ```

---

### Target Backend (Python FastAPI + PostgreSQL) Setup

To connect this frontend to a production Python backend:

#### Prerequisites
* **Python 3.10+**
* **PostgreSQL** with `pgvector` enabled

#### Backend Directory Setup
Create a `backend/` directory alongside the frontend:

```bash
mkdir backend && cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate
```

#### Install Recommended Python Dependencies
```bash
pip install fastapi uvicorn[standard] sqlalchemy asyncpg psycopg2-binary \
            pgvector pydantic pydantic-settings python-jose[cryptography] \
            passlib[bcrypt] python-multipart langchain llama-index \
            google-generativeai pypdf
```

#### Sample `main.py` (FastAPI Entry Point)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="GMRIT Academic Hub API",
    description="Backend services for Academic CRM, RAG Knowledge Base, and Coding Engine",
    version="1.0.0"
)

# Enable CORS for the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "online", "platform": "GMRIT Academic Hub"}
```

#### Run the FastAPI Backend Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Interactive API documentation will be available at:
* Swagger UI: `http://localhost:8000/docs`
* ReDoc: `http://localhost:8000/redoc`

---

## 📂 Project Directory Structure

```
CRM-Platform/
├── dist/                     # Production build output
├── node_modules/             # Node packages
├── public/                   # Static public assets
├── src/
│   ├── App.jsx               # Application root & view controller
│   ├── main.jsx              # React DOM mounting
│   ├── index.css             # Global CSS design tokens & utilities
│   ├── components/
│   │   ├── admin/            # 9 Admin views (Users, RAG base, Audits, Analytics)
│   │   ├── ai/               # RagChatbot.jsx, SourceViewerModal.jsx
│   │   ├── auth/             # LoginView.jsx, FirstLoginModal.jsx
│   │   ├── coding/           # CodingPracticeView.jsx, CodingAssessmentsView.jsx
│   │   ├── common/           # Header, Sidebar, CommandPalette, Notifications
│   │   ├── faculty/          # 5 Faculty views (Dashboard, Analytics, Students)
│   │   ├── profile/          # UserProfileModal.jsx
│   │   └── student/          # 6 Student views (Syllabus, PYQs, Grades, Infographics)
│   ├── data/
│   │   ├── codingData.js     # Coding problems, test cases, starter code
│   │   ├── mockData.js       # Student records, faculty rosters, departments
│   │   └── ragKnowledge.js   # RAG vector chunks, documents & query engine
│   └── services/
│       ├── accessControl.js  # Role-permission mapping & guards
│       ├── auditService.js   # Audit trail logger
│       ├── authService.js    # Authentication & session persistence
│       └── codeExecutionService.js # Code runner simulation / execution service
├── index.html                # HTML template with Google Fonts
├── package.json              # Project manifest and scripts
├── vite.config.js            # Vite build configuration
└── README.md                 # Project documentation
```

---

## 🗺️ Roadmap & API Integration

- [x] Full UI/UX Dashboard for Students, Faculty, and Admins
- [x] Client-side Mock RAG search engine with page citations
- [x] Interactive in-browser coding test editor
- [ ] Connect FastAPI endpoints for `/api/auth/login` and `/api/auth/refresh`
- [ ] Ingest live PDF files into `PostgreSQL + pgvector` via background Celery/FastAPI workers
- [ ] Connect production Docker/Judge0 sandbox for real-time remote code execution
- [ ] Live WebSocket notifications for assessment publish events and grading updates

---

## 📄 License
This project is developed for institutional academic management and learning operations at **GMR Institute of Technology (GMRIT)**. All rights reserved.
