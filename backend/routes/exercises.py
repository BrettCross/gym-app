from fastapi import APIRouter, status, HTTPException
from pydantic import BaseModel


router = APIRouter(tags=["exercises"])

class Exercise(BaseModel):
    exercise_id: int
    name: str

exercises = [
    Exercise(exercise_id=1, name="Push Up"), 
    Exercise(exercise_id=2, name="Squat"),
    Exercise(exercise_id=3, name="Sit Up")
]

# Exercise Endpoints
@router.post("/exercises/", response_model=Exercise, status_code=status.HTTP_201_CREATED)
async def create_exercise(exercise: Exercise):
    exercises.append(exercise)
    return exercise

@router.get("/exercises")
async def read_all_exercises():
    return exercises

@router.get("/exercises/{exercise_id}")
async def read_exercise(exercise_id: int):
    for exercise in exercises:
        if exercise.exercise_id == exercise_id:
            return exercise
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")

@router.delete("/exercises/{exercise_id}")
async def delete_exercise(exercise_id: int):
    for exercise in exercises:
        if exercise.exercise_id == exercise_id:
            exercises.remove(exercise)
            return {"message": "Exercise successfully deleted"}
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")