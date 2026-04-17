from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from datetime import datetime, timezone


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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "workouts"
