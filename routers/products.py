from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/products", tags=["Products"])

class Product(BaseModel):
    id: int
    name: str
    price: float
    description: str

mock_products = [
    Product(id=1, name="Laptop", price=999.99, description="High-performance laptop for software development"),
    Product(id=2, name="Mouse", price=25.50, description="Wireless ergonomic computer mouse"),
]

@router.get("/", response_model=List[Product])
def get_products():
    """
    Retrieve a list of available products in the catalog.
    
    Returns:
        List[Product]: A list of product objects.
    """
    return mock_products
