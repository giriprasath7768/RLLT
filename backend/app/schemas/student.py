from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date
from uuid import UUID

class StudentBase(BaseModel):
    name: str
    mobile_number: Optional[str] = None
    address: Optional[str] = None
    dob: Optional[datetime] = None
    gender: Optional[str] = None
    category: Optional[str] = None
    stage: Optional[str] = None
    enrollment_number: Optional[str] = None

class StudentCreate(StudentBase):
    email: EmailStr
    is_active: Optional[bool] = False

class AutoGroupPayload(BaseModel):
    student_ids: list[UUID]

class ManualGroupPayload(BaseModel):
    student_ids: list[UUID]
    group_name: str

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile_number: Optional[str] = None
    address: Optional[str] = None
    dob: Optional[datetime] = None
    gender: Optional[str] = None
    enrollment_number: Optional[str] = None
    is_active: Optional[bool] = None

class StudentResponse(StudentBase):
    id: UUID
    email: str
    is_active: bool
    role: str
    assessment_status: Optional[str] = "pending"
    activation_email_sent: Optional[bool] = False
    location_name: Optional[str] = None
    admin_name: Optional[str] = None
    assessment_marks: Optional[float] = None
    created_at: Optional[datetime] = None
    group_name: Optional[str] = None

    class Config:
        from_attributes = True

class StudentActivation(BaseModel):
    is_active: bool

class AssessmentResponseItem(BaseModel):
    assessment_id: UUID
    choice: int

class AssessmentSubmissionPayload(BaseModel):
    responses: list[AssessmentResponseItem]

class StudentGroupResponse(BaseModel):
    id: UUID
    name: str
    location_id: UUID
    created_at: Optional[datetime] = None
    members: list[StudentResponse] = []

    class Config:
        from_attributes = True
