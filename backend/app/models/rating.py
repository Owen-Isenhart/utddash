from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    rater_id = Column(Integer, ForeignKey("users.id"), nullable=False) # The user who gives the rating
    ratee_id = Column(Integer, ForeignKey("users.id"), nullable=False) # The user who receives the rating

    rating = Column(Integer, nullable=False) 
    comment = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    order = relationship("Order", back_populates="ratings")