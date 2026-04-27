from beanie import PydanticObjectId
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class SetProgressBase(BaseModel):
    reps: int
    weight: float | None = None

class ExerciseProgressCreate(BaseModel):
    exercise_id: str
    sets: list[SetProgressBase]

class ExerciseProgressRead(BaseModel):
    exercise_id: str
    exercise_name: str
    sets: list[SetProgressBase]    

class SessionCreate(BaseModel):
    # user_id: str
    workout_id: str | None = None
    date: datetime | None = None
    exercises: list[ExerciseProgressCreate]

class SessionRead(BaseModel):
    id: str
    user_id: str
    workout_id: str | None = None
    workout_name: str
    date: datetime
    exercises: list[ExerciseProgressRead]

    model_config = ConfigDict(
        json_encoders = {
            PydanticObjectId: str
        }
    )

    # class Config:
    #     json_encoders = {
    #         PydanticObjectId: str   # serialize PydanticObjectId -> str
    #     }