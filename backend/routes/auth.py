from datetime import timedelta
from typing import Annotated

from beanie.operators import Or
from fastapi import Depends, APIRouter, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from backend.models.user import User 
from backend.schemas.token import Token
from backend.schemas.user import UserCreate, UserRead
from backend.utils import auth


router = APIRouter()

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> dict:
    """
    OAuth2 compatible token login, get an access token for future endpoints.
    """

    user = await auth.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, 
        expires_delta=access_token_expires
    )

    return Token(access_token=access_token, token_type="bearer")


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserCreate) -> User:
    """
    Register a new user account.
    """

    existing_user = await User.find_one(
        Or(
            User.username == user_in.username, 
            User.email == user_in.email
        )
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail="username or email already registered"
        )
    
    user_data = user_in.model_dump(exclude={"password"})
    hashed_password = auth.get_password_hash(user_in.password)

    new_user = User(
        **user_data,
        hashed_password=hashed_password
    )

    await new_user.insert()
    return new_user
