import os
import httpx
from fastapi import HTTPException, status

INVENTORY_SERVICE_URL = os.getenv("INVENTORY_SERVICE_URL", "http://172.31.10.61:8003")
PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL", "http://172.31.22.202:8002")
TIMEOUT = 10.0

def get_product(product_id: int) -> dict:
    url = f"{PRODUCT_SERVICE_URL}/api/v1/products/{product_id}"
    try:
        response = httpx.get(url, timeout=TIMEOUT)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not reach Product Service: {exc}"
        )
    if response.status_code == 404:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product {product_id} not found"
        )
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Product Service returned {response.status_code}"
        )
    return response.json()

def check_and_reduce_stock(product_id: int, quantity: int) -> dict:
    url = f"{INVENTORY_SERVICE_URL}/api/v1/inventory/reduce"
    try:
        response = httpx.post(
            url,
            json={"product_id": product_id, "quantity": quantity},
            timeout=TIMEOUT
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not reach Inventory Service: {exc}"
        )
    if response.status_code == 404:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No inventory record for product {product_id}"
        )
    if response.status_code == 400:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=response.json().get("detail", "Insufficient stock")
        )
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Inventory Service returned {response.status_code}"
        )
    return response.json()
