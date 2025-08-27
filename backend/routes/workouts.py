from fastapi import APIRouter, status, HTTPException
from beanie import PydanticObjectId
from models.workout import Workout
from schemas.workout import WorkoutCreate, WorkoutRead, WorkoutUpdate


router = APIRouter(tags=["workouts"])

@router.post("/workouts", response_model=WorkoutRead, status_code=status.HTTP_201_CREATED)
async def create_workout(workout: WorkoutCreate):
    does_exist = await Workout.find_one(Workout.name == workout.name)
    if does_exist:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Workout already registered")
    
    work_doc = Workout(
        name=workout.name,
        exercises=workout.exercises
    )
    await work_doc.insert()

    return WorkoutRead(
        id=str(work_doc.id),
        name=work_doc.name,
        exercises=work_doc.exercises
    )

@router.get("/workouts", response_model=list[WorkoutRead], status_code=status.HTTP_200_OK)
async def list_workouts(name: str | None = None):
    query = {}
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    
    workouts = await Workout.find(query).to_list()
    if len(workouts) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")
    
    return [
        WorkoutRead(
            id=str(workout.id),
            name=workout.name,
            exercises=workout.exercises
        )
        for workout in workouts
    ]

@router.get("/workouts/{workout_id}", response_model=WorkoutRead, status_code=status.HTTP_200_OK)
async def read_workout(workout_id: PydanticObjectId):
    workout = await Workout.get(workout_id)
    if not workout:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")
    
    return WorkoutRead(
        id=str(workout.id),
        name=workout.name,
        exercises=workout.exercises
    )

@router.put("/workouts/{workout_id}", response_model=WorkoutRead, status_code=status.HTTP_200_OK)
async def update_workout(workout_id: PydanticObjectId, workout_update: WorkoutUpdate):
    workout = await Workout.get(workout_id)
    if not workout:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")
    
    update_data = workout_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workout, field, value)

    await workout.save()

    return WorkoutRead(
        id=str(workout.id),
        name=workout.name,
        exercises=workout.exercises
    )

@router.delete("/workouts/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workout(workout_id: PydanticObjectId):
    workout = await Workout.get(workout_id)

    if not workout:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")
    
    await workout.delete()
    return None