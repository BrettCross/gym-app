from datetime import datetime, timezone

from beanie import Document, PydanticObjectId
from pydantic import Field


class Exercise(Document):
    """
    The Exercise model represents the blueprint of a physical movement.

    It serves as a template that can be included in Workouts and
    instantiated during Sessions.
    """
    user_id: PydanticObjectId = Field(
        description="The unique identifier of the user who owns this exercise template."
    )

    name: str = Field(
        description="the name of the exercise",
        examples=["Barbell Bench Press", "Deadlift"]
    )

    equipment: list[str] = Field(
        default_factory=list,
        description="List of equipment required. Use 'none' for bodyweight movements.",
        examples=[["barbell", "bench"]]
    )

    muscle_group: list[str] = Field(
        default_factory=list,
        description="List of targeted muscles involved in the movement. Convention: Index 0 is the primary.",
        examples=[["chest", "tricep", "front deltoid"]] 
    )

    exercise_type: str = Field(
        description="How the exercise is tracked.",
        examples=["weight reps"]
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the exercise was first created."
    )

    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of when the exercise was last updated."
    )

    class Settings:
        name = "exercises"