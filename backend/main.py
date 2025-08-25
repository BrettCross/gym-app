from fastapi import FastAPI
from contextlib import asynccontextmanager
from db.mongo import init_db

from routes import exercises, ping, users

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    # (close db connection here if needed)

app = FastAPI(lifespan=lifespan)

# Users - Authentication, Registration, Profile Management
# Exercises - Create, Read, Update, Delete
# Workouts - Create, Read, Update, Delete
# Sessions - Start, Stop, Pause, Resume, Discard

# Create ->     POST
# Read ->       GET
# Update ->     PUT / PATCH
# Delete ->     DELETE

app.include_router(ping.router)
app.include_router(exercises.router)
app.include_router(users.router)

# @app.get("/")
# async def read_root():
#     return {"message": "Welcome to the Workout Tracker API"}

@app.get("/")
async def root():
    return {"status": "MongoDB connected!"}
