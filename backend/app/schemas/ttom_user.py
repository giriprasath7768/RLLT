from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, constr

class TTOMUserBase(BaseModel):
    name: str
    mobile_number: str
    address: Optional[str] = None
    location_id: UUID
    is_active: bool = True

class TTOMUserCreate(TTOMUserBase):
    pass # Managed automatically on the backend
    
class TTOMUserUpdate(BaseModel):
    name: Optional[str] = None
    mobile_number: Optional[str] = None
    address: Optional[str] = None
    location_id: Optional[UUID] = None
    is_active: Optional[bool] = None

class TTOMUserResponse(TTOMUserBase):
    id: UUID
    is_active: bool
    created_at: Optional[datetime] = None
    country: Optional[str] = None
    continent: Optional[str] = None
    city: Optional[str] = None
    plain_password: Optional[str] = None
    assigned_chart_id: Optional[str] = None
    assigned_chart_type: Optional[str] = None

    class Config:
        from_attributes = True
