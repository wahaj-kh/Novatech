from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
import models
import schemas
import database
import auth

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED, summary="Register a New Customer", description="Creates a new customer account and initializes an empty shopping cart.")
def register(email: str = Form(...), password: str = Form(...), db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # By default creating a customer, but could be adjusted to support admin creation
    new_user = models.Customer(email=email)
    new_user.password = password # Hashed automatically by setter
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Initialize an empty cart for the customer
    new_cart = models.Cart(customer_id=new_user.id)
    db.add(new_cart)
    db.commit()
    
    return new_user

@router.post("/login", response_model=schemas.Token, summary="Login User", description="Authenticates a user and returns a JWT Bearer token.")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    print(f"Checking user: {user.email if user else 'NOT FOUND'}")
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    verification_result = user.verify_password(form_data.password)
    print(f"Verification result: {verification_result}")
    if not verification_result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Embed role in JWT
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role.value}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
