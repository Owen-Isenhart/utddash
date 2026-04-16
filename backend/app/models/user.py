import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum, Float, Text
from sqlalchemy.orm import relationship
from app.database import Base

class UserRole(str, enum.Enum):
    PROVIDER = "provider"
    BUYER = "buyer"
    BOTH = "both"

class User(Base):
    __tablename__ = "users"

    # Core Identity & Auth
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # Profile Information
    full_name = Column(String, nullable=False)
    bio = Column(Text, nullable=True)
    
    # Marketplace Roles
    role = Column(Enum(UserRole), default=UserRole.BOTH, nullable=False)
    
    # P2P Payment Handles
    venmo_handle = Column(String, nullable=True)
    cashapp_handle = Column(String, nullable=True)
    zelle_handle = Column(String, nullable=True)
    
    # Reputation & Stats
    rating_avg = Column(Float, default=0.0)
    total_earnings = Column(Float, default=0.0) # Tracked for providers
    total_savings = Column(Float, default=0.0)  # Tracked for buyers

    # Relationships
    orders_as_buyer = relationship("Order", back_populates="buyer", foreign_keys="[Order.buyer_id]")
    orders_as_provider = relationship("Order", back_populates="provider", foreign_keys="[Order.provider_id]")