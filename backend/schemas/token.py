from pydantic import BaseModel, Field

class Token(BaseModel):
    """
    Schema for the successful authentication response.
    Follows the OAuth2 standard format.
    """
    access_token: str = Field(
        ...,
        description="Short-lived JWT access token"
    )

    refresh_token: str = Field(
        ...,
        description="Long-lived token used to rotate credentials and maintain the session."
    )

    token_type: str = Field(
        default="bearer",
        description="The type of token (usually 'bearer')"

    )


class TokenData(BaseModel):
    """
    Payload structure for decoded tokens.
    """

    username: str | None = Field(
        default=None,
        description="The username of the authenticated user"
    )

    role: str | None = Field(
        default=None,
        description="The role of the authenticated user"
    )


class TokenRefreshRequest(BaseModel):
    """
    Schema for refreshing an expired access token.
    """

    refresh_token: str = Field(
        ...,
        description="The persistent refresh token"
    )