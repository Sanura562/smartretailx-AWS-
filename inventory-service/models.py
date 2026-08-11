from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from database import Base


# ── DATABASE MODEL ────────────────────────────────────────────────────────
class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, unique=True, index=True, nullable=False)
    product_name = Column(String(200), nullable=False)
    quantity = Column(Integer, default=0, nullable=False)
    low_stock_threshold = Column(Integer, default=10, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# ── PYDANTIC SCHEMAS ──────────────────────────────────────────────────────
class InventoryCreate(BaseModel):
    """What admin sends to POST /inventory to create a new stock record."""
    product_id: int
    product_name: str
    quantity: int = 0
    low_stock_threshold: int = 10


class InventoryUpdate(BaseModel):
    """All fields optional - used for PUT /inventory/{product_id}."""
    quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None


class InventoryResponse(BaseModel):
    """What the API returns."""
    id: int
    product_id: int
    product_name: str
    quantity: int
    low_stock_threshold: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StockReduceRequest(BaseModel):
    """Body for POST /inventory/reduce - called by Order Service when an order is placed."""
    product_id: int
    quantity: int
