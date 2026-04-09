import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from typing import List, Optional

from app.db.database import get_db
from app.db.models import Assessment, User, Admin, UserRole
from app.api.auth import get_current_user
from app.schemas.assessment import (
    AssessmentResponse,
    AssessmentCreate,
    AssessmentUpdate,
    AssessmentBulkCreate
)

router = APIRouter()

async def verify_admin_or_higher(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.super_admin, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions. Admin or Super Admin required.")
    return current_user

@router.get("/", response_model=List[AssessmentResponse])
async def read_assessments(
    name: Optional[str] = None,
    location_module: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_admin_or_higher)
):
    query = select(Assessment)
    if name:
        query = query.where(Assessment.name == name)
    if location_module:
        query = query.where(Assessment.location_module == location_module)
        
    if current_user.role == UserRole.admin:
        admin_res = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
        admin = admin_res.scalar_one_or_none()
        if admin and admin.location_id:
            query = query.where(Assessment.location_id == admin.location_id)
    
    result = await db.execute(query)
    assessments = result.scalars().all()
    return assessments

@router.get("/options", response_model=dict)
async def get_assessment_options(db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    names_query = select(Assessment.name).distinct()
    locations_query = select(Assessment.location_module).distinct()
    
    names_result = await db.execute(names_query)
    locations_result = await db.execute(locations_query)
    
    return {
        "names": names_result.scalars().all(),
        "locations": locations_result.scalars().all()
    }

@router.post("/", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assessment(assessment: AssessmentCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    assigned_location_id = None
    if current_user.role == UserRole.admin:
        admin_res = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
        admin = admin_res.scalar_one_or_none()
        if admin:
            assigned_location_id = admin.location_id

    db_assessment = Assessment(**assessment.model_dump())
    db_assessment.location_id = assigned_location_id
    db.add(db_assessment)
    await db.commit()
    await db.refresh(db_assessment)
    return db_assessment

@router.post("/bulk", response_model=dict, status_code=status.HTTP_201_CREATED)
async def bulk_create_assessments(data: AssessmentBulkCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    assigned_location_id = None
    if current_user.role == UserRole.admin:
        admin_res = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
        admin = admin_res.scalar_one_or_none()
        if admin:
            assigned_location_id = admin.location_id

    db_assessments = [Assessment(**a.model_dump(), location_id=assigned_location_id) for a in data.assessments]
    db.add_all(db_assessments)
    await db.commit()
    return {"message": f"Successfully imported {len(db_assessments)} assessments"}

@router.put("/{assessment_id}", response_model=AssessmentResponse)
async def update_assessment(assessment_id: uuid.UUID, assessment: AssessmentUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    db_assessment = await db.get(Assessment, assessment_id)
    if db_assessment is None:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    for key, value in assessment.model_dump(exclude_unset=True).items():
        setattr(db_assessment, key, value)
        
    await db.commit()
    await db.refresh(db_assessment)
    return db_assessment

@router.delete("/bulk", response_model=dict)
async def bulk_delete_assessments(assessment_ids: List[uuid.UUID], db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    if not assessment_ids:
        return {"message": "No assessments selected for deletion"}
    await db.execute(delete(Assessment).where(Assessment.id.in_(assessment_ids)))
    await db.commit()
    return {"message": "Successfully deleted selected assessments"}

@router.delete("/purge", response_model=dict)
async def purge_assessments(name: str, location_module: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    await db.execute(
        delete(Assessment)
        .where(Assessment.name == name)
        .where(Assessment.location_module == location_module)
    )
    await db.commit()
    return {"message": f"Successfully purged assessments for {name} - {location_module}"}

@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assessment(assessment_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    db_assessment = await db.get(Assessment, assessment_id)
    if db_assessment is None:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    await db.delete(db_assessment)
    await db.commit()
    return None
