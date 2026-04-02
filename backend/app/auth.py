from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import APIRouter, HTTPException
from app.schemas import UserRegister, UserLogin, Token
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRATION

print("auth.py loaded")

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

fake_users_db = {}

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRATION)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/register")
def register(user: UserRegister):
    if user.email in fake_users_db:
        raise HTTPException(status_code=400, detail="User already exists")
    hashed_password = hash_password(user.password)
    fake_users_db[user.email] = {"email": user.email, "hashed_password": hashed_password, "role": user.role}
    return {"message": "User registered successfully"}

@router.post("/login", response_model=Token)
def login(user: UserLogin):
    db_user = fake_users_db.get(user.email)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}