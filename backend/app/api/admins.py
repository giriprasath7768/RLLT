import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.db.models import Admin, User, Location, UserRole
from app.schemas.admin import AdminCreate, AdminUpdate, AdminResponse
from app.api.auth import get_current_user
from app.core.security import get_password_hash

router = APIRouter()

async def verify_super_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.super_admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions. Super Admin required.")
    return current_user

@router.get("/", response_model=List[AdminResponse])
async def get_admins(db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_super_admin)):
    query = (
        select(Admin, User, Location)
        .join(User, Admin.user_id == User.id)
        .join(Location, Admin.location_id == Location.id)
    )
    result = await db.execute(query)
    results = result.all()
    
    admins_list = []
    for admin, user, location in results:
        admins_list.append(
            AdminResponse(
                id=admin.id,
                user_id=admin.user_id,
                name=admin.name,
                mobile_number=admin.mobile_number,
                address=admin.address,
                location_id=admin.location_id,
                created_at=admin.created_at,
                email=user.email,
                is_active=user.is_active,
                city=location.city,
                country=location.country,
                continent=location.continent
            )
        )
    return admins_list

@router.post("/", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
async def create_admin(admin_in: AdminCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_super_admin)):
    result = await db.execute(select(User).where(User.email == admin_in.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    loc_result = await db.execute(select(Location).where(Location.id == admin_in.location_id))
    location = loc_result.scalar_one_or_none()
    if not location:
        raise HTTPException(status_code=400, detail="Invalid location_id")

    raw_password = secrets.token_urlsafe(8)
    hashed_password = get_password_hash(raw_password)

    new_user = User(
        email=admin_in.email,
        hashed_password=hashed_password,
        role=UserRole.admin,
        is_active=admin_in.is_active
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    new_admin = Admin(
        user_id=new_user.id,
        name=admin_in.name,
        mobile_number=admin_in.mobile_number,
        address=admin_in.address,
        location_id=admin_in.location_id
    )
    db.add(new_admin)
    await db.commit()
    await db.refresh(new_admin)

    print(f"\\n--- MOCK EMAIL SENDER ---")
    print(f"To: {admin_in.email}")
    print(f"Subject: Your Admin Account Created")
    print(f"Body: Welcome {admin_in.name}! Your admin account password is: {raw_password}")
    print(f"-------------------------\\n")

    return AdminResponse(
        id=new_admin.id,
        user_id=new_admin.user_id,
        name=new_admin.name,
        mobile_number=new_admin.mobile_number,
        address=new_admin.address,
        location_id=new_admin.location_id,
        created_at=new_admin.created_at,
        email=new_user.email,
        is_active=new_user.is_active,
        city=location.city,
        country=location.country,
        continent=location.continent
    )

@router.put("/{admin_id}", response_model=AdminResponse)
async def update_admin(admin_id: UUID, admin_in: AdminUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_super_admin)):
    adm_res = await db.execute(select(Admin).where(Admin.id == admin_id))
    admin = adm_res.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
        
    usr_res = await db.execute(select(User).where(User.id == admin.user_id))
    user = usr_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Associated user not found")

    update_data = admin_in.dict(exclude_unset=True)
    
    if 'is_active' in update_data:
        user.is_active = update_data.pop('is_active')
        
    if 'email' in update_data:
        new_email = update_data.pop('email')
        if new_email != user.email:
            existing_user_result = await db.execute(select(User).where(User.email == new_email))
            if existing_user_result.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="User with this email already exists")
            user.email = new_email
        
    if 'location_id' in update_data:
        loc_res = await db.execute(select(Location).where(Location.id == update_data['location_id']))
        new_loc = loc_res.scalar_one_or_none()
        if not new_loc:
            raise HTTPException(status_code=400, detail="Invalid location_id")

    for field, value in update_data.items():
        setattr(admin, field, value)

    await db.commit()
    await db.refresh(admin)
    await db.refresh(user)
    
    loc_res = await db.execute(select(Location).where(Location.id == admin.location_id))
    location = loc_res.scalar_one_or_none()

    return AdminResponse(
        id=admin.id,
        user_id=admin.user_id,
        name=admin.name,
        mobile_number=admin.mobile_number,
        address=admin.address,
        location_id=admin.location_id,
        created_at=admin.created_at,
        email=user.email,
        is_active=user.is_active,
        city=location.city,
        country=location.country,
        continent=location.continent
    )

@router.delete("/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin(admin_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_super_admin)):
    adm_res = await db.execute(select(Admin).where(Admin.id == admin_id))
    admin = adm_res.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
        
    usr_res = await db.execute(select(User).where(User.id == admin.user_id))
    user = usr_res.scalar_one_or_none()
    
    await db.delete(admin)
    if user:
         await db.delete(user)
         
    await db.commit()
    return None
