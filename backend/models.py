from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
import enum
from passlib.context import CryptContext
from database import Base

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class RoleEnum(str, enum.Enum):
    customer = "customer"
    admin = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    _hashed_password = Column("hashed_password", String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.customer)

    # Polymorphic identity for inheritance
    __mapper_args__ = {
        "polymorphic_on": role,
        "polymorphic_identity": "user",
    }

    @property
    def password(self):
        raise AttributeError("Password is not readable.")

    @password.setter
    def password(self, raw_password: str):
        self._hashed_password = pwd_context.hash(raw_password)

    def verify_password(self, raw_password: str) -> bool:
        return pwd_context.verify(raw_password, self._hashed_password)

class Customer(User):
    __mapper_args__ = {
        "polymorphic_identity": RoleEnum.customer,
    }
    # Customer specific fields
    shipping_address = Column(String, nullable=True)
    
    # Relationships
    cart = relationship("Cart", back_populates="customer", uselist=False)
    orders = relationship("Order", back_populates="customer")

class Admin(User):
    __mapper_args__ = {
        "polymorphic_identity": RoleEnum.admin,
    }
    # Admin specific fields
    permissions_level = Column(Integer, default=1)

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    category = Column(String, index=True, nullable=False)
    image_url = Column(String, nullable=True)
    stock = Column(Integer, default=0)

class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"))
    
    customer = relationship("Customer", back_populates="cart")
    items = relationship("CartItem", back_populates="cart")

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)

    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"))
    _total_amount = Column("total_amount", Float, nullable=False)
    status = Column(String, default="pending")

    customer = relationship("Customer", back_populates="orders")

    @property
    def total_amount(self):
        return self._total_amount

    @total_amount.setter
    def total_amount(self, value):
        if value < 0:
            raise ValueError("Total amount cannot be negative")
        self._total_amount = value
