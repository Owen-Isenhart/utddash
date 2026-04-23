from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NotificationBase(BaseModel):
    message: str
    event_type: str = "general"
    order_id: Optional[int] = None

class NotificationCreate(NotificationBase):
    user_id: int

class Notification(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationReadUpdate(BaseModel):
    is_read: bool = True