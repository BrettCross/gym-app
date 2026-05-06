from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter()

@router.get("/ping", summary="API Heartbeat")
async def ping():
    """
    Verifies that the API routing layer and middleware are functioning.

    This differs from the top-level /healthz as it ensures the 
    request has successfully passed through the /api prefix logic.
    """
    return {
        "message": "pong",
        "timestamp": datetime.now(timezone.utc),
        "environment": "development",
        "version": "1.0.0"
    }
