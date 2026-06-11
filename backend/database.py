import os

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from backend.models.user import User
from backend.models.exercise import Exercise
from backend.models.workout import Workout
from backend.models.session import Session
from backend.models.refresh_token import RefreshToken


async def init_db(uri: str | None = None) -> None:
    """
    Initializes the MongoDB client and the Beanie ODM.
    """

    # Use provided URI or fallback to environment variable
    # target_uri = uri or os.getenv("MONGO_URI")
    user = os.getenv("MONGO_USER")
    password = os.getenv("MONGO_PASS")
    host = os.getenv("MONGO_HOST")
    target_uri = uri or f"mongodb+srv://{user}:{password}@{host}"

    if not target_uri:
        raise ValueError("MongoDB connection URI is missing!")

    print("Connecting to MongoDB...")
    
    # Create the Motor Client
    client = AsyncIOMotorClient(target_uri)

    # Get default database from URI 
    db = client.get_default_database()
    
    # Initialize Beanie with models
    await init_beanie(
        database=db, 
        document_models=[
            User, 
            Exercise, 
            Workout, 
            Session,
            RefreshToken
        ]
    )
    
    print("Beanie/Mongo initialization complete!")
    