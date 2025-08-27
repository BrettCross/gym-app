from pydantic import BaseModel
from beanie import PydanticObjectId


class WorkoutCreate(BaseModel):
    name: str
    exercises: list[str]

class WorkoutRead(BaseModel):
    id: str
    name: str
    exercises: list[str]

    class Config:
        json_encoders = {
            PydanticObjectId: str   # serialize PydanticObjectId -> str
        }

class WorkoutUpdate(BaseModel):
    name: str | None = None
    exercises: list[str] | None = None