from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.sql import func
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from database import Base


# ── DATABASE MODEL ────────────────────────────────────────────────────────
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    sku = Column(String(100), unique=True, nullable=False)  # stock keeping unit - unique product code
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# ── PYDANTIC SCHEMAS ──────────────────────────────────────────────────────
class ProductCreate(BaseModel):
    """What admin sends to POST /products"""
    name: str
    description: Optional[str] = None
    price: float
    category: str
    sku: str
    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    """All fields optional for PATCH-style updates"""
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    """What the API returns - safe to expose publicly"""
    id: int
    name: str
    description: Optional[str]
    price: float
    category: str
    sku: str
    image_url: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
