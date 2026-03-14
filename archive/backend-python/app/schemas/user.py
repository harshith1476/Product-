
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    gender: Optional[str] = "Not Selected"
    dob: Optional[str] = "Not Selected"
    age: Optional[int] = None
    blood_group: Optional[str] = None
    image: Optional[str] = None
    role: Optional[str] = "patient"

# Properties to receive on user creation
class UserCreate(UserBase):
    email: EmailStr
    name: str # required
    password: str

# Properties to receive on user update
class UserUpdate(UserBase):
    password: Optional[str] = None
    
# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Properties to return to client
class User(UserInDBBase):
    pass

# Properties stored in DB
class UserInDB(UserInDBBase):
    password: str
