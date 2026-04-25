from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user
from backend.app.database import get_db
from backend.app.models.message import Message
from backend.app.models.order import Order
from backend.app.models.user import User
from backend.app.schemas.messages import Message as MessageSchema
from backend.app.schemas.messages import MessageCreate
from backend.app.realtime import emit_user_event
from backend.app.config import PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT

router = APIRouter()


def _get_order_for_participant(db: Session, order_id: int, current_user: User) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.id not in {order.buyer_id, order.provider_id}:
        raise HTTPException(status_code=403, detail="Not authorized for this order")

    return order


@router.get("/{order_id}", response_model=list[MessageSchema])
def get_order_messages(
    order_id: int,
    limit: int = Query(PAGINATION_DEFAULT_LIMIT, ge=1, le=PAGINATION_MAX_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_order_for_participant(db, order_id, current_user)
    return (
        db.query(Message)
        .filter(Message.order_id == order_id)
        .order_by(Message.created_at.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.post("/{order_id}", response_model=MessageSchema)
async def post_order_message(
    order_id: int,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = _get_order_for_participant(db, order_id, current_user)
    if order.provider_id is None:
        raise HTTPException(status_code=400, detail="Order chat is available after provider acceptance")
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    message = Message(
        order_id=order.id,
        buyer_id=order.buyer_id,
        provider_id=order.provider_id,
        sender_id=current_user.id,
        content=payload.content.strip(),
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    recipient_id = order.provider_id if current_user.id == order.buyer_id else order.buyer_id
    if recipient_id:
        await emit_user_event(
            recipient_id,
            "order.message",
            {
                "order_id": order.id,
                "content": message.content,
                "sender_user_id": current_user.id,
                "created_at": message.created_at.isoformat(),
            },
        )

    return message
