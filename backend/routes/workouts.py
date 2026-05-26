from typing import Annotated

from fastapi import APIRouter, Depends, status, HTTPException
from beanie import PydanticObjectId
from beanie.operators import In

from backend.models.user import User
from backend.models.workout import Workout, WorkoutExercise, ExerciseSet
from backend.schemas.workout import WorkoutCreate, WorkoutRead, WorkoutUpdate, WorkoutExerciseBase, WorkoutDetailRead, WorkoutExerciseDetail, SetSchema
from backend.models.exercise import Exercise
from backend.utils import auth
from backend.utils.policies import WorkoutPolicy
from backend.services.workouts import get_enriched_workout


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

    auth_filter = WorkoutPolicy.get_read_filter(current_user)
    
    query = Workout.find(auth_filter)
    
    if name:
        query = query.find(Workout.name == {"$regex": name, "$options": "i"})

    workouts = await query.to_list()

    return [
        WorkoutRead(
            **w.model_dump(),
            can_edit=WorkoutPolicy.can_modify(current_user, w),
            can_delete=WorkoutPolicy.can_delete(current_user, w)
        )
        for w in workouts
    ]


@router.get("/{workout_id}", response_model=WorkoutDetailRead, status_code=status.HTTP_200_OK)
async def read_workout(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
    workout_id: PydanticObjectId
):
    """
    Fetch a detailed workout routine for the authenticated user.
    """

    workout = await Workout.get(workout_id)

    if not workout or not WorkoutPolicy.can_view(current_user, workout):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Workout not found"
        )
    
    return await get_enriched_workout(current_user, workout)


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

    workout = await Workout.get(workout_id)

    if not workout or not WorkoutPolicy.can_modify(current_user, workout):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Workout not found"
        )
    
    update_data = workout_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workout, field, value)
    await workout.save()
    
    return await get_enriched_workout(current_user, workout)


@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workout(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
    workout_id: PydanticObjectId
):
    """
    Deletes the workout for the authenticated user.

    Returns a **404** if workout is unavailable.
    """
    workout = await Workout.get(workout_id)

    if not workout or not WorkoutPolicy.can_delete(current_user, workout):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Workout not found"
        )
    
    await workout.delete()
    return None