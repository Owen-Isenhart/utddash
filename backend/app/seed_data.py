import argparse
import json
import random
import secrets
from datetime import UTC, datetime, timedelta

from passlib.context import CryptContext

from backend.app.database import Base, SessionLocal, engine
from backend.app.models.message import Message
from backend.app.models.notification import Notification
from backend.app.models.order import Order, OrderStatus
from backend.app.models.rating import Rating
from backend.app.models.user import User, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

FIRST_NAMES = [
    "Alex", "Jordan", "Taylor", "Riley", "Casey", "Morgan", "Jamie", "Avery",
    "Drew", "Parker", "Quinn", "Logan", "Skyler", "Reese", "Dakota", "Finley",
    "Elliot", "Blake", "Kendall", "Micah", "Hayden", "Emerson", "Sawyer", "Rowan",
]

LAST_NAMES = [
    "Nguyen", "Patel", "Kim", "Garcia", "Smith", "Lopez", "Johnson", "Tran",
    "Ahmed", "Singh", "Brown", "Miller", "Martinez", "Chen", "Wright", "Clark",
    "Hall", "Allen", "Young", "Hill", "Scott", "Green", "Adams", "Baker",
]

DINING_LOCATIONS = [
    "Dining Hall West", "Dining Hall East", "Student Union Food Court", "Pub at UTD",
    "Chick-fil-A SU", "Panda Express SU", "Halal Shack", "Einstein Bros Bagels",
    "Taco Bell Cantina", "Northside Cafe", "Comet Cafe", "Market at UV",
]

ITEM_SETS = [
    "Chicken tenders, fries, drink",
    "Veggie bowl, water",
    "Burger combo with no onions",
    "Pasta plate and side salad",
    "Burrito bowl extra protein",
    "Sushi roll and miso soup",
    "Sandwich and chips",
    "Pizza slice combo",
    "Rice bowl and tea",
    "Noodles and spring rolls",
    "Wrap and smoothie",
    "Coffee and breakfast sandwich",
]

INSTRUCTIONS = [
    "Meet at library front entrance",
    "Drop at ECS North lobby",
    "I will wait near the fountain",
    "Call me when you arrive",
    "Meet by parking structure elevator",
    "Leave with front desk",
    "Meet at residence hall entrance",
    "Text before pickup and dropoff",
]

MESSAGE_TEMPLATES = [
    "On my way now.",
    "I am at the pickup line.",
    "Order confirmed.",
    "Running a couple minutes late.",
    "I just parked nearby.",
    "Can you meet at the side entrance?",
    "I am here, sending location update.",
    "Got your food, heading over.",
    "QR ready when you are.",
    "Completed, thanks.",
]

NOTIFICATION_MESSAGES = [
    "New request posted near your area.",
    "A provider accepted your order.",
    "Provider marked your order in progress.",
    "Provider arrived, scan QR to complete.",
    "Order completed successfully.",
    "You received a new message.",
    "You received a new rating.",
]

RATING_COMMENTS = [
    "Fast delivery and smooth handoff.",
    "Good communication throughout.",
    "Very reliable and friendly.",
    "Accurate order and on time.",
    "Great experience overall.",
    "Helpful updates, would order again.",
    "Solid service and easy meetup.",
    "No issues, quick completion.",
]


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def utc_now_naive() -> datetime:
    # Keep DB values UTC while remaining compatible with naive DateTime columns.
    return datetime.now(UTC).replace(tzinfo=None)


def random_coord() -> tuple[float, float]:
    # Roughly around UTD campus for demo-only map interactions.
    base_lat = 32.9858
    base_lng = -96.7501
    return (
        round(base_lat + random.uniform(-0.01, 0.01), 6),
        round(base_lng + random.uniform(-0.01, 0.01), 6),
    )


def make_demo_route(start_lat: float, start_lng: float, end_lat: float, end_lng: float) -> str:
    mid_lat = round((start_lat + end_lat) / 2 + random.uniform(-0.0015, 0.0015), 6)
    mid_lng = round((start_lng + end_lng) / 2 + random.uniform(-0.0015, 0.0015), 6)
    route = {
        "type": "LineString",
        "coordinates": [
            [start_lng, start_lat],
            [mid_lng, mid_lat],
            [end_lng, end_lat],
        ],
    }
    return json.dumps(route)


def reset_data(db) -> None:
    db.query(Rating).delete()
    db.query(Message).delete()
    db.query(Notification).delete()
    db.query(Order).delete()
    db.query(User).delete()
    db.commit()


