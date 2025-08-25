from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str | None = None

class UserRead(BaseModel):
    id: str
    username: str
    email: EmailStr
    full_name: str | None = None