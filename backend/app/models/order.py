from datetime import datetime
import enum

from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, Text, DateTime
from sqlalchemy.orm import relationship

from backend.app.database import Base


class OrderStatus(str, enum.Enum):
    REQUESTED = "requested"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    DELIVERED = "delivered"
    COMPLETED = "completed"


class Order(Base):
    __tablename__ = "orders"

    # identity
    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # order details
    location = Column(String, nullable=False)
    items = Column(Text, nullable=False)
    delivery_instructions = Column(Text, nullable=True)

    max_price = Column(Float, nullable=False)
    agreed_price = Column(Float, nullable=True)

    # status
    status = Column(Enum(OrderStatus), default=OrderStatus.REQUESTED, nullable=False)

    # timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    delivery_time = Column(DateTime, nullable=True)

    # QR / verification
    qr_token = Column(String, unique=True, nullable=True)
    qr_expiration = Column(DateTime, nullable=True)

    # relationships
    buyer = relationship("User", back_populates="orders_as_buyer", foreign_keys=[buyer_id])
    provider = relationship("User", back_populates="orders_as_provider", foreign_keys=[provider_id])

    messages = relationship("Message", back_populates="order")
    ratings = relationship("Rating", back_populates="order")