from dotenv import load_dotenv
load_dotenv()

import json
import os
from contextlib import asynccontextmanager

import jwt
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from backend.database import init_db 
from backend.redis_client import redis_client
from backend.routes.router import api_router
from backend.utils.constants import SYSTEM_USER_ID


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

# -- Custom Audit Middleware --
@app.middleware("http")
async def audit_middleware(request: Request, call_next):
    """
    Global Audit Logger: Captures identity from JWT and offloads 
    destructive events to Redis.
    """
    response = await call_next(request)

    # Log successful state-changing operations
    if request.method in ["POST", "PATCH", "PUT", "DELETE"] and 200 <= response.status_code < 300:
        user_id = SYSTEM_USER_ID
        
        # Extract user identity from the Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ")[1]
                payload = jwt.decode(token, options={"verify_signature": False})
                user_id = payload.get("sub", SYSTEM_USER_ID)
            except Exception:
                user_id = "malformed-token"

        log_payload = {
            "user_id": user_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code
        }
        
        # Non-blocking push to the Redis buffer
        try:
            redis_client.lpush("audit_queue", json.dumps(log_payload))
        except Exception as e:
            print(f"Audit Failure: {e}")

    return response

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