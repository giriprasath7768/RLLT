from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime

class AdminBase(BaseModel):
    name: str
    mobile_number: Optional[str] = None
    address: str
    location_id: UUID
    is_active: bool = True

class AdminCreate(AdminBase):
    email: EmailStr

class AdminUpdate(BaseModel):
    name: Optional[str] = None
    mobile_number: Optional[str] = None
    address: Optional[str] = None
    location_id: Optional[UUID] = None
    is_active: Optional[bool] = None
    email: Optional[EmailStr] = None

class AdminResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    mobile_number: Optional[str]
    address: str
    location_id: UUID
    created_at: datetime
    
    # Joined from User table
    email: str
    is_active: bool
    
    # Joined from Location table
    city: str
    country: str
    continent: str

    class Config:
        from_attributes = True
