from datetime import datetime, timedelta
import secrets

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user
from backend.app.config import (
    PAGINATION_DEFAULT_LIMIT,
    PAGINATION_MAX_LIMIT,
    QR_TOKEN_TTL_MINUTES,
)
from backend.app.database import get_db
from backend.app.models.order import Order, OrderStatus
from backend.app.models.user import User, UserRole
from backend.app.notifications import create_notification
from backend.app.realtime import emit_user_event
from backend.app.schemas.order import (
    Order as OrderSchema,
    OrderAcceptRequest,
    OrderCreate,
    OrderLocationUpdate,
    OrderRouteUpdate,
    OrderUpdate,
    QrValidateRequest,
)

router = APIRouter()


def _get_order_or_404(db: Session, order_id: int) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def _is_provider_role(user: User) -> bool:
    return user.role in {UserRole.PROVIDER, UserRole.BOTH}


def _is_buyer_role(user: User) -> bool:
    return user.role in {UserRole.BUYER, UserRole.BOTH}


@router.post("/", response_model=OrderSchema)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _is_buyer_role(current_user):
        raise HTTPException(status_code=403, detail="Only buyers can create orders")

    order = Order(
        buyer_id=current_user.id,
        location=payload.location,
        items=payload.items,
        delivery_instructions=payload.delivery_instructions,
        max_price=payload.max_price,
        delivery_time=payload.delivery_time,
    )

    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("/", response_model=list[OrderSchema])
