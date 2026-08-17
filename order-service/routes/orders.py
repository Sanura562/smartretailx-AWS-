from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from database import get_db
from models import Order, OrderItem, OrderCreate, OrderResponse, OrderStatusUpdate
from auth import decode_access_token, require_admin
from http_client import get_product, check_and_reduce_stock
from sqs import publish_order_event

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])

VALID_STATUSES = {"pending", "confirmed", "shipped", "delivered", "cancelled"}


@router.get("/health/check")
def health_check():
    return {"status": "healthy", "service": "order-service"}


@router.get("", response_model=List[OrderResponse])
def get_all_orders(
    db: Session = Depends(get_db),
    payload: dict = Depends(require_admin)
):
    """Get all orders - admin only"""
    orders = db.query(Order).options(joinedload(Order.items)).order_by(Order.created_at.desc()).all()
    return orders


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(decode_access_token)
):
    if not order_in.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order must contain at least one item")

    for item in order_in.items:
        get_product(item.product_id)

    for item in order_in.items:
        check_and_reduce_stock(item.product_id, item.quantity)

    total_amount = sum(item.quantity * item.unit_price for item in order_in.items)

    order = Order(user_id=order_in.user_id, status="pending", total_amount=total_amount)
    db.add(order)
    db.flush()

    for item in order_in.items:
        db.add(OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            product_name=item.product_name,
            quantity=item.quantity,
            unit_price=item.unit_price
        ))

    db.commit()
    db.refresh(order)

    publish_order_event(order.id, order.user_id, order.total_amount, order.status)

    return order


@router.get("/user/{user_id}", response_model=List[OrderResponse])
def list_orders_for_user(
    user_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(decode_access_token)
):
    orders = db.query(Order).options(joinedload(Order.items)).filter(Order.user_id == user_id).all()
    return orders


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(decode_access_token)
):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_admin)
):
    if status_update.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(sorted(VALID_STATUSES))}"
        )

    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = status_update.status
    db.commit()
    db.refresh(order)

    publish_order_event(order.id, order.user_id, order.total_amount, order.status)

    return order
