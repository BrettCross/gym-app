from beanie import PydanticObjectId
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class SetProgressBase(BaseModel):
    reps: int
    weight: float | None = None

class ExerciseProgressBase(BaseModel):
    exercise_id: str
    sets: list[SetProgressBase]

class SessionCreate(BaseModel):
    user_id: str
    workout_id: str | None = None
    date: datetime | None = None
    exercises: list[ExerciseProgressBase]

class SessionRead(BaseModel):
    id: str
    user_id: str
    workout_id: str | None = None
    date: datetime
    exercises: list[ExerciseProgressBase]

    model_config = ConfigDict(
        json_encoders = {
            PydanticObjectId: str
        }
    )

    # class Config:
    #     json_encoders = {
    #         PydanticObjectId: str   # serialize PydanticObjectId -> str
    #     }