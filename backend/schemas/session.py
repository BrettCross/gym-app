from datetime import datetime

from beanie import PydanticObjectId
from pydantic import BaseModel, ConfigDict, Field


# --- Shared Sub-Schemas ---

class SessionSetBase(BaseModel):
    """The performance data for a single set."""
    weight: float = Field(default=None, description="Weight used")
    reps: int = Field(..., description="Reps completed")


class SessionExerciseBase(BaseModel):
    """Shared fields for exercises within a session."""
    exercise_id: PydanticObjectId
    sets: list[SessionSetBase] = Field(default_factory=list)


class SessionExerciseRead(SessionExerciseBase):
    """Enriched exercise data including historical snapshot names."""
    exercise_name: str = Field(
        ..., 
        description="Snapshot name of exercise performed"
    )


# --- Main Schemas --- 

class SessionBase(BaseModel):
    """Core data for a workout session."""
    workout_id: PydanticObjectId | None = None
    workout_name: str = Field(
        ...,
        description="name of the routine performed"
    )

class SessionCreate(SessionBase):
    """
    Schema for srtarting/saving a session.
    Note: Metadata like 'exercise_name' is usually handled by 
    the backend during the snapshot process.
    """

    start_time: datetime | None = None
    exercises: list[SessionExerciseBase] = Field(default_factory=list)


class SessionRead(SessionBase):
    """
    The full session representation for the history UI.
    """

    id: PydanticObjectId
    user_id: PydanticObjectId = Field(
        ..., 
        description="the unique ID of the user who performed the session"
    )

    start_time: datetime
    end_time: datetime | None = None
    exercises: list[SessionExerciseRead] = Field(default_factory=list)

    can_edit: bool = Field(
        default=False,
        descirption="Whether user can modify this session"
    )

    can_delete: bool = Field(
        default=False,
        descirption="Whether user can delete this session"
    )

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )

class SessionUpdate(BaseModel):
    """Used for updating an active or finished session. All fields are optional."""
    workout_name: str | None = None
    exercises: list[SessionExerciseBase] | None = None
    end_time: datetime | None = None