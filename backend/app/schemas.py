from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRegister(BaseModel):
    email: str
    password: str
    role: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

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
    delivery_time: Optional[datetime] = None

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

class RatingBase(BaseModel):
    rating: int = Field(..., ge=1, le=5) # Rating must be between 1 and 5
    comment: Optional[str] = None

class RatingCreate(RatingBase):
    order_id: int
    ratee_id: int

class Rating(RatingBase):
    id: int
    order_id: int
    rater_id: int
    ratee_id: int
    created_at: datetime

    class Config:
        from_attributes = True
