import datetime
from typing import Optional
from pydantic import BaseModel
from enum import Enum


class OrderStatus(str, Enum):
    REQUESTED = "requested"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    DELIVERED = "delivered"
    COMPLETED = "completed"

class OrderBase(BaseModel):
    location: str
    items: str
    delivery_instructions: Optional[str] = None
    max_price: float
    delivery_time: Optional[str] = None

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    agreed_price: Optional[float] = None

class Order(OrderBase):
    id: int
    buyer_id: int
    provider_id: Optional[int] = None
    status: OrderStatus
    agreed_price: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True