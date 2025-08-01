from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["exercises"])


class Exercise(BaseModel):
    exercise_id: int
    name: str

exercises = [
    {"exercise_id": 1, "name": "Push Up"}, 
    {"exercise_id": 2, "name": "Squat"}, 
    {"exercise_id": 3, "name": "Sit Up"}
]

# Exercise Endpoints
@router.post("/exercises/")
async def create_exercise(exercise: Exercise):
    exercises.append(exercise)
    return exercise

@router.get("/exercises")
async def read_all_exercises():
    return exercises

@router.get("/exercises/{exercise_id}")
async def read_exercise(exercise_id: int):
    for exercise in exercises:
        if exercise["exercise_id"] == exercise_id:
            return exercise
    return {"error": "Exercise not found"}

@router.delete("/exercises/{exercise_id}")
async def delete_exercise(exercise_id: int):
    for exercise in exercises:
        if exercise["exercise_id"] == exercise_id:
            exercises.remove(exercise)
            return {"message": "Exercise successfully deleted"}
    return {"error": "Exercise not found"}