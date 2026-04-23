from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user
from backend.app.database import get_db
from backend.app.models.order import Order, OrderStatus
from backend.app.models.rating import Rating
from backend.app.models.user import User
from backend.app.schemas.rating import Rating as RatingSchema
from backend.app.schemas.rating import RatingCreate

router = APIRouter()


def _recalculate_user_rating(db: Session, user_id: int) -> None:
    avg_rating = db.query(func.avg(Rating.rating)).filter(Rating.ratee_id == user_id).scalar()
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.rating_avg = float(avg_rating or 0.0)


@router.post("/", response_model=RatingSchema)
def create_rating(
    payload: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == payload.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != OrderStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Ratings are allowed only after completion")
    if current_user.id not in {order.buyer_id, order.provider_id}:
        raise HTTPException(status_code=403, detail="Not authorized to rate this order")
    if payload.ratee_id not in {order.buyer_id, order.provider_id}:
        raise HTTPException(status_code=400, detail="Ratee must be part of this order")
    if payload.ratee_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot rate yourself")

    existing = (
        db.query(Rating)
        .filter(Rating.order_id == payload.order_id, Rating.rater_id == current_user.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="You already rated this order")

    rating = Rating(
        order_id=payload.order_id,
        rater_id=current_user.id,
        ratee_id=payload.ratee_id,
        rating=payload.rating,
        comment=payload.comment,
    )

    db.add(rating)
    _recalculate_user_rating(db, payload.ratee_id)
    db.commit()
    db.refresh(rating)
    return rating


@router.get("/", response_model=list[RatingSchema])
def get_ratings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Rating)
        .filter((Rating.rater_id == current_user.id) | (Rating.ratee_id == current_user.id))
        .order_by(Rating.created_at.desc())
        .all()
    )


@router.get("/{rating_id}", response_model=RatingSchema)
def get_rating_by_id(
    rating_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rating = db.query(Rating).filter(Rating.id == rating_id).first()
    if rating is None:
        raise HTTPException(status_code=404, detail="Rating not found")
    if current_user.id not in {rating.rater_id, rating.ratee_id}:
        raise HTTPException(status_code=403, detail="Not authorized to view this rating")
    return rating