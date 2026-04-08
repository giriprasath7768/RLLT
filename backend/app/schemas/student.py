from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date
from uuid import UUID

class StudentBase(BaseModel):
    name: str
    mobile_number: Optional[str] = None
    address: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    enrollment_number: Optional[str] = None

class StudentCreate(StudentBase):
    email: EmailStr
    is_active: Optional[bool] = False

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile_number: Optional[str] = None
    address: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    enrollment_number: Optional[str] = None
    is_active: Optional[bool] = None

class StudentResponse(StudentBase):
    id: UUID
    email: str
    is_active: bool
    role: str
    activation_email_sent: Optional[bool] = False
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class StudentActivation(BaseModel):
    is_active: bool
