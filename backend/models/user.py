from beanie import Document
from pydantic import EmailStr

class User(Document):
    username: str
    email: EmailStr
    hashed_password: str
    full_name: str | None = None

    class Settings:
        name = "users"  # MongoDB collection name
