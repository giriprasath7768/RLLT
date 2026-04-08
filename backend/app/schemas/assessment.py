import uuid
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class AssessmentBase(BaseModel):
    name: str
    location_module: str
    question_number: Optional[str] = None
    question_text: str
    seven_tnt: Optional[str] = None
    category: Optional[str] = None
    stage: Optional[str] = None
    choice_1: Optional[str] = None
    grade_1: Optional[str] = None
    choice_2: Optional[str] = None
    grade_2: Optional[str] = None
    choice_3: Optional[str] = None
    grade_3: Optional[str] = None

class AssessmentCreate(AssessmentBase):
    pass

class AssessmentUpdate(BaseModel):
    name: Optional[str] = None
    location_module: Optional[str] = None
    question_number: Optional[str] = None
    question_text: Optional[str] = None
    seven_tnt: Optional[str] = None
    category: Optional[str] = None
    stage: Optional[str] = None
    choice_1: Optional[str] = None
    grade_1: Optional[str] = None
    choice_2: Optional[str] = None
    grade_2: Optional[str] = None
    choice_3: Optional[str] = None
    grade_3: Optional[str] = None

class AssessmentResponse(AssessmentBase):
    id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AssessmentBulkCreate(BaseModel):
    assessments: List[AssessmentCreate]
