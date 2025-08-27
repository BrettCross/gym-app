from beanie import Document


class Workout(Document):
    name: str
    exercises: list[str] # list of strings or ids?

    class Settings:
        name = "workouts"
