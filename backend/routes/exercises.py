from datetime import datetime
from enum import Enum
from typing import Annotated

from beanie import PydanticObjectId
from beanie.operators import In
from fastapi import Depends, APIRouter, HTTPException, status
import httpx

from backend.models.exercise import Exercise
from backend.models.user import User
from backend.models.enums import ExerciseLibrary
from backend.schemas.exercise import ExerciseCreate, ExerciseRead, ExerciseUpdate
from backend.utils import auth
from backend.utils.policies import ExercisePolicy
from backend.utils.constants import SYSTEM_USER_ID


router = APIRouter()

@router.get("/libraries", response_model=list[str])
async def get_library_types():
    """
    
    """
    return [lib.value for lib in ExerciseLibrary]


# Create Exercise
@router.post("", response_model=ExerciseRead, status_code=status.HTTP_201_CREATED)
async def create_exercise(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
    exercise: ExerciseCreate
):
    """
    Create a new exercise template for the authenticated user.
    Checks for duplicates names to prevent redundant templates.
    """
    exercise_exists = await Exercise.find_one(
        Exercise.user_id == PydanticObjectId(current_user.id),
        Exercise.name == exercise.name
    )

    if exercise_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail="You already have an exercise with this name."
        )
    
    new_exercise = Exercise(
        **exercise.model_dump(),
        user_id=current_user.id
    )
    
    await new_exercise.insert()
    return new_exercise


# Read exercises with optional filters
@router.get("", response_model=list[ExerciseRead], status_code=status.HTTP_200_OK)
async def list_exercises(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
    name: str | None = None, 
    equipment: str | None = None, 
    muscle_group: str | None = None,
    library: ExerciseLibrary | None = None
):
    """
    List all exercises for the current user with optional filtering 
    and smart library segmentation.
    """

    auth_filter = ExercisePolicy.get_read_filter(current_user, library)
    query = Exercise.find(auth_filter)

    if name:
        query = query.find(Exercise.name == {"$regex": name, "$options": "i"})
    if equipment:
        query = query.find(Exercise.equipment == {"$regex": equipment, "$options": "i"})
    if muscle_group:
        query = query.find(Exercise.muscle_group == {"$regex": muscle_group, "$options": "i"})
    exercises = await query.sort("name").to_list()

    # sort official exercises before user's exercises
    exercises.sort(key=lambda x: (not x.is_official, x.name))

    # include edit/delete permissions for frontend
    results = []
    for ex in exercises:
        out = ExerciseRead.model_validate(ex)
        out.can_edit = ExercisePolicy.can_modify(current_user, ex)
        out.can_delete = ExercisePolicy.can_delete(current_user, ex)
        results.append(out)

    return results


# Read Exercise with ID - backend use
@router.get("/{exercise_id}", response_model=ExerciseRead, status_code=status.HTTP_200_OK)
async def read_exercise(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
    exercise_id: PydanticObjectId
):
    """
    Fetch a single exercise by its unique ID for the authenticated user.
    """
    # exercise = await Exercise.find_one(
    #     Exercise.user_id == current_user.id,
    #     Exercise.id == exercise_id
    # )
    exercise = await Exercise.get(exercise_id)
    if not exercise or not ExercisePolicy.can_view(current_user, exercise):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Exercise not found"
        )

    return exercise


# Update Exercise
@router.put("/{exercise_id}", response_model=ExerciseRead, status_code=status.HTTP_200_OK)
async def update_exercise(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
    exercise_id: PydanticObjectId,
    exercise_update: ExerciseUpdate
):
    """
    Performs a partial update on an existing exercise template.

    - **exercise_id**: The unique MongoDB ID of the exercise.
    - **exercise_update**: A JSON object containing only the fields you wish to change.
    
    Returns a **404** if the exercise is unavailable.
    """

    # exercise = await Exercise.find_one(
    #     Exercise.user_id == current_user.id,
    #     Exercise.id == exercise_id
    # )
    exercise = await Exercise.get(exercise_id)

    if not exercise or not ExercisePolicy.can_modify(current_user, exercise):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Exercise not found"
    )

    update_data = exercise_update.model_dump(exclude_unset=True)

    if current_user.role != "ADMIN":
        update_data.pop("is_official", None)

    for field, value in update_data.items():
        setattr(exercise, field, value)
    await exercise.save()
    return exercise


# Delete Exercise
@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exercise(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
    exercise_id: PydanticObjectId
):
    """
    Deletes the exercise for the authenticated user.

    Returns a **404** if the exercise is unavailable.
    """
    exercise = await Exercise.get(exercise_id)

    if not exercise or not ExercisePolicy.can_delete(current_user, exercise):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Exercise not found"
    )
    
    await exercise.delete()
    return None