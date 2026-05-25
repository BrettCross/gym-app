from enum import Enum

class ExerciseLibrary(str, Enum):
    """
    Specifies which library subset to query.
    """
    ALL = "all"
    OFFICIAL = "official"
    PERSONAL = "personal"


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"