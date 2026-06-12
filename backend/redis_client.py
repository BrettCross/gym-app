import os
import redis

# Connection pooling for efficient resource usage
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "redis"),
    port=6379,
    db=0,
    password=os.getenv("REDIS_PASS"),
    decode_responses=True
)