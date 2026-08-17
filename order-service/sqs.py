import json
import os
from datetime import datetime, timezone
import boto3

AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-1")
SQS_QUEUE_URL = os.getenv("SQS_QUEUE_URL")

sqs_client = boto3.client("sqs", region_name=AWS_REGION)

def publish_order_event(order_id: int, user_id: int, total_amount: float, status: str) -> None:
    event = {
        "order_id": order_id,
        "user_id": user_id,
        "total_amount": total_amount,
        "status": status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if not SQS_QUEUE_URL:
        print(f"[SQS EVENT] No queue URL set - skipping: {json.dumps(event)}")
        return
    try:
        sqs_client.send_message(
            QueueUrl=SQS_QUEUE_URL,
            MessageBody=json.dumps(event)
        )
        print(f"[SQS EVENT] Published order event: {json.dumps(event)}")
    except Exception as e:
        print(f"[SQS EVENT] Failed to publish: {e}")
