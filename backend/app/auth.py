from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

# Using the backend.app structure from your HEAD branch
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.schemas.user import (
    UserCreate,
    UserResponse,
    Token,
    UserUpdate,
    TokenBalanceUpdate,
    UserLocationUpdate,
)
from backend.app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRATION

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str):
    password = str(password).strip()
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(str(plain_password).strip(), hashed_password)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRATION)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="User already exists"
        )

    new_user = User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hash_password(user.password),
        role=user.role,
        venmo_handle=user.venmo_handle,
        cashapp_handle=user.cashapp_handle,
        zelle_handle=user.zelle_handle,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == form_data.username).first()

    if not db_user or not verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid email or password"
        )

    # Added "role" to the token payload as seen in the incoming branch
    access_token = create_access_token(
        data={"sub": db_user.email, "role": db_user.role.value, "user_id": db_user.id}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")

        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    user = db.query(User).filter(User.email == email).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user


@router.get("/users/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/users/me", response_model=UserResponse)
def update_users_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch("/users/me/token-balance", response_model=UserResponse)
def update_my_token_balance(
    payload: TokenBalanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.token_balance < 0:
        raise HTTPException(status_code=400, detail="Token balance cannot be negative")

    current_user.token_balance = payload.token_balance
    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch("/users/me/location", response_model=UserResponse)
def update_my_location(
    payload: UserLocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.current_lat = payload.lat
    current_user.current_lng = payload.lng
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/validate-token")
def validate_token(current_user: User = Depends(get_current_user)):
    return {
        "message": "Token is valid",
        "user_id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
    }