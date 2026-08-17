import os
import boto3
from boto3.dynamodb.conditions import Key

AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-1")
TABLE_NAME = os.getenv("DYNAMODB_TABLE", "smartretailx-notifications")

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
table = dynamodb.Table(TABLE_NAME)

def next_id() -> str:
    import time
    return str(int(time.time() * 1000))

def put_notification(item: dict) -> None:
    if "id" not in item:
        item["id"] = next_id()
    table.put_item(Item=item)

def get_notification(notification_id: str):
    response = table.get_item(Key={"id": notification_id})
    return response.get("Item")

def get_notifications_for_user(user_id: int) -> list:
    response = table.query(
        IndexName="user_id-index",
        KeyConditionExpression=Key("user_id").eq(user_id)
    )
    return response.get("Items", [])

def mark_notification_read(notification_id: str) -> bool:
    item = get_notification(notification_id)
    if item is None:
        return False
    table.update_item(
        Key={"id": notification_id},
        UpdateExpression="SET is_read = :true",
        ExpressionAttributeValues={":true": True}
    )
    return True
