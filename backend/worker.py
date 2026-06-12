import asyncio
import json
import os
import redis
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from backend.models.audit_log import AuditLog

async def run_worker():
    """
    Consumes tasks from Redis and persists them to MongoDB.
    """
    user = os.getenv("MONGO_USER")
    password = os.getenv("MONGO_PASS")
    host = os.getenv("MONGO_HOST")
    mongo_uri = f"mongodb+srv://{user}:{password}@{host}"
    client = AsyncIOMotorClient(mongo_uri)
    db = client.get_default_database()
    await init_beanie(database=db, document_models=[AuditLog])
    
    r = redis.Redis(
        host=os.getenv("REDIS_HOST", "redis"), 
        port=6379,
        password=os.getenv("REDIS_PASS"),
        decode_responses=True,
        socket_timeout=None,
        socket_connect_timeout=10
    )
    print("Worker active: Listening for audit events...")

    while True:
        try:
            # Blocks until a log is available
            result = r.brpop("audit_queue", timeout=0)
            if result:
                _, message = result
                data = json.loads(message)
                log_entry = AuditLog(**data)
                await log_entry.insert()
                # Professional tip: add a success print for debugging
                print(f"Successfully audited: {data.get('method')} {data.get('path')}")
        except redis.exceptions.ConnectionError:
            print("Redis connection lost. Retrying in 5 seconds...")
            await asyncio.sleep(5)
        except Exception as e:
            print(f"Worker Error: {e}")

if __name__ == "__main__":
    asyncio.run(run_worker())