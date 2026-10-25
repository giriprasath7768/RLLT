import secrets
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, File
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

class TouchCountUpdatePayload(BaseModel):
    transformation: int = 0
    team_transformation: int = 0
    klt_reading_plan: int = 0
    word_editor: int = 0

router = APIRouter()

@router.get("/debug-touches")
async def debug_touches(db: AsyncSession = Depends(get_db)):
    from app.db.models import StudentTouchCount, User
    result = await db.execute(select(User.email, StudentTouchCount.transformation_touches, StudentTouchCount.team_transformation_touches, StudentTouchCount.klt_reading_plan_touches, StudentTouchCount.word_editor_touches).outerjoin(StudentTouchCount, User.id == StudentTouchCount.user_id))
    rows = result.all()
    return [{"email": r[0], "transformation": r[1], "team_transformation": r[2], "klt_reading_plan": r[3], "word_editor": r[4]} for r in rows]

async def verify_admin_or_higher(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.super_admin, UserRole.admin, UserRole.leader]:
        raise HTTPException(status_code=403, detail="Not enough permissions. Admin, Super Admin, or Leader required.")
    return current_user

@router.get("/", response_model=List[StudentResponse])
async def get_students(db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    from app.db.models import StudentTouchCount
    query = select(User, Location.city.label("location_name"), Location.country.label("location_country"), Admin.name.label("admin_name"), StudentGroup.name.label("group_name"), StudentTouchCount) \
        .outerjoin(Location, User.location_id == Location.id) \
        .outerjoin(Admin, Admin.location_id == Location.id) \
        .outerjoin(StudentGroup, User.group_id == StudentGroup.id) \
        .outerjoin(StudentTouchCount, User.id == StudentTouchCount.user_id) \
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
    for user_obj, loc_name, loc_country, adm_name, grp_name, touch_count_obj in rows:
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
            "location_id": user_obj.location_id,
            "location_name": loc_name,
            "country": loc_country,
            "admin_name": adm_name,
            "group_name": grp_name,
            "touch_counts": {
                "transformation": touch_count_obj.transformation_touches or 0 if touch_count_obj else 0,
                "team_transformation": touch_count_obj.team_transformation_touches or 0 if touch_count_obj else 0,
                "klt_reading_plan": touch_count_obj.klt_reading_plan_touches or 0 if touch_count_obj else 0,
                "word_editor": touch_count_obj.word_editor_touches or 0 if touch_count_obj else 0
            } if touch_count_obj else None
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

_touch_logs_initialized = False

async def _ensure_touch_logs_ready(db: AsyncSession):
    global _touch_logs_initialized
    from sqlalchemy import text
    from app.db.models import StudentTouchCount, StudentTouchLog
    from datetime import datetime, timezone

    if not _touch_logs_initialized:
        try:
            await db.execute(text("""
                CREATE TABLE IF NOT EXISTS student_touch_logs (
                    id UUID PRIMARY KEY,
                    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
                    transformation_touches INTEGER DEFAULT 0,
                    team_transformation_touches INTEGER DEFAULT 0,
                    klt_reading_plan_touches INTEGER DEFAULT 0,
                    word_editor_touches INTEGER DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """))
            await db.commit()
            _touch_logs_initialized = True
        except Exception:
            await db.rollback()

    # Backfill baseline logs for any student who has cumulative counts in student_touch_counts
    # but does not yet have any rows in student_touch_logs
    try:
        tc_rows = (await db.execute(
            select(StudentTouchCount, User).join(User, StudentTouchCount.user_id == User.id)
        )).all()
        if tc_rows:
            logged_user_ids_res = await db.execute(select(StudentTouchLog.user_id).distinct())
            logged_user_ids = {r[0] for r in logged_user_ids_res.all()}
            added_any = False
            for tc, u in tc_rows:
                if u.id not in logged_user_ids:
                    t1 = tc.transformation_touches or 0
                    t2 = tc.team_transformation_touches or 0
                    t3 = tc.klt_reading_plan_touches or 0
                    t4 = tc.word_editor_touches or 0
                    if t1 > 0 or t2 > 0 or t3 > 0 or t4 > 0:
                        db.add(StudentTouchLog(
                            user_id=u.id,
                            location_id=u.location_id,
                            transformation_touches=t1,
                            team_transformation_touches=t2,
                            klt_reading_plan_touches=t3,
                            word_editor_touches=t4,
                            created_at=tc.updated_at or u.created_at or datetime.now(timezone.utc)
                        ))
                        added_any = True
            if added_any:
                await db.commit()
    except Exception:
        await db.rollback()

@router.get("/touch-counts/report")
async def get_touch_counts_report(
    student_id: str = None,
    location_ids: str = None,
    from_date: str = None,
    to_date: str = None,
    from_time: str = None,
    to_time: str = None,
    tz_offset: int = -330,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_admin_or_higher)
):
    from app.db.models import StudentTouchCount, StudentTouchLog
    from datetime import datetime, date as dt_date, time as dt_time, timezone, timedelta

    await _ensure_touch_logs_ready(db)

    parsed_student_id = None
    if student_id and student_id.strip():
        try:
            parsed_student_id = UUID(student_id.strip())
        except Exception:
            return {"transformation": 0, "team_transformation": 0, "klt_reading_plan": 0, "word_editor": 0}

    # Determine location filter
    allowed_location_ids = None
    if current_user.role == UserRole.admin:
        admin_res = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
        admin = admin_res.scalar_one_or_none()
        if admin and admin.location_id:
            allowed_location_ids = [admin.location_id]
    elif current_user.role == UserRole.leader:
        leader_res = await db.execute(select(Leader).where(Leader.user_id == current_user.id))
        leader = leader_res.scalar_one_or_none()
        if leader and leader.admin_id:
            admin_res = await db.execute(select(Admin).where(Admin.id == leader.admin_id))
            admin = admin_res.scalar_one_or_none()
            if admin and admin.location_id:
                allowed_location_ids = [admin.location_id]

    if location_ids and location_ids.strip():
        requested_ids = []
        for raw_id in location_ids.split(","):
            raw_id = raw_id.strip()
            if raw_id:
                try:
                    requested_ids.append(UUID(raw_id))
                except Exception:
                    pass
        if requested_ids:
            if allowed_location_ids is not None:
                allowed_location_ids = [lid for lid in requested_ids if lid in allowed_location_ids]
            else:
                allowed_location_ids = requested_ids

    # Parse date and time bounds
    parsed_from_date = None
    parsed_to_date = None
    parsed_from_time = None
    parsed_to_time = None

    if from_date and from_date.strip():
        try:
            parsed_from_date = dt_date.fromisoformat(from_date.strip())
        except Exception:
            pass
    if to_date and to_date.strip():
        try:
            parsed_to_date = dt_date.fromisoformat(to_date.strip())
        except Exception:
            pass
    if from_time and from_time.strip():
        try:
            parts = [int(p) for p in from_time.strip().split(":")]
            parsed_from_time = dt_time(parts[0], parts[1] if len(parts) > 1 else 0, 0)
        except Exception:
            pass
    if to_time and to_time.strip():
        try:
            parts = [int(p) for p in to_time.strip().split(":")]
            parsed_to_time = dt_time(parts[0], parts[1] if len(parts) > 1 else 0, 59, 999999)
        except Exception:
            pass

    log_q = (
        select(StudentTouchLog, User.location_id)
        .join(User, StudentTouchLog.user_id == User.id)
        .where(User.role == UserRole.student)
        .where(func.coalesce(StudentTouchLog.location_id, User.location_id).isnot(None))
    )
    if parsed_student_id is not None:
        log_q = log_q.where(User.id == parsed_student_id)
    if allowed_location_ids is not None:
        if len(allowed_location_ids) == 0:
            return {"transformation": 0, "team_transformation": 0, "klt_reading_plan": 0, "word_editor": 0}
        log_q = log_q.where(func.coalesce(StudentTouchLog.location_id, User.location_id).in_(allowed_location_ids))

    log_rows = (await db.execute(log_q)).all()
    totals = {
        "transformation": 0,
        "team_transformation": 0,
        "klt_reading_plan": 0,
        "word_editor": 0
    }

    offset_delta = timedelta(minutes=int(tz_offset or 0))
    for log_obj, user_loc_id in log_rows:
        ts = log_obj.created_at
        if ts is None:
            continue
        if ts.tzinfo is not None:
            utc_dt = ts.astimezone(timezone.utc).replace(tzinfo=None)
        else:
            utc_dt = ts
        local_dt = utc_dt - offset_delta
        local_d = local_dt.date()
        local_t = local_dt.time()

        # Filter by single Date or Date Range
        if parsed_from_date and parsed_to_date:
            low_d = min(parsed_from_date, parsed_to_date)
            high_d = max(parsed_from_date, parsed_to_date)
            if not (low_d <= local_d <= high_d):
                continue
        elif parsed_from_date:
            if local_d != parsed_from_date:
                continue
        elif parsed_to_date:
            if local_d != parsed_to_date:
                continue

        # Filter by single Time or Time Range
        if parsed_from_time and parsed_to_time:
            if parsed_from_time <= parsed_to_time:
                if not (parsed_from_time <= local_t <= parsed_to_time):
                    continue
            else:
                if not (local_t >= parsed_from_time or local_t <= parsed_to_time):
                    continue
        elif parsed_from_time:
            if not (local_t.hour == parsed_from_time.hour and local_t.minute == parsed_from_time.minute):
                continue
        elif parsed_to_time:
            if not (local_t.hour == parsed_to_time.hour and local_t.minute == parsed_to_time.minute):
                continue

        totals["transformation"] += int(log_obj.transformation_touches or 0)
        totals["team_transformation"] += int(log_obj.team_transformation_touches or 0)
        totals["klt_reading_plan"] += int(log_obj.klt_reading_plan_touches or 0)
        totals["word_editor"] += int(log_obj.word_editor_touches or 0)

    return totals


