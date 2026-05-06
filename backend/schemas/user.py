from beanie import PydanticObjectId
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    """
    Base schema for User data shared across requests and responses.
    """

    username: str = Field(
        ...,
        description="Unique login identifier.",
        min_length=3,
        max_length=50
    )

    email: EmailStr = Field(
        ...,
        description="User's verified email address.",
    )

    full_name: str | None = Field(
        default=None,
        description="Optional display name."
    )


class UserCreate(UserBase):
    """
    Schema for new user registration.
    """

    password: str = Field(
        ...,
        description="Plain text password (hashed before storage)."
    )


class UserRead(UserBase):
    """
    Schema for returning User data to frontend.
    """

    id: PydanticObjectId = Field(
        description="Unique database identifier"
    )
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


class UserUpdate(UserBase):
    """
    Schema for updating User data. All fields are optional
    """

    email: EmailStr | None
    full_name: str | None