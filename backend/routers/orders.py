from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
import database
import auth

router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)

# Customer endpoints
@router.post("/", status_code=status.HTTP_201_CREATED, summary="Create Order", description="Creates an order from the current user's cart items.")
def create_order(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Create an order from cart items and clear the cart."""
    if current_user.role != models.RoleEnum.customer:
        raise HTTPException(status_code=400, detail="Only customers can place orders")
    
    cart = db.query(models.Cart).filter(models.Cart.customer_id == current_user.id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate total
    total_amount = sum(item.quantity * item.product.price for item in cart.items)
    
    # Create order
    new_order = models.Order(
        customer_id=current_user.id,
        total_amount=total_amount,
        status="pending"
    )
    db.add(new_order)
    
    # Clear cart items
    db.query(models.CartItem).filter(models.CartItem.cart_id == cart.id).delete()
    
    db.commit()
    db.refresh(new_order)
    
    return {
        "id": new_order.id,
        "total_amount": new_order.total_amount,
        "status": new_order.status,
        "message": "Order placed successfully"
    }

@router.get("/my-orders", summary="Get My Orders", description="Retrieves all orders for the current customer.")
def get_my_orders(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get all orders for the current customer."""
    if current_user.role != models.RoleEnum.customer:
        raise HTTPException(status_code=400, detail="Only customers have orders")
    
    orders = db.query(models.Order).filter(models.Order.customer_id == current_user.id).all()
    
    return [
        {
            "id": order.id,
            "total_amount": order.total_amount,
            "status": order.status,
            "customer_email": order.customer.email
        }
        for order in orders
    ]

# Admin endpoints
@router.get("/admin/all", summary="Get All Orders (Admin)", description="Retrieves all orders in the system. Admin only.")
def get_all_orders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.admin_required)
):
    """Get all orders (admin only)."""
    orders = db.query(models.Order).offset(skip).limit(limit).all()
    
    return [
        {
            "id": order.id,
            "customer_id": order.customer_id,
            "customer_email": order.customer.email,
            "total_amount": order.total_amount,
            "status": order.status
        }
        for order in orders
    ]

@router.get("/admin/{order_id}", summary="Get Order Details (Admin)", description="Retrieves details of a specific order. Admin only.")
def get_order_details(
    order_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.admin_required)
):
    """Get order details (admin only)."""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "customer_email": order.customer.email,
        "total_amount": order.total_amount,
        "status": order.status
    }

@router.patch("/admin/{order_id}/status", summary="Update Order Status (Admin)", description="Updates the status of an order. Admin only.")
def update_order_status(
    order_id: int,
    status: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.admin_required)
):
    """Update order status (admin only)."""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Validate status
    valid_statuses = ["pending", "processing", "shipped", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    order.status = status
    db.commit()
    db.refresh(order)
    
    return {
        "id": order.id,
        "status": order.status,
        "message": "Order status updated successfully"
    }

@router.delete("/admin/{order_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Order (Admin)", description="Deletes an order from the system. Admin only.")
def delete_order(
    order_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.admin_required)
):
    """Delete an order (admin only)."""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db.delete(order)
    db.commit()
