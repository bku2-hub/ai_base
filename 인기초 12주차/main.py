import os
import json
import urllib.request
from urllib.error import HTTPError
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TodoCreate(BaseModel):
    task: str
    memo: str = ""

class TodoUpdate(BaseModel):
    is_complete: bool

def request_supabase(method: str, endpoint: str, data: dict = None):
    if not SUPABASE_URL or not SUPABASE_KEY or SUPABASE_URL == "YOUR_SUPABASE_PROJECT_URL_HERE":
        raise HTTPException(status_code=500, detail="Supabase 설정 안됨")
    
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    req_data = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read()
            if res_body:
                return json.loads(res_body)
            return []
    except HTTPError as e:
        print(f"Supabase HTTPError: {e.read().decode('utf-8')}")
        raise HTTPException(status_code=500, detail="DB Error")
    except Exception as e:
        print(f"Request Error: {e}")
        raise HTTPException(status_code=500, detail="Network Error")

@app.get("/api/todos")
def get_todos():
    res = request_supabase("GET", "TodoTable?select=*&order=id.asc")
    for r in res:
        if r.get("task") and "|||" in r["task"]:
            parts = r["task"].split("|||", 1)
            r["task"] = parts[0]
            r["memo"] = parts[1]
        else:
            r["memo"] = ""
    return res

@app.post("/api/todos")
def add_todo(todo: TodoCreate):
    combined_task = f"{todo.task}|||{todo.memo}" if todo.memo else todo.task
    data = {"task": combined_task, "is_complete": False}
    res = request_supabase("POST", "TodoTable", data)
    if res and len(res) > 0:
        r = res[0]
        if r.get("task") and "|||" in r["task"]:
            parts = r["task"].split("|||", 1)
            r["task"] = parts[0]
            r["memo"] = parts[1]
        else:
            r["memo"] = ""
        return r
    return None

@app.put("/api/todos/{todo_id}")
def update_todo(todo_id: int, todo: TodoUpdate):
    data = {"is_complete": todo.is_complete}
    res = request_supabase("PATCH", f"TodoTable?id=eq.{todo_id}", data)
    return res[0] if res else None

@app.delete("/api/todos/{todo_id}")
def delete_todo(todo_id: int):
    request_supabase("DELETE", f"TodoTable?id=eq.{todo_id}")
    return {"status": "success"}

if not os.path.exists("static"):
    os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return FileResponse("static/index.html")
