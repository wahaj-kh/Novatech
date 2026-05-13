from fastapi import APIRouter, Depends, HTTPException, status, Form
# Note: Form is still used by the create endpoint below
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
import database
import auth

router = APIRouter()

# Public GET
@router.get("/products/featured", response_model=List[schemas.ProductResponse], summary="Get Featured Products", description="Returns a list of products marked as featured for the homepage carousel.", tags=["Public Catalog"])
def get_featured_products(db: Session = Depends(database.get_db)):
    products = db.query(models.Product).filter(models.Product.is_featured == True).all()
    return products

@router.get("/products", response_model=List[schemas.ProductResponse], summary="Get All Products", description="Returns a list of all products in the catalog.", tags=["Public Catalog"])
def get_products(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    products = db.query(models.Product).offset(skip).limit(limit).all()
    return products

@router.get("/products/{product_id}", response_model=schemas.ProductResponse, summary="Get Product Details", description="Returns the details of a specific product by ID.", tags=["Public Catalog"])
def get_product(product_id: int, db: Session = Depends(database.get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# Admin routes
@router.get(
    "/admin/products/{product_id}",
    response_model=schemas.ProductResponse,
    summary="Get Product for Editing",
    description=(
        "Fetch the current data for a product before editing it.\n\n"
        "**How to update a product:**\n"
        "1. Enter the product ID here and click **Execute** to see current values.\n"
        "2. Copy the response JSON.\n"
        "3. Go to `PUT /admin/products/{product_id}` or `PATCH /admin/products/{product_id}`.\n"
        "4. Paste the JSON into the request body, edit the fields you want, then execute."
    ),
    tags=["Product Management"],
)
def get_product_for_admin(product_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.admin_required)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/admin/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED, summary="Create Product", description="Adds a new product to the database. Requires admin privileges.", tags=["Product Management"])
def create_product(
    name: str = Form(...),
    description: str = Form(None),
    price: float = Form(...),
    category: str = Form(...),
    stock: int = Form(0),
    image_url: str = Form(None),
    is_featured: bool = Form(False),
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.admin_required)
):
    new_product = models.Product(
        name=name,
        description=description,
        price=price,
        category=category,
        stock=stock,
        image_url=image_url,
        is_featured=is_featured
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.put(
    "/admin/products/{product_id}",
    response_model=schemas.ProductResponse,
    summary="Update Product",
    description=(
        "Updates an existing product by ID.\n\n"
        "**Tip:** First use `GET /admin/products/{product_id}` above to see the current values, "
        "then fill in only the boxes you want to change. Any box left empty will keep its current value."
    ),
    tags=["Product Management"],
)
def update_product(
    product_id: int,
    name: str = Form(None, description="Leave empty to keep current value"),
    description: str = Form(None, description="Leave empty to keep current value"),
    price: float = Form(None, description="Leave empty to keep current value"),
    category: str = Form(None, description="Leave empty to keep current value"),
    stock: int = Form(None, description="Leave empty to keep current value"),
    image_url: str = Form(None, description="Leave empty to keep current value"),
    is_featured: bool = Form(None, description="Leave empty to keep current value"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.admin_required),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if name is not None: product.name = name
    if description is not None: product.description = description
    if price is not None: product.price = price
    if category is not None: product.category = category
    if stock is not None: product.stock = stock
    if image_url is not None: product.image_url = image_url
    if is_featured is not None: product.is_featured = is_featured

    db.commit()
    db.refresh(product)
    return product

@router.patch(
    "/admin/products/{product_id}",
    response_model=schemas.ProductResponse,
    summary="Patch Product (Partial)",
    description=(
        "Partially updates an existing product by ID.\n\n"
        "**Workflow:**\n"
        "1. Call `GET /admin/products/{product_id}` first to retrieve the current values.\n"
        "2. Send only the fields you want to change in the JSON body.\n\n"
        "Fields not included in the request body will remain unchanged."
    ),
    tags=["Product Management"],
)
def patch_product(
    product_id: int,
    payload: schemas.ProductUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.admin_required),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    updates = payload.model_dump(exclude_unset=True, exclude_none=True)
    for key, value in updates.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product

@router.delete("/admin/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Product", description="Removes a product from the database.", tags=["Product Management"])
def delete_product(product_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.admin_required)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
