from beanie import PydanticObjectId
from pydantic import BaseModel, ConfigDict, Field


# --- Shared Sub-Schemas ---
class SetSchema(BaseModel):
    """Used to populate set data for Exercises"""
    weight: float = Field(..., description="Weight used in the set (lbs/kg).")
    reps: int = Field(..., description="Number of repetitions.", gt=-1)


class WorkoutExerciseBase(BaseModel):
    """
    Core structure of an exercise within a workout.
    
    Used for input (Create/Update). Contains just the IDs.
    """

    exercise_id: PydanticObjectId = Field(
        ..., 
        description="Reference to the exercise template"
    )

    order: int = Field(
        ..., 
        description="The sequence position of the exercise"
    )

    sets: list[SetSchema] = Field(
        default_factory=list, 
        description="List of sets to be performed."
    )


class WorkoutExerciseDetail(WorkoutExerciseBase):
    """Adds Exercise metadata for detailed view."""
    name: str = Field(
        ..., 
    description="The display name of the exercise",
    examples=["Barbell Bench Press"]
    )

    equipment: list[str] = Field(
        default_factory=list,
        description="List of equipment needed."
    )

    muscle_group: list[str] = Field(
        default_factory=list,
        description="List of targeted muscles. Index 0 is primary."
    )

    exercise_type: str = Field(
        ...,
        description="tracking method of exercise.",
        examples=["weight&reps", "cardio"]
    )
    

# --- Main Schemas ---
class WorkoutBase(BaseModel):
    """Base fields for all workout schemas."""
    name: str = Field(
        ...,
        description="The display name of the workout.",
        examples=["Push Day", "Pull Day"]
    )


class WorkoutCreate(WorkoutBase):
    """Schema for incoming creation requests"""
    exercises: list[WorkoutExerciseBase] = Field(
        default_factory=list,
        description="List of exercises to be performed."
    )


class WorkoutReadBase(WorkoutBase):
    """System fields for all outgoing responses."""
    id: PydanticObjectId = Field(
        description="The unique ID for this workout template."
    )

    user_id: PydanticObjectId = Field(
        description="The ID of the user who owns this workout template."
    )

    can_edit: bool = Field(
        default=False,
        description="Indicates if the authenticated user has permission to modify this workout."
    )

    can_delete: bool = Field(
        default=False,
        description="Indicates if the authenticated user has permission to permanently delete this workout."
    )

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


class WorkoutRead(WorkoutReadBase):
    """Lightweight view for lists."""
    exercises: list[WorkoutExerciseBase] = Field(
        default_factory=list,
        description="List of exercises to be performed."
    )


class WorkoutDetailRead(WorkoutReadBase):
    """Enriched view for workout dashboard"""
    exercises: list[WorkoutExerciseDetail] = Field(
        default_factory=list,
        description="List of exercises to be performed"
    )


class WorkoutUpdate(WorkoutBase):
    """Schema for partial updates. All fields are optional."""
    name: str | None = None
    exercises: list[WorkoutExerciseBase] | None = None