from fastapi import APIRouter, HTTPException
from models.user import User
from schemas.user import UserCreate, UserRead

router = APIRouter()

@router.post("/users", response_model=UserRead)
async def create_user(user: UserCreate):
    # check if user exists
    userExists = await User.find_one(User.email == user.email)
    if userExists:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # hash the password
    hashed_password = "_HASH_" + user.password

    # create/save user in mongo
    user_doc = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    await user_doc.insert()
    
    # return a clean response
    return UserRead(
        id=str(user_doc.id),
        username=user_doc.username,
        email=user_doc.email,
        full_name=user_doc.full_name,
    )

@router.get("/users", response_model=list[UserRead])
async def list_users():
    users = await User.find_all().to_list()
    return [
        UserRead(
            id=str(user.id),
            username=user.username,
            email=user.email,
            full_name=user.full_name,
        )
        for user in users
    ]