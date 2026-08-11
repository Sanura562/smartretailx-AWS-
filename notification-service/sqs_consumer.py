"""
Simulates listening for order events published by Order Service.

In production, this would long-poll an SQS queue that Order Service
publishes to (see order-service/sqs.py). Whenever a message arrived,
we'd create a notification for the relevant user and delete the message
from the queue.

Locally there's no SQS to poll, so we just generate a sample notification
every 30 seconds to simulate a message coming in - useful for demoing the
GET /notifications endpoints without wiring up real AWS infrastructure.
"""
import time
from datetime import datetime, timezone

import boto3  # noqa: F401  -- kept so the real polling code below is a drop-in swap

import dynamodb

POLL_INTERVAL_SECONDS = 30

# Real SQS polling loop would look like this:
#
# import json, os
# sqs_client = boto3.client("sqs", region_name=os.getenv("AWS_REGION", "eu-west-2"))
# QUEUE_URL = os.getenv("SQS_QUEUE_URL")
#
# def start_sqs_consumer():
#     while True:
#         response = sqs_client.receive_message(
#             QueueUrl=QUEUE_URL,
#             MaxNumberOfMessages=10,
#             WaitTimeSeconds=20  # long polling
#         )
#         for message in response.get("Messages", []):
#             event = json.loads(message["Body"])
#             notification_id = dynamodb.next_id()
#             dynamodb.put_notification({
#                 "id": notification_id,
#                 "user_id": event["user_id"],
#                 "message": f"Your order #{event['order_id']} is now {event['status']}",
#                 "notification_type": "order_update",
#                 "order_id": event["order_id"],
#                 "is_read": False,
#                 "created_at": datetime.now(timezone.utc).isoformat(),
#             })
#             sqs_client.delete_message(
#                 QueueUrl=QUEUE_URL,
#                 ReceiptHandle=message["ReceiptHandle"]
#             )


def start_sqs_consumer():
    """
    Local-dev stand-in for the real SQS consumer above.
    Runs forever on a background thread, creating one sample
    notification every POLL_INTERVAL_SECONDS.
    """
    while True:
        time.sleep(POLL_INTERVAL_SECONDS)
        notification_id = dynamodb.next_id()
        dynamodb.put_notification({
            "id": notification_id,
            "user_id": 1,
            "message": "This is a simulated order update notification (local dev only).",
            "notification_type": "order_update",
            "order_id": None,
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        print(f"🔔 [SQS CONSUMER] created sample notification id={notification_id}")
