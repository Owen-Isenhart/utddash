from datetime import datetime
from pydantic import BaseModel

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    order_id: int

class Message(MessageBase):
    id: int
    order_id: int
    sender_id: int
    created_at: datetime

    class Config:
        from_attributes = True