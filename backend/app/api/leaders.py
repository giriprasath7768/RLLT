import asyncio
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.db.models import Leader, Admin, User, Location, UserRole
from app.schemas.leader import LeaderCreate, LeaderUpdate, LeaderResponse
from app.api.auth import get_current_user
from app.core.security import get_password_hash
from app.services.email_service import send_leader_creation_email

router = APIRouter()

async def verify_admin_or_higher(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.super_admin, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions. Admin or Super Admin required.")
    return current_user

@router.get("/", response_model=List[LeaderResponse])
async def get_leaders(db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    query = (
        select(Leader, User, Admin, Location)
        .join(User, Leader.user_id == User.id)
        .join(Admin, Leader.admin_id == Admin.id)
        .join(Location, Admin.location_id == Location.id)
    )
    
    if current_user.role == UserRole.admin:
        admin_res = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
        admin_profile = admin_res.scalar_one_or_none()
        if admin_profile:
            query = query.where(Admin.location_id == admin_profile.location_id)
            
    result = await db.execute(query)
    results = result.all()
    
    leaders_list = []
    for leader, user, admin, location in results:
        leaders_list.append(
            LeaderResponse(
                id=leader.id,
                user_id=leader.user_id,
                name=leader.name,
                mobile_number=leader.mobile_number,
                address=leader.address,
                admin_id=leader.admin_id,
                created_at=leader.created_at,
                email=user.email,
                is_active=user.is_active,
                admin_name=admin.name,
                city=location.city,
                country=location.country,
                continent=location.continent
            )
        )
    return leaders_list

@router.post("/", response_model=LeaderResponse, status_code=status.HTTP_201_CREATED)
async def create_leader(leader_in: LeaderCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == leader_in.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Verify admin exists
    admin_result = await db.execute(select(Admin).where(Admin.id == leader_in.admin_id))
    admin = admin_result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=400, detail="Invalid admin_id")

    # Get the location implicitly to return in response
    loc_result = await db.execute(select(Location).where(Location.id == admin.location_id))
    location = loc_result.scalar_one_or_none()

    # Create new User object for the Leader
    raw_password = secrets.token_urlsafe(8)
    hashed_password = get_password_hash(raw_password)

    new_user = User(
        email=leader_in.email,
        hashed_password=hashed_password,
        role=UserRole.leader,
        is_active=leader_in.is_active
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Create Leader profile linking User and Admin
    new_leader = Leader(
        user_id=new_user.id,
        name=leader_in.name,
        mobile_number=leader_in.mobile_number,
        address=leader_in.address,
        admin_id=leader_in.admin_id
    )
    db.add(new_leader)
    await db.commit()
    await db.refresh(new_leader)

    # Run the email hook immediately to explicitly capture failures if SMTP drops it
    print(f"\n--- ATTEMPTING SMTP DISPATCH TO: {leader_in.email} ---")
    mail_sent = send_leader_creation_email(leader_in.email, leader_in.name, raw_password)
    if not mail_sent:
        print(f"!!! CRITICAL: Failed to dispatch SMTP Email to {leader_in.email}. Check backend logger.error output or Mailtrap config! !!!\n")
    else:
        print(f"--- SUCCESS: Dispatched Leader Email successfully via SMTP! ---\n")

    return LeaderResponse(
        id=new_leader.id,
        user_id=new_leader.user_id,
        name=new_leader.name,
        mobile_number=new_leader.mobile_number,
        address=new_leader.address,
        admin_id=new_leader.admin_id,
        created_at=new_leader.created_at,
        email=new_user.email,
        is_active=new_user.is_active,
        admin_name=admin.name,
        city=location.city,
        country=location.country,
        continent=location.continent
    )

@router.put("/{leader_id}", response_model=LeaderResponse)
async def update_leader(leader_id: UUID, leader_in: LeaderUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    ldr_res = await db.execute(select(Leader).where(Leader.id == leader_id))
    leader = ldr_res.scalar_one_or_none()
    if not leader:
        raise HTTPException(status_code=404, detail="Leader not found")
        
    usr_res = await db.execute(select(User).where(User.id == leader.user_id))
    user = usr_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Associated user not found")

    update_data = leader_in.dict(exclude_unset=True)
    
    if 'is_active' in update_data:
        user.is_active = update_data.pop('is_active')
        
    if 'email' in update_data:
        new_email = update_data.pop('email')
        if new_email != user.email:
            existing_user_result = await db.execute(select(User).where(User.email == new_email))
            if existing_user_result.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="User with this email already exists")
            user.email = new_email
        
    if 'admin_id' in update_data:
        adm_res = await db.execute(select(Admin).where(Admin.id == update_data['admin_id']))
        new_adm = adm_res.scalar_one_or_none()
        if not new_adm:
            raise HTTPException(status_code=400, detail="Invalid admin_id")

    for field, value in update_data.items():
        setattr(leader, field, value)

    await db.commit()
    await db.refresh(leader)
    await db.refresh(user)
    
    # Get associated relationships for the response model
    adm_res = await db.execute(select(Admin).where(Admin.id == leader.admin_id))
    admin = adm_res.scalar_one_or_none()

    loc_res = await db.execute(select(Location).where(Location.id == admin.location_id))
    location = loc_res.scalar_one_or_none()

    return LeaderResponse(
        id=leader.id,
        user_id=leader.user_id,
        name=leader.name,
        mobile_number=leader.mobile_number,
        address=leader.address,
        admin_id=leader.admin_id,
        created_at=leader.created_at,
        email=user.email,
        is_active=user.is_active,
        admin_name=admin.name,
        city=location.city,
        country=location.country,
        continent=location.continent
    )

@router.delete("/{leader_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_leader(leader_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    ldr_res = await db.execute(select(Leader).where(Leader.id == leader_id))
    leader = ldr_res.scalar_one_or_none()
    if not leader:
        raise HTTPException(status_code=404, detail="Leader not found")
        
    usr_res = await db.execute(select(User).where(User.id == leader.user_id))
    user = usr_res.scalar_one_or_none()
    
    await db.delete(leader)
    if user:
         await db.delete(user)
         
    await db.commit()
    return None
