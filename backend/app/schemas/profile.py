from pydantic import BaseModel, EmailStr
from typing import Optional

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    mobile_number: Optional[str] = None
    address: Optional[str] = None
    profile_image_url: Optional[str] = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class ProfileResponse(BaseModel):
    email: str
    role: str
    name: Optional[str] = None
    mobile_number: Optional[str] = None
    address: Optional[str] = None
    profile_image_url: Optional[str] = None
