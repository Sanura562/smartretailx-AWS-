import threading

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import notifications
from sqs_consumer import start_sqs_consumer

app = FastAPI(
    title="SmartRetailX - Notification Service",
    description="Stores and serves user notifications (order updates, low-stock alerts)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


@app.on_event("startup")
def on_startup():
    """
    No database to migrate here (notifications live in DynamoDB / an
    in-memory dict locally). Instead we start the SQS consumer loop on
    a background thread so it doesn't block the API from serving requests.
    """
    thread = threading.Thread(target=start_sqs_consumer, daemon=True)
    thread.start()
    print("✅ Notification Service: SQS consumer started (background thread)")


app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(notifications.router)


@app.get("/")
def root():
    return {"service": "notification-service", "status": "running"}
