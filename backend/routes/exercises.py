from fastapi import APIRouter, status, HTTPException
from beanie import PydanticObjectId
from models.exercise import Exercise
from schemas.exercise import ExerciseCreate, ExerciseRead, ExerciseUpdate


router = APIRouter(tags=["exercises"])

# Exercise Endpoints
@router.post("/exercises", response_model=ExerciseRead, status_code=status.HTTP_201_CREATED)
async def create_exercise(exercise: ExerciseCreate):
    # check if exercise exists
    does_exist = await Exercise.find_one(Exercise.name == exercise.name)
    if does_exist:
        raise HTTPException(status_code=400, detail="Exercise already registered")
    
    # create/save exercise to Mongo
    exer_doc = Exercise(
        name=exercise.name,
        equipment=exercise.equipment,
        muscleGroup=exercise.muscleGroup,
        exerciseType=exercise.exerciseType
    )
    await exer_doc.insert()

    # return clean response
    return ExerciseRead(
        id=str(exer_doc.id),
        name=exer_doc.name,
        equipment=exer_doc.equipment,
        muscleGroup=exer_doc.muscleGroup,
        exerciseType=exer_doc.exerciseType
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
    if len(exercises) > 0:
        return [
            ExerciseRead(
                id=str(exercise.id),
                name=exercise.name,
                equipment=exercise.equipment,
                muscleGroup=exercise.muscleGroup,
                exerciseType=exercise.exerciseType
            )
            for exercise in exercises
        ]
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercises not found")

# Read Exercise with ID - backend use
@router.get("/exercises/{exercise_id}", response_model=ExerciseRead, status_code=status.HTTP_200_OK)
async def read_exercise(exercise_id: PydanticObjectId):
    exercise = await Exercise.get(exercise_id)
    print(exercise)
    if exercise != None:
        return ExerciseRead(
            id=str(exercise.id),
            name=exercise.name,
            equipment=exercise.equipment,
            muscleGroup=exercise.muscleGroup,
            exerciseType=exercise.exerciseType
        )
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")

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
        name=exercise.name,
        equipment=exercise.equipment,
        muscleGroup=exercise.muscleGroup,
        exerciseType=exercise.exerciseType
    )

@router.delete("/exercises/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exercise(exercise_id: PydanticObjectId):
    exercise = await Exercise.get(exercise_id)
    if not exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")
    
    await exercise.delete()
    return None