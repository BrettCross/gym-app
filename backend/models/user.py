from datetime import datetime, timezone

from beanie import Document
from pydantic import EmailStr, Field


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

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users" 
