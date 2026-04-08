from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.database import get_db
from app.db.models import User, UserRole, SuperAdmin, Admin, Leader
from app.schemas.profile import ProfileUpdate, PasswordUpdate, ProfileResponse
from app.api.auth import get_current_user
from app.core.security import verify_password, get_password_hash

router = APIRouter()

@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile_data = {
        "email": current_user.email,
        "role": current_user.role.value,
        "name": current_user.name,
        "address": current_user.address,
        "mobile_number": current_user.mobile_number,
        "profile_image_url": None
    }
    
    if current_user.role == UserRole.super_admin:
        res = await db.execute(select(SuperAdmin).where(SuperAdmin.user_id == current_user.id))
        sa = res.scalar_one_or_none()
        if sa:
            profile_data.update({
                "name": sa.name,
                "address": sa.address,
                "mobile_number": sa.mobile_number,
                "profile_image_url": sa.profile_image_url
            })
            
    elif current_user.role == UserRole.admin:
        res = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
        admin = res.scalar_one_or_none()
        if admin:
            profile_data.update({
                "name": admin.name,
                "address": admin.address,
                "mobile_number": admin.mobile_number
            })
            
    elif current_user.role == UserRole.leader:
        res = await db.execute(select(Leader).where(Leader.user_id == current_user.id))
        leader = res.scalar_one_or_none()
        if leader:
            profile_data.update({
                "name": leader.name,
                "address": leader.address,
                "mobile_number": leader.mobile_number
            })
            
    return ProfileResponse(**profile_data)

@router.put("/me", response_model=ProfileResponse)
async def update_my_profile(profile_in: ProfileUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.super_admin:
        res = await db.execute(select(SuperAdmin).where(SuperAdmin.user_id == current_user.id))
        sa = res.scalar_one_or_none()
        if sa:
            if profile_in.name is not None: sa.name = profile_in.name
            if profile_in.address is not None: sa.address = profile_in.address
            if profile_in.mobile_number is not None: sa.mobile_number = profile_in.mobile_number
            if profile_in.profile_image_url is not None: sa.profile_image_url = profile_in.profile_image_url
            await db.commit()
    elif current_user.role == UserRole.admin:
        res = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
        admin = res.scalar_one_or_none()
        if admin:
            if profile_in.name is not None: admin.name = profile_in.name
            if profile_in.address is not None: admin.address = profile_in.address
            if profile_in.mobile_number is not None: admin.mobile_number = profile_in.mobile_number
            await db.commit()
    elif current_user.role == UserRole.leader:
        res = await db.execute(select(Leader).where(Leader.user_id == current_user.id))
        leader = res.scalar_one_or_none()
        if leader:
            if profile_in.name is not None: leader.name = profile_in.name
            if profile_in.address is not None: leader.address = profile_in.address
            if profile_in.mobile_number is not None: leader.mobile_number = profile_in.mobile_number
            await db.commit()
    else:
        if profile_in.name is not None: current_user.name = profile_in.name
        if profile_in.address is not None: current_user.address = profile_in.address
        if profile_in.mobile_number is not None: current_user.mobile_number = profile_in.mobile_number
        await db.commit()
        
    return await get_my_profile(db=db, current_user=current_user)

@router.put("/password", response_model=dict)
async def update_password(pw_in: PasswordUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(pw_in.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    current_user.hashed_password = get_password_hash(pw_in.new_password)
    await db.commit()
    return {"message": "Password updated successfully"}
