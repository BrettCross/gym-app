from datetime import datetime, timezone

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field


class ExerciseSet(BaseModel):
    """Represents a single set of an exercise within a workout."""
    weight: float = Field(..., description="Weight used in the set (lbs/Kg).")
    reps: int = Field(..., description="Number of repititions performed.")


class WorkoutExercise(BaseModel):
    """Links an exercise to a workout with a specfic order and set data."""
    exercise_id: PydanticObjectId = Field(..., description="Reference to the Exercise template.")
    order: int = Field(..., description="The sequence position of the exercise.")
    sets: list[ExerciseSet] = Field(default_factory=list)

class Workout(Document):
    """
    The Workout model represents a routine template of exercises.
    It can be used to start a new workout Session
    """
    user_id: PydanticObjectId = Field(
        ..., 
        description="The id of the owner of this workout routine."
    )

    name: str = Field(
        ...,
        description="The name of the workout.",
        examples=["Push Day", "Pull Day"]
    )

    exercises: list[WorkoutExercise] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    async def save(self, *args, **kwargs):
        """
        Overriding the save method to automatically update the timestamp.
        """
        
        self.updated_at = datetime.now(timezone.utc)
        return await super().save(*args, **kwargs)

    class Settings:
        name = "workouts"
