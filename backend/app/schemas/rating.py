from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


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