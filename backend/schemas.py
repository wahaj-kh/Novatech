from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from enum import Enum as PyEnum

class RoleEnum(str, PyEnum):
    customer = "customer"
    admin = "admin"

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: RoleEnum

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: str
    image_url: Optional[str] = None
    stock: int = 0
    is_featured: bool = False

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, example="Updated Product Name")
    description: Optional[str] = Field(None, example="Updated product description")
    price: Optional[float] = Field(None, example=99.99)
    category: Optional[str] = Field(None, example="Electronics")
    image_url: Optional[str] = Field(None, example="https://example.com/image.jpg")
    stock: Optional[int] = Field(None, example=50)
    is_featured: Optional[bool] = Field(None, example=True)

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class HeroHotspotBase(BaseModel):
    top: str
    left: str
    title: str
    description: str

class HeroHotspotCreate(HeroHotspotBase):
    pass

class HeroHotspotResponse(HeroHotspotBase):
    id: int
    hero_setting_id: int

    class Config:
        from_attributes = True

class HeroSettingBase(BaseModel):
    title: str
    description: str
    image_url: Optional[str] = None

class HeroSettingCreate(HeroSettingBase):
    hotspots: List[HeroHotspotCreate] = []

class HeroSettingResponse(HeroSettingBase):
    id: int
    hotspots: List[HeroHotspotResponse] = []

    class Config:
        from_attributes = True