async def _ensure_offline_reports_table_ready(db: AsyncSession):
    from sqlalchemy import text
    try:
        await db.execute(text("""
            CREATE TABLE IF NOT EXISTS offline_honeycomb_reports (
                id UUID PRIMARY KEY,
                file_name VARCHAR,
                organization_name VARCHAR,
                location_display VARCHAR NOT NULL,
                location_ids VARCHAR,
                report_date VARCHAR NOT NULL,
                from_date VARCHAR,
                to_date VARCHAR,
                report_time VARCHAR NOT NULL,
                from_time VARCHAR,
                to_time VARCHAR,
                module VARCHAR NOT NULL,
                facet VARCHAR NOT NULL,
                phase VARCHAR NOT NULL,
                mother_tongue VARCHAR,
                word_editor_touches INTEGER DEFAULT 0,
                transformation_touches INTEGER DEFAULT 0,
                team_transformation_touches INTEGER DEFAULT 0,
                klt_reading_plan_touches INTEGER DEFAULT 0,
                metrics_json JSON,
                signature_hash VARCHAR UNIQUE NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """))
        await db.commit()
    except Exception:
        await db.rollback()


def _serialize_offline_report(obj, is_duplicate: bool = False, saved: bool = True, message: str = ""):
    return {
        "id": str(obj.id),
        "file_name": obj.file_name or "Honeycomb_Report.pdf",
        "organization_name": obj.organization_name or "NAME",
        "location_display": obj.location_display or "ALL LOCATIONS & STUDENTS",
        "location_ids": obj.location_ids or "",
        "report_date": obj.report_date or "",
        "from_date": obj.from_date or "",
        "to_date": obj.to_date or "",
        "report_time": obj.report_time or "",
        "from_time": obj.from_time or "",
        "to_time": obj.to_time or "",
        "module": obj.module or "MODULE 1/5",
        "facet": obj.facet or "FACET 1/12",
        "phase": obj.phase or "PHASE 1/12",
        "mother_tongue": obj.mother_tongue or "MOTHER TONGUE",
        "touch_counts": {
            "word_editor": int(obj.word_editor_touches or 0),
            "transformation": int(obj.transformation_touches or 0),
            "team_transformation": int(obj.team_transformation_touches or 0),
            "klt_reading_plan": int(obj.klt_reading_plan_touches or 0),
        },
        "metrics": obj.metrics_json or {},
        "signature_hash": obj.signature_hash,
        "created_at": obj.created_at.isoformat() if obj.created_at else None,
        "is_duplicate": is_duplicate,
        "saved": saved,
        "message": message,
    }


