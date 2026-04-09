import qrcode
import io
import base64
import uuid
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException

app = FastAPI()

# HELPER: This turns text into a QR image string
def get_qr_b64(content: str):
    qr = qrcode.make(content)
    buf = io.BytesIO()
    qr.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()

# 1. DASHER ARRIVES
@app.post("/orders/{order_id}/arrive")
async def mark_arrived(order_id: int):
    # In a real app, you'd fetch from DB here. 
    # For now, we generate a secret 'handshake'
    secret = str(uuid.uuid4())[:8] # Shortened for easy reading
    
    qr_image = get_qr_b64(secret)
    
    return {
        "status": "arrived",
        "handshake_code": secret,
        "qr_code_base64": f"data:image/png;base64,{qr_image}"
    }

# 2. CUSTOMER SCANS
@app.post("/orders/{order_id}/confirm")
async def confirm_order(order_id: int, scanned_code: str):
    # Here, you would check if scanned_code == DB's handshake_code
    if scanned_code: 
        return {"message": "Delivery Confirmed!", "payout": "released"}
    raise HTTPException(status_code=400, detail="Invalid code")