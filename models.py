from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class Order(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_id: str
    dasher_id: Optional[str] = None
    status: str = "pending" # pending -> arrived -> completed
    
    # Handshake logic fields
    handshake_code: Optional[str] = None
    handshake_expires_at: Optional[datetime] = None