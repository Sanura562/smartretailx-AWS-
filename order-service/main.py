from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
import time

from database import engine, Base
from routes import orders

app = FastAPI(
    title="SmartRetailX - Order Processing Service",
    description="Creates and tracks orders, coordinating with Product and Inventory services",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


@app.on_event("startup")
def on_startup():
    """
    Creates the database tables on startup if they don't already exist.
    Retries a few times because in Docker Compose, this service can start
    before the Postgres container is fully ready to accept connections.
    """
    retries = 5
    while retries > 0:
        try:
            Base.metadata.create_all(bind=engine)
            print("✅ Order Service: database tables ready")
            return
        except OperationalError:
            retries -= 1
            print(f"⏳ Database not ready yet, retrying... ({retries} left)")
            time.sleep(3)
    raise Exception("Could not connect to database after retries")


app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(orders.router)


@app.get("/")
def root():
    return {"service": "order-service", "status": "running"}
