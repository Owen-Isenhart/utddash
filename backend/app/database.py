from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# IMPORTANT: make sure this exists in config.py
from backend.app.config import DATABASE_URL

# Base for all models
Base = declarative_base()

# Database engine
engine = create_engine(DATABASE_URL)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Dependency for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()