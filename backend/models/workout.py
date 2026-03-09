from beanie import Document, PydanticObjectId
from pydantic import BaseModel


class ExerciseSet(BaseModel):
    weight: float
    reps: int

class WorkoutExercise(BaseModel):
    exercise_id: PydanticObjectId
    order: int
    sets: list[ExerciseSet] = []

class Workout(Document):
    user_id: PydanticObjectId
    name: str
    exercises: list[WorkoutExercise] = []

    class Settings:
        name = "workouts"
