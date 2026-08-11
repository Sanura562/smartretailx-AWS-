from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

from database import Base


# ============================================================
# DATABASE MODEL (SQLAlchemy)
# This defines the actual "users" table structure in PostgreSQL.
# ============================================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="customer")  # "customer" or "admin" - used for RBAC in Task 3
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ============================================================
# PYDANTIC SCHEMAS (request/response validation)
# These define what JSON shape comes IN and goes OUT of the API.
# They are NOT database tables - they're just validation contracts.
# ============================================================

class UserRegister(BaseModel):
    """What the client must send to POST /users/register"""
    email: EmailStr
    password: str
    full_name: str


class UserLogin(BaseModel):
    """What the client must send to POST /users/login"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """What we send back to the client - notice: NO password field"""
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True  # allows converting a SQLAlchemy User object directly into this schema


class UserUpdate(BaseModel):
    """What the client can send to PUT /users/{id} - all optional"""
    full_name: Optional[str] = None
    password: Optional[str] = None


class TokenResponse(BaseModel):
    """What we send back after a successful login"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
