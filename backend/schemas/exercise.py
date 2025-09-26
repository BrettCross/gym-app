from pydantic import BaseModel, ConfigDict
from beanie import PydanticObjectId

class ExerciseCreate(BaseModel):
    name: str
    equipment: list[str]
    muscleGroup: list[str]
    exerciseType: str
    

class ExerciseRead(BaseModel):
    id: str
    name: str
    equipment: list[str]
    muscleGroup: list[str]
    exerciseType: str

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