def get_orders(
    limit: int = Query(PAGINATION_DEFAULT_LIMIT, ge=1, le=PAGINATION_MAX_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.BUYER:
        return (
            db.query(Order)
            .filter(Order.buyer_id == current_user.id)
            .order_by(Order.updated_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
    if current_user.role == UserRole.PROVIDER:
        return (
            db.query(Order)
            .filter(Order.provider_id == current_user.id)
            .order_by(Order.updated_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
    return (
        db.query(Order)
        .filter((Order.buyer_id == current_user.id) | (Order.provider_id == current_user.id))
        .order_by(Order.updated_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.get("/open", response_model=list[OrderSchema])
def get_open_orders(
    limit: int = Query(PAGINATION_DEFAULT_LIMIT, ge=1, le=PAGINATION_MAX_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _is_provider_role(current_user):
        raise HTTPException(status_code=403, detail="Only providers can view open orders")

    return (
        db.query(Order)
        .filter(Order.status == OrderStatus.REQUESTED, Order.provider_id.is_(None))
        .order_by(Order.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.get("/me", response_model=list[OrderSchema])
def get_my_orders(
    limit: int = Query(PAGINATION_DEFAULT_LIMIT, ge=1, le=PAGINATION_MAX_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Order)
        .filter((Order.buyer_id == current_user.id) | (Order.provider_id == current_user.id))
        .order_by(Order.updated_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.get("/{order_id}", response_model=OrderSchema)
def get_order_by_id(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = _get_order_or_404(db, order_id)
    if current_user.id not in {order.buyer_id, order.provider_id}:
        raise HTTPException(status_code=403, detail="Not authorized for this order")
    return order


@router.post("/{order_id}/accept", response_model=OrderSchema)
async def accept_order(
    order_id: int,
    payload: OrderAcceptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _is_provider_role(current_user):
        raise HTTPException(status_code=403, detail="Only providers can accept orders")

    order = _get_order_or_404(db, order_id)
    if order.status != OrderStatus.REQUESTED or order.provider_id is not None:
        raise HTTPException(status_code=409, detail="Order is no longer available")
    if order.buyer_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot accept your own order")

    order.provider_id = current_user.id
    order.status = OrderStatus.ACCEPTED
    if payload.agreed_price is not None:
        order.agreed_price = payload.agreed_price

    db.commit()
    db.refresh(order)

    create_notification(
        db,
        user_id=order.buyer_id,
        message=f"Your order #{order.id} was accepted.",
        event_type="order.accepted",
        order_id=order.id,
    )
    await emit_user_event(
        order.buyer_id,
        "order.accepted",
        {"order_id": order.id, "provider_id": current_user.id},
    )
    return order


@router.patch("/{order_id}", response_model=OrderSchema)
async def update_order(
    order_id: int,
    payload: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = _get_order_or_404(db, order_id)

    if current_user.id not in {order.buyer_id, order.provider_id}:
        raise HTTPException(status_code=403, detail="Not authorized for this order")

    if payload.agreed_price is not None:
        if current_user.id != order.provider_id:
            raise HTTPException(status_code=403, detail="Only provider can update agreed price")
        order.agreed_price = payload.agreed_price

    if payload.status is not None:
        transition = (order.status, payload.status)
        allowed = {
            (OrderStatus.ACCEPTED, OrderStatus.IN_PROGRESS),
            (OrderStatus.IN_PROGRESS, OrderStatus.DELIVERED),
        }
        if transition not in allowed:
            raise HTTPException(status_code=400, detail="Invalid status transition")
        if current_user.id != order.provider_id:
            raise HTTPException(status_code=403, detail="Only provider can move order status")
        order.status = payload.status

        counterpart_id = order.buyer_id
        create_notification(
            db,
            user_id=counterpart_id,
            message=f"Order #{order.id} status is now {order.status.value}.",
            event_type="order.status",
            order_id=order.id,
        )
        await emit_user_event(
            counterpart_id,
            "order.status",
            {"order_id": order.id, "status": order.status.value},
        )

    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_id}/arrive", response_model=OrderSchema)
async def mark_arrived_and_generate_qr(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = _get_order_or_404(db, order_id)
    if current_user.id != order.provider_id:
        raise HTTPException(status_code=403, detail="Only provider can generate delivery QR")
    if order.status not in {OrderStatus.IN_PROGRESS, OrderStatus.DELIVERED}:
        raise HTTPException(status_code=400, detail="Order must be in progress before arrival")

    order.status = OrderStatus.DELIVERED
    order.qr_token = secrets.token_urlsafe(24)
    order.qr_expiration = datetime.utcnow() + timedelta(minutes=QR_TOKEN_TTL_MINUTES)
    order.qr_verified_at = None
    db.commit()
    db.refresh(order)

    create_notification(
        db,
        user_id=order.buyer_id,
        message=f"Provider arrived for order #{order.id}. Scan QR to complete.",
        event_type="order.arrived",
        order_id=order.id,
    )
    await emit_user_event(
        order.buyer_id,
        "order.arrived",
        {
            "order_id": order.id,
            "qr_token": order.qr_token,
            "qr_expiration": order.qr_expiration.isoformat() if order.qr_expiration else None,
        },
    )
    return order


@router.post("/{order_id}/validate-qr", response_model=OrderSchema)
async def validate_qr_and_complete_order(
    order_id: int,
    payload: QrValidateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = _get_order_or_404(db, order_id)
    if current_user.id != order.buyer_id:
        raise HTTPException(status_code=403, detail="Only buyer can validate delivery QR")
    if order.status != OrderStatus.DELIVERED:
        raise HTTPException(status_code=400, detail="Order is not ready for QR validation")
    if not order.qr_token or not order.qr_expiration:
        raise HTTPException(status_code=400, detail="QR token has not been generated")
    if datetime.utcnow() > order.qr_expiration:
        raise HTTPException(status_code=400, detail="QR token expired")
    if payload.qr_token != order.qr_token:
        raise HTTPException(status_code=400, detail="Invalid QR token")

    order.status = OrderStatus.COMPLETED
    order.qr_verified_at = datetime.utcnow()
    order.qr_token = None
    order.qr_expiration = None

    settlement_tokens = order.agreed_price if order.agreed_price is not None else order.max_price
    provider = db.query(User).filter(User.id == order.provider_id).first()
    buyer = db.query(User).filter(User.id == order.buyer_id).first()
    if provider and buyer:
        if buyer.token_balance < settlement_tokens:
            raise HTTPException(status_code=400, detail="Buyer does not have enough tokens")
        buyer.token_balance -= settlement_tokens
        provider.token_balance += settlement_tokens
        provider.total_earnings += settlement_tokens
        buyer.total_savings += max(order.max_price - settlement_tokens, 0)

    db.commit()
    db.refresh(order)

    if order.provider_id:
        create_notification(
            db,
            user_id=order.provider_id,
            message=f"Order #{order.id} was completed and token transfer settled.",
            event_type="order.completed",
            order_id=order.id,
        )
        await emit_user_event(
            order.provider_id,
            "order.completed",
            {"order_id": order.id},
        )

    await emit_user_event(order.buyer_id, "order.completed", {"order_id": order.id})
    return order


@router.patch("/{order_id}/location", response_model=OrderSchema)
async def update_order_location(
    order_id: int,
    payload: OrderLocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = _get_order_or_404(db, order_id)
    if current_user.id not in {order.buyer_id, order.provider_id}:
        raise HTTPException(status_code=403, detail="Not authorized for this order")

    if current_user.id == order.provider_id:
        order.provider_lat = payload.lat
        order.provider_lng = payload.lng
    else:
        order.buyer_lat = payload.lat
        order.buyer_lng = payload.lng

    db.commit()
    db.refresh(order)

    recipient_id = order.buyer_id if current_user.id == order.provider_id else order.provider_id
    if recipient_id:
        await emit_user_event(
            recipient_id,
            "order.location",
            {
                "order_id": order.id,
                "lat": payload.lat,
                "lng": payload.lng,
                "actor_user_id": current_user.id,
            },
        )
    return order


@router.patch("/{order_id}/route", response_model=OrderSchema)
async def update_order_route(
    order_id: int,
    payload: OrderRouteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = _get_order_or_404(db, order_id)
    if current_user.id != order.provider_id:
        raise HTTPException(status_code=403, detail="Only provider can update route")

    order.route_geojson = payload.route_geojson
    db.commit()
    db.refresh(order)

    await emit_user_event(
        order.buyer_id,
        "order.route",
        {
            "order_id": order.id,
            "route_geojson": order.route_geojson,
        },
    )
    return order