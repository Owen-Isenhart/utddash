from fastapi import FastAPI

from backend.app.auth import router as auth_router
from backend.app.database import Base, engine
from backend.app.models import user, order, rating

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="UTDDash API")


@app.get("/")
def root():
    return {"message": "UTDDash backend is running"}


app.include_router(auth_router)