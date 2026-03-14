
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.api.v1.api import api_router
from app.api.v1.endpoints.compat import router as compat_router
from app.core.config import settings
from app.db.base_class import Base
from app.db.session import engine, get_db
from app.models import user, specialty, hospital  # Register models


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables on startup (for development only)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# CORS
origins = [
    "http://localhost:5173",  # Vite (Frontend)
    "http://localhost:5174",  # Vite (Admin)
    "http://localhost:3000",
    "https://medical-pms.vercel.app",
    "https://medical-pms-admin.vercel.app",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Welcome to PMS Python Backend 🐍"}


@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        # Simple query to verify DB connection
        result = await db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {str(e)}",
        )


# Include API Router (v1 - Python native)
app.include_router(api_router, prefix=settings.API_V1_STR)

# Include Compatibility Router (matches Node.js Express routes for frontend)
app.include_router(compat_router, prefix="/api", tags=["Frontend Compat"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
