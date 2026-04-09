from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.db.database import engine
from app.db.models import Base # Ensure all models are loaded

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="Media Platform API", lifespan=lifespan)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost", "http://127.0.0.1"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.auth import router as auth_router
from app.api.locations import router as locations_router
from app.api.admins import router as admins_router
from app.api.leaders import router as leaders_router
from app.api.students import router as students_router
from app.api.profile import router as profile_router
from app.api.assessments import router as assessments_router
from app.api.books import router as books_router
from app.api.chapters import router as chapters_router
from app.api.rllt import router as rllt_router
from app.api.charts import router as charts_router
from app.api.vcards import router as vcards_router
from app.api.contents import router as contents_router
from app.api.oils import router as oils_router
from app.api.assignments import router as assignments_router


app.include_router(auth_router, prefix="/api", tags=["auth"])
app.include_router(profile_router, prefix="/api/profile", tags=["profile"])
app.include_router(locations_router, prefix="/api", tags=["locations"])
app.include_router(admins_router, prefix="/api/admins", tags=["admins"])
app.include_router(leaders_router, prefix="/api/leaders", tags=["leaders"])
app.include_router(students_router, prefix="/api/students", tags=["students"])
app.include_router(assessments_router, prefix="/api/assessments", tags=["assessments"])
app.include_router(books_router, prefix="/api/books", tags=["books"])
app.include_router(chapters_router, prefix="/api/chapters", tags=["chapters"])
app.include_router(rllt_router, prefix="/api/rllt_lookup", tags=["rllt_lookup"])
app.include_router(charts_router, prefix="/api/charts", tags=["charts"])
app.include_router(vcards_router, prefix="/api/vcards", tags=["vcards"])
app.include_router(contents_router, prefix="/api/contents", tags=["contents"])
app.include_router(oils_router, prefix="/api/oils", tags=["oils"])
app.include_router(assignments_router, prefix="/api/assignments", tags=["assignments"])


import os
from fastapi.staticfiles import StaticFiles

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Media Platform API"}

from sqlalchemy import text
from app.db.database import get_db
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

@app.get("/debug_db")
async def debug_db(db: AsyncSession = Depends(get_db)):
    try:
        # Check connection
        await db.execute(text("SELECT 1"))
        
        # Check tables in public schema
        result = await db.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        ))
        tables = [row[0] for row in result.fetchall()]
        
        return {
            "status": "connected",
            "tables": tables,
            "database_url": "Configured" # Don't leak actual credentials if possible
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "traceback": "Check server logs"
        }
