from pydantic import BaseModel, ConfigDict
from beanie import PydanticObjectId


class SetSchema(BaseModel):
    weight: float
    reps: int

class WorkoutExerciseSchema(BaseModel):
    exercise_id: PydanticObjectId
    order: int
    sets: list[SetSchema] = []

class WorkoutExerciseDetail(BaseModel):
    exercise_id: PydanticObjectId
    order: int
    name: str
    equipment: list[str]
    muscleGroup: list[str]
    exerciseType: str
    sets: list[SetSchema] = []

class WorkoutCreate(BaseModel):
    name: str
    exercises: list[WorkoutExerciseSchema] = []

class WorkoutDetailRead(BaseModel):
    id: str
    user_id: str
    name: str
    exercises: list[WorkoutExerciseDetail] = []

    model_config = ConfigDict(
        json_encoders = {
            PydanticObjectId: str
        }
    )

class WorkoutRead(BaseModel):
    id: str
    user_id: str
    name: str
    exercises: list[WorkoutExerciseSchema] = []

    model_config = ConfigDict(
        json_encoders = {
            PydanticObjectId: str
        }
    )
    # class Config:
    #     json_encoders = {
    #         PydanticObjectId: str   # serialize PydanticObjectId -> str
    #     }

class WorkoutUpdate(BaseModel):
    name: str | None = None
    exercises: list[WorkoutExerciseSchema] | None = None