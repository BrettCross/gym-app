from fastapi import APIRouter, Depends, status, HTTPException
from beanie import PydanticObjectId
from typing import Annotated

from backend.models.user import User
from backend.models.workout import Workout, WorkoutExercise, ExerciseSet
from backend.schemas.workout import WorkoutCreate, WorkoutRead, WorkoutUpdate, WorkoutExerciseSchema, WorkoutDetailRead, WorkoutExerciseDetail, SetSchema
from backend.models.exercise import Exercise
from backend.utils import auth


router = APIRouter(tags=["workouts"])

@router.post("/workouts", response_model=WorkoutRead, status_code=status.HTTP_201_CREATED)
async def create_workout(
    workout: WorkoutCreate,
    current_user: Annotated[User, Depends(auth.get_current_active_user)]):
    
    workout_exists = await Workout.find_one(Workout.user_id == PydanticObjectId(current_user.id)).find_one(Workout.name == workout.name)
    if workout_exists:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Workout already registered")
    
    work_doc = Workout(
        user_id=current_user.id,
        name=workout.name,
        exercises=[
            WorkoutExercise(
                exercise_id=e.exercise_id,
                order=e.order,
                sets=[
                    ExerciseSet(
                        weight=s.weight,
                        reps=s.reps
                    )
                    for s in e.sets
                ]
            )
            for e in workout.exercises
        ]
    )
    await work_doc.insert()

    return WorkoutRead(
        id=str(work_doc.id),
        user_id=str(work_doc.user_id),
        name=work_doc.name,
        exercises=[
            WorkoutExerciseSchema(
                exercise_id=e.exercise_id,
                order=e.order,
                sets=[
                    SetSchema(
                        weight=s.weight,
                        reps=s.reps
                    )
                    for s in e.sets
                ]
            )
            for e in work_doc.exercises
        ]
    )

@router.get("/workouts", response_model=list[WorkoutRead], status_code=status.HTTP_200_OK)
async def list_workouts(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
    name: str | None = None):

    query = {}
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    
    workouts = await Workout.find(Workout.user_id == PydanticObjectId(current_user.id)).find(query).to_list()
    if len(workouts) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")
    
    return [
        WorkoutRead(
            id=str(workout.id),
            user_id=str(workout.user_id),
            name=workout.name,
            exercises=[
                WorkoutExerciseSchema(
                    exercise_id=e.exercise_id,
                    order=e.order,
                    sets=[
                        SetSchema(
                            weight=s.weight,
                            reps=s.reps
                        )
                        for s in e.sets
                    ]
                )
                for e in workout.exercises
            ]
        )
        for workout in workouts
    ]

@router.get("/workouts/{workout_id}", response_model=WorkoutDetailRead, status_code=status.HTTP_200_OK)
async def read_workout(
    workout_id: PydanticObjectId,
    current_user: Annotated[User, Depends(auth.get_current_active_user)]):

    workout = await Workout.get(workout_id)
    if not workout:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")
    if workout.user_id != PydanticObjectId(current_user.id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="not authorized")
    
    workout_exercises = []

    for e in workout.exercises:
        exercise = await Exercise.get(e.exercise_id)
        workout_exercises.append(WorkoutExerciseDetail(
            exercise_id=str(e.exercise_id),
            order=e.order,
            name=exercise.name,
            equipment=exercise.equipment,
            muscleGroup=exercise.muscleGroup,
            exerciseType=exercise.exerciseType,
            sets=[
                SetSchema(
                    weight=s.weight,
                    reps=s.reps
                )
                for s in e.sets
            ]
        ))
    
    return WorkoutDetailRead(
        id=str(workout.id),
        user_id=str(workout.user_id),
        name=workout.name,
        exercises=workout_exercises
    )

@router.patch("/workouts/{workout_id}", response_model=WorkoutDetailRead, status_code=status.HTTP_200_OK)
async def update_workout(
    workout_id: PydanticObjectId,
    workout_update: WorkoutUpdate,
    current_user: Annotated[User, Depends(auth.get_current_active_user)]):

    workout = await Workout.get(workout_id)
    if not workout:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")
    if workout.user_id != PydanticObjectId(current_user.id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="not authorized")
    
    update_data = workout_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workout, field, value)

    await workout.save()

    workout_exercises = []

    for e in workout.exercises:
        exercise = await Exercise.get(e.exercise_id)
        workout_exercises.append(WorkoutExerciseDetail(
            exercise_id=str(e.exercise_id),
            order=e.order,
            name=exercise.name,
            equipment=exercise.equipment,
            muscleGroup=exercise.muscleGroup,
            exerciseType=exercise.exerciseType,
            sets=[
                SetSchema(
                    weight=s.weight,
                    reps=s.reps
                )
                for s in e.sets
            ]
        ))
    
    return WorkoutDetailRead(
        id=str(workout.id),
        user_id=str(workout.user_id),
        name=workout.name,
        exercises=workout_exercises
    )

@router.delete("/workouts/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workout(
    workout_id: PydanticObjectId,
    current_user: Annotated[User, Depends(auth.get_current_active_user)]):
    workout = await Workout.get(workout_id)

    if not workout:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")
    if workout.user_id != PydanticObjectId(current_user.id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="not authorized")
    
    await workout.delete()
    return None