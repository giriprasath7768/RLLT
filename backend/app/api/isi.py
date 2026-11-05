import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text

from app.db.database import get_db
from app.db.models import User, ISIRecord, Location, Admin, Leader
from app.api.auth import get_current_user, _resolve_user_location_and_name

router = APIRouter()

_isi_table_ready = False
_ttomt_table_ready = False


async def _resolve_user_full_details(db: AsyncSession, user: Optional[User], fallback_role: str = "student"):
    if not user:
        return {
            "display_name": "User",
            "role": fallback_role,
            "location_id": None,
            "location_name": "Global / Unassigned",
            "continent": None,
            "country": None,
            "city": None,
        }
    role_name = user.role.value if hasattr(user.role, "value") else str(user.role)
    if role_name == "ttom_user":
        from app.db.models import TTOMUser
        ttom_res = await db.execute(select(TTOMUser).where(TTOMUser.id == user.id))
        ttom_u = ttom_res.scalars().first()
        display_name = getattr(ttom_u, "name", None) or "T-Tom-T User"
        loc_id = getattr(ttom_u, "location_id", None)
    else:
        display_name, loc_id, _ = await _resolve_user_location_and_name(db, user, role_name)

    continent = None
    country = None
    city = None
    location_name = "Global / All Locations" if role_name == "super_admin" else "Unassigned"

    if loc_id:
        loc_res = await db.execute(select(Location).where(Location.id == loc_id))
        loc = loc_res.scalars().first()
        if loc:
            continent = loc.continent
            country = loc.country
            city = loc.city
            parts = [p for p in [loc.continent, loc.country, loc.city] if p]
            location_name = " • ".join(parts)

    return {
        "display_name": display_name,
        "role": role_name,
        "location_id": str(loc_id) if loc_id else None,
        "location_name": location_name,
        "continent": continent,
        "country": country,
        "city": city,
    }


async def _seed_other_roles_if_needed(db: AsyncSession):
    """Ensure isi_records has entries across admin, leader, and student roles so role filtering works out-of-the-box."""
    try:
        role_check = await db.execute(text("SELECT DISTINCT role FROM isi_records"))
        existing_roles = {row[0] for row in role_check.fetchall() if row[0]}

        target_roles = ["admin", "leader", "student"]
        missing_roles = [r for r in target_roles if r not in existing_roles]
        if not missing_roles:
            return

        users_res = await db.execute(select(User))
        all_users = users_res.scalars().all()

        role_samples = {
            "admin": [
                {"module": 1, "facet": 2, "phase": 1, "day": 6, "daily": 4, "able": 2, "art": "1m", "color": "#00AEFF"},
                {"module": 2, "facet": 1, "phase": 2, "day": 12, "daily": 6, "able": 3, "art": "2m", "color": "#FFEB00"},
                {"module": 3, "facet": 3, "phase": 1, "day": 18, "daily": 5, "able": 2, "art": "1m", "color": "#1ED700"},
            ],
            "leader": [
                {"module": 1, "facet": 1, "phase": 2, "day": 10, "daily": 5, "able": 3, "art": "1m", "color": "#FF6C00"},
                {"module": 2, "facet": 4, "phase": 3, "day": 15, "daily": 7, "able": 4, "art": "2m", "color": "#00AEFF"},
                {"module": 4, "facet": 2, "phase": 1, "day": 20, "daily": 4, "able": 2, "art": "1m", "color": "#1B00A6"},
            ],
            "student": [
                {"module": 1, "facet": 1, "phase": 1, "day": 6, "daily": 8, "able": 4, "art": "1m", "color": "#00AEFF"},
                {"module": 2, "facet": 2, "phase": 1, "day": 9, "daily": 6, "able": 3, "art": "1m", "color": "#1ED700"},
                {"module": 3, "facet": 1, "phase": 2, "day": 14, "daily": 5, "able": 2, "art": "2m", "color": "#FFEB00"},
                {"module": 4, "facet": 3, "phase": 2, "day": 21, "daily": 4, "able": 2, "art": "2m", "color": "#FF002B"},
                {"module": 5, "facet": 1, "phase": 3, "day": 25, "daily": 3, "able": 1, "art": "3m", "color": "#FF6C00"},
            ],
        }

        for role_key in missing_roles:
            matching_users = [
                u for u in all_users
                if (u.role.value if hasattr(u.role, "value") else str(u.role)) == role_key
            ]
            if not matching_users:
                continue

            samples = role_samples.get(role_key, [])
            for idx, sample in enumerate(samples):
                u = matching_users[idx % len(matching_users)]
                display_name, _, _ = await _resolve_user_location_and_name(db, u, role_key)
                cat = getattr(u, "category", None)
                if role_key == "student" and not cat:
                    cat = "Category A"
                banner = f"RLLT-MDL{sample['module']} FCT{sample['facet']} PHS{sample['phase']} DAY {sample['day']}"
                rec = ISIRecord(
                    id=uuid.uuid4(),
                    user_id=u.id,
                    username=display_name,
                    role=role_key,
                    category=cat,
                    module=sample["module"],
                    facet=sample["facet"],
                    phase=sample["phase"],
                    day=sample["day"],
                    phase_days=30,
                    art=sample["art"],
                    daily_isi_count=sample["daily"],
                    able_again_count=sample["able"],
                    color_code=sample["color"],
                    theme_color=sample["color"],
                    banner_text=banner,
                )
                db.add(rec)

        await db.commit()
    except Exception:
        await db.rollback()


