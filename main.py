import datetime
import random
import logging
from pathlib import Path
from typing import Optional, List, Dict
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("fenix-plumbing")

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(
    title="Служба сантехники «Феникс»",
    description="Лендинг и API приема заявок на сантехнические работы",
    version="1.0.0"
)

static_dir = BASE_DIR / "static"
if not static_dir.exists():
    static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

leads_db: List[Dict] = []

class LeadRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=6, max_length=30)
    device_type: Optional[str] = Field(None, max_length=100)
    problem: Optional[str] = Field(None, max_length=300)
    comment: Optional[str] = Field(None, max_length=500)

@app.get("/", response_class=HTMLResponse)
async def serve_landing():
    html_path = BASE_DIR / "templates" / "index.html"
    if not html_path.exists():
        html_path = BASE_DIR / "index.html"

    if not html_path.exists():
        return HTMLResponse(
            content=f"""
            <div style="font-family: sans-serif; padding: 40px; text-align: center; background: #0b0c10; color: #fff; min-height: 100vh;">
                <h2 style="color: #ff5500;">Файл index.html не найден!</h2>
                <p>Проверьте путь: <code>{BASE_DIR / 'templates' / 'index.html'}</code></p>
            </div>
            """,
            status_code=404
        )

    return HTMLResponse(content=html_path.read_text(encoding="utf-8"))

@app.post("/api/lead")
async def create_lead(lead: LeadRequest):
    """Принимает заявку на вызов сантехника."""
    lead_id = f"{random.randint(1000, 9999)}"
    service_needed = lead.device_type or lead.problem or "Сантехнические работы"
    lead_record = {
        "id": lead_id,
        "name": lead.name,
        "phone": lead.phone,
        "service": service_needed,
        "comment": lead.comment,
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    leads_db.append(lead_record)
    logger.info(f"💧 Новая заявка на сантехнику #{lead_id}: {lead_record['name']} | {lead_record['phone']} | {lead_record['service']}")

    return JSONResponse(
        status_code=200,
        content={
            "status": "success",
            "message": "Заявка на вызов сантехника успешно принята",
            "lead_id": lead_id
        }
    )

@app.get("/api/leads")
async def get_leads():
    return {"total": len(leads_db), "leads": leads_db}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)