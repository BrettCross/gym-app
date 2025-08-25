from beanie import Document
from typing import List

class Exercise(Document):
    name: str
    equipment: List[str]
    muscleGroup: List[str] # maybe split into primary and secondary
    exerciseType: str

    class Settings:
        name = "exercises" # MongoDB colletion name