def build_users(db, total_users: int, password: str) -> list[User]:
    users: list[User] = []

    demo_users = [
        ("demo_buyer1@utdallas.edu", "Demo Buyer One", UserRole.BUYER),
        ("demo_buyer2@utdallas.edu", "Demo Buyer Two", UserRole.BUYER),
        ("demo_provider1@utdallas.edu", "Demo Provider One", UserRole.PROVIDER),
        ("demo_provider2@utdallas.edu", "Demo Provider Two", UserRole.PROVIDER),
        ("demo_hybrid1@utdallas.edu", "Demo Hybrid One", UserRole.BOTH),
        ("demo_hybrid2@utdallas.edu", "Demo Hybrid Two", UserRole.BOTH),
    ]

    for email, full_name, role in demo_users:
        lat, lng = random_coord()
        users.append(
            User(
                email=email,
                full_name=full_name,
                hashed_password=hash_password(password),
                role=role,
                bio=f"{full_name} seeded for backend demo testing.",
                venmo_handle=full_name.lower().replace(" ", "_") + "_venmo",
                cashapp_handle="$" + full_name.lower().replace(" ", ""),
                zelle_handle=email,
                token_balance=round(random.uniform(500, 1600), 2),
                current_lat=lat,
                current_lng=lng,
            )
        )

    remaining = max(total_users - len(users), 0)
    role_pool = [UserRole.BUYER, UserRole.PROVIDER, UserRole.BOTH]

    for i in range(remaining):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        full_name = f"{first} {last}"
        email = f"{first.lower()}.{last.lower()}.{i+1}@utdallas.edu"
        role = random.choice(role_pool)
        lat, lng = random_coord()

        users.append(
            User(
                email=email,
                full_name=full_name,
                hashed_password=hash_password(password),
                role=role,
                bio=f"{full_name} likes discounted campus meals.",
                venmo_handle=f"{first.lower()}{i+1}",
                cashapp_handle=f"${last.lower()}{i+1}",
                zelle_handle=email,
                token_balance=round(random.uniform(250, 1400), 2),
                current_lat=lat,
                current_lng=lng,
            )
        )

    db.add_all(users)
    db.commit()
    for u in users:
        db.refresh(u)
    return users


def build_orders(db, users: list[User], total_orders: int) -> list[Order]:
    buyers = [u for u in users if u.role in {UserRole.BUYER, UserRole.BOTH}]
    providers = [u for u in users if u.role in {UserRole.PROVIDER, UserRole.BOTH}]

    statuses = [
        OrderStatus.REQUESTED,
        OrderStatus.ACCEPTED,
        OrderStatus.IN_PROGRESS,
        OrderStatus.DELIVERED,
        OrderStatus.COMPLETED,
    ]
    weights = [0.22, 0.18, 0.20, 0.15, 0.25]

    orders: list[Order] = []

    now = utc_now_naive()
    for _ in range(total_orders):
        buyer = random.choice(buyers)
        status = random.choices(statuses, weights=weights, k=1)[0]
        provider = None

        if status != OrderStatus.REQUESTED:
            provider_candidates = [p for p in providers if p.id != buyer.id]
            provider = random.choice(provider_candidates) if provider_candidates else None
            if provider is None:
                status = OrderStatus.REQUESTED

        max_price = round(random.uniform(6, 24), 2)
        agreed_price = None
        if status in {OrderStatus.ACCEPTED, OrderStatus.IN_PROGRESS, OrderStatus.DELIVERED, OrderStatus.COMPLETED}:
            agreed_price = round(random.uniform(5, max_price), 2)

        created_at = now - timedelta(hours=random.randint(3, 240))
        updated_at = created_at + timedelta(minutes=random.randint(5, 240))

        order = Order(
            buyer_id=buyer.id,
            provider_id=provider.id if provider else None,
            location=random.choice(DINING_LOCATIONS),
            items=random.choice(ITEM_SETS),
            delivery_instructions=random.choice(INSTRUCTIONS),
            max_price=max_price,
            agreed_price=agreed_price,
            status=status,
            created_at=created_at,
            updated_at=updated_at,
            delivery_time=created_at + timedelta(minutes=random.randint(15, 120)),
        )

        if provider:
            buyer_lat, buyer_lng = random_coord()
            provider_lat, provider_lng = random_coord()
            order.buyer_lat = buyer_lat
            order.buyer_lng = buyer_lng
            order.provider_lat = provider_lat
            order.provider_lng = provider_lng
            order.route_geojson = make_demo_route(provider_lat, provider_lng, buyer_lat, buyer_lng)

        if status == OrderStatus.DELIVERED:
            order.qr_token = secrets.token_urlsafe(18)
            if random.random() < 0.65:
                order.qr_expiration = now + timedelta(minutes=random.randint(2, 20))
            else:
                order.qr_expiration = now - timedelta(minutes=random.randint(2, 20))

        if status == OrderStatus.COMPLETED:
            order.qr_verified_at = updated_at

        orders.append(order)

    db.add_all(orders)
    db.commit()
    for order in orders:
        db.refresh(order)
    return orders


def build_messages(db, orders: list[Order]) -> list[Message]:
    messages: list[Message] = []

    for order in orders:
        if order.provider_id is None:
            continue

        count = random.randint(4, 14)
        for _ in range(count):
            messages.append(
                Message(
                    order_id=order.id,
                    buyer_id=order.buyer_id,
                    provider_id=order.provider_id,
                    content=random.choice(MESSAGE_TEMPLATES),
                    created_at=order.created_at + timedelta(minutes=random.randint(1, 180)),
                )
            )

    db.add_all(messages)
    db.commit()
    return messages


