from sqlalchemy import Column, Integer, String
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    payment_handle = Column(String, unique=True, index=True)
    bio = Column(String)
    profile_picture = Column(String)

