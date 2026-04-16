from sqlalchemy import Column, Integer, String, DateTime
from database import Base

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="Pending")
    qr_token = Column(String, nullable=True)
    qr_token_expiry = Column(DateTime, nullable=True)