async def _ensure_isi_table_ready(db: AsyncSession):
    global _isi_table_ready
    if _isi_table_ready:
        return
    try:
        await db.execute(text("""
            CREATE TABLE IF NOT EXISTS isi_records (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                username VARCHAR NOT NULL,
                role VARCHAR NOT NULL,
                category VARCHAR,
                module INTEGER NOT NULL,
                facet INTEGER NOT NULL,
                phase INTEGER NOT NULL,
                day INTEGER NOT NULL,
                phase_days INTEGER,
                art VARCHAR,
                daily_isi_count INTEGER NOT NULL DEFAULT 0,
                able_again_count INTEGER NOT NULL DEFAULT 0,
                color_code VARCHAR,
                theme_color VARCHAR,
                banner_text VARCHAR,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """))
        await db.execute(text("""
            CREATE TABLE IF NOT EXISTS isi_phase_locks (
                user_id UUID PRIMARY KEY,
                module INTEGER NOT NULL,
                facet INTEGER NOT NULL,
                phase INTEGER NOT NULL,
                phase_days INTEGER NOT NULL DEFAULT 30,
                submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """))
        await db.execute(text("ALTER TABLE isi_records ADD COLUMN IF NOT EXISTS color_code VARCHAR;"))
        await db.execute(text("UPDATE isi_records SET color_code = theme_color WHERE color_code IS NULL AND theme_color IS NOT NULL;"))
        await db.commit()
        await _seed_other_roles_if_needed(db)
        _isi_table_ready = True
    except Exception:
        await db.rollback()


class ISILockPayload(BaseModel):
    module: int
    facet: int
    phase: int
    phase_days: int = 30


