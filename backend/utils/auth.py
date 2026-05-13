import os
from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, status, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from backend.models.user import User
from backend.schemas.token import TokenData

# --- Configuration ---
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

# --- Password Logic ---
def verify_password(plain_password, hashed_password) -> bool:
    """Verifies a plain text password against a stored hash."""
    return password_hash.verify(plain_password, hashed_password)

def get_password_hash(password) -> str:
    """Generates a secure hash from a plain text password."""
    return password_hash.hash(password)

# --- User Retreival Logic ---
async def get_user(username: str) -> str | None:
    """
    Fetches the full user document by username.
    """
    return await User.find_one(User.username == username)
    
async def authenticate_user(username: str, password: str) -> User | None:
    """Validates User credentials.
    Returns the User document if successful, otherwise None.
    """
    user = await get_user(username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

# --- Token Logic ---
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Generates a JWT access token.
    Defaults to 15 minutes if no delta is provided.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- Dependency Injection ---
async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)]
) -> User:
    """
    FastAPI dependency that decodes the JWT and retrieves the User document.
    """
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except InvalidTokenError:
        raise credentials_exception

    user = await get_user(username=token_data.username)
    if user is None:
        raise credentials_exception

    return user

async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """
    Final dependency to ensure user is active (and eventually check roles).
    """
    return current_user