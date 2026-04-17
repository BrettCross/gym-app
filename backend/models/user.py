from beanie import Document
from pydantic import EmailStr, Field
from datetime import datetime, timezone

class User(Document):
    username: str
    email: EmailStr
    hashed_password: str
    full_name: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"  # MongoDB collection name
