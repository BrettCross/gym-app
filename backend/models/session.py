from beanie import Document, PydanticObjectId
from pydantic import BaseModel
from datetime import datetime

class SetProgress(BaseModel):
    reps: int
    weight: float | None = None     # lb or kg

class ExerciseProgress(BaseModel):
    exercise_id: PydanticObjectId
    sets: list[SetProgress]

class Session(Document):
    user_id: PydanticObjectId
    workout_id: PydanticObjectId
    date: datetime = datetime.now()
    exercises: list[ExerciseProgress]

    class Settings:
        name = "sessions"