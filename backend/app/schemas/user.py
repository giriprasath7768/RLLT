from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import date

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
