import json
from datetime import datetime, timezone

import boto3  # noqa: F401  -- kept so the real publish call below is a drop-in swap

# In production, this would be a real SQS queue URL from an env var, e.g.:
#   SQS_QUEUE_URL = os.getenv("SQS_QUEUE_URL")
#   sqs_client = boto3.client("sqs", region_name=os.getenv("AWS_REGION", "eu-west-2"))


def publish_order_event(order_id: int, user_id: int, total_amount: float, status: str) -> None:
    """
    Publishes an "order event" whenever an order is created or its status
    changes, so Notification Service can pick it up and alert the customer.

    Locally (no AWS available) we just print the event as JSON. When
    deploying to AWS, swap the print() below for the real boto3 SQS call.
    """
    event = {
        "order_id": order_id,
        "user_id": user_id,
        "total_amount": total_amount,
        "status": status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    print(f"📤 [SQS EVENT] {json.dumps(event)}")

    # Real SQS publish call would look like this:
    #
    # sqs_client.send_message(
    #     QueueUrl=SQS_QUEUE_URL,
    #     MessageBody=json.dumps(event)
    # )
