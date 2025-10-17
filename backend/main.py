from fastapi import FastAPI
from contextlib import asynccontextmanager
# Assuming db/mongo.py now contains the refactored init_db(uri)
from backend.database import init_db 
import os 
from motor.motor_asyncio import AsyncIOMotorClient

from backend.routes import exercises, ping, users, workouts, sessions

# Global variable to hold the client instance returned by init_db
global_client: AsyncIOMotorClient | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. STARTUP
    global global_client
    
    # --- CHECK FOR TESTING ENVIRONMENT HERE ---
    if os.getenv("TESTING") != "1": 
        # Only run production setup if we are NOT testing
        print("Starting Application (Production/Dev Mode)...")
        mongo_uri = os.getenv("MONGO_URI")
        
        try:
            global_client = await init_db(uri=mongo_uri)
        except Exception as e:
            print(f"FATAL ERROR during MongoDB startup: {e}")
            raise e
    else:
        # Running in test mode - skip production DB init
        print("Running in Test Mode. Skipping production DB initialization.")
    
    # Yield control to the application to handle requests
    yield
    
    # SHUTDOWN
    # Only close the client if we actually opened it (i.e., not in test mode)
    if os.getenv("TESTING") != "1" and global_client:
        global_client.close()
        print("MongoDB Client connection closed.")


app = FastAPI(lifespan=lifespan)

app.include_router(ping.router)
app.include_router(exercises.router)
app.include_router(users.router)
app.include_router(workouts.router)
app.include_router(sessions.router)

@app.get("/")
async def root():
    return {"status": "Service is running!"}
