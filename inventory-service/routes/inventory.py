from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Inventory, InventoryCreate, InventoryUpdate, InventoryResponse, StockReduceRequest
from auth import require_admin, decode_access_token

router = APIRouter(prefix="/api/v1/inventory", tags=["inventory"])


# ── SPECIFIC ROUTES FIRST (avoid clashing with the dynamic /{product_id}) ──

@router.post("/reduce", response_model=InventoryResponse)
def reduce_stock(reduce_in: StockReduceRequest, db: Session = Depends(get_db)):
    """
    Reduces stock for a product by a given quantity.
    Called by Order Service whenever an order is placed.
    Returns an error if there isn't enough stock available.
    If the resulting quantity drops at or below the low-stock threshold,
    a notification is published (SNS/SQS in production - here we just log it).
    """
    item = db.query(Inventory).filter(Inventory.product_id == reduce_in.product_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory record not found")

    if item.quantity < reduce_in.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock: have {item.quantity}, requested {reduce_in.quantity}"
        )

    item.quantity -= reduce_in.quantity
    db.commit()
    db.refresh(item)

    if item.quantity <= item.low_stock_threshold:
        # In production this would publish to an SNS topic / SQS queue so that
        # Notification Service can alert admins. Locally we just log it.
        print(
            f"⚠️  LOW STOCK ALERT: product_id={item.product_id} "
            f"({item.product_name}) quantity={item.quantity} "
            f"<= threshold={item.low_stock_threshold}. "
            f"[Would publish SNS/SQS notification here]"
        )

    return item


@router.get("/low-stock", response_model=list[InventoryResponse])
def get_low_stock(db: Session = Depends(get_db), payload: dict = Depends(require_admin)):
    """Returns all inventory items at or below their low-stock threshold. Admin only."""
    items = db.query(Inventory).filter(Inventory.quantity <= Inventory.low_stock_threshold).all()
    return items


@router.get("/health/check")
def health_check():
    return {"status": "healthy", "service": "inventory-service"}


# ── GENERIC /{product_id} ROUTES ───────────────────────────────────────────

@router.post("", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def create_inventory(
    inventory_in: InventoryCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_admin)
):
    """Create a new inventory record for a product. Admin only."""
    existing = db.query(Inventory).filter(Inventory.product_id == inventory_in.product_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Inventory record for product_id {inventory_in.product_id} already exists"
        )

    item = Inventory(**inventory_in.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/{product_id}", response_model=InventoryResponse)
def get_stock(product_id: int, db: Session = Depends(get_db)):
    """Get the current stock level for a product. Public endpoint."""
    item = db.query(Inventory).filter(Inventory.product_id == product_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory record not found")
    return item


@router.put("/{product_id}", response_model=InventoryResponse)
def update_stock(
    product_id: int,
    update_data: InventoryUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_admin)
):
    """Update stock quantity and/or low-stock threshold. Admin only."""
    item = db.query(Inventory).filter(Inventory.product_id == product_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory record not found")

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item
