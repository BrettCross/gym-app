from beanie import PydanticObjectId
from datetime import datetime
from fastapi import Depends, APIRouter, HTTPException, status
from typing import Annotated

from backend.models.exercise import Exercise
from backend.models.user import User
from backend.schemas.exercise import ExerciseCreate, ExerciseRead, ExerciseUpdate
from backend.database import get_database
from backend.utils import auth


router = APIRouter(tags=["exercises"])

# Create Exercise
@router.post("/exercises", response_model=ExerciseRead, status_code=status.HTTP_201_CREATED)
async def create_exercise(
    exercise: ExerciseCreate,
    current_user: Annotated[User, Depends(auth.get_current_active_user)]):
    # check if exercise exists for user
    exercise_exists = await Exercise.find_one(Exercise.userID == PydanticObjectId(current_user.id)).find_one(Exercise.name == exercise.name)
    
    if exercise_exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Exercise already registered")
    
    # create/save exercise to Mongo
    exer_doc = Exercise(
        userID=current_user.id,
        name=exercise.name,
        equipment=exercise.equipment,
        muscleGroup=exercise.muscleGroup,
        exerciseType=exercise.exerciseType,
        createdAt=exercise.createdAt or datetime.now()
    )
    await exer_doc.insert()

    # return clean response
    return ExerciseRead(
        id=str(exer_doc.id),
        userID=str(exer_doc.userID),
        name=exer_doc.name,
        equipment=exer_doc.equipment,
        muscleGroup=exer_doc.muscleGroup,
        exerciseType=exer_doc.exerciseType,
        createdAt=exer_doc.createdAt
    )

# Read exercises with optional filters
@router.get("/exercises", response_model=list[ExerciseRead], status_code=status.HTTP_200_OK)
async def list_exercises(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
    name: str | None = None, 
    equipment: str | None = None, 
    muscleGroup: str | None = None,
):
    query = {}
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    if equipment:
        query["equipment"] = {"$regex": equipment, "$options": "i"}
    if muscleGroup:
        query["muscleGroup"] = {"$regex": muscleGroup, "$options": "i"}

    exercises = await Exercise.find(Exercise.userID == PydanticObjectId(current_user.id)).find(query).to_list()

    if len(exercises) == 0:
        # raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercises not found")
        return []
    
    return [
        ExerciseRead(
            id=str(exercise.id),
            userID=str(exercise.userID),
            name=exercise.name,
            equipment=exercise.equipment,
            muscleGroup=exercise.muscleGroup,
            exerciseType=exercise.exerciseType,
            createdAt=exercise.createdAt
        )
        for exercise in exercises
    ]

# Read Exercise with ID - backend use
@router.get("/exercises/{exercise_id}", response_model=ExerciseRead, status_code=status.HTTP_200_OK)
async def read_exercise(
    exercise_id: PydanticObjectId,
    current_user: Annotated[User, Depends(auth.get_current_active_user)]):
    exercise = await Exercise.get(exercise_id)

    if not exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")
    
    return ExerciseRead(
        id=str(exercise.id),
        userID=current_user.id,
        name=exercise.name,
        equipment=exercise.equipment,
        muscleGroup=exercise.muscleGroup,
        exerciseType=exercise.exerciseType,
        createdAt=exercise.createdAt
    )

# Update Exercise
@router.put("/exercises/{exercise_id}", response_model=ExerciseRead, status_code=status.HTTP_200_OK)
async def update_exercise(
    exercise_id: PydanticObjectId, 
    exercise_update: ExerciseUpdate,
    current_user: Annotated[User, Depends(auth.get_current_active_user)]):

    exercise = await Exercise.get(exercise_id)
    if not exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")

    update_data = exercise_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(exercise, field, value)

    await exercise.save()

    return ExerciseRead(
        id=str(exercise.id),
        userID=current_user.id,
        name=exercise.name,
        equipment=exercise.equipment,
        muscleGroup=exercise.muscleGroup,
        exerciseType=exercise.exerciseType,
        createdAt=exercise.createdAt
    )

# Delete Exercise
@router.delete("/exercises/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exercise(
    exercise_id: PydanticObjectId,
    _: Annotated[User, Depends(auth.get_current_active_user)]):
    exercise = await Exercise.get(exercise_id)
    if not exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")
    
    await exercise.delete()
    return None