import secrets
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.db.models import User, UserRole, Admin, Leader, Location, Assessment, AssessmentResult, StudentGroup
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentActivation, AssessmentSubmissionPayload, StudentGroupResponse, AutoGroupPayload, ManualGroupPayload
from sqlalchemy import delete, update, func
from sqlalchemy.orm import selectinload
import math
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
    query = select(User, Location.city.label("location_name"), Admin.name.label("admin_name"), StudentGroup.name.label("group_name")) \
        .outerjoin(Location, User.location_id == Location.id) \
        .outerjoin(Admin, Admin.location_id == Location.id) \
        .outerjoin(StudentGroup, User.group_id == StudentGroup.id) \
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
    for user_obj, loc_name, adm_name, grp_name in rows:
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
            "admin_name": adm_name,
            "group_name": grp_name
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

@router.post("/grouping/auto", response_model=dict)
async def auto_group_students(payload: AutoGroupPayload, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    loc_id = None
    if current_user.role == UserRole.admin:
        admin_res = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
        admin = admin_res.scalar_one_or_none()
        if admin:
            loc_id = admin.location_id
    elif current_user.role == UserRole.leader:
        leader_res = await db.execute(select(Leader).where(Leader.user_id == current_user.id))
        leader = leader_res.scalar_one_or_none()
        if leader and leader.admin_id:
            adm_res = await db.execute(select(Admin).where(Admin.id == leader.admin_id))
            adm = adm_res.scalar_one_or_none()
            if adm:
                loc_id = adm.location_id
                
    if not loc_id and current_user.role != UserRole.super_admin:
        return {"message": "Location scope required for auto-grouping."}
        
    locations_to_group = []
    if current_user.role == UserRole.super_admin:
        res = await db.execute(select(Location.id))
        locations_to_group = res.scalars().all()
    else:
        locations_to_group = [loc_id]
        
    total_groups_created = 0
    
    for l_id in locations_to_group:
        # Clear existing group associations to prevent integrity errors before dropping the group entities
        await db.execute(update(User).where(User.location_id == l_id).values(group_id=None))
        await db.execute(delete(StudentGroup).where(StudentGroup.location_id == l_id))
        
        query = select(User).where(User.id.in_(payload.student_ids), User.location_id == l_id)
        result = await db.execute(query)
        students = result.scalars().all()
        
        if not students:
            continue
            
        total_st = len(students)
        num_groups = math.ceil(total_st / 5)
        
        def mark(s): 
            return s.assessment_marks if s.assessment_marks is not None else 0.0
        sorted_students = sorted(students, key=mark, reverse=True)
        
        split_idx = math.ceil(total_st * 0.6)
        high_scorers = sorted_students[:split_idx]
        low_scorers = sorted_students[split_idx:]
        
        loc_res = await db.execute(select(Location.city).where(Location.id == l_id))
        loc_city = loc_res.scalar_one_or_none() or f"Loc {l_id}"
        
        groups_created = []
        for i in range(num_groups):
            g = StudentGroup(name=f"Group {i+1} ({loc_city})", location_id=l_id)
            db.add(g)
            groups_created.append(g)
            
        await db.flush()
        
        high_idx, low_idx = 0, 0
        for g in groups_created:
            for _ in range(3):
                if high_idx < len(high_scorers):
                    high_scorers[high_idx].group_id = g.id
                    high_idx += 1
            for _ in range(2):
                if low_idx < len(low_scorers):
                    low_scorers[low_idx].group_id = g.id
                    low_idx += 1
                    
        for stu in low_scorers[low_idx:]:
            stu.group_id = None
            
        total_groups_created += num_groups
            
    await db.commit()
    
    if total_groups_created == 0:
        return {"message": "Not enough active students in any location to form groups."}
    return {"message": f"Successfully created {total_groups_created} groups."}

@router.post("/grouping/ungroup", response_model=dict)
async def ungroup_students(payload: AutoGroupPayload, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    if not payload.student_ids:
        return {"message": "No students provided for ungrouping."}
        
    await db.execute(update(User).where(User.id.in_(payload.student_ids)).values(group_id=None))
    await db.flush()
    
    query = select(StudentGroup.id).outerjoin(User, User.group_id == StudentGroup.id).group_by(StudentGroup.id).having(func.count(User.id) == 0)
    res = await db.execute(query)
    empty_group_ids = res.scalars().all()
    if empty_group_ids:
        await db.execute(delete(StudentGroup).where(StudentGroup.id.in_(empty_group_ids)))
        
    await db.commit()
    return {"message": "Successfully ungrouped selected students."}

@router.post("/grouping/manual", response_model=dict)
async def manual_group_students(payload: ManualGroupPayload, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    if not payload.student_ids:
        return {"message": "No students provided for grouping."}
        
    if not payload.group_name or not payload.group_name.strip():
        return {"message": "Group name cannot be empty."}

    group_name = payload.group_name.strip()

    loc_id = None
    if current_user.role == UserRole.admin:
        admin_res = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
        admin = admin_res.scalar_one_or_none()
        if admin:
            loc_id = admin.location_id
    elif current_user.role == UserRole.leader:
        leader_res = await db.execute(select(Leader).where(Leader.user_id == current_user.id))
        leader = leader_res.scalar_one_or_none()
        if leader and leader.admin_id:
            adm_res = await db.execute(select(Admin).where(Admin.id == leader.admin_id))
            adm = adm_res.scalar_one_or_none()
            if adm:
                loc_id = adm.location_id
                
    query = select(User).where(User.id.in_(payload.student_ids))
    if loc_id:
        query = query.where(User.location_id == loc_id)
        
    result = await db.execute(query)
    students = result.scalars().all()
    
    if not students:
        return {"message": "No valid students found in your location."}

    # Group students by their location, since manual grouping requires creating a StudentGroup tied to a location
    students_by_loc = {}
    for stu in students:
        if stu.location_id:
            if stu.location_id not in students_by_loc:
                students_by_loc[stu.location_id] = []
            students_by_loc[stu.location_id].append(stu)

    total_grouped = 0
    assigned_groups = []

    for l_id, stus in students_by_loc.items():
        # Check if group already exists for this location
        g_res = await db.execute(select(StudentGroup).where(StudentGroup.name == group_name, StudentGroup.location_id == l_id))
        group = g_res.scalar_one_or_none()
        
        if not group:
            group = StudentGroup(name=group_name, location_id=l_id)
            db.add(group)
            await db.flush() # get ID
            
        for s in stus:
            s.group_id = group.id
            total_grouped += 1
            
        assigned_groups.append(group.name)
        
    # Clean up empty groups globally if needed, similarly to ungroup
    query_empty = select(StudentGroup.id).outerjoin(User, User.group_id == StudentGroup.id).group_by(StudentGroup.id).having(func.count(User.id) == 0)
    res_empty = await db.execute(query_empty)
    empty_group_ids = res_empty.scalars().all()
    if empty_group_ids:
        await db.execute(delete(StudentGroup).where(StudentGroup.id.in_(empty_group_ids)))

    await db.commit()
    
    return {"message": f"Successfully grouped {total_grouped} student(s) into '{group_name}'."}

@router.get("/grouping", response_model=List[StudentGroupResponse])
async def get_student_groups(db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    loc_id = None
    if current_user.role == UserRole.admin:
        admin_res = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
        admin = admin_res.scalar_one_or_none()
        if admin:
            loc_id = admin.location_id
    elif current_user.role == UserRole.leader:
        leader_res = await db.execute(select(Leader).where(Leader.user_id == current_user.id))
        leader = leader_res.scalar_one_or_none()
        if leader and leader.admin_id:
            adm_res = await db.execute(select(Admin).where(Admin.id == leader.admin_id))
            adm = adm_res.scalar_one_or_none()
            if adm:
                loc_id = adm.location_id
                
    query = select(StudentGroup).options(selectinload(StudentGroup.members))
    if loc_id:
        query = query.where(StudentGroup.location_id == loc_id)
        
    result = await db.execute(query)
    groups = result.scalars().all()
    
    for g in groups:
        for m in g.members:
            m.location_name = None
            m.admin_name = None
            if hasattr(m.role, 'value'):
                m.role = m.role.value
            
    return groups
