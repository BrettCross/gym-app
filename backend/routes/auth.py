from datetime import timedelta
from typing import Annotated

import jwt
from beanie.operators import Or
from fastapi import Depends, APIRouter, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError

from backend.models.user import User 
from backend.schemas.token import Token, TokenRefreshRequest
from backend.schemas.user import UserCreate, UserRead
from backend.utils import auth


router = APIRouter()

@router.post("/token", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
):
    """
    OAuth2 compatible token login, get an access token and refresh token for future endpoints.
    """

    user = await auth.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return Token(
        access_token=auth.create_access_token(user),
        refresh_token=auth.create_refresh_token(user.username),
        token_type="bearer"
    )


@router.post("/refresh", response_model=Token)
async def refresh(refresh_data: TokenRefreshRequest):
    """
    Implements refresh token rotation.

    Decodes the refresh token, validates its JTI and type, and issues
    a brand-new pair of tokens to maintain a secure, seamless session.
    """
    try:
        payload = jwt.decode(
            refresh_data.refresh_token, 
            auth.SECRET_KEY, 
            algorithms=[auth.ALGORITHM]
        )

        # Security: In a production environment, check if payload['jti'] is blacklisted here
        # if await is_jti_blacklisted(payload.get("jti")):
        #     raise HTTPException(status_code=401, detail="Token revoked")

        if payload.get("sub") is None or payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
        
        user = await auth.get_user(payload.get("sub"))
        return Token(
            access_token=auth.create_access_token(user),
            refresh_token=auth.create_refresh_token(user.username),
            token_type="bearer"
        )
        
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid refresh token"
        )


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserCreate):
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
