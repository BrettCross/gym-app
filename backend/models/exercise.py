from beanie import Document

class Exercise(Document):
    name: str
    equipment: list[str]
    muscleGroup: list[str] # maybe split into primary and secondary
    exerciseType: str

    class Settings:
        name = "exercises" # MongoDB colletion name