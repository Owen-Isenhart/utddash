from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user
from backend.app.database import get_db
from backend.app.models.notification import Notification
from backend.app.models.user import User
from backend.app.schemas.notification import (
    Notification as NotificationSchema,
    NotificationReadUpdate,
)

router = APIRouter()


@router.get("/", response_model=list[NotificationSchema])
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.patch("/{notification_id}", response_model=NotificationSchema)
def mark_notification_read(
    notification_id: int,
    payload: NotificationReadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = payload.is_read
    db.commit()
    db.refresh(notification)
    return notification


def create_notification(
    db: Session,
    user_id: int,
    message: str,
    event_type: str = "general",
    order_id: int | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        message=message,
        event_type=event_type,
        order_id=order_id,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
