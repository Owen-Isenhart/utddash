from datetime import datetime
from pydantic import BaseModel

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    order_id: int
    buyer_id: int
    provider_id: int
    created_at: datetime

    class Config:
        from_attributes = True