from fastapi import APIRouter, status, HTTPException
from beanie import PydanticObjectId
from backend.models.exercise import Exercise
from backend.models.user import User
from backend.schemas.exercise import ExerciseCreate, ExerciseRead, ExerciseUpdate
from datetime import datetime
from backend.database import get_database


router = APIRouter(tags=["exercises"])

# Create Exercise
@router.post("/exercises", response_model=ExerciseRead, status_code=status.HTTP_201_CREATED)
async def create_exercise(exercise: ExerciseCreate):
    # check if exercise exists
    exercise_exists = await Exercise.find_one(Exercise.name == exercise.name)
    
    # check if user exists
    user_exists = await get_database().get_collection("users").find_one(User.id == PydanticObjectId(exercise.userID))
    print(f"user_exists {exercise.userID}: {user_exists}")
    print(f"exercise_exists: {exercise_exists}")


    if exercise_exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Exercise already registered")
    
    if not user_exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User does not exist")
    
    # create/save exercise to Mongo
    exer_doc = Exercise(
        userID=exercise.userID,
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
    name: str | None = None, 
    equipment: str | None = None, 
    muscleGroup: str | None = None
):
    query = {}
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    if equipment:
        query["equipment"] = {"$regex": equipment, "$options": "i"}
    if muscleGroup:
        query["muscleGroup"] = {"$regex": muscleGroup, "$options": "i"}
    
    exercises = await Exercise.find(query).to_list()
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
async def read_exercise(exercise_id: PydanticObjectId):
    exercise = await Exercise.get(exercise_id)

    if not exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")
    
    return ExerciseRead(
        id=str(exercise.id),
        userID=str(exercise.userID),
        name=exercise.name,
        equipment=exercise.equipment,
        muscleGroup=exercise.muscleGroup,
        exerciseType=exercise.exerciseType,
        createdAt=exercise.createdAt
    )

# Update Exercise
@router.put("/exercises/{exercise_id}", response_model=ExerciseRead, status_code=status.HTTP_200_OK)
async def update_exercise(exercise_id: PydanticObjectId, exercise_update: ExerciseUpdate):
    exercise = await Exercise.get(exercise_id)
    if not exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")

    update_data = exercise_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(exercise, field, value)

    await exercise.save()

    return ExerciseRead(
        id=str(exercise.id),
        userID=str(exercise.userID),
        name=exercise.name,
        equipment=exercise.equipment,
        muscleGroup=exercise.muscleGroup,
        exerciseType=exercise.exerciseType,
        createdAt=exercise.createdAt
    )

# Delete Exercise
@router.delete("/exercises/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exercise(exercise_id: PydanticObjectId):
    exercise = await Exercise.get(exercise_id)
    if not exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")
    
    await exercise.delete()
    return None