from beanie import Document
from pydantic import EmailStr
from datetime import datetime

class User(Document):
    username: str
    email: EmailStr
    hashed_password: str
    full_name: str | None = None
    createdAt: datetime = datetime.now()

    class Settings:
        name = "users"  # MongoDB collection name
