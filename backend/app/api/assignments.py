from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.db.models import Assignment, User
from app.schemas.assignment import AssignmentCreate, AssignmentOut

router = APIRouter()

@router.post("/", response_model=AssignmentOut)
async def create_assignment(assignment: AssignmentCreate, db: AsyncSession = Depends(get_db)):
    # Validate user exists
    user_stmt = select(User).where(User.id == assignment.user_id)
    user_result = await db.execute(user_stmt)
    if not user_result.scalars().first():
        raise HTTPException(status_code=404, detail="User not found")

    new_assignment = Assignment(**assignment.model_dump(exclude_unset=True))
    db.add(new_assignment)
    await db.commit()
    await db.refresh(new_assignment)
    return new_assignment

@router.get("/", response_model=List[AssignmentOut])
async def get_assignments(db: AsyncSession = Depends(get_db)):
    stmt = select(Assignment).order_by(Assignment.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()
