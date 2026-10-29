from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from project root .env
root_env = Path(__file__).resolve().parent.parent / ".env"
if root_env.exists():
    load_dotenv(dotenv_path=root_env)
else:
    load_dotenv()

from backend.rag.router import router as rag_router


app = FastAPI(
    title="GMRIT Academic Hub API",
    description="Backend services for Academic CRM, DeepExtract RAG Knowledge Base, and Coding Engine",
    version="1.0.0",
)

app.include_router(rag_router)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_origins=[
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.options("/api/code/execute")
@app.options("/api/code/feedback")
async def options_code_endpoints():
    return Response(status_code=200)



import json
import re
import urllib.request
import urllib.error
import subprocess
import sys
import tempfile
import os
import time
from pydantic import BaseModel
from typing import Optional


class CodeExecutionRequest(BaseModel):
    source_code: str
    language: Optional[str] = "python"
    language_id: Optional[int] = None
    stdin: Optional[str] = ""


LANGUAGE_ID_MAP = {
    "python": 100,      # Python (3.12.5)
    "cpp": 105,         # C++ (GCC 14.1.0)
    "c": 103,           # C (GCC 14.1.0)
    "java": 91,         # Java (JDK 17.0.6)
    "javascript": 102,  # JavaScript (Node.js 22.08.0)
    "mysql": 82,        # SQL (SQLite 3.34.0)
    "sql": 82
}

ID_TO_LANGUAGE_MAP = {
    100: "python", 71: "python", 92: "python",
    105: "cpp", 52: "cpp", 53: "cpp", 54: "cpp",
    103: "c", 48: "c", 49: "c", 50: "c",
    91: "java", 62: "java",
    102: "javascript", 93: "javascript", 97: "javascript", 63: "javascript",
    82: "mysql"
}


def execute_locally(source_code: str, language: str, stdin: str = ""):
    lang = language.lower().strip()
    start_time = time.time()

    if lang == "python":
        try:
            proc = subprocess.run(
                [sys.executable, "-c", source_code],
                input=stdin or "",
                capture_output=True,
                text=True,
                timeout=5
            )
            elapsed = time.time() - start_time
            return {
                "success": True,
                "stdout": proc.stdout or "",
                "stderr": proc.stderr or "",
                "compile_output": "" if proc.returncode == 0 else proc.stderr,
                "time": f"{elapsed:.3f}",
                "memory": "24000",
                "status": "Accepted" if proc.returncode == 0 else "Runtime Error"
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Time Limit Exceeded (5.0s)",
                "status": "Time Limit Exceeded"
            }
        except Exception as e:
            return {"success": False, "error": str(e), "status": "Execution Error"}

    elif lang in ("javascript", "js"):
        try:
            proc = subprocess.run(
                ["node", "-e", source_code],
                input=stdin or "",
                capture_output=True,
                text=True,
                timeout=5
            )
            elapsed = time.time() - start_time
            return {
                "success": True,
                "stdout": proc.stdout or "",
                "stderr": proc.stderr or "",
                "compile_output": "" if proc.returncode == 0 else proc.stderr,
                "time": f"{elapsed:.3f}",
                "memory": "32000",
                "status": "Accepted" if proc.returncode == 0 else "Runtime Error"
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Time Limit Exceeded (5.0s)",
                "status": "Time Limit Exceeded"
            }
        except Exception as e:
            return {"success": False, "error": str(e), "status": "Execution Error"}

    elif lang in ("mysql", "sql", "sqlite"):
        try:
            import sqlite3
            conn = sqlite3.connect(":memory:")
            cursor = conn.cursor()
            cursor.executescript(source_code)
            rows = cursor.fetchall()
            conn.close()
            elapsed = time.time() - start_time
            return {
                "success": True,
                "stdout": json.dumps(rows) if rows else "Query executed successfully.",
                "stderr": "",
                "compile_output": "",
                "time": f"{elapsed:.3f}",
                "memory": "16000",
                "status": "Accepted"
            }
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": str(e),
                "compile_output": str(e),
                "time": "0.01",
                "memory": "16000",
                "status": "Compilation Error"
            }

    elif lang in ("c", "cpp"):
        compiler = "g++" if lang == "cpp" else "gcc"
        ext = ".cpp" if lang == "cpp" else ".c"
        with tempfile.TemporaryDirectory() as tmpdir:
            src_file = os.path.join(tmpdir, f"solution{ext}")
            exe_file = os.path.join(tmpdir, "solution.exe")
            with open(src_file, "w", encoding="utf-8") as f:
                f.write(source_code)

            # Compile
            compile_proc = subprocess.run(
                [compiler, "-O2", src_file, "-o", exe_file],
                capture_output=True,
                text=True,
                timeout=6
            )
            if compile_proc.returncode != 0:
                return {
                    "success": False,
                    "stdout": "",
                    "stderr": compile_proc.stderr,
                    "compile_output": compile_proc.stderr,
                    "time": "0.00",
                    "memory": "0",
                    "status": "Compilation Error"
                }

            # Run
            try:
                run_proc = subprocess.run(
                    [exe_file],
                    input=stdin or "",
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                elapsed = time.time() - start_time
                return {
                    "success": True,
                    "stdout": run_proc.stdout or "",
                    "stderr": run_proc.stderr or "",
                    "compile_output": "",
                    "time": f"{elapsed:.3f}",
                    "memory": "28000",
                    "status": "Accepted" if run_proc.returncode == 0 else "Runtime Error"
                }
            except subprocess.TimeoutExpired:
                return {
                    "success": False,
                    "error": "Time Limit Exceeded (5.0s)",
                    "status": "Time Limit Exceeded"
                }

    elif lang == "java":
        with tempfile.TemporaryDirectory() as tmpdir:
            class_match = re.search(r'public\s+class\s+(\w+)', source_code)
            main_class = class_match.group(1) if class_match else "Main"
            src_file = os.path.join(tmpdir, f"{main_class}.java")
            with open(src_file, "w", encoding="utf-8") as f:
                f.write(source_code)

            # Compile
            try:
                compile_proc = subprocess.run(
                    ["javac", src_file],
                    capture_output=True,
                    text=True,
                    timeout=6
                )
                if compile_proc.returncode != 0:
                    return {
                        "success": False,
                        "stdout": "",
                        "stderr": compile_proc.stderr,
                        "compile_output": compile_proc.stderr,
                        "time": "0.00",
                        "memory": "0",
                        "status": "Compilation Error"
                    }

                # Run
                run_proc = subprocess.run(
                    ["java", "-cp", tmpdir, main_class],
                    input=stdin or "",
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                elapsed = time.time() - start_time
                return {
                    "success": True,
                    "stdout": run_proc.stdout or "",
                    "stderr": run_proc.stderr or "",
                    "compile_output": "" if run_proc.returncode == 0 else run_proc.stderr,
                    "time": f"{elapsed:.3f}",
                    "memory": "32000",
                    "status": "Accepted" if run_proc.returncode == 0 else "Runtime Error"
                }
            except subprocess.TimeoutExpired:
                return {
                    "success": False,
                    "error": "Time Limit Exceeded (5.0s)",
                    "status": "Time Limit Exceeded"
                }
            except Exception as e:
                pass

    return None


@app.get("/api/health")
async def health_check():
    return {"status": "online", "platform": "GMRIT Academic Hub"}


@app.post("/api/code/execute")
async def execute_code(req: CodeExecutionRequest):
    # Determine canonical language
    lang = req.language
    if req.language_id and req.language_id in ID_TO_LANGUAGE_MAP:
        lang = ID_TO_LANGUAGE_MAP[req.language_id]

    # 1. Attempt local execution if possible
    local_result = execute_locally(req.source_code, lang, req.stdin)
    if local_result is not None:
        return local_result

    # 2. Fallback to Judge0
    lang_id = req.language_id or LANGUAGE_ID_MAP.get(lang.lower(), 100)
    payload = json.dumps({
        "source_code": req.source_code,
        "language_id": lang_id,
        "stdin": req.stdin or ""
    }).encode("utf-8")

    req_obj = urllib.request.Request(
        "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
        data=payload,
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req_obj, timeout=12) as response:
            result = json.loads(response.read().decode("utf-8"))
            return {
                "success": True,
                "stdout": result.get("stdout") or "",
                "stderr": result.get("stderr") or "",
                "compile_output": result.get("compile_output") or "",
                "time": result.get("time") or "0.05",
                "memory": result.get("memory") or "32000",
                "status": result.get("status", {}).get("description", "Unknown")
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "status": "Execution Error"
        }


class CodingFeedbackRequest(BaseModel):
    problem_title: Optional[str] = "Coding Problem"
    problem_description: Optional[str] = ""
    language: Optional[str] = "python"
    code: str
    execution_output: Optional[str] = ""
    compiler_output: Optional[str] = ""
    status: Optional[str] = ""
    test_results: Optional[list] = None
    hint_level: Optional[int] = 1


@app.post("/api/code/feedback")
async def get_coding_feedback(req: CodingFeedbackRequest):
    code = (req.code or "").strip()
    if not code:
        return {
            "what_went_wrong": "No code provided to analyze.",
            "why_it_went_wrong": "The code editor was empty when feedback was requested.",
            "progressive_hint": "Write or select a solution draft before requesting feedback.",
            "approach_guidance": "Start by defining the required function signature and breaking down the input constraints.",
            "test_case_analysis": "No test cases could be evaluated on empty code.",
            "is_verified_execution": False,
        }

    # Truncate if overly long
    truncated_code = code[:50000]

    api_key = os.getenv("GROQ_CODING_API_KEY") or os.getenv("GROQ_RAG_API_KEY")
    models = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]

    prompt_lines = [
        f"Problem Title: {req.problem_title}",
        f"Problem Description: {req.problem_description[:1000] if req.problem_description else 'N/A'}",
        f"Language: {req.language}",
        f"Student Code:\n{truncated_code}",
        f"Execution Status: {req.status or 'Incomplete / Not Run'}",
        f"Execution Output: {req.execution_output[:2000] if req.execution_output else 'None'}",
        f"Compiler Output: {req.compiler_output[:2000] if req.compiler_output else 'None'}",
        f"Hint Level Requested: {req.hint_level} (Level 1: conceptual nudge, Level 2: structural hint / pseudocode logic)",
    ]
    if req.test_results:
        prompt_lines.append(f"Test Results: {json.dumps(req.test_results[:5])}")

    prompt = "\n".join(prompt_lines)

    if api_key:
        try:
            from groq import AsyncGroq
            client = AsyncGroq(api_key=api_key, timeout=15.0)

            system_instruction = (
                "You are the GMRIT Intelligent Coding Mentor. Analyze the student's code and execution/error state. "
                "Provide constructive, pedagogical guidance without simply giving away the full copy-paste solution. "
                "Return a single JSON object with EXACTLY these string keys:\n"
                "- what_went_wrong: Clear explanation of the bug, syntax error, or failing logic.\n"
                "- why_it_went_wrong: The underlying conceptual root cause.\n"
                "- progressive_hint: Progressive hint tailored to the hint_level (level 1 = conceptual nudge, level 2 = structural/syntactic guidance).\n"
                "- approach_guidance: Recommended step-by-step approach to solve the problem.\n"
                "- test_case_analysis: Analysis of the failing test case or edge cases.\n"
                "- is_verified_execution: boolean (true if based on execution/test results, false if theoretical review)."
            )

            for model in models:
                try:
                    res = await client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "system", "content": system_instruction},
                            {"role": "user", "content": prompt}
                        ],
                        response_format={"type": "json_object"},
                        temperature=0.2,
                        max_tokens=1500
                    )
                    content = res.choices[0].message.content
                    data = json.loads(content)
                    return {
                        "what_went_wrong": data.get("what_went_wrong", "Logic or runtime issue identified."),
                        "why_it_went_wrong": data.get("why_it_went_wrong", "The current logic does not satisfy constraints."),
                        "progressive_hint": data.get("progressive_hint", "Review the problem conditions and base cases."),
                        "approach_guidance": data.get("approach_guidance", "Consider stepping through the algorithm with a small input."),
                        "test_case_analysis": data.get("test_case_analysis", "Review edge cases such as empty input or boundaries."),
                        "is_verified_execution": bool(data.get("is_verified_execution", bool(req.status or req.test_results)))
                    }
                except Exception:
                    continue
        except Exception:
            pass

    # Fallback response if LLM call fails
    return {
        "what_went_wrong": req.status or "Execution completed with warnings or logic discrepancy.",
        "why_it_went_wrong": req.compiler_output or req.execution_output or "Mismatch between actual and expected behavior.",
        "progressive_hint": "Trace variable mutations and loop boundaries for small sample inputs.",
        "approach_guidance": "Verify problem constraints and test boundary inputs (e.g. single element, negatives).",
        "test_case_analysis": "Review failing test case input and compare intermediate state at each step.",
        "is_verified_execution": bool(req.status or req.test_results)
    }