@router.get("/offline-reports")
async def list_offline_honeycomb_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_admin_or_higher)
):
    from app.db.models import OfflineHoneycombReport
    await _ensure_offline_reports_table_ready(db)
    res = await db.execute(select(OfflineHoneycombReport).order_by(OfflineHoneycombReport.created_at.desc()))
    items = res.scalars().all()
    return [_serialize_offline_report(item) for item in items]


@router.post("/offline-reports/upload")
async def upload_offline_honeycomb_report(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_admin_or_higher)
):
    import json
    import re
    import hashlib
    import uuid as uuid_mod
    from datetime import datetime, timezone
    from app.db.models import OfflineHoneycombReport, StudentTouchCount

    await _ensure_offline_reports_table_ready(db)

    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Uploaded PDF file is empty.")

    extracted = None
    full_text = ""
    pdf_meta = {}

    try:
        import fitz
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        pdf_meta = doc.metadata or {}
        text_parts = []
        for page in doc:
            text_parts.append(page.get_text("text") or "")
        full_text = "\n".join(text_parts)
        doc.close()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid PDF file: {str(e)}")

    # 1. Check metadata subject / keywords for embedded RLLT_HONEYCOMB_DATA JSON
    for meta_val in [pdf_meta.get("subject") or "", pdf_meta.get("keywords") or ""]:
        if "RLLT_HONEYCOMB_DATA:" in meta_val:
            raw_json = meta_val.split("RLLT_HONEYCOMB_DATA:", 1)[1].strip()
            try:
                extracted = json.loads(raw_json)
                break
            except Exception:
                pass

    # 2. Check page text or raw PDF bytes for RLLT_HONEYCOMB_JSON_START ... RLLT_HONEYCOMB_JSON_END
    if not extracted:
        m = re.search(r"RLLT_HONEYCOMB_JSON_START\s*(\{.*?\})\s*RLLT_HONEYCOMB_JSON_END", full_text, re.DOTALL)
        if m:
            try:
                extracted = json.loads(m.group(1))
            except Exception:
                pass

    if not extracted:
        try:
            raw_str = pdf_bytes.decode("latin-1", errors="ignore")
            m_raw = re.search(r"RLLT_HONEYCOMB_DATA:(\{.*?\})(?:\)|>|\n|\r)", raw_str)
            if m_raw:
                extracted = json.loads(m_raw.group(1).replace("\\(", "(").replace("\\)", ")"))
        except Exception:
            pass

    # 3. Parse structured text from PDF (e.g. Browser Print -> Save as PDF)
    if not extracted and full_text.strip():
        lines = [ln.strip() for ln in full_text.splitlines() if ln.strip()]
        joined = " | ".join(lines)

        def parse_int(val_str):
            if not val_str:
                return 0
            cleaned = re.sub(r"[^\d]", "", str(val_str))
            return int(cleaned) if cleaned else 0

        mod_m = re.search(r"(MODULE\s*\d+(?:\s*/\s*\d+)?)", joined, re.IGNORECASE)
        facet_m = re.search(r"(FACET\s*\d+(?:\s*/\s*\d+)?)", joined, re.IGNORECASE)
        phase_m = re.search(r"(PHASE\s*\d+(?:\s*/\s*\d+)?|\d+\s*PHASE)", joined, re.IGNORECASE)

        date_m = re.search(r"((?:SUN|MON|TUE|WED|THU|FRI|SAT)\s+\d{1,2}\s+[A-Z]{3}\s+\d{4}|\d{1,2}\s+[A-Z]{3}\s+\d{4}\s*-\s*\d{1,2}\s+[A-Z]{3}\s+\d{4})", joined, re.IGNORECASE)
        time_m = re.search(r"(\d{1,2}:\d{2}\s*(?:AM|PM)(?:\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM))?)", joined, re.IGNORECASE)

        loc_val = "ALL LOCATIONS & STUDENTS"
        for i, ln in enumerate(lines):
            if ln.upper() in ("LOCATION", "COUNTRY & LOCATION") and i + 1 < len(lines):
                loc_val = lines[i + 1].upper()
                break
            elif "ALL LOCATIONS" in ln.upper() or "MORE THAN ONE LOCATION" in ln.upper():
                loc_val = ln.upper()
                break

        org_val = "NAME"
        for i, ln in enumerate(lines):
            if ln.upper() == "ORGANIZATION" and i + 1 < len(lines):
                cand = lines[i + 1].strip()
                if cand.upper() not in ("LOCATION", "COUNTRY & LOCATION", "ALL LOCATIONS & STUDENTS"):
                    org_val = cand.upper()
                break

        word_count_val = 0
        wc_m = re.search(r"WORD\s*COUNT\s*[:|]?\s*([\d,]+)", joined, re.IGNORECASE)
        if wc_m:
            word_count_val = parse_int(wc_m.group(1))

        touch_matches = re.findall(r"TOUCH\s*COUNT\s*:\s*([\d,]+)", joined, re.IGNORECASE)
        trans_val = parse_int(touch_matches[0]) if len(touch_matches) >= 1 else 0
        team_val = parse_int(touch_matches[1]) if len(touch_matches) >= 2 else 0
        ttomt_val = parse_int(touch_matches[2]) if len(touch_matches) >= 3 else 0

        extracted = {
            "organization_name": org_val,
            "location_display": loc_val,
            "location_ids": "",
            "report_date": date_m.group(1).upper() if date_m else datetime.now().strftime("%a %d %b %Y").upper(),
            "report_time": time_m.group(1).upper() if time_m else datetime.now().strftime("%I:%M %p").upper(),
            "module": mod_m.group(1).upper() if mod_m else "MODULE 1/5",
            "facet": facet_m.group(1).upper() if facet_m else "FACET 1/12",
            "phase": phase_m.group(1).upper() if phase_m else "PHASE 1/12",
            "mother_tongue": "MOTHER TONGUE",
            "touch_counts": {
                "word_editor": word_count_val,
                "transformation": trans_val,
                "team_transformation": team_val,
                "klt_reading_plan": ttomt_val,
            },
            "metrics": {}
        }

    # 4. Fallback for older image-only PDFs exported before metadata/text embedding
    if not extracted:
        q = select(
            func.coalesce(func.sum(StudentTouchCount.transformation_touches), 0),
            func.coalesce(func.sum(StudentTouchCount.team_transformation_touches), 0),
            func.coalesce(func.sum(StudentTouchCount.klt_reading_plan_touches), 0),
            func.coalesce(func.sum(StudentTouchCount.word_editor_touches), 0)
        ).join(User, StudentTouchCount.user_id == User.id).where(User.role == UserRole.student)
        row = (await db.execute(q)).one()

        now_dt = datetime.now()
        days_arr = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
        months_arr = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
        cdate = pdf_meta.get("creationDate") or ""
        m_dt = re.search(r"D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})", cdate)
        if m_dt:
            try:
                now_dt = datetime(int(m_dt.group(1)), int(m_dt.group(2)), int(m_dt.group(3)), int(m_dt.group(4)), int(m_dt.group(5)))
            except Exception:
                pass

        formatted_d = f"{days_arr[now_dt.weekday()]} {now_dt.day:02d} {months_arr[now_dt.month - 1]} {now_dt.year}"
        formatted_t = now_dt.strftime("%I:%M %p").lstrip("0").upper()

        extracted = {
            "organization_name": "NAME",
            "location_display": "ALL LOCATIONS & STUDENTS",
            "location_ids": "",
            "report_date": formatted_d,
            "report_time": formatted_t,
            "module": "MODULE 1/5",
            "facet": "FACET 1/12",
            "phase": "PHASE 1/12",
            "mother_tongue": "MOTHER TONGUE",
            "touch_counts": {
                "word_editor": int(row[3] or 0),
                "transformation": int(row[0] or 0),
                "team_transformation": int(row[1] or 0),
                "klt_reading_plan": int(row[2] or 0),
            },
            "metrics": {}
        }

    org_name = str(extracted.get("organization_name") or "NAME").strip()
    loc_display = str(extracted.get("location_display") or "ALL LOCATIONS & STUDENTS").strip()
    loc_ids = str(extracted.get("location_ids") or "").strip()
    rep_date = str(extracted.get("report_date") or "").strip()
    f_date = str(extracted.get("from_date") or "").strip()
    t_date = str(extracted.get("to_date") or "").strip()
    rep_time = str(extracted.get("report_time") or "").strip()
    f_time = str(extracted.get("from_time") or "").strip()
    t_time = str(extracted.get("to_time") or "").strip()
    mod_str = str(extracted.get("module") or "MODULE 1/5").strip()
    facet_str = str(extracted.get("facet") or "FACET 1/12").strip()
    phase_str = str(extracted.get("phase") or "PHASE 1/12").strip()
    mt_str = str(extracted.get("mother_tongue") or "MOTHER TONGUE").strip()

    tc = extracted.get("touch_counts") or {}
    we_touches = int(tc.get("word_editor") or 0)
    tr_touches = int(tc.get("transformation") or 0)
    tt_touches = int(tc.get("team_transformation") or 0)
    klt_touches = int(tc.get("klt_reading_plan") or 0)
    metrics_data = extracted.get("metrics") or {}

    # Compute deterministic duplicate signature strictly based on Location, Date, and Time Duration
    sig_raw = "|".join([
        loc_display.upper(),
        rep_date.upper(),
        rep_time.upper(),
    ])
    sig_hash = hashlib.sha256(sig_raw.encode("utf-8")).hexdigest()

    # Check if a report with the same Location, Date, and Time Duration already exists in offline_honeycomb_reports
    from sqlalchemy import or_, and_
    existing_res = await db.execute(
        select(OfflineHoneycombReport).where(
            or_(
                OfflineHoneycombReport.signature_hash == sig_hash,
                and_(
                    func.upper(OfflineHoneycombReport.location_display) == loc_display.upper(),
                    func.upper(OfflineHoneycombReport.report_date) == rep_date.upper(),
                    func.upper(OfflineHoneycombReport.report_time) == rep_time.upper(),
                )
            )
        )
    )
    existing_report = existing_res.scalars().first()

    if existing_report:
        return {
            "id": str(existing_report.id),
            "file_name": file.filename or existing_report.file_name or "Honeycomb_Report.pdf",
            "organization_name": org_name,
            "location_display": loc_display,
            "location_ids": loc_ids,
            "report_date": rep_date,
            "from_date": f_date,
            "to_date": t_date,
            "report_time": rep_time,
            "from_time": f_time,
            "to_time": t_time,
            "module": mod_str,
            "facet": facet_str,
            "phase": phase_str,
            "mother_tongue": mt_str,
            "touch_counts": {
                "word_editor": we_touches,
                "transformation": tr_touches,
                "team_transformation": tt_touches,
                "klt_reading_plan": klt_touches,
            },
            "metrics": metrics_data,
            "signature_hash": existing_report.signature_hash,
            "created_at": existing_report.created_at.isoformat() if existing_report.created_at else None,
            "is_duplicate": True,
            "saved": False,
            "message": "Duplicate report (same Location, Date, and Time Duration) detected in database. Skipped saving duplicate, displaying report.",
        }

    new_report = OfflineHoneycombReport(
        id=uuid_mod.uuid4(),
        file_name=file.filename or "Honeycomb_Report.pdf",
        organization_name=org_name,
        location_display=loc_display,
        location_ids=loc_ids,
        report_date=rep_date,
        from_date=f_date,
        to_date=t_date,
        report_time=rep_time,
        from_time=f_time,
        to_time=t_time,
        module=mod_str,
        facet=facet_str,
        phase=phase_str,
        mother_tongue=mt_str,
        word_editor_touches=we_touches,
        transformation_touches=tr_touches,
        team_transformation_touches=tt_touches,
        klt_reading_plan_touches=klt_touches,
        metrics_json=metrics_data,
        signature_hash=sig_hash,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_report)
    await db.commit()
    await db.refresh(new_report)

    return _serialize_offline_report(
        new_report,
        is_duplicate=False,
        saved=True,
        message="Honeycomb report data extracted from PDF and saved to database."
    )


