from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class OrderStatus(str, enum.Enum):
    REQUESTED = "requested"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    DELIVERED = "delivered"
    COMPLETED = "completed"

class Order(Base):
    __tablename__ = "orders"

    # identity and auth
    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Assigned when provider accepts the order

    # order details
    location = Column(String, nullable=False)
    items = Column(Text, nullable=False)
    delivery_instructions = Column(Text, nullable=True)

    max_price = Column(Float, nullable=False)
    agreed_price = Column(Float, nullable=True) # Set when provider accepts the order

    # order status
    status = Column(Enum(OrderStatus), default=OrderStatus.REQUESTED, nullable=False)

    # timing 
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    delivery_time = Column(DateTime, nullable=True)

    # QR code
    qr_token = Column(String, unique=True, nullable=True) # Generated when provider accepts the order
    qr_expiration = Column(DateTime, nullable=True) # Set to a short time window after acceptance

    # relationship
    buyer = relationship("User", back_populates="orders_as_buyer", foreign_keys=[buyer_id])
    provider = relationship("User", back_populates="orders_as_provider", foreign_keys=[provider_id])

    ratings = relationship("Rating", back_populates="order")
