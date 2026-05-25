from typing import Annotated

from fastapi import Depends, APIRouter, HTTPException, status

from backend.models.user import User, UserRole
from backend.schemas.user import UserCreate, UserRead
from backend.utils import auth


router = APIRouter()

@router.get("/me", response_model=UserRead)
async def read_users_me(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
):
    """Retrieve the current authenticated user's profile"""
    return current_user

@router.get("/all", response_model=list[UserRead])
async def read_all_users(
    admin: Annotated[User, Depends(auth.require_role(UserRole.ADMIN))],
):
    """
    Protected Admin-Only route. 
    Regular users will receive a 404 per the 'Invisible 404' strategy.
    """
    return await User.find_all().to_list()