from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.db.models import Assignment, User
from app.schemas.assignment import AssignmentCreate, AssignmentOut, AssignmentBulkCreate
from app.api.auth import get_current_user

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

@router.get("/my", response_model=List[AssignmentOut])
async def get_my_assignments(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Assignment).where(Assignment.user_id == current_user.id).order_by(Assignment.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/", response_model=List[AssignmentOut])
async def get_assignments(db: AsyncSession = Depends(get_db)):
    stmt = select(Assignment).order_by(Assignment.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/bulk", response_model=dict)
async def bulk_create_assignments(payload: AssignmentBulkCreate, db: AsyncSession = Depends(get_db)):
    if not payload.user_ids:
        raise HTTPException(status_code=400, detail="No users selected.")
    
    # Query all users to ensure they exist
    user_stmt = select(User).where(User.id.in_(payload.user_ids))
    user_result = await db.execute(user_stmt)
    valid_users = user_result.scalars().all()
    if len(valid_users) != len(payload.user_ids):
        raise HTTPException(status_code=404, detail="One or more users not found.")
        
    created_count = 0
    for uid in payload.user_ids:
        new_assignment = Assignment(
            user_id=uid,
            chart_id=payload.chart_id,
            chart_type=payload.chart_type,
            start_date=payload.start_date,
            end_date=payload.end_date
        )
        db.add(new_assignment)
        created_count += 1
        
    await db.commit()
    return {"message": f"Successfully assigned chart to {created_count} students."}
