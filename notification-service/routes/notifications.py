from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from models import NotificationResponse
from auth import decode_access_token
import dynamodb

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


@router.get("/health/check")
def health_check():
    return {"status": "healthy", "service": "notification-service"}


@router.get("/user/{user_id}", response_model=List[NotificationResponse])
def get_notifications_for_user(
    user_id: int,
    payload: dict = Depends(decode_access_token)
):
    """Returns all notifications for a given user."""
    return dynamodb.get_notifications_for_user(user_id)


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: str,
    payload: dict = Depends(decode_access_token)
):
    """Returns a single notification by id."""
    notification = dynamodb.get_notification(notification_id)
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return notification


@router.post("/mark-read/{notification_id}", response_model=NotificationResponse)
def mark_read(
    notification_id: str,
    payload: dict = Depends(decode_access_token)
):
    """Marks a notification as read."""
    ok = dynamodb.mark_notification_read(notification_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return dynamodb.get_notification(notification_id)
