"""
Local-dev storage for notifications.

In production this service would use DynamoDB (NoSQL fits well here -
notifications are simple, high-volume, append-mostly records with no
complex relational queries). Locally, without AWS credentials or a
DynamoDB Local container, we simulate the same interface with an
in-memory dict so the rest of the app doesn't need to know the difference.

Real DynamoDB version would look like:

    import boto3

    dynamodb = boto3.resource("dynamodb", region_name=os.getenv("AWS_REGION", "eu-west-2"))
    table = dynamodb.Table(os.getenv("NOTIFICATIONS_TABLE", "smartretailx-notifications"))

    def put_notification(item: dict) -> None:
        table.put_item(Item=item)

    def get_notification(notification_id: str) -> dict | None:
        response = table.get_item(Key={"id": notification_id})
        return response.get("Item")

    def get_notifications_for_user(user_id: int) -> list[dict]:
        response = table.query(
            IndexName="user_id-index",
            KeyConditionExpression=Key("user_id").eq(user_id)
        )
        return response.get("Items", [])

    def mark_notification_read(notification_id: str) -> None:
        table.update_item(
            Key={"id": notification_id},
            UpdateExpression="SET is_read = :true",
            ExpressionAttributeValues={":true": True}
        )
"""
import itertools

# In-memory "table". Keyed by notification id (string, mirrors a DynamoDB
# partition key so swapping in the real table later is a drop-in change).
notifications_store: dict = {}

_id_counter = itertools.count(1)


def next_id() -> str:
    return str(next(_id_counter))


def put_notification(item: dict) -> None:
    notifications_store[item["id"]] = item


def get_notification(notification_id: str):
    return notifications_store.get(notification_id)


def get_notifications_for_user(user_id: int) -> list:
    return [
        n for n in notifications_store.values()
        if n["user_id"] == user_id
    ]


def mark_notification_read(notification_id: str) -> bool:
    item = notifications_store.get(notification_id)
    if item is None:
        return False
    item["is_read"] = True
    return True
