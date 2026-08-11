from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserRegister, UserLogin, UserResponse, UserUpdate, TokenResponse
from auth import hash_password, verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """
    Creates a new user account.
    - Checks the email isn't already taken
    - Hashes the password before storing it (never store plain text)
    """
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    new_user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role="customer"  # everyone registers as a customer by default; admins are promoted manually
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)  # pulls back the auto-generated id and created_at from the DB
    return new_user


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Verifies email + password, then issues a JWT access token.
    This is the token that Order Service, Inventory Service etc. will
    validate on every protected request.
    """
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    # "sub" (subject) is the standard JWT claim for "who is this token about"
    token = create_access_token(data={"sub": str(user.id), "role": user.role, "email": user.email})

    return TokenResponse(access_token=token, user=user)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), payload: dict = Depends(decode_access_token)):
    """
    Returns a user's profile. Requires a valid JWT (any logged-in user).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(decode_access_token)
):
    """
    Updates a user's profile. Users can only update their own profile -
    we check the token's "sub" claim matches the user_id being updated.
    """
    if str(payload.get("sub")) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if update_data.full_name is not None:
        user.full_name = update_data.full_name
    if update_data.password is not None:
        user.hashed_password = hash_password(update_data.password)

    db.commit()
    db.refresh(user)
    return user


@router.get("/health/check")
def health_check():
    """Used by ECS/load balancers to confirm this service is alive."""
    return {"status": "healthy", "service": "user-service"}
