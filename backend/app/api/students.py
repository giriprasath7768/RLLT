import secrets
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.db.models import User, UserRole, Admin, Leader, Location, Assessment, AssessmentResult
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentActivation, AssessmentSubmissionPayload
from app.api.auth import get_current_user
from app.core.security import get_password_hash
from app.services.email_service import send_student_activation_email
from pydantic import BaseModel

class BulkActivatePayload(BaseModel):
    student_ids: List[UUID]

class BulkApprovePayload(BaseModel):
    student_ids: List[UUID]
    approve: bool = True

router = APIRouter()

async def verify_admin_or_higher(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.super_admin, UserRole.admin, UserRole.leader]:
        raise HTTPException(status_code=403, detail="Not enough permissions. Admin, Super Admin, or Leader required.")
    return current_user

@router.get("/", response_model=List[StudentResponse])
async def get_students(db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    query = select(User, Location.city.label("location_name"), Admin.name.label("admin_name")) \
        .outerjoin(Location, User.location_id == Location.id) \
        .outerjoin(Admin, Admin.location_id == Location.id) \
        .where(User.role == UserRole.student)
    
    if current_user.role == UserRole.admin:
        admin_res = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
        admin = admin_res.scalar_one_or_none()
        if admin and admin.location_id:
            query = query.where(User.location_id == admin.location_id)
    elif current_user.role == UserRole.leader:
        leader_res = await db.execute(select(Leader).where(Leader.user_id == current_user.id))
        leader = leader_res.scalar_one_or_none()
        if leader and leader.admin_id:
            admin_res = await db.execute(select(Admin).where(Admin.id == leader.admin_id))
            admin = admin_res.scalar_one_or_none()
            if admin and admin.location_id:
                query = query.where(User.location_id == admin.location_id)
            
    result = await db.execute(query)
    
    rows = result.all()
    response_list = []
    for user_obj, loc_name, adm_name in rows:
        user_dict = {
            "id": user_obj.id,
            "email": user_obj.email,
            "name": user_obj.name,
            "mobile_number": user_obj.mobile_number,
            "address": user_obj.address,
            "dob": user_obj.dob,
            "gender": user_obj.gender,
            "category": user_obj.category,
            "stage": user_obj.stage,
            "enrollment_number": user_obj.enrollment_number,
            "is_active": user_obj.is_active,
            "role": user_obj.role.value if hasattr(user_obj.role, 'value') else str(user_obj.role),
            "assessment_status": user_obj.assessment_status,
            "assessment_marks": user_obj.assessment_marks,
            "activation_email_sent": user_obj.activation_email_sent,
            "created_at": user_obj.created_at,
            "location_name": loc_name,
            "admin_name": adm_name
        }
        response_list.append(user_dict)
    
    return response_list

@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(student_in: StudentCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    result = await db.execute(select(User).where(User.email == student_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Determine location_id for the new student
    assigned_location_id = None
    if current_user.role == UserRole.admin:
        admin_res = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
        admin = admin_res.scalar_one_or_none()
        if admin:
            assigned_location_id = admin.location_id
    elif current_user.role == UserRole.leader:
        leader_res = await db.execute(select(Leader).where(Leader.user_id == current_user.id))
        leader = leader_res.scalar_one_or_none()
        if leader and leader.admin_id:
            admin_res = await db.execute(select(Admin).where(Admin.id == leader.admin_id))
            admin = admin_res.scalar_one_or_none()
            if admin:
                assigned_location_id = admin.location_id

    import uuid
    enrollment = student_in.enrollment_number or f"ACR-{uuid.uuid4().hex[:8].upper()}"
    
    # Auto generate strong password directly upon creation
    import secrets
    raw_password = secrets.token_hex(4)
    
    new_user = User(
        email=student_in.email,
        hashed_password=get_password_hash(raw_password),
        role=UserRole.student,
        is_active=student_in.is_active,
        name=student_in.name,
        address=student_in.address,
        mobile_number=student_in.mobile_number,
        dob=student_in.dob,
        gender=student_in.gender,
        category=student_in.category,
        stage=student_in.stage,
        enrollment_number=enrollment,
        location_id=assigned_location_id,
        activation_email_sent=True  # Mark it sent since we send it below!
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Dispatch via generic SMTP synchronously for error capture trace (standard config like Leader/Admin changes)
    print(f"\n--- ATTEMPTING SMTP DISPATCH TO STUDENT: {student_in.email} ---")
    mail_sent = send_student_activation_email(student_in.email, student_in.name, enrollment, raw_password)
    if not mail_sent:
        print(f"!!! CRITICAL: Failed to dispatch SMTP Email to {student_in.email}. !!!\n")
    else:
        print(f"--- SUCCESS: Dispatched Student Email successfully via SMTP! ---\n")

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
        import secrets
        temp_password = secrets.token_hex(4)
        user.hashed_password = get_password_hash(temp_password)
        user.activation_email_sent = True
        
        # Fire background task string matching AWS SES setup logic requirements
        background_tasks.add_task(send_student_activation_email, user.email, user.name, user.enrollment_number, temp_password)

    await db.commit()
    await db.refresh(user)
    return user

@router.post("/bulk-activate", response_model=dict)
async def bulk_activate_students(payload: BulkActivatePayload, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    result = await db.execute(select(User).where(User.id.in_(payload.student_ids)).where(User.role == UserRole.student).where(User.is_active == False))
    users = result.scalars().all()
    
    import secrets
    count = 0
    for user in users:
        user.is_active = True
        if not user.activation_email_sent:
            temp_password = secrets.token_hex(4)
            user.hashed_password = get_password_hash(temp_password)
            user.activation_email_sent = True
            background_tasks.add_task(send_student_activation_email, user.email, user.name, user.enrollment_number, temp_password)
        count += 1
        
    await db.commit()
    return {"message": f"Successfully activated {count} students"}

@router.post("/assessment/submit", response_model=StudentResponse)
async def submit_assessment(payload: AssessmentSubmissionPayload, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role != UserRole.student:
        raise HTTPException(status_code=403, detail="Only students can submit assessments")
    
    total_marks = 0.0
    db_results = []
    
    for resp in payload.responses:
        db_assessment = await db.get(Assessment, resp.assessment_id)
        if db_assessment:
            grade_str = getattr(db_assessment, f"grade_{resp.choice}", "0")
            try:
                current_grade = float(grade_str) if grade_str else 0.0
            except ValueError:
                current_grade = 0.0
                
            total_marks += current_grade
            
            db_results.append(
                AssessmentResult(
                    user_id=current_user.id,
                    assessment_id=resp.assessment_id,
                    selected_choice=resp.choice,
                    awarded_grade=current_grade
                )
            )

    if db_results:
        db.add_all(db_results)
                
    current_user.assessment_status = "under_review"
    current_user.assessment_marks = total_marks
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.put("/{student_id}/approve-assessment", response_model=StudentResponse)
async def approve_student_assessment(student_id: UUID, approve: bool = True, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    result = await db.execute(select(User).where((User.id == student_id) & (User.role == UserRole.student)))
    user = result.scalars().first()
    if not user:
         raise HTTPException(status_code=404, detail="Student not found")
         
    user.assessment_status = "approved" if approve else "under_review"
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/bulk-approve-assessment", response_model=dict)
async def bulk_approve_assessments(payload: BulkApprovePayload, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    result = await db.execute(select(User).where(User.id.in_(payload.student_ids)).where(User.role == UserRole.student))
    users = result.scalars().all()
    
    count = 0
    new_status = "approved" if payload.approve else "under_review"
    for user in users:
        user.assessment_status = new_status
        count += 1
        
    await db.commit()
    return {"message": f"Successfully updated {count} assessment statuses."}
