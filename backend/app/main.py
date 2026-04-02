from fastapi import FastAPI
from app.auth import router as auth_router

app = FastAPI(title="UTDDash API")

@app.get("/")
def root():
    return {"message": "UTDDash backend is running"}

app.include_router(auth_router)