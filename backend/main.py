from fastapi import FastAPI
from contextlib import asynccontextmanager
from db.mongo import init_db
import os


from routes import exercises, ping, users, workouts, sessions

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    client = await init_db()
    yield
    # Shutdown
    if os.getenv("ENV") == "test":
        client.drop_database("gym_app_test")
    client.close()
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
app.include_router(workouts.router)
app.include_router(sessions.router)

# @app.get("/")
# async def read_root():
#     return {"message": "Welcome to the Workout Tracker API"}

@app.get("/")
async def root():
    return {"status": "MongoDB connected!"}
