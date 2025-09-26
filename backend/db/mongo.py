import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv
from models.user import User
from models.exercise import Exercise
from models.workout import Workout
from models.session import Session


load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
TEST_MONGO_URI = os.getenv("TEST_MONGO_URI")

async def init_db():
    print("Connecting to Mongo...")
    # check if in test mode
    uri = TEST_MONGO_URI if os.getenv("ENV") == "test" else MONGO_URI
    print(f"Using uri: {uri}")
    client = AsyncIOMotorClient(uri)
    print("Connected to Mongo Client!")
    db = client.get_database()
    print("Got database!")
    print("retrieving collection names...")
    print(await db.list_collection_names())
    await init_beanie(database=db, document_models=[User, Exercise, Workout, Session])
    return client
