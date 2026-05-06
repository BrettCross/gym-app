from fastapi import APIRouter
from backend.routes import auth, exercises, ping, users, workouts, sessions

api_router = APIRouter()
api_router.include_router(ping.router)
api_router.include_router(exercises.router, prefix="/exercises", tags=["Exercises"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(workouts.router, prefix="/workouts", tags=["Workouts"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])

api_router.include_router(auth.router, tags=["Authentication"])
