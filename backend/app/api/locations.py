import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.db.database import get_db
from app.db.models import Location, User, Admin, Leader, UserRole
from app.api.auth import get_current_user, get_current_user_optional
from app.schemas.location import LocationCreate, LocationUpdate, LocationResponse
from typing import List, Optional
router = APIRouter()

@router.get("/locations", response_model=List[LocationResponse])
async def read_locations(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    query = select(Location)
    
    if current_user:
        if current_user.role == UserRole.admin:
            admin_res = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
            admin = admin_res.scalar_one_or_none()
            if admin and admin.location_id:
                query = query.where(Location.id == admin.location_id)
        elif current_user.role == UserRole.leader:
            leader_res = await db.execute(select(Leader).where(Leader.user_id == current_user.id))
            leader = leader_res.scalar_one_or_none()
            if leader and leader.admin_id:
                admin_res = await db.execute(select(Admin).where(Admin.id == leader.admin_id))
                admin = admin_res.scalar_one_or_none()
                if admin and admin.location_id:
                    query = query.where(Location.id == admin.location_id)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    locations = result.scalars().all()
    return locations

@router.post("/locations", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(location: LocationCreate, db: AsyncSession = Depends(get_db)):
    db_location = Location(**location.model_dump())
    db.add(db_location)
    await db.commit()
    await db.refresh(db_location)
    return db_location

@router.get("/locations/{location_id}", response_model=LocationResponse)
async def read_location(location_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    db_location = await db.get(Location, location_id)
    if db_location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return db_location

@router.put("/locations/{location_id}", response_model=LocationResponse)
async def update_location(location_id: uuid.UUID, location: LocationUpdate, db: AsyncSession = Depends(get_db)):
    db_location = await db.get(Location, location_id)
    if db_location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    
    for key, value in location.model_dump().items():
        setattr(db_location, key, value)
        
    await db.commit()
    await db.refresh(db_location)
    return db_location

@router.delete("/locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(location_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    db_location = await db.get(Location, location_id)
    if db_location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    
    await db.delete(db_location)
    await db.commit()
    return None
