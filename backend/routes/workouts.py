from typing import Annotated

from fastapi import APIRouter, Depends, status, HTTPException
from beanie import PydanticObjectId
from beanie.operators import In

from backend.models.user import User
from backend.models.workout import Workout, WorkoutExercise, ExerciseSet
from backend.schemas.workout import WorkoutCreate, WorkoutRead, WorkoutUpdate, WorkoutExerciseBase, WorkoutDetailRead, WorkoutExerciseDetail, SetSchema
from backend.models.exercise import Exercise
from backend.utils import auth


router = APIRouter()

@router.post("", response_model=WorkoutRead, status_code=status.HTTP_201_CREATED)
async def create_workout(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
    workout: WorkoutCreate
):
    """
    Creates a new workout template for the authenticated user.
    Checks for duplicate names to prevent redundant templates.
    """

    workout_exists = await Workout.find_one(
        Workout.user_id == current_user.id,
        Workout.name == workout.name
    )

    if workout_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail="You already have a workout routine with this name"
        )
    
    new_workout = Workout(
        **workout.model_dump(),
        user_id=current_user.id
    ) 

    await new_workout.insert()
    return new_workout


@router.get("", response_model=list[WorkoutRead], status_code=status.HTTP_200_OK)
async def list_workouts(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
    name: str | None = None
):
    """
    Lists all the workouts that the authenticated user owns with optional filtering by name.
    """

    query = Workout.find(Workout.user_id == current_user.id)
    if name:
        query = query.find(Workout.name == {"$regex": name, "$options": "i"})
    return await query.to_list()


@router.get("/{workout_id}", response_model=WorkoutDetailRead, status_code=status.HTTP_200_OK)
async def read_workout(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
    workout_id: PydanticObjectId
):
    """
    Fetch a detailed workout rountine for the authenticated user.
    """

    workout = await Workout.find_one(
        Workout.user_id == current_user.id,
        Workout.id == workout_id
    )

    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Workout not found"
        )
    
    # fetch all exercises in one database hit
    exercise_ids = [e.exercise_id for e in workout.exercises]
    exercises = await Exercise.find(
        In(Exercise.id, exercise_ids)
    ).to_list()

    exercise_map = {ex.id: ex for ex in exercises}

    detailed_exercises = []
    for e in workout.exercises:
        ex_info = exercise_map.get(e.exercise_id)
        if ex_info:
            detailed_exercises.append({
                **ex_info.model_dump(),
                "exercise_id": e.exercise_id,
                "order": e.order,
                "sets": e.sets
            })
    
    return ({
        **workout.model_dump(),
        "exercises": detailed_exercises
    })


@router.patch("/{workout_id}", response_model=WorkoutDetailRead, status_code=status.HTTP_200_OK)
async def update_workout(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
    workout_id: PydanticObjectId,
    workout_update: WorkoutUpdate
):
    """
    Performs a partial update on an existing Workout template and returns the enriched detail view.

    **workout_id**: the unique MongoDB of the workout.
    **workout_update**: A JSON object containing only the data that is to be updated.
    
    Returns a **404** if the workout is unavailable.
    """

    workout = await Workout.find_one(
        Workout.user_id == current_user.id, 
        Workout.id == workout_id
    )

    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Workout not found"
        )
    
    update_data = workout_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workout, field, value)
    await workout.save()

    exercise_ids = [e.exercise_id for e in workout.exercises]
    exercises = await Exercise.find(
        In(Exercise.id, exercise_ids)
    ).to_list()
    
    exercise_map = {ex.id: ex for ex in exercises}
    
    detailed_exercises = []
    for e in workout.exercises:
        ex_info = exercise_map.get(e.exercise_id)
        if ex_info:
            detailed_exercises.append({
                **ex_info.model_dump(),
                "exercise_id": e.exercise_id,
                "order": e.order,
                "sets": e.sets
            })
    
    return ({
        **workout.model_dump(),
        "exercises": detailed_exercises
    })


@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workout(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
    workout_id: PydanticObjectId
):
    """
    Deletes the workout for the authenticated user.

    Returns a **404** if workout is unavailable.
    """
    workout = await Workout.find_one(
        Workout.id == workout_id,
        Workout.user_id == current_user.id
    )

    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Workout not found"
        )
    
    await workout.delete()
    return None