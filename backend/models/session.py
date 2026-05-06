from datetime import datetime, timezone

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field


class SessionSet(BaseModel):
    """The actual performance of a single set"""
    weight: float = Field(..., description="Weight used")
    reps: int = Field(..., description="Reps completed")
    

class SessionExercise(BaseModel):
    """
    A snapshot of an exercise performed during this specific session.
    Metadata is copied here to preserve historical accuracy.
    """

    exercise_id: PydanticObjectId
    exercise_name: str = Field(..., description="Snapshot of the exercise name")
    muscle_group: list[str] = Field(
        default_factory=list,
        description="Snaphot of muscle groups at time of workout"
    )

    sets: list[SessionSet] = Field(default_factory=list)


class Session(Document):
    """
    Represents a completed or active workout session.
    """

    user_id: PydanticObjectId = Field(..., description="the athlete")
    workout_id: PydanticObjectId = Field(
        ..., 
        description="the routine template used"
    )

    workout_name: str = Field(
        ..., 
        description="the session name",
        examples=["Push Day", "Pull Day"]
    )

    exercises: list[SessionExercise] = Field(default_factory=list)

    total_volume: float = Field(
        default=0.0,
        description="Calculated sum of (weight * reps) for all sets. Stored to optimize analytics queries. "
    )

    start_time: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    end_time: datetime | None = Field(
        default=None, 
        description="Null if the session is still active"
    )

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "sessions"
        indexes = [
            "start_time",
            "user_id"
        ]