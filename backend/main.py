from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import routes
from core.config import settings
from core.scheduler import start_scheduler, shutdown_scheduler

app = FastAPI(
    title="Daily News Digest API",
    description="Backend API and RAG ingestion pipeline for the newspaper app.",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    start_scheduler()

@app.on_event("shutdown")
async def shutdown_event():
    shutdown_scheduler()

import os

# Collect all allowed origins.
# Locally: localhost variants for dev servers.
# Production: the PRODUCTION_FRONTEND_URL env var (set in Railway dashboard).
_allowed_origins = [
    "http://localhost:8080",
    "http://localhost:3000",
    "http://127.0.0.1:8080",
    "http://localhost:5500",
]

# Add the live Vercel frontend URL when running in production.
# Set PRODUCTION_FRONTEND_URL=https://your-app.vercel.app in Railway env vars.
_prod_url = os.getenv("PRODUCTION_FRONTEND_URL")
if _prod_url:
    _allowed_origins.append(_prod_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the main API router
app.include_router(routes.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "supabase_configured": bool(settings.SUPABASE_URL)}
