from fastapi import FastAPI
from backend.app.auth import router as auth_router
<<<<<<< HEAD
=======
from backend.app.database import Base, engine
from backend.app.models import user, order, rating

Base.metadata.create_all(bind=engine)
>>>>>>> 6f8a4b6 (Edited backend structure with models and schema)

app = FastAPI(title="UTDDash API")

@app.get("/")
def root():
    return {"message": "UTDDash backend is running"}

app.include_router(auth_router)