@router.delete("/offline-reports/{report_id}")
async def delete_offline_honeycomb_report(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(verify_admin_or_higher)
):
    from app.db.models import OfflineHoneycombReport
    await _ensure_offline_reports_table_ready(db)
    res = await db.execute(select(OfflineHoneycombReport).where(OfflineHoneycombReport.id == report_id))
    report_obj = res.scalar_one_or_none()
    if not report_obj:
        raise HTTPException(status_code=404, detail="Offline report not found")
    await db.delete(report_obj)
    await db.commit()
    return {"deleted": True, "id": str(report_id)}

@router.put("/me/touch-counts")
async def increment_my_touch_counts(payload: TouchCountUpdatePayload, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Self-service endpoint: any logged-in user can increment their OWN touch counts.
    Used by the player pages (TTomTPlayer, SMTPlayer) — no admin role required.
    MUST be defined BEFORE /{student_id}/touch-counts to avoid FastAPI route conflict."""
    from app.db.models import StudentTouchCount, StudentTouchLog
    from datetime import datetime, timezone

    user_id = current_user.id

    # Verify this user actually exists in the users table and has an assigned location
    user_check = await db.execute(select(User).where(User.id == user_id))
    user_obj = user_check.scalars().first()
    if not user_obj or user_obj.location_id is None:
        # Gracefully skip for ttom_users or users without an assigned location
        return {"transformation": 0, "team_transformation": 0, "klt_reading_plan": 0, "word_editor": 0, "skipped": True}

    await _ensure_touch_logs_ready(db)

    tc_result = await db.execute(select(StudentTouchCount).where(StudentTouchCount.user_id == user_id))
    existing = tc_result.scalars().first()

    if not existing:
        try:
            new_tc = StudentTouchCount(
                user_id=user_id,
                transformation_touches=payload.transformation,
                team_transformation_touches=payload.team_transformation,
                klt_reading_plan_touches=payload.klt_reading_plan,
                word_editor_touches=payload.word_editor,
                updated_at=datetime.now(timezone.utc)
            )
            db.add(new_tc)
            await db.commit()
        except Exception:
            await db.rollback()
            return {"transformation": 0, "team_transformation": 0, "klt_reading_plan": 0, "word_editor": 0}
    else:
        await db.execute(
            update(StudentTouchCount)
            .where(StudentTouchCount.user_id == user_id)
            .values(
                transformation_touches=func.coalesce(StudentTouchCount.transformation_touches, 0) + payload.transformation,
                team_transformation_touches=func.coalesce(StudentTouchCount.team_transformation_touches, 0) + payload.team_transformation,
                klt_reading_plan_touches=func.coalesce(StudentTouchCount.klt_reading_plan_touches, 0) + payload.klt_reading_plan,
                word_editor_touches=func.coalesce(StudentTouchCount.word_editor_touches, 0) + payload.word_editor,
                updated_at=datetime.now(timezone.utc)
            )
        )
        await db.commit()

    # Record timestamped & location-tagged touch event in student_touch_logs
    try:
        db.add(StudentTouchLog(
            user_id=user_id,
            location_id=user_obj.location_id,
            transformation_touches=payload.transformation,
            team_transformation_touches=payload.team_transformation,
            klt_reading_plan_touches=payload.klt_reading_plan,
            word_editor_touches=payload.word_editor,
            created_at=datetime.now(timezone.utc)
        ))
        await db.commit()
    except Exception:
        await db.rollback()

    db.expire_all()
    fresh_result = await db.execute(select(StudentTouchCount).where(StudentTouchCount.user_id == user_id))
    fresh_tc = fresh_result.scalars().first()

    return {
        "transformation": fresh_tc.transformation_touches if fresh_tc and fresh_tc.transformation_touches else 0,
        "team_transformation": fresh_tc.team_transformation_touches if fresh_tc and fresh_tc.team_transformation_touches else 0,
        "klt_reading_plan": fresh_tc.klt_reading_plan_touches if fresh_tc and fresh_tc.klt_reading_plan_touches else 0,
        "word_editor": fresh_tc.word_editor_touches if fresh_tc and fresh_tc.word_editor_touches else 0
    }

@router.put("/{student_id}/touch-counts", response_model=StudentResponse)
async def update_student_touch_counts(student_id: UUID, payload: TouchCountUpdatePayload, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    from app.db.models import StudentTouchCount, StudentTouchLog
    from datetime import datetime, timezone

    # 1. Verify the student exists
    result = await db.execute(select(User).where((User.id == student_id) & (User.role == UserRole.student)))
    user = result.scalars().first()
    if not user:
         raise HTTPException(status_code=404, detail="Student not found")

    await _ensure_touch_logs_ready(db)

    # 2. Check if a touch count row exists
    tc_result = await db.execute(select(StudentTouchCount).where(StudentTouchCount.user_id == student_id))
    existing = tc_result.scalars().first()

    if not existing:
        # First time: INSERT a new row with the payload values
        new_tc = StudentTouchCount(
            user_id=student_id,
            transformation_touches=payload.transformation,
            team_transformation_touches=payload.team_transformation,
            klt_reading_plan_touches=payload.klt_reading_plan,
            word_editor_touches=payload.word_editor,
            updated_at=datetime.now(timezone.utc)
        )
        db.add(new_tc)
    else:
        # Subsequent times: atomic SQL UPDATE directly in the database
        await db.execute(
            update(StudentTouchCount)
            .where(StudentTouchCount.user_id == student_id)
            .values(
                transformation_touches=func.coalesce(StudentTouchCount.transformation_touches, 0) + payload.transformation,
                team_transformation_touches=func.coalesce(StudentTouchCount.team_transformation_touches, 0) + payload.team_transformation,
                klt_reading_plan_touches=func.coalesce(StudentTouchCount.klt_reading_plan_touches, 0) + payload.klt_reading_plan,
                word_editor_touches=func.coalesce(StudentTouchCount.word_editor_touches, 0) + payload.word_editor,
                updated_at=datetime.now(timezone.utc)
            )
        )

    await db.commit()

    try:
        db.add(StudentTouchLog(
            user_id=student_id,
            location_id=user.location_id,
            transformation_touches=payload.transformation,
            team_transformation_touches=payload.team_transformation,
            klt_reading_plan_touches=payload.klt_reading_plan,
            word_editor_touches=payload.word_editor,
            created_at=datetime.now(timezone.utc)
        ))
        await db.commit()
    except Exception:
        await db.rollback()

    # 3. CRITICAL FIX: Expire all cached ORM objects, then re-SELECT fresh from DB.
    #    After a raw SQL UPDATE, the old ORM object is stale. db.refresh() on it
    #    can return cached/old values. We must do a fresh SELECT instead.
    db.expire_all()
    fresh_result = await db.execute(select(StudentTouchCount).where(StudentTouchCount.user_id == student_id))
    fresh_tc = fresh_result.scalars().first()

    t_val = fresh_tc.transformation_touches if fresh_tc and fresh_tc.transformation_touches else 0
    tt_val = fresh_tc.team_transformation_touches if fresh_tc and fresh_tc.team_transformation_touches else 0
    klt_val = fresh_tc.klt_reading_plan_touches if fresh_tc and fresh_tc.klt_reading_plan_touches else 0
    we_val = fresh_tc.word_editor_touches if fresh_tc and fresh_tc.word_editor_touches else 0

    user_dict = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "mobile_number": user.mobile_number,
        "address": user.address,
        "dob": user.dob,
        "gender": user.gender,
        "category": user.category,
        "stage": user.stage,
        "enrollment_number": user.enrollment_number,
        "is_active": user.is_active,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "assessment_status": user.assessment_status,
        "assessment_marks": user.assessment_marks,
        "activation_email_sent": user.activation_email_sent,
        "created_at": user.created_at,
        "touch_counts": {
            "transformation": t_val,
            "team_transformation": tt_val,
            "klt_reading_plan": klt_val,
            "word_editor": we_val
        }
    }
    return user_dict

@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(student_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(verify_admin_or_higher)):
    result = await db.execute(select(User).where((User.id == student_id) & (User.role == UserRole.student)))
    user = result.scalars().first()
    if not user:
         raise HTTPException(status_code=404, detail="Student not found")
    
    from app.db.models import AssessmentResult, Media, PasswordReset, Assignment, WordDocument, ClassroomAssignment, ClassroomSubmission, ClassroomProgress
    
    # Delete related records to avoid ForeignKeyViolation
    await db.execute(delete(AssessmentResult).where(AssessmentResult.user_id == student_id))
    await db.execute(delete(Media).where(Media.owner_id == student_id))
    await db.execute(delete(PasswordReset).where(PasswordReset.user_id == student_id))
    await db.execute(delete(Assignment).where(Assignment.user_id == student_id))
    await db.execute(delete(WordDocument).where(WordDocument.user_id == student_id))
    await db.execute(delete(ClassroomAssignment).where(ClassroomAssignment.student_id == student_id))
    await db.execute(delete(ClassroomSubmission).where(ClassroomSubmission.student_id == student_id))
    await db.execute(delete(ClassroomProgress).where(ClassroomProgress.student_id == student_id))
    
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
