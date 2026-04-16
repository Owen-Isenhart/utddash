from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    PROVIDER = "provider"
    BUYER = "buyer"
    BOTH = "both"

# fields shared for creating and reading users
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.BOTH
    venmo_handle: Optional[str] = None
    cashapp_handle: Optional[str] = None
    zelle_handle: Optional[str] = None

    # custom validation for UTD emails
    @field_validator('email')
    @classmethod
    def validate_utd_email(cls, v: str):
        if not v.lower().endswith('@utdallas.edu'):
            raise ValueError('Registration requires a valid @utdallas.edu email')
        return v

# schema for user registration (includes password)
class UserCreate(UserBase):
    password: str

# schema for updating user info (all fields optional)
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    venmo_handle: Optional[str] = None
    cashapp_handle: Optional[str] = None
    zelle_handle: Optional[str] = None


# schema for returning user data (excludes sensitive info)
class User(UserBase):
    id: int
    is_verified: bool = False
    rating_avg: float = 0.0
    total_earnings: float = 0.0
    total_savings: float = 0.0

    class Config:
        from_attributes = True # Allows Pydantic to read from SQLAlchemy models

class Token(BaseModel):
    access_token: str
    token_type: str
        