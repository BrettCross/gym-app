from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from beanie import PydanticObjectId

from backend.models.enums import UserRole
from backend.models.user import User
from backend.schemas.user import UserRead
from backend.services import exercise_service
from backend.utils.auth import require_role


router = APIRouter(
    dependencies=[Depends(require_role(UserRole.ADMIN))]
)

@router.get("/users", response_model=list[UserRead])
async def read_all_users(
    admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
):
    """
    Returns a complete list of users.
    """

    return await User.find_all().to_list()


@router.patch("/exercises/{exercise_id}/verify")
async def verify_exercise(
    admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    exercise_id: PydanticObjectId
):
    """
    Promotes a user-contributed exercise to the Official library.
    """

    promoted_exercise = await exercise_service.promote_to_official(exercise_id)
    return promoted_exercise


@router.delete("/users/{user_id}")
async def delete_user(
    admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    user_id: PydanticObjectId
    ):
    """
    Deletes a user from
    """

    user = await User.get(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    await user.delete()
    return None