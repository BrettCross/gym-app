from datetime import datetime

from beanie import PydanticObjectId
from pydantic import BaseModel, ConfigDict, Field


class ExerciseBase(BaseModel):
    """
    Base schema for Exercise data shared across requests and responses.
    """

    name: str = Field(
        ...,
        description="The display name of the exercise.",
        examples=["Barbell Bench Press"]
    )

    equipment: list[str] = Field(
        default_factory=list,
        description="List of equipment needed. Use ['none'] for bodyweight."
    )

    muscle_group: list[str] = Field(
        default_factory=list,
        description="List of targeted muscles. Index 0 is the primary."
    )

    exercise_type: str = Field(
        ...,
        description="Tracking method.",
        examples=["weight&reps"]
    )


class ExerciseCreate(ExerciseBase):
    """
    Used for creating a new exercise template.
    """

    pass
    

class ExerciseRead(ExerciseBase):
    """
    Full representation of an Exercise as stored in the database.
    Includes system-generated IDs and timestamps.
    """

    id: PydanticObjectId = Field(
        description="The unique database ID for this exercise."
    )

    user_id: PydanticObjectId = Field(
        description="The identifier of the user who owns this template."
    )

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


class ExerciseUpdate(BaseModel):
    """
    Used to update parts of an existing exercise. All fields are optional.
    """

    name: str | None = None
    equipment: list[str] | None = None
    muscle_group: list[str] | None = None
    exercise_type: str | None = None