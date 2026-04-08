from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID

class LeaderBase(BaseModel):
    name: str
    mobile_number: str
    address: Optional[str] = None
    admin_id: UUID

class LeaderCreate(LeaderBase):
    email: EmailStr
    is_active: Optional[bool] = True

class LeaderUpdate(BaseModel):
    name: Optional[str] = None
    mobile_number: Optional[str] = None
    address: Optional[str] = None
    admin_id: Optional[UUID] = None
    is_active: Optional[bool] = None
    email: Optional[EmailStr] = None

class LeaderResponse(LeaderBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    email: str
    is_active: bool
    
    # Nested Info from DB Query
    admin_name: str
    city: str
    country: str
    continent: str

    class Config:
        from_attributes = True
