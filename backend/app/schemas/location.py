from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class LocationBase(BaseModel):
    continent: str
    country: str
    city: str

class LocationCreate(LocationBase):
    pass

class LocationUpdate(LocationBase):
    pass

class LocationResponse(LocationBase):
    id: UUID
    created_at: datetime | None

    class Config:
        from_attributes = True
