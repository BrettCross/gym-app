from typing import Annotated

from fastapi import Depends, APIRouter, HTTPException, status

from backend.models.user import User
from backend.schemas.user import UserCreate, UserRead
from backend.utils import auth


router = APIRouter()

@router.get("/me", response_model=UserRead)
async def read_users_me(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
):
    """Retrieve the current authenticated user's profile"""
    return current_user