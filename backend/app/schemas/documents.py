from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime

class DocumentBase(BaseModel):
    title: Optional[str] = "Untitled Document"
    content: Optional[str] = ""
    watermark_url: Optional[str] = None
    language: Optional[str] = None
    country_code: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: UUID4
    user_id: UUID4
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True
        from_attributes = True