@router.get("/lock", response_model=dict)
async def get_isi_phase_lock(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await _ensure_isi_table_ready(db)
    from datetime import datetime, timezone
    res = await db.execute(
        text("SELECT module, facet, phase, phase_days, submitted_at FROM isi_phase_locks WHERE user_id = :uid"),
        {"uid": current_user.id}
    )
    row = res.mappings().first()
    if not row:
        return {"locked": False}

    sub_at = row["submitted_at"]
    now_utc = datetime.now(timezone.utc)
    if sub_at.tzinfo is None:
        sub_at = sub_at.replace(tzinfo=timezone.utc)

    elapsed_seconds = max(0.0, (now_utc - sub_at).total_seconds())
    elapsed_days = int(elapsed_seconds // 86400)
    total_days = int(row["phase_days"] or 30)

    if elapsed_days >= total_days:
        return {"locked": False, "expired": True}

    current_day = min(total_days, elapsed_days + 1)
    return {
        "locked": True,
        "module": row["module"],
        "facet": row["facet"],
        "phase": row["phase"],
        "phase_days": total_days,
        "current_day": current_day,
        "submitted_at": sub_at.isoformat(),
    }


@router.post("/lock", response_model=dict)
async def save_isi_phase_lock(
    payload: ISILockPayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await _ensure_isi_table_ready(db)
    from datetime import datetime, timezone
    now_utc = datetime.now(timezone.utc)
    await db.execute(
        text("""
            INSERT INTO isi_phase_locks (user_id, module, facet, phase, phase_days, submitted_at)
            VALUES (:uid, :module, :facet, :phase, :phase_days, :submitted_at)
            ON CONFLICT (user_id) DO UPDATE SET
                module = EXCLUDED.module,
                facet = EXCLUDED.facet,
                phase = EXCLUDED.phase,
                phase_days = EXCLUDED.phase_days,
                submitted_at = EXCLUDED.submitted_at
        """),
        {
            "uid": current_user.id,
            "module": payload.module,
            "facet": payload.facet,
            "phase": payload.phase,
            "phase_days": payload.phase_days or 30,
            "submitted_at": now_utc,
        }
    )
    await db.commit()
    return {
        "locked": True,
        "module": payload.module,
        "facet": payload.facet,
        "phase": payload.phase,
        "phase_days": payload.phase_days or 30,
        "current_day": 1,
        "submitted_at": now_utc.isoformat(),
    }


@router.delete("/lock", response_model=dict)
async def clear_isi_phase_lock(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await _ensure_isi_table_ready(db)
    await db.execute(
        text("DELETE FROM isi_phase_locks WHERE user_id = :uid"),
        {"uid": current_user.id}
    )
    await db.commit()
    return {"locked": False}


class ISISavePayload(BaseModel):
    module: int
    facet: int
    phase: int
    day: int
    phase_days: Optional[int] = 30
    art: Optional[str] = "1m"
    daily_isi_count: int = 0
    able_again_count: int = 0
    color_code: Optional[str] = "#00b4ff"
    theme_color: Optional[str] = "#00b4ff"
    banner_text: Optional[str] = None


@router.get("/viewer-context", response_model=dict)
async def get_isi_viewer_context(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await _ensure_isi_table_ready(db)
    details = await _resolve_user_full_details(db, current_user)
    role_name = details["role"]
    student_category = getattr(current_user, "category", None)
    return {
        "user_id": str(current_user.id),
        "username": details["display_name"],
        "role": role_name,
        "category": student_category,
        "location_id": details["location_id"],
        "location_name": details["location_name"],
        "continent": details["continent"],
        "country": details["country"],
        "city": details["city"],
        "can_view_all": role_name in ("super_admin", "admin"),
        "is_leader": role_name == "leader",
        "is_student": role_name == "student",
    }


@router.post("", response_model=dict)
@router.post("/save", response_model=dict)
async def save_isi_record(
    payload: ISISavePayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await _ensure_isi_table_ready(db)

    details = await _resolve_user_full_details(db, current_user)
    role_name = details["role"]
    display_name = details["display_name"]

    student_category = None
    if role_name == "student":
        student_category = getattr(current_user, "category", None) or "Student"
    else:
        student_category = getattr(current_user, "category", None)

    computed_banner = payload.banner_text or f"RLLT-MDL{payload.module} FCT{payload.facet} PHS{payload.phase} DAY {payload.day}"
    sticker_color = (payload.color_code or payload.theme_color or "#00b4ff").upper()

    new_record = ISIRecord(
        id=uuid.uuid4(),
        user_id=current_user.id,
        username=display_name,
        role=role_name,
        category=student_category,
        module=payload.module,
        facet=payload.facet,
        phase=payload.phase,
        day=payload.day,
        phase_days=payload.phase_days,
        art=payload.art,
        daily_isi_count=payload.daily_isi_count,
        able_again_count=payload.able_again_count,
        color_code=sticker_color,
        theme_color=sticker_color,
        banner_text=computed_banner
    )

    db.add(new_record)
    await db.commit()
    await db.refresh(new_record)

    return {
        "status": "success",
        "message": "ISI phase details saved successfully",
        "record": {
            "id": str(new_record.id),
            "user_id": str(new_record.user_id),
            "username": new_record.username,
            "role": new_record.role,
            "category": new_record.category,
            "module": new_record.module,
            "facet": new_record.facet,
            "phase": new_record.phase,
            "day": new_record.day,
            "phase_days": new_record.phase_days,
            "art": new_record.art,
            "daily_isi_count": new_record.daily_isi_count,
            "able_again_count": new_record.able_again_count,
            "color_code": new_record.color_code or new_record.theme_color,
            "theme_color": new_record.theme_color or new_record.color_code,
            "banner_text": new_record.banner_text,
            "location_id": details["location_id"],
            "location_name": details["location_name"],
            "continent": details["continent"],
            "country": details["country"],
            "city": details["city"],
            "created_at": new_record.created_at.isoformat() if new_record.created_at else None
        }
    }


@router.get("/me", response_model=dict)
async def get_my_isi_records(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await _ensure_isi_table_ready(db)

    details = await _resolve_user_full_details(db, current_user)
    role_name = details["role"]
    display_name = details["display_name"]
    student_category = getattr(current_user, "category", None) if role_name == "student" else None

    result = await db.execute(
        select(ISIRecord)
        .where(ISIRecord.user_id == current_user.id)
        .order_by(ISIRecord.created_at.desc())
        .limit(50)
    )
    records = result.scalars().all()

    return {
        "user": {
            "user_id": str(current_user.id),
            "username": display_name,
            "role": role_name,
            "category": student_category,
            "location_id": details["location_id"],
            "location_name": details["location_name"],
        },
        "records": [
            {
                "id": str(r.id),
                "user_id": str(r.user_id),
                "username": r.username,
                "role": r.role,
                "category": r.category,
                "module": r.module,
                "facet": r.facet,
                "phase": r.phase,
                "day": r.day,
                "phase_days": r.phase_days,
                "art": r.art,
                "daily_isi_count": r.daily_isi_count,
                "able_again_count": r.able_again_count,
                "color_code": (r.color_code or r.theme_color or "#00B4FF").upper(),
                "theme_color": (r.theme_color or r.color_code or "#00B4FF").upper(),
                "banner_text": r.banner_text,
                "location_id": details["location_id"],
                "location_name": details["location_name"],
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in records
        ]
    }


@router.get("", response_model=List[dict])
async def list_all_isi_records(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await _ensure_isi_table_ready(db)

    viewer_details = await _resolve_user_full_details(db, current_user)
    viewer_role = viewer_details["role"]
    viewer_loc_id = viewer_details["location_id"]

    # Fetch users map to resolve location details for each record
    users_res = await db.execute(select(User))
    users_by_id = {u.id: u for u in users_res.scalars().all()}

    user_loc_cache = {}
    for uid, u_obj in users_by_id.items():
        user_loc_cache[uid] = await _resolve_user_full_details(db, u_obj)

    query = select(ISIRecord).order_by(ISIRecord.created_at.desc()).limit(300)
    if viewer_role == "student":
        # Students can ONLY view their own student reports
        query = (
            select(ISIRecord)
            .where(ISIRecord.user_id == current_user.id)
            .order_by(ISIRecord.created_at.desc())
            .limit(300)
        )

    result = await db.execute(query)
    records = result.scalars().all()

    output = []
    for r in records:
        u_info = user_loc_cache.get(r.user_id) or {
            "location_id": None,
            "location_name": "Global / All Locations" if r.role == "super_admin" else "Unassigned",
            "continent": None,
            "country": None,
            "city": None,
        }

        # For Leaders: only include records belonging to their allocated location (or their own records)
        if viewer_role == "leader":
            if viewer_loc_id and u_info["location_id"] != viewer_loc_id and r.user_id != current_user.id:
                continue

        output.append({
            "id": str(r.id),
            "user_id": str(r.user_id),
            "username": r.username,
            "role": r.role,
            "category": r.category,
            "module": r.module,
            "facet": r.facet,
            "phase": r.phase,
            "day": r.day,
            "phase_days": r.phase_days,
            "art": r.art or "1m",
            "daily_isi_count": r.daily_isi_count,
            "able_again_count": r.able_again_count,
            "color_code": (r.color_code or r.theme_color or "#00B4FF").upper(),
            "theme_color": (r.theme_color or r.color_code or "#00B4FF").upper(),
            "banner_text": r.banner_text,
            "location_id": u_info["location_id"],
            "location_name": u_info["location_name"],
            "continent": u_info["continent"],
            "country": u_info["country"],
            "city": u_info["city"],
            "created_at": r.created_at.isoformat() if r.created_at else None
        })

    return output


# =========================================================================
# TTomT Report Endpoints (Triggered by clicking 👍 in TTomTPlayer)
# =========================================================================

async def _seed_ttomt_roles_if_needed(db: AsyncSession):
    """Ensure ttomt_report_records has initial sample entries across roles if empty."""
    try:
        role_check = await db.execute(text("SELECT DISTINCT role FROM ttomt_report_records"))
        existing_roles = {row[0] for row in role_check.fetchall() if row[0]}

        target_roles = ["admin", "leader", "student"]
        missing_roles = [r for r in target_roles if r not in existing_roles]
        if not missing_roles:
            return

        users_res = await db.execute(select(User))
        all_users = users_res.scalars().all()

        role_samples = {
            "admin": [
                {"module": 1, "facet": 1, "phase": 1, "day": 1, "phase_days": 30, "art": "1H 20m", "tracks": "Proverbs 1, Psalms 1-5, Genesis 1-10", "color": "#00C0FF"},
                {"module": 2, "facet": 2, "phase": 1, "day": 5, "phase_days": 30, "art": "1H 21m", "tracks": "Proverbs 5, Psalms 18, Exodus 23-30", "color": "#00A638"},
            ],
            "leader": [
                {"module": 1, "facet": 2, "phase": 1, "day": 3, "phase_days": 30, "art": "1H 20m", "tracks": "Proverbs 3, Psalms 10-13, Genesis 37-43", "color": "#3340CD"},
                {"module": 3, "facet": 1, "phase": 2, "day": 8, "phase_days": 40, "art": "1H 19m", "tracks": "Proverbs 8, Psalms 25-28, Numbers 4-11", "color": "#FE6D01"},
            ],
            "student": [
                {"module": 1, "facet": 1, "phase": 1, "day": 1, "phase_days": 30, "art": "1H 20m", "tracks": "Proverbs 1, Psalms 1-5, Genesis 1-10", "color": "#00C0FF"},
                {"module": 2, "facet": 2, "phase": 1, "day": 2, "phase_days": 30, "art": "1H 21m", "tracks": "Proverbs 2, Psalms 6-9, Genesis 22-28", "color": "#00A638"},
                {"module": 3, "facet": 1, "phase": 1, "day": 4, "phase_days": 30, "art": "1H 26m", "tracks": "Proverbs 4, Psalms 14-17, Exodus 4-12", "color": "#BB43B1"},
            ],
        }

        for role_key in missing_roles:
            matching_users = [
                u for u in all_users
                if (u.role.value if hasattr(u.role, "value") else str(u.role)) == role_key
            ]
            if not matching_users:
                continue

            samples = role_samples.get(role_key, [])
            for idx, sample in enumerate(samples):
                u = matching_users[idx % len(matching_users)]
                display_name, _, _ = await _resolve_user_location_and_name(db, u, role_key)
                cat = getattr(u, "category", None)
                if role_key == "student" and not cat:
                    cat = "Category A"
                day_str = str(sample["day"]).zfill(2)
                banner = f"RLLT-MDL{sample['module']} FCT{sample['facet']} PHS{sample['phase']} DAY {day_str} : 👍"
                await db.execute(
                    text("""
                        INSERT INTO ttomt_report_records (
                            id, user_id, username, role, category,
                            module, facet, phase, day, phase_days,
                            art, tracks, filter_type, thumbs_up_count,
                            color_code, theme_color, banner_text
                        ) VALUES (
                            :id, :user_id, :username, :role, :category,
                            :module, :facet, :phase, :day, :phase_days,
                            :art, :tracks, :filter_type, :thumbs_up_count,
                            :color_code, :theme_color, :banner_text
                        )
                    """),
                    {
                        "id": uuid.uuid4(),
                        "user_id": u.id,
                        "username": display_name,
                        "role": role_key,
                        "category": cat,
                        "module": sample["module"],
                        "facet": sample["facet"],
                        "phase": sample["phase"],
                        "day": sample["day"],
                        "phase_days": sample["phase_days"],
                        "art": sample["art"],
                        "tracks": sample["tracks"],
                        "filter_type": "main",
                        "thumbs_up_count": 1,
                        "color_code": sample["color"],
                        "theme_color": sample["color"],
                        "banner_text": banner,
                    }
                )

        await db.commit()
    except Exception:
        await db.rollback()


async def _ensure_ttomt_table_ready(db: AsyncSession):
    global _ttomt_table_ready
    if _ttomt_table_ready:
        return
    try:
        await db.execute(text("""
            CREATE TABLE IF NOT EXISTS ttomt_report_records (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL,
                username VARCHAR NOT NULL,
                role VARCHAR NOT NULL,
                category VARCHAR,
                module INTEGER NOT NULL,
                facet INTEGER NOT NULL,
                phase INTEGER NOT NULL,
                day INTEGER NOT NULL,
                phase_days INTEGER,
                art VARCHAR,
                tracks VARCHAR,
                filter_type VARCHAR,
                thumbs_up_count INTEGER NOT NULL DEFAULT 1,
                color_code VARCHAR,
                theme_color VARCHAR,
                banner_text VARCHAR,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """))
        await db.commit()
        await _seed_ttomt_roles_if_needed(db)
        _ttomt_table_ready = True
    except Exception:
        await db.rollback()


class TTomTReportSavePayload(BaseModel):
    module: int = 1
    facet: int = 1
    phase: int = 1
    day: int = 1
    phase_days: Optional[int] = 30
    art: Optional[str] = "0"
    tracks: Optional[str] = ""
    filter_type: Optional[str] = "main"
    thumbs_up_count: int = 1
    color_code: Optional[str] = "#37475A"
    theme_color: Optional[str] = "#37475A"
    banner_text: Optional[str] = None


@router.get("/ttomt/viewer-context", response_model=dict)
async def get_ttomt_viewer_context(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await _ensure_ttomt_table_ready(db)
    details = await _resolve_user_full_details(db, current_user)
    role_name = details["role"]
    student_category = getattr(current_user, "category", None)
    return {
        "user_id": str(current_user.id),
        "username": details["display_name"],
        "role": role_name,
        "category": student_category,
        "location_id": details["location_id"],
        "location_name": details["location_name"],
        "continent": details["continent"],
        "country": details["country"],
        "city": details["city"],
        "can_view_all": role_name in ("super_admin", "admin"),
        "is_leader": role_name == "leader",
        "is_student": role_name == "student",
    }


@router.post("/ttomt", response_model=dict)
@router.post("/ttomt/save", response_model=dict)
async def save_ttomt_report_record(
    payload: TTomTReportSavePayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await _ensure_ttomt_table_ready(db)

    details = await _resolve_user_full_details(db, current_user)
    role_name = details["role"]
    display_name = details["display_name"]

    student_category = None
    if role_name == "student":
        student_category = getattr(current_user, "category", None) or "Student"
    elif role_name == "ttom_user":
        student_category = "TTOM User"
    else:
        student_category = getattr(current_user, "category", None)

    computed_banner = payload.banner_text or f"RLLT-MDL{payload.module} FCT{payload.facet} PHS{payload.phase} DAY {payload.day} DONE 😊 😊 😊 😊 😊 ✅"
    raw_color = (payload.color_code or payload.theme_color or "#37475A").strip()
    sticker_color = raw_color.upper() if raw_color.startswith("#") else "#37475A"

    rec_id = uuid.uuid4()
    await db.execute(
        text("""
            INSERT INTO ttomt_report_records (
                id, user_id, username, role, category,
                module, facet, phase, day, phase_days,
                art, tracks, filter_type, thumbs_up_count,
                color_code, theme_color, banner_text
            ) VALUES (
                :id, :user_id, :username, :role, :category,
                :module, :facet, :phase, :day, :phase_days,
                :art, :tracks, :filter_type, :thumbs_up_count,
                :color_code, :theme_color, :banner_text
            )
        """),
        {
            "id": rec_id,
            "user_id": current_user.id,
            "username": display_name,
            "role": role_name,
            "category": student_category,
            "module": payload.module,
            "facet": payload.facet,
            "phase": payload.phase,
            "day": payload.day,
            "phase_days": payload.phase_days,
            "art": payload.art or "0",
            "tracks": payload.tracks or "",
            "filter_type": payload.filter_type or "main",
            "thumbs_up_count": payload.thumbs_up_count or 1,
            "color_code": sticker_color,
            "theme_color": sticker_color,
            "banner_text": computed_banner,
        }
    )
    await db.commit()

    from datetime import datetime, timezone
    now_iso = datetime.now(timezone.utc).isoformat()

    return {
        "status": "success",
        "message": f"TTomT Day {day_str} 👍 saved to TTomT Report",
        "record": {
            "id": str(rec_id),
            "user_id": str(current_user.id),
            "username": display_name,
            "role": role_name,
            "category": student_category,
            "module": payload.module,
            "facet": payload.facet,
            "phase": payload.phase,
            "day": payload.day,
            "phase_days": payload.phase_days,
            "art": payload.art or "0",
            "tracks": payload.tracks or "",
            "filter_type": payload.filter_type or "main",
            "thumbs_up_count": payload.thumbs_up_count or 1,
            "daily_isi_count": payload.thumbs_up_count or 1,
            "able_again_count": payload.phase_days or 30,
            "color_code": sticker_color,
            "theme_color": sticker_color,
            "banner_text": computed_banner,
            "location_id": details["location_id"],
            "location_name": details["location_name"],
            "continent": details["continent"],
            "country": details["country"],
            "city": details["city"],
            "created_at": now_iso,
        }
    }


@router.get("/ttomt", response_model=List[dict])
async def list_all_ttomt_records(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await _ensure_ttomt_table_ready(db)

    viewer_details = await _resolve_user_full_details(db, current_user)
    viewer_role = viewer_details["role"]
    viewer_loc_id = viewer_details["location_id"]

    users_res = await db.execute(select(User))
    users_by_id = {u.id: u for u in users_res.scalars().all()}

    user_loc_cache = {}
    for uid, u_obj in users_by_id.items():
        user_loc_cache[uid] = await _resolve_user_full_details(db, u_obj)

    try:
        from app.db.models import TTOMUser
        ttom_res = await db.execute(select(TTOMUser))
        for tu in ttom_res.scalars().all():
            class _MockT:
                id = tu.id
                role = "ttom_user"
            user_loc_cache[tu.id] = await _resolve_user_full_details(db, _MockT(), "ttom_user")
    except Exception:
        pass

    if viewer_role in ("student", "ttom_user"):
        rows_res = await db.execute(
            text("""
                SELECT id, user_id, username, role, category,
                       module, facet, phase, day, phase_days,
                       art, tracks, filter_type, thumbs_up_count,
                       color_code, theme_color, banner_text, created_at
                FROM ttomt_report_records
                WHERE user_id = :uid
                ORDER BY created_at DESC
                LIMIT 300
            """),
            {"uid": current_user.id}
        )
    else:
        rows_res = await db.execute(
            text("""
                SELECT id, user_id, username, role, category,
                       module, facet, phase, day, phase_days,
                       art, tracks, filter_type, thumbs_up_count,
                       color_code, theme_color, banner_text, created_at
                FROM ttomt_report_records
                ORDER BY created_at DESC
                LIMIT 300
            """)
        )

    rows = rows_res.mappings().all()
    output = []
    for r in rows:
        uid = r["user_id"]
        u_info = user_loc_cache.get(uid) or {
            "location_id": None,
            "location_name": "Global / All Locations" if r["role"] == "super_admin" else "Unassigned",
            "continent": None,
            "country": None,
            "city": None,
        }

        if viewer_role == "leader":
            if viewer_loc_id and u_info["location_id"] != viewer_loc_id and uid != current_user.id:
                continue

        c_at = r["created_at"]
        created_iso = c_at.isoformat() if hasattr(c_at, "isoformat") else (str(c_at) if c_at else None)
        color_hex = (r["color_code"] or r["theme_color"] or "#00C0FF").upper()
        if not color_hex.startswith("#"):
            color_hex = "#00C0FF"

        output.append({
            "id": str(r["id"]),
            "user_id": str(uid),
            "username": r["username"],
            "role": r["role"],
            "category": r["category"],
            "module": r["module"],
            "facet": r["facet"],
            "phase": r["phase"],
            "day": r["day"],
            "phase_days": r["phase_days"] or 30,
            "art": r["art"] or "0",
            "tracks": r["tracks"] or "",
            "filter_type": r["filter_type"] or "main",
            "thumbs_up_count": r["thumbs_up_count"] or 1,
            "daily_isi_count": r["thumbs_up_count"] or 1,
            "able_again_count": r["phase_days"] or 30,
            "color_code": color_hex,
            "theme_color": color_hex,
            "banner_text": r["banner_text"],
            "location_id": u_info["location_id"],
            "location_name": u_info["location_name"],
            "continent": u_info["continent"],
            "country": u_info["country"],
            "city": u_info["city"],
            "created_at": created_iso,
        })

    return output

