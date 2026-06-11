from typing import Annotated

import jwt
from beanie.operators import Or
from fastapi import Depends, APIRouter, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError

from backend.models.refresh_token import RefreshToken
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

    access_token = auth.create_access_token(user)
    refresh_token = await auth.create_refresh_token(user)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )


@router.post("/refresh", response_model=Token)
async def refresh(refresh_data: TokenRefreshRequest):
    """
    
    """
    try:
        payload = jwt.decode(
            refresh_data.refresh_token, 
            auth.SECRET_KEY, 
            algorithms=[auth.ALGORITHM]
        )

        jti = payload.get("jti")
        username = payload.get("sub")
        token_type = payload.get("type")

        if not jti or username is None or token_type != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        token_doc = await RefreshToken.find_one(RefreshToken.jti == jti)

        if not token_doc or token_doc.revoked:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked or expired")
        
        token_doc.revoked = True
        await token_doc.save()
        
        user = await auth.get_user(username)

        new_access_token = auth.create_access_token(user)
        new_refresh_token = await auth.create_refresh_token(user)
        return Token(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
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


@router.post("/logout")
async def logout(refresh_data: TokenRefreshRequest):
    """
    Revokes a refresh token to end the session.
    """
    try:
        payload = jwt.decode(
            refresh_data.refresh_token, 
            auth.SECRET_KEY, 
            algorithms=[auth.ALGORITHM],
            options={"verify_exp": False} 
        )
        
        jti = payload.get("jti")
        if not jti:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")

        token_doc = await RefreshToken.find_one(RefreshToken.jti == jti)
        if token_doc:
            token_doc.revoked = True
            await token_doc.save()
            
        return {"detail": "Successfully logged out"}

    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")