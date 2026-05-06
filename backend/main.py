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
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise ValueError("MONGO_URI environment variable is not set!")

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

# CORS middleware - use env variables for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
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