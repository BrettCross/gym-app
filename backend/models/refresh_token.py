# backend/models/auth.py
from datetime import datetime
from typing import Annotated

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

class RefreshToken(Document):
    """
    Represents a stored refresh token session.
    Used for token revocation, reuse detection, and session management.
    """

    jti: Annotated[str, Indexed(unique=True)] = Field(
        ...,
        description="The unique identifier (JWT ID) matching the 'jti' claim in the token payload."
    )

    user_id: PydanticObjectId = Field(
        ...,
        description="The ID of the user who owns this session."
    )

    username: str = Field(
        ...,
        description="The username of the user who owns this session."
    )

    expires_at: Annotated[datetime, Indexed(expireAfterSeconds=0)] = Field(
        ...,
        description="The timestamp when the token is no longer valid. MongoDB will auto-delete the record at this time."
    )

    revoked: bool = Field(
        default=False,
        description="Flag indicating if this token has been manually revoked or already used in a rotation."
    )

    class Settings:
        name = "refresh_tokens"