from fastapi import FastAPI
from app.auth import router as auth_router
from app.routes import orders, ratings

app = FastAPI(title="UTDDash API")

@app.get("/")
def root():
    return {"message": "UTDDash backend is running"}

app.include_router(auth_router)
app.include_router(orders.router)
app.include_router(ratings.router)

