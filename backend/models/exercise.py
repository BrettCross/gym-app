from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime, timezone

class Exercise(Document):
    userID: PydanticObjectId
    name: str
    equipment: list[str]
    muscleGroup: list[str] # maybe split into primary and secondary
    exerciseType: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "exercises" # MongoDB colletion name