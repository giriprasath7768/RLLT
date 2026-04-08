from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class RlltLookupBase(BaseModel):
    module: int
    facet: int
    phase: int
    day: int
    art: str
    scheduled_value_days: int

class RlltLookupCreate(RlltLookupBase):
    pass

class RlltLookupUpdate(BaseModel):
    module: Optional[int] = None
    facet: Optional[int] = None
    phase: Optional[int] = None
    day: Optional[int] = None
    art: Optional[str] = None
    scheduled_value_days: Optional[int] = None

class RlltLookupResponse(RlltLookupBase):
    id: UUID

    class Config:
        from_attributes = True
