from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID

class ChapterBase(BaseModel):
    chapter_number: int
    verse_count: int = 0
    art: float = 0.0

class ChapterCreate(ChapterBase):
    book_id: UUID

class ChapterUpdate(BaseModel):
    chapter_number: Optional[int] = None
    verse_count: Optional[int] = None
    art: Optional[float] = None

class ChapterResponse(ChapterBase):
    id: UUID
    book_id: UUID

    class Config:
        from_attributes = True

class ChapterWithBookResponse(ChapterResponse):
    book_name: str

    class Config:
        from_attributes = True

class BookBase(BaseModel):
    name: str
    short_form: Optional[str] = None
    author: str = "Unknown"
    total_chapters: int = 0
    total_verses: int = 0
    total_art: float = 0.0
    ppl: float = 0.0

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    name: Optional[str] = None
    short_form: Optional[str] = None
    author: Optional[str] = None
    total_chapters: Optional[int] = None
    total_verses: Optional[int] = None
    total_art: Optional[float] = None
    ppl: Optional[float] = None

class BookResponse(BookBase):
    id: UUID
    chapters: List[ChapterResponse] = []

    class Config:
        from_attributes = True
