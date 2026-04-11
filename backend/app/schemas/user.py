from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import date
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: str | None = None
    role: str | None = None

class UserInfo(BaseModel):
    id: UUID
    email: EmailStr
    role: str
    is_active: bool
    assessment_status: Optional[str] = "pending"
    assessment_marks: Optional[float] = None

    class Config:
        from_attributes = True

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    address: str
    mobile_number: str
    dob: date
    gender: str
    location_id: Optional[UUID] = None
    category: Optional[str] = None
    stage: Optional[str] = None

class ResetPasswordConfirmRequest(BaseModel):
    token: str
    new_password: str
