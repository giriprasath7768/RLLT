import secrets
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.db.models import User, UserRole
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentActivation
from app.api.auth import get_current_user
from app.core.security import get_password_hash

router = APIRouter()

async def send_activation_email(email: str, name: str, enrollment_number: str, temp_password: str):
    await asyncio.sleep(1) # mock async I/O
    print(f"\n--- MOCK AWS SES EMAIL SENDER ---")
    print(f"Para: {email}")
    print(f"Assunto: Conta Ativada - Bem-vindo!")
    print(f"Corpo: Olá {name},\nSua conta de estudante foi ativada com sucesso.\nNúmero de Matrícula: {enrollment_number}\nSenha Gerada: {temp_password}\nPor favor, faça luz de acesso no portal.")
    print(f"---------------------------------\n")

async def verify_admin_or_higher(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.super_admin, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions. Admin or Super Admin required.")
    return current_user

@router.get("/", response_model=List[StudentResponse])
async def get_students(db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    result = await db.execute(select(User).where(User.role == UserRole.student))
    return result.scalars().all()

@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(student_in: StudentCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    result = await db.execute(select(User).where(User.email == student_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    import uuid
    enrollment = student_in.enrollment_number or f"ACR-{uuid.uuid4().hex[:8].upper()}"
    
    new_user = User(
        email=student_in.email,
        hashed_password=get_password_hash("defaultpass"),
        role=UserRole.student,
        is_active=student_in.is_active,
        name=student_in.name,
        address=student_in.address,
        mobile_number=student_in.mobile_number,
        dob=student_in.dob,
        gender=student_in.gender,
        enrollment_number=enrollment
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(student_id: UUID, student_in: StudentUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    result = await db.execute(select(User).where((User.id == student_id) & (User.role == UserRole.student)))
    user = result.scalars().first()
    if not user:
         raise HTTPException(status_code=404, detail="Student not found")
    
    update_data = student_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
        
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(student_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    result = await db.execute(select(User).where((User.id == student_id) & (User.role == UserRole.student)))
    user = result.scalars().first()
    if not user:
         raise HTTPException(status_code=404, detail="Student not found")
    
    await db.delete(user)
    await db.commit()
    return None

@router.patch("/{student_id}/activate", response_model=StudentResponse)
async def activate_student(student_id: UUID, activation: StudentActivation, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    result = await db.execute(select(User).where((User.id == student_id) & (User.role == UserRole.student)))
    user = result.scalars().first()
    if not user:
         raise HTTPException(status_code=404, detail="Student not found")
         
    user.is_active = activation.is_active
    
    # Trigger SES Email on first time activation
    if activation.is_active and not user.activation_email_sent:
        temp_password = secrets.token_urlsafe(8)
        user.hashed_password = get_password_hash(temp_password)
        user.activation_email_sent = True
        
        # Fire background task string matching AWS SES setup logic requirements
        background_tasks.add_task(send_activation_email, user.email, user.name, user.enrollment_number, temp_password)

    await db.commit()
    await db.refresh(user)
    return user
