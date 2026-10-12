"""
Listokes Backend — FastAPI Application Entry Point

Run with:
    uvicorn app.main:app --reload --port 8000
"""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base

# Import all models so SQLAlchemy registers them on Base.metadata
from app.models import user, task, expense, subscription  # noqa: F401

from app.routers import auth, tasks, expenses, subscriptions


# ── Lifespan ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    On startup: create tables with retry logic for cloud database warm-up.
    """
    for attempt in range(1, 6):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            print("Database connected and tables verified.")
            break
        except Exception as e:
            print(f"Database connection attempt {attempt}/5 failed: {e}")
            if attempt == 5:
                print("Proceeding without initial table creation. Endpoints will retry on query.")
            else:
                await asyncio.sleep(2)
    yield
    await engine.dispose()


# ── App Factory ──────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered life optimization API — tasks, expenses, subscriptions",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware ───────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────

API_V1 = "/api/v1"

app.include_router(auth.router, prefix=API_V1)
app.include_router(tasks.router, prefix=API_V1)
app.include_router(expenses.router, prefix=API_V1)
app.include_router(subscriptions.router, prefix=API_V1)


# ── Health Check ─────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}
