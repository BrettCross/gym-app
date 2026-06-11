from dotenv import load_dotenv
load_dotenv()

import os 
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from backend.database import init_db 
from backend.routes.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles application startup and shutdown events.
    """
    # Initialize MongoDB and Beanie
    user = os.getenv("MONGO_USER")
    password = os.getenv("MONGO_PASS")
    host = os.getenv("MONGO_HOST")
    mongo_uri = f"mongodb+srv://{user}:{password}@{host}"
    if not user or not password or not host:
        raise ValueError("An environment variable is not set!")

    # init_db handles connection and Beanie initialization
    await init_db(uri=mongo_uri)
    print("Successfully connected to MongoDB and initialized Beanie")

    yield

    print("Application shutdown complete")


# --- App Configuration ---
app = FastAPI(
    title="Gym Tracker API",
    version="1.0.0",
    lifespan=lifespan
)

raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost")
origins = [origin.strip() for origin in raw_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routes ---

app.include_router(api_router, prefix="/api")

@app.get("/", include_in_schema=False)
async def root_redirect():
    """Redirects the base URL to the swagger documentation."""
    return RedirectResponse(url="/docs")


@app.get("/healthz", include_in_schema=False)
async def health_check():
    """System health check for infrastructure monitoring."""
    return {"status": "healthy"}