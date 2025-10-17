import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from beanie import init_beanie
from dotenv import load_dotenv
from backend.models.user import User
from backend.models.exercise import Exercise
from backend.models.workout import Workout
from backend.models.session import Session

# Global state to hold the initialized database object
_db_connection: AsyncIOMotorDatabase = None

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
TEST_MONGO_URI = os.getenv("TEST_MONGO_URI")

async def init_db(uri: str) -> AsyncIOMotorClient:
    """Initializes the MongoDB client and the Beanie ODM."""
    global _db_connection
    
    print(f"Connecting to Mongo with URI: {uri[76:]}...")
    
    client = AsyncIOMotorClient(uri)
    db = client.get_database()
    
    # Initialize Beanie with the connected database and your models
    await init_beanie(
        database=db, 
        document_models=[User, Exercise, Workout, Session]
    )
    
    # Store the database object globally
    _db_connection = db
    
    print("Beanie/Mongo connection complete!")
    return client

# --- DEPENDENCY FUNCTION TO OVERRIDE ---
def get_database() -> AsyncIOMotorDatabase:
    """
    FastAPI Dependency function that returns the database object.
    This is the function you will use in your routes and override in tests.
    """
    if _db_connection is None:
        raise ConnectionError("Database not initialized. Check startup events.")
    return _db_connection

print(f"DEBUG ID 1 (Defined in mongo.py): {id(get_database)}")

# --- Utility to close connection (e.g., in FastAPI shutdown event) ---
async def close_db(client: AsyncIOMotorClient):
    global _db_connection
    if client:
        client.close()
    _db_connection = None
