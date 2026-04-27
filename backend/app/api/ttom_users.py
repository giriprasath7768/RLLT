import random
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.db.models import TTOMUser, User, UserRole, Location, TTOMAssignment
from app.schemas.ttom_user import TTOMUserCreate, TTOMUserUpdate, TTOMUserResponse
from app.schemas.assignment import AssignmentBulkCreate, AssignmentBulkRemove
from app.api.auth import get_current_user

from app.core.security import get_password_hash

router = APIRouter()

async def verify_admin_or_super(current_user: User = Depends(get_current_user)):
    if getattr(current_user, "role", "") not in [UserRole.super_admin, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions. Super Admin or Admin required.")
    return current_user

@router.get("/me/chart", response_model=dict)
async def get_my_chart(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    if getattr(current_user, "role", "") != "ttom_user":
        raise HTTPException(status_code=403, detail="Not a TTOM User")
        
    assign_res = await db.execute(select(TTOMAssignment).where(TTOMAssignment.user_id == current_user.id))
    assignment = assign_res.scalars().first()
    
    if not assignment or not assignment.chart_id:
        return {"payload": "[]", "filter": "main", "module": 1, "facet": 1, "phase": 1}
        
    from app.db.models import ChartMapping, OilChartMapping
    from uuid import UUID
    
    try:
        cid = UUID(assignment.chart_id)
    except Exception:
        return {"payload": "[]", "filter": "main", "module": 1, "facet": 1, "phase": 1}
    
    chart_res = await db.execute(select(ChartMapping).where(ChartMapping.id == cid))
    chart = chart_res.scalars().first()
    if chart:
        filter_type = 'morning_evening' if 'Morning/Evening' in assignment.chart_type else 'main'
        return {
            "payload": chart.state_payload,
            "filter": filter_type,
            "module": chart.module,
            "facet": chart.facet,
            "phase": chart.phase
        }
        
    oil_res = await db.execute(select(OilChartMapping).where(OilChartMapping.id == cid))
    oil = oil_res.scalars().first()
    if oil:
        filter_type = 'morning_evening' if 'Morning/Evening' in assignment.chart_type else 'main'
        return {
            "payload": oil.state_payload,
            "filter": filter_type,
            "module": oil.module,
            "facet": oil.facet,
            "phase": oil.phase
        }
        
    return {"payload": "[]", "filter": "main", "module": 1, "facet": 1, "phase": 1}

@router.get("", response_model=List[TTOMUserResponse])
async def get_ttom_users(db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_super)):
    query = select(TTOMUser, Location).join(Location, TTOMUser.location_id == Location.id)
    
    if current_user.role == UserRole.admin:
        from app.db.models import Admin
        admin_res = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
        admin = admin_res.scalars().first()
        if admin:
            query = query.where(TTOMUser.location_id == admin.location_id)
        else:
            return []

    result = await db.execute(query)
    users_with_locs = result.all()
    
    assignments_res = await db.execute(select(TTOMAssignment))
    assignments = assignments_res.scalars().all()
    
    user_assignments = {}
    for a in assignments:
        if a.user_id not in user_assignments:
            user_assignments[a.user_id] = a
    
    users_list = []
    for user, location in users_with_locs:
        assignment = user_assignments.get(user.id)
        users_list.append(
            TTOMUserResponse(
                id=user.id,
                name=user.name,
                mobile_number=user.mobile_number,
                address=user.address,
                location_id=user.location_id,
                is_active=user.is_active,
                created_at=user.created_at,
                city=location.city,
                country=location.country,
                continent=location.continent,
                plain_password=user.plain_password,
                assigned_chart_id=assignment.chart_id if assignment else None,
                assigned_chart_type=assignment.chart_type if assignment else None
            )
        )
    return users_list

@router.post("", response_model=TTOMUserResponse, status_code=status.HTTP_201_CREATED)
async def create_ttom_user(user: TTOMUserCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_super)):
    # Check if mobile exists
    result = await db.execute(select(TTOMUser).where(TTOMUser.mobile_number == user.mobile_number))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Mobile number already registered")

    # Verify location exists
    loc_result = await db.execute(select(Location).where(Location.id == user.location_id))
    location = loc_result.scalars().first()
    if not location:
        raise HTTPException(status_code=400, detail="Invalid location ID")
        
    if current_user.role == UserRole.admin:
        from app.db.models import Admin
        admin_res = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
        admin = admin_res.scalars().first()
        if not admin or admin.location_id != user.location_id:
            raise HTTPException(status_code=403, detail="Cannot create user for a different location")

    # Generate 4 Digit PIN
    plain_pin = f"{random.randint(0, 9999):04d}"

    hashed_password = get_password_hash(plain_pin)
    new_user = TTOMUser(**user.model_dump(), password_hash=hashed_password, plain_password=plain_pin)
    db.add(new_user)
    try:
        await db.commit()
        await db.refresh(new_user)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return TTOMUserResponse(
        id=new_user.id,
        name=new_user.name,
        mobile_number=new_user.mobile_number,
        address=new_user.address,
        location_id=new_user.location_id,
        is_active=new_user.is_active,
        created_at=new_user.created_at,
        city=location.city,
        country=location.country,
        continent=location.continent,
        plain_password=new_user.plain_password,
        assigned_chart_id=None,
        assigned_chart_type=None
    )

