from beanie import Document, PydanticObjectId
from datetime import datetime

class Exercise(Document):
    userID: PydanticObjectId
    name: str
    equipment: list[str]
    muscleGroup: list[str] # maybe split into primary and secondary
    exerciseType: str
    createdAt: datetime = datetime.now()

    class Settings:
        name = "exercises" # MongoDB colletion name