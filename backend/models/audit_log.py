from datetime import datetime, timezone

from beanie import Document, PydanticObjectId
from pydantic import Field

class AuditLog(Document):
    """
    Schema for persistent security events. 
    Indexed on timestamp for performant admin queries.
    """
    user_id: PydanticObjectId = Field (
        ...,
        description="The id of the user who performed the event."
    )

    method: str = Field(
        description="The request type for the event."
    )

    path: str = Field(
        description="The path used for the event."
    )

    status_code: int = Field(
        description="The response status code for the event."
    )

    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "audit_logs"
        indexes = ["timestamp"]