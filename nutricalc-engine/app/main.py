from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import get_settings
from app.routers import auth, physiology

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="NutriSense AI API",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/v1")
app.include_router(physiology.router, prefix="/v1")


@app.get("/")
async def root():
    return {"message": "NutriSense AI backend is running"}


@app.get("/health")
async def health():
    return {"status": "healthy", "env": settings.app_env}