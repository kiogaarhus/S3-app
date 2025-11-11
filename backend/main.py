from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache.decorator import cache

from backend.api.dashboard import router as dashboard_router
from backend.api.aabenland import router as aabenland_router
from backend.api.separering import router as separering_router
from backend.api.dispensationssag import router as dispensationssag_router
from backend.api.nedsivningstilladelse import router as nedsivningstilladelse_router
from backend.api.reports import router as reports_router
from backend.api.forecasts import router as forecasts_router
from backend.api.projekttyper import router as projekttyper_router
from backend.api.projekter import router as projekter_router
from backend.api.sager import router as sager_router
from backend.api.search import router as search_router
from backend.api.auth import router as auth_router
from backend.utils.cache import init_cache

app = FastAPI(title="GIDAS Explorer API", version="1.0.0")


@app.on_event("startup")
async def startup():
    """Initialize cache on application startup."""
    await init_cache()

# CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)  # Auth router first
app.include_router(dashboard_router)
app.include_router(aabenland_router)
app.include_router(separering_router)
app.include_router(dispensationssag_router)
app.include_router(nedsivningstilladelse_router)
app.include_router(reports_router)
app.include_router(forecasts_router)
app.include_router(projekttyper_router)
app.include_router(projekter_router)
app.include_router(sager_router)
app.include_router(search_router)

@app.get("/")
async def root():
    return {"message": "GIDAS Explorer API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
