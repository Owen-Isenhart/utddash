from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import APIRouter, HTTPException
from app.schemas import UserRegister, UserLogin, Token
from app.config import SECRET_KEY, ALGORITH, ACCESS_TOKEN_EXPIRATION

router = APIRouter()