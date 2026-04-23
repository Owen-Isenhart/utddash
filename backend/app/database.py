from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.config import DATABASE_URL

# Base class for all SQLAlchemy models to inherit from
Base = declarative_base()

# Create the database engine
engine = create_engine(DATABASE_URL)

# Session factory for creating new database sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Dependency to provide a database session to FastAPI routes
# It ensures the connection is closed after the request is finished
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()