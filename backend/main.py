from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="GMRIT Academic Hub API",
    description="Backend services for Academic CRM, RAG Knowledge Base, and Coding Engine",
    version="1.0.0",
)

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
async def options_code_execute():
    return Response(status_code=200)


import json
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