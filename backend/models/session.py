from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from datetime import datetime, timezone

class SetProgress(BaseModel):
    reps: int
    weight: float | None = None     # lb or kg

class ExerciseProgress(BaseModel):
    exercise_id: PydanticObjectId
    sets: list[SetProgress]

class Session(Document):
    user_id: PydanticObjectId
    workout_id: PydanticObjectId
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    exercises: list[ExerciseProgress]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "sessions"