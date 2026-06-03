from fastapi import HTTPException
from beanie import PydanticObjectId

from backend.models.exercise import Exercise


async def promote_to_official(exercise_id: PydanticObjectId):
    """
    Promotes a user's exercise to an official exercise.

    This makes the exercise accessible by everyone. 
    """
    
    exercise = await Exercise.get(exercise_id)

    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    exercise.is_official = True
    exercise.user_id = None

    await exercise.save()

    return exercise