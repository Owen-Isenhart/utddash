from jose import JWTError, jwt
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Using the backend.app prefix for consistency across your project
from backend.app.auth import router as auth_router
from backend.app.orders import router as orders_router
from backend.app.ratings import router as ratings_router
from backend.app.messages import router as messages_router
from backend.app.notifications import router as notifications_router
from backend.app.config import ALGORITHM, CORS_ALLOWED_ORIGINS, SECRET_KEY
from backend.app.database import Base, engine
from backend.app.models import user, order, rating, notification, message
from backend.app.realtime import manager

# Create DB tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="UTDDash API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "UTDDash backend is running"}


# Include all routers with prefixes and tags for clean documentation
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(orders_router, prefix="/orders", tags=["Orders"])
app.include_router(ratings_router, prefix="/ratings", tags=["Ratings"])
app.include_router(messages_router, prefix="/messages", tags=["Messages"])
app.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])


@app.websocket("/ws")
async def websocket_events(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        await websocket.close(code=1008)
        return
    user_id = payload.get("user_id")
    if not user_id:
        await websocket.close(code=1008)
        return

    await manager.connect(int(user_id), websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(int(user_id), websocket)