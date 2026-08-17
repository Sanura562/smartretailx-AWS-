import json
import os
import time
from datetime import datetime, timezone
import boto3
import dynamodb

POLL_INTERVAL_SECONDS = 20
AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-1")
QUEUE_URL = os.getenv("SQS_QUEUE_URL")

def start_sqs_consumer():
    if not QUEUE_URL:
        print("[SQS CONSUMER] No SQS_QUEUE_URL set - skipping consumer")
        return

    sqs_client = boto3.client("sqs", region_name=AWS_REGION)
    print(f"[SQS CONSUMER] Listening on {QUEUE_URL}")

    while True:
        try:
            response = sqs_client.receive_message(
                QueueUrl=QUEUE_URL,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=20
            )
            for message in response.get("Messages", []):
                try:
                    event = json.loads(message["Body"])
                    notification_id = dynamodb.next_id()
                    dynamodb.put_notification({
                        "id": notification_id,
                        "user_id": event.get("user_id", 1),
                        "message": f"Your order #{event.get('order_id')} status is now: {event.get('status', 'updated')}",
                        "notification_type": "order_update",
                        "order_id": event.get("order_id"),
                        "is_read": False,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    })
                    sqs_client.delete_message(
                        QueueUrl=QUEUE_URL,
                        ReceiptHandle=message["ReceiptHandle"]
                    )
                    print(f"[SQS CONSUMER] processed order event: {event}")
                except Exception as e:
                    print(f"[SQS CONSUMER] error processing message: {e}")
        except Exception as e:
            print(f"[SQS CONSUMER] polling error: {e}")
            time.sleep(5)
