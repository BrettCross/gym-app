from typing import Annotated
from fastapi import Depends, APIRouter, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from backend.models.user import User
from backend.schemas.user import UserCreate, UserRead
from backend.schemas.token import Token
from datetime import timedelta

from backend.utils import auth

router = APIRouter()

# @router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
# async def create_user(user: UserCreate):
#     # check if user exists
#     userExists = await User.find_one(User.username == user.username)
#     if userExists:
#         raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    
#     # hash the password
#     hashed_password = auth.get_password_hash(user.password)

#     # create/save user in mongo
#     user_doc = User(
#         username=user.username,
#         email=user.email,
#         hashed_password=hashed_password,
#         full_name=user.full_name
#     )
#     await user_doc.insert()
    
#     # return a clean response
#     return UserRead(
#         id=str(user_doc.id),
#         username=user_doc.username,
#         email=user_doc.email,
#         full_name=user_doc.full_name,
#     )

# @router.get("/users", response_model=list[UserRead], status_code=status.HTTP_200_OK)
# async def list_users():
#     users = await User.find_all().to_list()
#     return [
#         UserRead(
#             id=str(user.id),
#             username=user.username,
#             email=user.email,
#             full_name=user.full_name,
#         )
#         for user in users
#     ]

@router.post("/token")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    user = await auth.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")


@router.get("/users/me/", response_model=UserRead)
async def read_users_me(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
):
    return current_user


@router.get("/users/me/items/")
async def read_own_items(
    current_user: Annotated[User, Depends(auth.get_current_active_user)],
):
    return [{"item_id": "Foo", "owner": current_user.username}]