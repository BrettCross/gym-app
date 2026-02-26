from pydantic import BaseModel, ConfigDict
from beanie import PydanticObjectId
from datetime import datetime

class ExerciseCreate(BaseModel):
    # userID: str
    name: str
    equipment: list[str]
    muscleGroup: list[str]
    exerciseType: str
    createdAt: datetime | None = None
    

class ExerciseRead(BaseModel):
    id: str
    userID: str
    name: str
    equipment: list[str]
    muscleGroup: list[str]
    exerciseType: str
    createdAt: datetime

    model_config = ConfigDict(
        json_encoders = {
            PydanticObjectId: str
        }
    )

    # class Config:
    #     json_encoders = {
    #         PydanticObjectId: str   # serialize PydanticObjectId -> str
    #     }

class ExerciseUpdate(BaseModel):
    name: str | None = None
    equipment: list[str] | None = None
    muscleGroup: list[str] | None = None
    exerciseType: str | None = None