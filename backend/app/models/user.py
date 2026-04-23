import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum, Float, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

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
    is_verified = Column(Boolean, default=False, nullable=False)
    
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
    token_balance = Column(Float, default=0.0, nullable=False)

    # Demo-only manual location (no GPS usage)
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)

    # Relationships
    orders_as_buyer = relationship("Order", back_populates="buyer", foreign_keys="[Order.buyer_id]")
    orders_as_provider = relationship("Order", back_populates="provider", foreign_keys="[Order.provider_id]")
    notifications = relationship("Notification", back_populates="user")