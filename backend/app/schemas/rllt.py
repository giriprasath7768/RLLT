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
    ot_bks: Optional[str] = None
    nt_bks: Optional[str] = None
    we5: Optional[str] = None
    pro: Optional[str] = None
    psa: Optional[str] = None
    chp: Optional[int] = None
    ver: Optional[int] = None
    ppl: Optional[str] = None

class RlltLookupCreate(RlltLookupBase):
    pass

class RlltLookupUpdate(BaseModel):
    module: Optional[int] = None
    facet: Optional[int] = None
    phase: Optional[int] = None
    day: Optional[int] = None
    art: Optional[str] = None
    scheduled_value_days: Optional[int] = None
    ot_bks: Optional[str] = None
    nt_bks: Optional[str] = None
    we5: Optional[str] = None
    pro: Optional[str] = None
    psa: Optional[str] = None
    chp: Optional[int] = None
    ver: Optional[int] = None
    ppl: Optional[str] = None

class RlltLookupResponse(RlltLookupBase):
    id: UUID

    class Config:
        from_attributes = True