def build_notifications(db, users: list[User], orders: list[Order]) -> list[Notification]:
    notifications: list[Notification] = []

    for order in orders:
        notifications.append(
            Notification(
                user_id=order.buyer_id,
                order_id=order.id,
                message=f"Order #{order.id} created.",
                event_type="order.created",
                is_read=random.random() < 0.5,
                created_at=order.created_at,
            )
        )

        if order.provider_id:
            notifications.append(
                Notification(
                    user_id=order.provider_id,
                    order_id=order.id,
                    message=f"You are assigned to order #{order.id}.",
                    event_type="order.assigned",
                    is_read=random.random() < 0.5,
                    created_at=order.updated_at,
                )
            )

    for user in users:
        extra_count = random.randint(3, 8)
        for _ in range(extra_count):
            notifications.append(
                Notification(
                    user_id=user.id,
                    order_id=None,
                    message=random.choice(NOTIFICATION_MESSAGES),
                    event_type="general",
                    is_read=random.random() < 0.4,
                    created_at=utc_now_naive() - timedelta(hours=random.randint(1, 72)),
                )
            )

    db.add_all(notifications)
    db.commit()
    return notifications


def build_ratings(db, orders: list[Order]) -> list[Rating]:
    ratings: list[Rating] = []

    completed_orders = [o for o in orders if o.status == OrderStatus.COMPLETED and o.provider_id is not None]
    for order in completed_orders:
        ratings.append(
            Rating(
                order_id=order.id,
                rater_id=order.buyer_id,
                ratee_id=order.provider_id,
                rating=random.randint(3, 5),
                comment=random.choice(RATING_COMMENTS),
                created_at=order.updated_at + timedelta(minutes=random.randint(1, 60)),
            )
        )

        if random.random() < 0.88:
            ratings.append(
                Rating(
                    order_id=order.id,
                    rater_id=order.provider_id,
                    ratee_id=order.buyer_id,
                    rating=random.randint(3, 5),
                    comment=random.choice(RATING_COMMENTS),
                    created_at=order.updated_at + timedelta(minutes=random.randint(1, 90)),
                )
            )

    db.add_all(ratings)
    db.commit()
    for rating in ratings:
        db.refresh(rating)
    return ratings


def recompute_user_stats(db, users: list[User], orders: list[Order], ratings: list[Rating]) -> None:
    for user in users:
        user.total_earnings = 0.0
        user.total_savings = 0.0

    for order in orders:
        if order.status != OrderStatus.COMPLETED or not order.provider_id:
            continue

        settlement = order.agreed_price if order.agreed_price is not None else order.max_price
        provider = next((u for u in users if u.id == order.provider_id), None)
        buyer = next((u for u in users if u.id == order.buyer_id), None)

        if provider:
            provider.total_earnings += settlement
            provider.token_balance += settlement
        if buyer:
            buyer.total_savings += max(order.max_price - settlement, 0)
            buyer.token_balance = max(0.0, buyer.token_balance - settlement)

    ratings_by_ratee: dict[int, list[int]] = {}
    for rating in ratings:
        ratings_by_ratee.setdefault(rating.ratee_id, []).append(rating.rating)

    for user in users:
        user_ratings = ratings_by_ratee.get(user.id, [])
        user.rating_avg = round(sum(user_ratings) / len(user_ratings), 2) if user_ratings else 0.0

    db.commit()


def seed_database(fresh: bool, users_count: int, orders_count: int, password: str) -> None:
    db = SessionLocal()
    try:
        if fresh:
            db.close()
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
            db = SessionLocal()

        users = build_users(db, users_count, password)
        orders = build_orders(db, users, orders_count)
        messages = build_messages(db, orders)
        notifications = build_notifications(db, users, orders)
        ratings = build_ratings(db, orders)
        recompute_user_stats(db, users, orders, ratings)

        print("Seed complete")
        print(f"Users: {len(users)}")
        print(f"Orders: {len(orders)}")
        print(f"Messages: {len(messages)}")
        print(f"Notifications: {len(notifications)}")
        print(f"Ratings: {len(ratings)}")
        print("Demo password for all seeded users:", password)
    finally:
        db.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed UTDDash backend with rich demo data")
    parser.add_argument("--fresh", action="store_true", help="Delete existing data before seeding")
    parser.add_argument("--users", type=int, default=36, help="How many users to seed")
    parser.add_argument("--orders", type=int, default=180, help="How many orders to seed")
    parser.add_argument("--password", type=str, default="password123", help="Password for all seeded users")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    seed_database(
        fresh=args.fresh,
        users_count=max(args.users, 6),
        orders_count=max(args.orders, 20),
        password=args.password,
    )
