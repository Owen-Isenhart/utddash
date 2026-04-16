from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware # 1. Import the middleware
import models, database
from routers import orders
from sqlalchemy.orm import Session

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# 2. Add the middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Allow your Next.js app
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods (GET, POST, etc.)
    allow_headers=["*"], # Allow all headers
)

app.include_router(orders.router)

@app.get("/")
def read_root():
    return {"message": "UTDDash API is running"}

@app.post("/setup-test")
def setup_test(db: Session = Depends(database.get_db)):
    # This creates the order that your frontend is looking for
    new_order = models.Order(id=1, status="Pending")
    db.add(new_order)
    db.commit()
    return {"message": "Order #1 created! You can now test the QR code."}