import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
# Change these to go "up" one level or use absolute paths
import models, schemas, database
router = APIRouter(prefix="/orders", tags=["Orders"])

# 1. Provider hits this when they arrive at the location
@router.post("/{order_id}/arrive", response_model=schemas.OrderResponse)
def mark_as_arrived(order_id: int, db: Session = Depends(database.get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Generate token and 5-minute expiry
    order.status = "Arrived"
    order.qr_token = str(uuid.uuid4())
    order.qr_token_expiry = datetime.utcnow() + timedelta(minutes=5)
    
    db.commit()
    db.refresh(order)
    return order

# 2. Buyer hits this when they scan the QR code
@router.post("/{order_id}/verify-handshake")
def verify_handshake(order_id: int, payload: schemas.HandshakePayload, db: Session = Depends(database.get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Security Checks
    if not order.qr_token or order.qr_token != payload.scanned_token:
        raise HTTPException(status_code=400, detail="Invalid QR code")
        
    if datetime.utcnow() > order.qr_token_expiry:
        raise HTTPException(status_code=400, detail="QR code has expired")

    # Success: Finalize Order
    order.status = "Completed"
    order.qr_token = None  # Clear token so it can't be reused
    db.commit()
    
    return {"message": "Handshake successful, order completed"}