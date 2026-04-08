from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime

class ContentBase(BaseModel):
    book_id: UUID4
    chapter_id: UUID4
    audio_url: Optional[str] = None
    video_url: Optional[str] = None
    ref_link: Optional[str] = None

class ContentCreate(ContentBase):
    pass

class ContentUpdate(BaseModel):
    audio_url: Optional[str] = None
    video_url: Optional[str] = None
    ref_link: Optional[str] = None

class ContentResponse(ContentBase):
    id: UUID4
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Used for joining in list endpoint
class ContentListResponse(ContentResponse):
    book_name: str
    chapter_number: int

# Used for bulk import payload from Excel
class BulkContentItem(BaseModel):
    book_name: str
    chapter_number: int
    audio_url: Optional[str] = None
    video_url: Optional[str] = None
    ref_link: Optional[str] = None

class BulkContentRequest(BaseModel):
    items: List[BulkContentItem]
