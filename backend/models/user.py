from datetime import datetime, timezone
from enum import Enum

from beanie import Document
from pydantic import EmailStr, Field

from backend.models.enums import UserRole


class User(Document):
    """
    Represents a registered user within the system.
    Handles authentication metadata and profile information.
    """

    username: str = Field(
        ...,
        description="Unique identifier used for login.",
        min_length=3,
        max_length=50
    )

    email: EmailStr = Field(
        ...,
        description="Verified email address used for communication and password resets."
    )

    hashed_password: str = Field(
        ...,
        description="Argon2id password hash."
    )

    full_name: str | None = Field(
        default=None,
        description="Optional display name."
    )

    role: UserRole = Field(
        default=UserRole.USER,
        description="The authorization level of the user, determining access to resources."
    )

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    async def save(self, *args, **kwargs):
        """
        Overriding the save method to automatically update the timestamp.
        """
        
        self.updated_at = datetime.now(timezone.utc)
        return await super().save(*args, **kwargs)

    class Settings:
        name = "users" 
