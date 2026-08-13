import os
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# ============================================================
# CONFIG
# In production these would come from AWS Secrets Manager,
# never hardcoded. For local dev we read from env vars with
# a fallback default.
# ============================================================
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# bcrypt is the industry-standard hashing algorithm for passwords -
# it's slow on purpose (resistant to brute force) and includes a salt automatically
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# This tells FastAPI's Swagger UI where to send login requests to get a token,
# and lets other routes declare "this endpoint requires a valid token"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/users/login")


# ============================================================
# PASSWORD HASHING
# ============================================================
def hash_password(plain_password: str) -> str:
    """Turn a plain-text password into a bcrypt hash before storing it."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a login attempt's password against the stored hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ============================================================
# JWT TOKEN CREATION
# ============================================================
def create_access_token(data: dict) -> str:
    """
    Builds a JWT containing whatever claims we pass in (e.g. user id, role),
    plus an expiry timestamp, then signs it with our secret key.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ============================================================
# JWT TOKEN VERIFICATION
# This is used as a FastAPI dependency on any route that needs
# the user to be logged in. It's also what OTHER microservices
# (like Order Service) will copy to validate tokens issued here.
# ============================================================
def decode_access_token(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception


def require_admin(payload: dict = Depends(decode_access_token)) -> dict:
    """
    A second layer of dependency - first verifies the token is valid,
    THEN checks the role claim inside it. Used for admin-only endpoints (RBAC).
    """
    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return payload
