from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class AssignmentBase(BaseModel):
    user_id: UUID
    chart_id: Optional[str] = None
    chart_type: str
    start_date: datetime
    end_date: datetime

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentBulkCreate(BaseModel):
    user_ids: List[UUID]
    chart_id: Optional[str] = None
    chart_type: str
    start_date: datetime
    end_date: datetime

class AssignmentBulkRemove(BaseModel):
    user_ids: List[UUID]

class AssignmentOut(AssignmentBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
