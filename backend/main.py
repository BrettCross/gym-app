from fastapi import FastAPI
from routes import exercises, ping

app = FastAPI()

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

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Workout Tracker API"}
