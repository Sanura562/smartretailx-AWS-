from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Product, ProductCreate, ProductUpdate, ProductResponse
from auth import require_admin, decode_access_token

router = APIRouter(prefix="/api/v1/products", tags=["products"])


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_admin)  # only admins can add products
):
    """Create a new product. Requires admin JWT token."""
    existing = db.query(Product).filter(Product.sku == product_in.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"SKU '{product_in.sku}' already exists")

    product = Product(**product_in.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("", response_model=List[ProductResponse])
def list_products(
    category: Optional[str] = Query(None, description="Filter by category"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
    # NOTE: no auth dependency - anyone can browse products
):
    """
    List all active products. Optionally filter by category.
    Supports pagination via skip/limit query params.
    Public endpoint - no login required.
    """
    query = db.query(Product).filter(Product.is_active == True)
    if category:
        query = query.filter(Product.category.ilike(f"%{category}%"))
    return query.offset(skip).limit(limit).all()


@router.get("/search", response_model=List[ProductResponse])
def search_products(
    q: str = Query(..., min_length=1, description="Search term"),
    db: Session = Depends(get_db)
):
    """
    Search products by name or description.
    Uses SQL ILIKE for case-insensitive partial matching.
    Public endpoint - no login required.
    """
    results = db.query(Product).filter(
        Product.is_active == True,
        (Product.name.ilike(f"%{q}%") | Product.description.ilike(f"%{q}%"))
    ).limit(50).all()
    return results


@router.get("/categories", response_model=List[str])
def list_categories(db: Session = Depends(get_db)):
    """Returns all unique product categories. Used by frontend for filter dropdowns."""
    rows = db.query(Product.category).filter(Product.is_active == True).distinct().all()
    return [row[0] for row in rows]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a single product by ID. Public endpoint."""
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.is_active == True
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    update_data: ProductUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_admin)
):
    """Update a product. Admin only."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_admin)
):
    """
    Soft delete - sets is_active=False rather than removing the DB row.
    This preserves order history that references this product.
    Admin only.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False
    db.commit()


@router.get("/health/check")
def health_check():
    return {"status": "healthy", "service": "product-service"}
