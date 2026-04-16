from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# This is what the buyer sends to the backend
class HandshakePayload(BaseModel):
    scanned_token: str

# This is what the backend sends back to the frontend
# The router was crashing because this specific class was missing!
class OrderResponse(BaseModel):
    id: int
    status: str
    qr_token: Optional[str] = None
    
    class Config:
        from_attributes = True