@router.put("/{user_id}", response_model=TTOMUserResponse)
async def update_ttom_user(user_id: UUID, payload: TTOMUserUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_super)):
    result = await db.execute(select(TTOMUser).where(TTOMUser.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="TTOM User not found")
        
    if current_user.role == UserRole.admin:
        from app.db.models import Admin
        admin_res = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
        admin = admin_res.scalars().first()
        if not admin or admin.location_id != user.location_id:
            raise HTTPException(status_code=403, detail="Cannot update user from a different location")

    update_data = payload.model_dump(exclude_unset=True)
    
    if "mobile_number" in update_data and update_data["mobile_number"] != user.mobile_number:
        mob_res = await db.execute(select(TTOMUser).where(TTOMUser.mobile_number == update_data["mobile_number"]))
        if mob_res.scalars().first():
            raise HTTPException(status_code=400, detail="Mobile number already registered")

    for field, value in update_data.items():
        setattr(user, field, value)

    try:
        await db.commit()
        await db.refresh(user)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
    loc_res = await db.execute(select(Location).where(Location.id == user.location_id))
    location = loc_res.scalar_one_or_none()

    assign_res = await db.execute(select(TTOMAssignment).where(TTOMAssignment.user_id == user.id))
    assignment = assign_res.scalars().first()

    return TTOMUserResponse(
        id=user.id,
        name=user.name,
        mobile_number=user.mobile_number,
        address=user.address,
        location_id=user.location_id,
        is_active=user.is_active,
        created_at=user.created_at,
        city=location.city if location else "",
        country=location.country if location else "",
        continent=location.continent if location else "",
        plain_password=user.plain_password,
        assigned_chart_id=assignment.chart_id if assignment else None,
        assigned_chart_type=assignment.chart_type if assignment else None
    )

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ttom_user(user_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_super)):
    result = await db.execute(select(TTOMUser).where(TTOMUser.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="TTOM User not found")
        
    if current_user.role == UserRole.admin:
        from app.db.models import Admin
        admin_res = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
        admin = admin_res.scalars().first()
        if not admin or admin.location_id != user.location_id:
            raise HTTPException(status_code=403, detail="Cannot delete user from a different location")

    from sqlalchemy import delete
    await db.execute(delete(TTOMAssignment).where(TTOMAssignment.user_id == user_id))

    await db.delete(user)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/assignments/bulk", response_model=dict)
async def bulk_create_ttom_assignments(payload: AssignmentBulkCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_super)):
    if not payload.user_ids:
        raise HTTPException(status_code=400, detail="No users selected.")
    
    # Query all users to ensure they exist
    user_stmt = select(TTOMUser).where(TTOMUser.id.in_(payload.user_ids))
    user_result = await db.execute(user_stmt)
    valid_users = user_result.scalars().all()
    if len(valid_users) != len(payload.user_ids):
        raise HTTPException(status_code=404, detail="One or more users not found.")
        
    created_count = 0
    for uid in payload.user_ids:
        new_assignment = TTOMAssignment(
            user_id=uid,
            chart_id=payload.chart_id,
            chart_type=payload.chart_type,
            start_date=payload.start_date,
            end_date=payload.end_date
        )
        db.add(new_assignment)
        created_count += 1
        
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return {"message": f"Successfully assigned chart to {created_count} TTOM users."}

@router.post("/assignments/bulk_remove", response_model=dict)
async def bulk_remove_ttom_assignments(payload: AssignmentBulkRemove, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_super)):
    if not payload.user_ids:
        raise HTTPException(status_code=400, detail="No users selected.")
    
    from sqlalchemy import delete
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
    return {"message": f"Successfully removed assigned charts for {result.rowcount} users."}
