from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
import database
import auth
from pydantic import BaseModel

router = APIRouter(
    prefix="/cart",
    tags=["Cart"]
)

class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int

@router.get("/", response_model=dict)
def get_cart(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != models.RoleEnum.customer:
        raise HTTPException(status_code=400, detail="Only customers have a cart")
    
    cart = db.query(models.Cart).filter(models.Cart.customer_id == current_user.id).first()
    if not cart:
        cart = models.Cart(customer_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
        
    items = []
    total_price = 0
    for item in cart.items:
        items.append({
            "product_id": item.product.id,
            "name": item.product.name,
            "quantity": item.quantity,
            "price": item.product.price,
            "image_url": item.product.image_url,
        })
        total_price += item.quantity * item.product.price
        
    return {"cart_id": cart.id, "items": items, "total_price": total_price}

@router.post("/items", status_code=status.HTTP_201_CREATED)
def add_to_cart(item: CartItemAdd, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != models.RoleEnum.customer:
        raise HTTPException(status_code=400, detail="Only customers have a cart")
        
    cart = db.query(models.Cart).filter(models.Cart.customer_id == current_user.id).first()
    if not cart:
        cart = models.Cart(customer_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
        
    product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    existing_item = db.query(models.CartItem).filter(models.CartItem.cart_id == cart.id, models.CartItem.product_id == item.product_id).first()
    if existing_item:
        existing_item.quantity += item.quantity
    else:
        new_item = models.CartItem(cart_id=cart.id, product_id=item.product_id, quantity=item.quantity)
        db.add(new_item)
        
    db.commit()
    return {"detail": "Item added to cart"}

@router.patch("/items/{product_id}", status_code=status.HTTP_200_OK)
def update_cart_item(product_id: int, update: CartItemUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != models.RoleEnum.customer:
        raise HTTPException(status_code=400, detail="Only customers have a cart")
    
    cart = db.query(models.Cart).filter(models.Cart.customer_id == current_user.id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    item = db.query(models.CartItem).filter(
        models.CartItem.cart_id == cart.id,
        models.CartItem.product_id == product_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not in cart")
    
    if update.quantity <= 0:
        db.delete(item)
    else:
        item.quantity = update.quantity
    db.commit()
    return {"detail": "Cart updated"}

@router.delete("/items/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_cart(product_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != models.RoleEnum.customer:
        raise HTTPException(status_code=400, detail="Only customers have a cart")
    
    cart = db.query(models.Cart).filter(models.Cart.customer_id == current_user.id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    item = db.query(models.CartItem).filter(
        models.CartItem.cart_id == cart.id,
        models.CartItem.product_id == product_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not in cart")
    
    db.delete(item)
    db.commit()

@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Clear all items from the cart (used on logout or order placement)."""
    if current_user.role != models.RoleEnum.customer:
        raise HTTPException(status_code=400, detail="Only customers have a cart")
    
    cart = db.query(models.Cart).filter(models.Cart.customer_id == current_user.id).first()
    if cart:
        db.query(models.CartItem).filter(models.CartItem.cart_id == cart.id).delete()
        db.commit()

