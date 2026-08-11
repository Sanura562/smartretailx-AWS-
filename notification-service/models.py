from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# No SQLAlchemy here - notifications are stored in DynamoDB (or, locally,
# an in-memory dict in dynamodb.py). These are pure Pydantic schemas
# used for request/response validation only.


class NotificationCreate(BaseModel):
    """Shape of a notification created internally (e.g. by the SQS consumer)."""
    user_id: int
    message: str
    notification_type: str
    order_id: Optional[int] = None


class NotificationResponse(BaseModel):
    id: str
    user_id: int
    message: str
    notification_type: str
    order_id: Optional[int] = None
    is_read: bool
    created_at: datetime
