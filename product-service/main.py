from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
import time

from database import engine, Base
from routes import products

app = FastAPI(
    title="SmartRetailX - Product Catalogue Service",
    description="Manages products, categories, and search for the SmartRetailX platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


@app.on_event("startup")
def on_startup():
    retries = 5
    while retries > 0:
        try:
            Base.metadata.create_all(bind=engine)
            print("✅ Product Service: database tables ready")
            return
        except OperationalError:
            retries -= 1
            print(f"⏳ Database not ready, retrying... ({retries} left)")
            time.sleep(3)
    raise Exception("Could not connect to database after retries")


app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(products.router)


@app.get("/")
def root():
    return {"service": "product-service", "status": "running"}
