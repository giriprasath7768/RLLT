from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, text
from sqlalchemy.dialects.postgresql import insert
from datetime import datetime
import uuid
import os
import json
import shutil
from typing import Optional

from app.db.database import get_db
from app.db.models import ChartMapping, ReadingPlanChartMapping, SevenTNTChartMapping, SevenTNTDayCycleChartMapping, User
from app.api.auth import get_current_user_optional, _resolve_user_location_and_name

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

import re

_OT_BOOKS = {
    "GEN","EXO","LEV","NUM","DEU","JOS","JDG","RUT","1SA","2SA","1KI","2KI","1CH","2CH",
    "EZR","NEH","EST","JOB","ECC","SOS","ISA","JER","LAM","EZE","DAN","HOS","JOE","AMO",
    "OBA","JON","MIC","NAH","HAB","ZEP","HAG","ZEC","MAL"
}
_NT_BOOKS = {
    "MAT","MAR","LUK","JOH","ACT","ROM","1CO","2CO","GAL","EPH","PHP","COL","1TH","2TH",
    "1TI","2TI","TIT","PHM","HEB","JAM","1PE","2PE","1JN","2JN","3JN","JUD","REV"
}


def _parse_art_to_mins(val) -> float:
    if not val:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).strip().lower()
    if "h" in s:
        m = re.search(r"(\d+)\s*h[.\s]*(\d*)", s)
        if m:
            hrs = int(m.group(1) or 0)
            mins = int(m.group(2) or 0)
            return float(hrs * 60 + mins)
    if "." in s:
        parts = s.split(".")
        p0 = re.sub(r"[^\d]", "", parts[0])
        p1 = re.sub(r"[^\d]", "", parts[1] if len(parts) > 1 else "0")
        if len(p1) == 1:
            p1 += "0"
        return float(int(p0 or 0)) + float(int(p1[:2] or 0)) / 60.0
    digits = re.sub(r"[^\d]", "", s)
    return float(int(digits)) if digits else 0.0


def _extract_chart_metrics_from_payload(parsed_payload) -> dict:
    ot = set()
    nt = set()
    pro = set()
    psa = set()
    psa119 = set()
    dpsa = set()

    chunks = []
    num_days_meta = 0
    num_persons_meta = 0
    grand_chp = 0
    grand_ver = 0
    grand_art_mins = 0.0

    if isinstance(parsed_payload, dict):
        full_plan = parsed_payload.get("fullPlan") if isinstance(parsed_payload.get("fullPlan"), dict) else {}
        chunks = (
            parsed_payload.get("payload")
            or parsed_payload.get("chunks")
            or full_plan.get("chunks")
            or []
        )
        try:
            num_days_meta = int(parsed_payload.get("numDays") or full_plan.get("numDays") or 0)
        except Exception:
            num_days_meta = 0
        try:
            num_persons_meta = int(parsed_payload.get("numPersons") or full_plan.get("numPersons") or 0)
        except Exception:
            num_persons_meta = 0
        try:
            grand_chp = int(parsed_payload.get("grandTotalChapters") or full_plan.get("grandTotalChapters") or 0)
        except Exception:
            grand_chp = 0
        try:
            grand_ver = int(parsed_payload.get("grandTotalVerses") or full_plan.get("grandTotalVerses") or 0)
        except Exception:
            grand_ver = 0
        try:
            grand_art_mins = float(parsed_payload.get("grandTotalArtMins") or full_plan.get("grandTotalArtMins") or 0)
        except Exception:
            grand_art_mins = 0.0
    elif isinstance(parsed_payload, list):
        chunks = parsed_payload

    if not isinstance(chunks, list):
        chunks = []

    row_days_count = 0
    sum_chp = 0
    sum_ver = 0
    sum_art_mins = 0.0

    book_keys = [
        "m1b", "m2b", "m3b", "m3b_morning", "m3b_evening",
        "m4b", "m4b_morning", "m4b_evening", "m5b"
    ]

    for ch in chunks:
        if not isinstance(ch, dict):
            continue
        days_list = ch.get("days") or []
        if not isinstance(days_list, list):
            continue
        for d in days_list:
            if not isinstance(d, dict):
                continue
            row_days_count += 1
            sum_chp += int(d.get("chap") or 0)
            sum_ver += int(d.get("verse") or 0)
            if d.get("artMins") is not None:
                try:
                    sum_art_mins += float(d.get("artMins") or 0)
                except Exception:
                    sum_art_mins += _parse_art_to_mins(d.get("art"))
            else:
                sum_art_mins += _parse_art_to_mins(d.get("art"))

            for key in book_keys:
                raw_str = d.get(key)
                if not raw_str:
                    continue
                for seg in str(raw_str).upper().split(","):
                    seg_clean = seg.strip()
                    if not seg_clean:
                        continue
                    if "DAVID" in seg_clean or "D.PSA" in seg_clean or "DPSA" in seg_clean:
                        dpsa.add("DPSA")
                        continue
                    m = re.match(r"^(\d?\s*[A-Z]+)\b", seg_clean)
                    if not m:
                        continue
                    bk = re.sub(r"\s+", "", m.group(1))
                    if bk in ("PSA", "PSALM", "PSALMS"):
                        if "119" in seg_clean and "-" not in seg_clean:
                            psa119.add("PSA119")
                        else:
                            psa.add("PSA")
                    elif bk in ("PRO", "PROV", "PROVERBS"):
                        pro.add("PRO")
                    elif bk in _OT_BOOKS:
                        ot.add(bk)
                    elif bk in _NT_BOOKS:
                        nt.add(bk)

    total_days = num_days_meta if num_days_meta > 0 else row_days_count
    final_chp = grand_chp if grand_chp > 0 else sum_chp
    final_ver = grand_ver if grand_ver > 0 else sum_ver
    final_art_mins = grand_art_mins if grand_art_mins > 0 else sum_art_mins

    art_round = int(round(final_art_mins))
    if art_round > 0:
        h = art_round // 60
        m = art_round % 60
        if h > 0 and m > 0:
            art_str = f"{h}h.{m}m"
        elif h > 0:
            art_str = f"{h}h"
        else:
            art_str = f"{m}m"
    else:
        art_str = "30m"

    we5_val = max(1, (total_days + 4) // 5) if total_days > 0 else (len(chunks) or 6)
    ppl_val = num_persons_meta if num_persons_meta > 0 else (total_days or 30)

    return {
        "total_days": total_days,
        "ot_bks": str(len(ot)) if len(ot) > 0 else None,
        "nt_bks": str(len(nt)) if len(nt) > 0 else None,
        "pro": str(len(pro)) if len(pro) > 0 else None,
        "psa": str(len(psa)) if len(psa) > 0 else None,
        "psa119": str(len(psa119)) if len(psa119) > 0 else None,
        "dpsa": str(len(dpsa)) if len(dpsa) > 0 else None,
        "chp": final_chp if final_chp > 0 else None,
        "ver": final_ver if final_ver > 0 else None,
        "art": art_str,
        "we5": str(we5_val),
        "ppl": str(ppl_val),
    }


def _parse_chart_datetime_ts(date_str: Optional[str], time_str: Optional[str], payload_str: Optional[str] = None, fallback_dt: Optional[datetime] = None) -> float:
    d_raw = (date_str or "").strip()
    t_raw = (time_str or "").strip()
    if payload_str:
        try:
            p = json.loads(payload_str)
            if isinstance(p, dict):
                fp = p.get("fullPlan") if isinstance(p.get("fullPlan"), dict) else {}
                d_raw = str(p.get("createdDate") or fp.get("selectedDateText") or d_raw).strip()
                t_raw = str(p.get("createdTime") or fp.get("selectedTimeText") or t_raw).strip()
        except Exception:
            pass

    if d_raw:
        parts = re.split(r"[-/]", d_raw)
        if len(parts) == 3:
            try:
                p0, p1, p2 = int(parts[0]), int(parts[1]), int(parts[2])
                year = p0 if p0 > 1900 else p2
                month = p1
                day = p2 if p0 > 1900 else p0
                hours, mins = 0, 0
                if t_raw:
                    tm = re.search(r"(\d{1,2}):(\d{2})\s*(AM|PM)?", t_raw, re.I)
                    if tm:
                        hours = int(tm.group(1))
                        mins = int(tm.group(2))
                        mer = (tm.group(3) or "").upper()
                        if mer == "PM" and hours < 12:
                            hours += 12
                        elif mer == "AM" and hours == 12:
                            hours = 0
                return datetime(year, month, day, hours, mins).timestamp()
            except Exception:
                pass

    if fallback_dt:
        try:
            return fallback_dt.timestamp()
        except Exception:
            pass
    return 0.0


async def sync_module5_rllt_lookup(db: AsyncSession):
    from app.db.models import RlltLookup
    cm_res = await db.execute(select(ChartMapping).where(ChartMapping.module == 5))
    cm_list = list(cm_res.scalars().all())

    rp_res = await db.execute(
        select(ReadingPlanChartMapping)
        .where(ReadingPlanChartMapping.module == 5)
        .order_by(ReadingPlanChartMapping.updated_at.desc().nullslast(), ReadingPlanChartMapping.created_at.desc().nullslast())
    )
    rp_list = list(rp_res.scalars().all())

    rllt_res = await db.execute(select(RlltLookup).where(RlltLookup.module == 5))
    rllt_rows = list(rllt_res.scalars().all())
    rllt_by_fp = {(r.facet, r.phase): r for r in rllt_rows}

    for fct in range(2, 6):
        for phs in range(1, 6):
            candidates = []
            for cm in cm_list:
                if cm.facet == fct and cm.phase == phs and cm.state_payload:
                    ts = _parse_chart_datetime_ts(cm.date, cm.time, cm.state_payload, getattr(cm, "updated_at", None) or getattr(cm, "created_at", None))
                    candidates.append((ts, 1, cm.state_payload))
            for idx, rp in enumerate(rp_list):
                if rp.facet == fct and rp.phase == phs and rp.state_payload:
                    ts = _parse_chart_datetime_ts(rp.date, rp.time, rp.state_payload, getattr(rp, "updated_at", None) or getattr(rp, "created_at", None))
                    # Higher tie-breaker for newest reading_plan_chart_mappings entry
                    candidates.append((ts, 1000 - idx, rp.state_payload))

            ex_r = rllt_by_fp.get((fct, phs))
            if candidates:
                candidates.sort(key=lambda x: (x[0], x[1]), reverse=True)
                latest_payload_str = candidates[0][2]
                try:
                    parsed_p = json.loads(latest_payload_str)
                    metrics = _extract_chart_metrics_from_payload(parsed_p)
                    t_days = metrics["total_days"] or 30
                    if ex_r:
                        ex_r.day = t_days
                        ex_r.scheduled_value_days = t_days
                        ex_r.art = metrics["art"] or "30m"
                        ex_r.we5 = metrics["we5"]
                        ex_r.ot_bks = metrics["ot_bks"]
                        ex_r.nt_bks = metrics["nt_bks"]
                        ex_r.pro = metrics["pro"]
                        ex_r.psa = metrics["psa"]
                        ex_r.psa119 = metrics["psa119"]
                        ex_r.dpsa = metrics["dpsa"]
                        ex_r.chp = metrics["chp"]
                        ex_r.ver = metrics["ver"]
                        ex_r.ppl = metrics["ppl"]
                    else:
                        new_r = RlltLookup(
                            module=5,
                            facet=fct,
                            phase=phs,
                            day=t_days,
                            scheduled_value_days=t_days,
                            art=metrics["art"] or "30m",
                            we5=metrics["we5"],
                            ot_bks=metrics["ot_bks"],
                            nt_bks=metrics["nt_bks"],
                            pro=metrics["pro"],
                            psa=metrics["psa"],
                            psa119=metrics["psa119"],
                            dpsa=metrics["dpsa"],
                            chp=metrics["chp"],
                            ver=metrics["ver"],
                            ppl=metrics["ppl"],
                        )
                        db.add(new_r)
                except Exception:
                    pass
            else:
                # No chart created yet for this (facet, phase): ensure clean 30-day default row exists
                if ex_r:
                    ex_r.day = 30
                    ex_r.scheduled_value_days = 30
                    ex_r.art = "-"
                    ex_r.we5 = "6"
                    ex_r.ot_bks = None
                    ex_r.nt_bks = None
                    ex_r.pro = None
                    ex_r.psa = None
                    ex_r.psa119 = None
                    ex_r.dpsa = None
                    ex_r.chp = None
                    ex_r.ver = None
                    ex_r.ppl = "30"
                else:
                    new_r = RlltLookup(
                        module=5,
                        facet=fct,
                        phase=phs,
                        day=30,
                        scheduled_value_days=30,
                        art="-",
                        we5="6",
                        ot_bks=None,
                        nt_bks=None,
                        pro=None,
                        psa=None,
                        psa119=None,
                        dpsa=None,
                        chp=None,
                        ver=None,
                        ppl="30",
                    )
                    db.add(new_r)


_chart_columns_migrated = False

async def ensure_chart_columns_ready(db: AsyncSession):
    global _chart_columns_migrated
    if _chart_columns_migrated:
        return
    try:
        for tbl in [
            "chart_mappings",
            "vcard_mappings",
            "oil_chart_mappings",
            "seven_tnt_chart_mappings",
            "seven_tnt_day_cycle_chart_mappings",
        ]:
            for col_def in [
                "user_id UUID",
                "location VARCHAR",
                "date VARCHAR",
                "time VARCHAR",
            ]:
                await db.execute(text(f"ALTER TABLE {tbl} ADD COLUMN IF NOT EXISTS {col_def};"))
        await db.execute(text("""
            CREATE TABLE IF NOT EXISTS reading_plan_chart_mappings (
                id UUID PRIMARY KEY,
                module INTEGER NOT NULL DEFAULT 5,
                facet INTEGER NOT NULL DEFAULT 2,
                phase INTEGER NOT NULL DEFAULT 1,
                banner_text VARCHAR,
                t_label VARCHAR,
                logo_url VARCHAR,
                state_payload TEXT NOT NULL,
                user_id UUID,
                created_by VARCHAR,
                location VARCHAR,
                date VARCHAR,
                time VARCHAR,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ
            );
        """))

        await sync_module5_rllt_lookup(db)
        await db.commit()
        _chart_columns_migrated = True
    except Exception:
        await db.rollback()

async def resolve_chart_creator_meta(
    db: AsyncSession,
    current_user: Optional[User],
    form_user_id: Optional[str] = None,
    form_location: Optional[str] = None,
    form_date: Optional[str] = None,
    form_time: Optional[str] = None,
    existing_row = None,
):
    resolved_user_id = None
    if current_user and getattr(current_user, "id", None):
        resolved_user_id = current_user.id
    elif form_user_id and form_user_id.strip():
        try:
            resolved_user_id = uuid.UUID(form_user_id.strip())
        except Exception:
            resolved_user_id = None
    if not resolved_user_id and existing_row is not None:
        resolved_user_id = getattr(existing_row, "user_id", None)

    resolved_location = form_location.strip() if (form_location and form_location.strip()) else None
    if not resolved_location:
        target_user = current_user
        if not target_user and resolved_user_id:
            u_res = await db.execute(select(User).where(User.id == resolved_user_id))
            target_user = u_res.scalars().first()
        if target_user:
            role_val = target_user.role.value if hasattr(target_user.role, "value") else str(getattr(target_user, "role", ""))
            _, _, loc_name = await _resolve_user_location_and_name(db, target_user, role_val)
            resolved_location = loc_name
    if not resolved_location and existing_row is not None:
        resolved_location = getattr(existing_row, "location", None)
    if not resolved_location:
        resolved_location = "Global / All Locations"

    now = datetime.now()
    resolved_date = form_date.strip() if (form_date and form_date.strip()) else None
    if not resolved_date and existing_row is not None and getattr(existing_row, "date", None):
        resolved_date = existing_row.date
    if not resolved_date:
        resolved_date = now.strftime("%d-%m-%Y")

    resolved_time = form_time.strip() if (form_time and form_time.strip()) else None
    if not resolved_time and existing_row is not None and getattr(existing_row, "time", None):
        resolved_time = existing_row.time
    if not resolved_time:
        resolved_time = now.strftime("%I:%M %p")

    return resolved_user_id, resolved_location, resolved_date, resolved_time

@router.post("/sync")
async def sync_chart(
    module: int = Form(...),
    facet: int = Form(...),
    phase: int = Form(...),
    banner_text: str = Form(""),
    t_label: str = Form(""),
    state_payload: str = Form(...),
    user_id: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    date: Optional[str] = Form(None),
    time: Optional[str] = Form(None),
    reading_plan_id: Optional[str] = Form(None),
    logo1: Optional[UploadFile] = File(None),
    logo2: Optional[UploadFile] = File(None),
    logo3: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    try:
        await ensure_chart_columns_ready(db)
        # Check if an existing row exists to preserve its logo if an empty file is sent
        result = await db.execute(select(ChartMapping).filter(
            ChartMapping.module == module,
            ChartMapping.facet == facet,
            ChartMapping.phase == phase
        ))
        existing = result.scalars().first()

        resolved_user_id, resolved_location, resolved_date, resolved_time = await resolve_chart_creator_meta(
            db, current_user, user_id, location, date, time, existing
        )

        resolved_created_by = None
        if current_user:
            resolved_created_by = current_user.name or current_user.email
        elif resolved_user_id:
            u_res = await db.execute(select(User).where(User.id == resolved_user_id))
            u_obj = u_res.scalars().first()
            if u_obj:
                resolved_created_by = u_obj.name or u_obj.email
        if not resolved_created_by:
            resolved_created_by = "Admin"

        logo_urls = {}
        if existing and existing.logo_url:
            try:
                import json
                parsed = json.loads(existing.logo_url)
                if isinstance(parsed, dict):
                    logo_urls = parsed
                else:
                    # Legacy fallback
                    logo_urls = {"logo1": existing.logo_url, "logo2": existing.logo_url, "logo3": existing.logo_url}
            except:
                logo_urls = {"logo1": existing.logo_url, "logo2": existing.logo_url, "logo3": existing.logo_url}

        async def process_logo(logo_file, key):
            if logo_file and logo_file.filename:
                ext = os.path.splitext(logo_file.filename)[1]
                filename = f"logo_{key}_{module}_{facet}_{phase}_{uuid.uuid4().hex}{ext}"
                file_path = os.path.join(UPLOAD_DIR, filename)
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(logo_file.file, buffer)
                logo_urls[key] = f"/api/uploads/{filename}"

        await process_logo(logo1, "logo1")
        await process_logo(logo2, "logo2")
        await process_logo(logo3, "logo3")

        import json
        final_logo_url = json.dumps(logo_urls) if logo_urls else None
            
        upsert_stmt = insert(ChartMapping).values(
            id=uuid.uuid4(),
            module=module,
            facet=facet,
            phase=phase,
            banner_text=banner_text,
            t_label=t_label,
            logo_url=final_logo_url,
            state_payload=state_payload,
            user_id=resolved_user_id,
            location=resolved_location,
            date=resolved_date,
            time=resolved_time,
        )
        
        on_conflict_stmt = upsert_stmt.on_conflict_do_update(
            index_elements=['module', 'facet', 'phase'], # Note: Need unique constraint for this! Or doing it manually.
            set_={
                'banner_text': upsert_stmt.excluded.banner_text,
                't_label': upsert_stmt.excluded.t_label,
                'state_payload': upsert_stmt.excluded.state_payload,
                'logo_url': upsert_stmt.excluded.logo_url,
                'user_id': upsert_stmt.excluded.user_id,
                'location': upsert_stmt.excluded.location,
                'date': upsert_stmt.excluded.date,
                'time': upsert_stmt.excluded.time,
            }
        )
        
        await db.execute(on_conflict_stmt)
        
        # Update RLLT table data with the exact number of days
        from app.db.models import RlltLookup
        saved_reading_plan_id = None
        try:
            if state_payload:
                parsed_payload = json.loads(state_payload)
                metrics = _extract_chart_metrics_from_payload(parsed_payload)
                total_days = metrics["total_days"]

                if total_days > 0:
                    rllt_result = await db.execute(select(RlltLookup).filter(
                        RlltLookup.module == module,
                        RlltLookup.facet == facet,
                        RlltLookup.phase == phase
                    ))
                    existing_rllt = rllt_result.scalars().first()

                    if existing_rllt:
                        existing_rllt.scheduled_value_days = total_days
                        existing_rllt.day = total_days
                        if metrics["art"]:
                            existing_rllt.art = metrics["art"]
                        if metrics["we5"]:
                            existing_rllt.we5 = metrics["we5"]
                        if metrics["ot_bks"] is not None:
                            existing_rllt.ot_bks = metrics["ot_bks"]
                        if metrics["nt_bks"] is not None:
                            existing_rllt.nt_bks = metrics["nt_bks"]
                        if metrics["pro"] is not None:
                            existing_rllt.pro = metrics["pro"]
                        if metrics["psa"] is not None:
                            existing_rllt.psa = metrics["psa"]
                        if metrics["psa119"] is not None:
                            existing_rllt.psa119 = metrics["psa119"]
                        if metrics["dpsa"] is not None:
                            existing_rllt.dpsa = metrics["dpsa"]
                        if metrics["chp"] is not None:
                            existing_rllt.chp = metrics["chp"]
                        if metrics["ver"] is not None:
                            existing_rllt.ver = metrics["ver"]
                        if metrics["ppl"]:
                            existing_rllt.ppl = metrics["ppl"]
                    else:
                        new_rllt = RlltLookup(
                            module=module,
                            facet=facet,
                            phase=phase,
                            day=total_days,
                            art=metrics["art"] or "30m",
                            scheduled_value_days=total_days,
                            we5=metrics["we5"],
                            ot_bks=metrics["ot_bks"],
                            nt_bks=metrics["nt_bks"],
                            pro=metrics["pro"],
                            psa=metrics["psa"],
                            psa119=metrics["psa119"],
                            dpsa=metrics["dpsa"],
                            chp=metrics["chp"],
                            ver=metrics["ver"],
                            ppl=metrics["ppl"],
                        )
                        db.add(new_rllt)

                # If this chart was saved from the Reading Plan workflow, also store/update it in reading_plan_chart_mappings
                if isinstance(parsed_payload, dict) and parsed_payload.get('readingPlan'):
                    existing_rp = None
                    if reading_plan_id and reading_plan_id.strip():
                        try:
                            rp_uuid = uuid.UUID(reading_plan_id.strip())
                            rp_res = await db.execute(select(ReadingPlanChartMapping).where(ReadingPlanChartMapping.id == rp_uuid))
                            existing_rp = rp_res.scalars().first()
                        except Exception:
                            existing_rp = None

                    if existing_rp:
                        existing_rp.module = module
                        existing_rp.facet = facet
                        existing_rp.phase = phase
                        existing_rp.banner_text = banner_text
                        existing_rp.t_label = t_label
                        existing_rp.logo_url = final_logo_url or existing_rp.logo_url
                        existing_rp.state_payload = state_payload
                        existing_rp.user_id = resolved_user_id
                        existing_rp.created_by = resolved_created_by
                        existing_rp.location = resolved_location
                        existing_rp.date = resolved_date
                        existing_rp.time = resolved_time
                        saved_reading_plan_id = str(existing_rp.id)
                    else:
                        new_rp_id = uuid.uuid4()
                        new_rp = ReadingPlanChartMapping(
                            id=new_rp_id,
                            module=module,
                            facet=facet,
                            phase=phase,
                            banner_text=banner_text,
                            t_label=t_label,
                            logo_url=final_logo_url,
                            state_payload=state_payload,
                            user_id=resolved_user_id,
                            created_by=resolved_created_by,
                            location=resolved_location,
                            date=resolved_date,
                            time=resolved_time,
                        )
                        db.add(new_rp)
                        saved_reading_plan_id = str(new_rp_id)
        except Exception as update_err:
            print("Failed to update rllt_lookup / reading_plan_chart_mappings:", update_err)
            
        await db.commit()
        
        return {
            "status": "success",
            "reading_plan_id": saved_reading_plan_id,
            "logo_url": final_logo_url,
            "user_id": str(resolved_user_id) if resolved_user_id else None,
            "created_by": resolved_created_by,
            "location": resolved_location,
            "date": resolved_date,
            "time": resolved_time,
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_charts(db: AsyncSession = Depends(get_db)):
    await ensure_chart_columns_ready(db)
    result = await db.execute(select(ChartMapping).order_by(ChartMapping.module, ChartMapping.facet, ChartMapping.phase))
    mappings = result.scalars().all()
    
    result_seven = await db.execute(select(SevenTNTChartMapping).order_by(SevenTNTChartMapping.module, SevenTNTChartMapping.facet, SevenTNTChartMapping.phase))
    seven_mappings = result_seven.scalars().all()

    result_daycycle = await db.execute(select(SevenTNTDayCycleChartMapping).order_by(SevenTNTDayCycleChartMapping.module, SevenTNTDayCycleChartMapping.facet, SevenTNTDayCycleChartMapping.phase))
    daycycle_mappings = result_daycycle.scalars().all()
    
    charts = []
    for m in mappings:
        # Use banner text if available, fallback to Unnamed
        name_str = m.banner_text if m.banner_text else "Unnamed Chart"
        label = f"{name_str} (Mod {m.module} | Fct {m.facet} | Ph {m.phase})"
        
        payload = m.state_payload or ""
        
        is_24x7 = '"m4b"' in payload or '"m4b_morning"' in payload
        is_morning_evening = '"m3b_morning"' in payload or '"m4b_morning"' in payload
        
        if is_24x7 and is_morning_evening:
            chart_type = "24x7 Morning/Evening Chart"
        elif is_morning_evening:
            chart_type = "Main Morning/Evening Chart"
        elif is_24x7:
            chart_type = "24x7 Chart"
        else:
            chart_type = "Main Chart"
            
        count_chunks = payload.count('"chunk_')
        tracking_days = 40 if count_chunks == 8 else 30
        if payload:
            try:
                parsed_p = json.loads(payload)
                if isinstance(parsed_p, dict):
                    if parsed_p.get("numDays") and int(parsed_p["numDays"]) > 0:
                        tracking_days = int(parsed_p["numDays"])
                    else:
                        chunks_list = parsed_p.get("payload") or parsed_p.get("chunks") or (parsed_p.get("fullPlan") or {}).get("chunks")
                        if isinstance(chunks_list, list):
                            total_d = sum(len(ch.get("days", [])) for ch in chunks_list if isinstance(ch, dict))
                            if total_d > 0:
                                tracking_days = total_d
                elif isinstance(parsed_p, list):
                    total_d = sum(len(ch.get("days", [])) for ch in parsed_p if isinstance(ch, dict))
                    if total_d > 0:
                        tracking_days = total_d
            except Exception:
                pass

        charts.append({
            "id": str(m.id),
            "label": label,
            "module": m.module,
            "facet": m.facet,
            "phase": m.phase,
            "chart_type": chart_type,
            "tracking_days": tracking_days,
            "banner_text": name_str,
            "state_payload": payload,
            "user_id": str(m.user_id) if m.user_id else None,
            "location": m.location,
            "date": m.date,
            "time": m.time,
        })
        
    for m in seven_mappings:
        name_str = m.banner_text if m.banner_text else "Unnamed 7TNT Chart"
        label = f"{name_str} (Mod {m.module} | Fct {m.facet} | Ph {m.phase})"
        charts.append({
            "id": str(m.id),
            "label": label,
            "module": m.module,
            "facet": m.facet,
            "phase": m.phase,
            "chart_type": "7TNT Main Chart",
            "tracking_days": 30, # default or parse payload if needed
            "banner_text": name_str,
            "state_payload": m.state_payload or "",
            "user_id": str(m.user_id) if m.user_id else None,
            "location": m.location,
            "date": m.date,
            "time": m.time,
        })

    for m in daycycle_mappings:
        name_str = m.banner_text if m.banner_text else "Unnamed 7TNT Day Cycle Chart"
        label = f"{name_str} (Mod {m.module} | Fct {m.facet} | Ph {m.phase})"
        charts.append({
            "id": str(m.id),
            "label": label,
            "module": m.module,
            "facet": m.facet,
            "phase": m.phase,
            "chart_type": "7TNT Day Cycle Chart",
            "tracking_days": 30, # default or parse payload if needed
            "banner_text": name_str,
            "state_payload": m.state_payload or "",
            "user_id": str(m.user_id) if m.user_id else None,
            "location": m.location,
            "date": m.date,
            "time": m.time,
        })

    return charts


@router.get("/sync/{module}/{facet}/{phase}")
async def get_chart(module: int, facet: int, phase: int, db: AsyncSession = Depends(get_db)):
    await ensure_chart_columns_ready(db)
    result = await db.execute(select(ChartMapping).filter(
        ChartMapping.module == module,
        ChartMapping.facet == facet,
        ChartMapping.phase == phase
    ))
    mapping = result.scalars().first()
    
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
        
    parsed_logo1 = mapping.logo_url
    if mapping.logo_url and mapping.logo_url.startswith("{"):
        import json
        try:
            urls = json.loads(mapping.logo_url)
            parsed_logo1 = urls.get("logo1", mapping.logo_url)
        except:
            pass

    return {
        "module": mapping.module,
        "facet": mapping.facet,
        "phase": mapping.phase,
        "banner_text": mapping.banner_text,
        "t_label": mapping.t_label,
        "logo_url": parsed_logo1,
        "logo_urls_json": mapping.logo_url,
        "state_payload": mapping.state_payload,
        "user_id": str(mapping.user_id) if mapping.user_id else None,
        "location": mapping.location,
        "date": mapping.date,
        "time": mapping.time,
    }


@router.delete("/sync/{module}/{facet}/{phase}")
async def delete_chart(module: int, facet: int, phase: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(delete(ChartMapping).where(
        ChartMapping.module == module,
        ChartMapping.facet == facet,
        ChartMapping.phase == phase
    ))
    
    if result.rowcount == 0:
        await db.rollback()
        raise HTTPException(status_code=404, detail="Mapping not found")
        
    if module == 5:
        await sync_module5_rllt_lookup(db)
    await db.commit()
    return {"status": "success", "message": "Chart mapping deleted successfully"}


@router.get("/reading-plans")
async def list_reading_plan_charts(db: AsyncSession = Depends(get_db)):
    await ensure_chart_columns_ready(db)

    # Backfill any Reading Plan chart saved in chart_mappings into reading_plan_chart_mappings if not yet present
    rp_res = await db.execute(select(ReadingPlanChartMapping).order_by(ReadingPlanChartMapping.created_at.desc()))
    rp_rows = list(rp_res.scalars().all())

    if len(rp_rows) == 0:
        cm_res = await db.execute(
            select(ChartMapping).where(
                (ChartMapping.state_payload.like('%"readingPlan"%')) |
                (ChartMapping.date.isnot(None))
            )
        )
        cm_rows = cm_res.scalars().all()
        if cm_rows:
            for cm in cm_rows:
                creator_name = "Admin"
                if cm.user_id:
                    u_r = await db.execute(select(User).where(User.id == cm.user_id))
                    u_o = u_r.scalars().first()
                    if u_o:
                        creator_name = u_o.name or u_o.email
                new_rp = ReadingPlanChartMapping(
                    id=uuid.uuid4(),
                    module=cm.module,
                    facet=cm.facet,
                    phase=cm.phase,
                    banner_text=cm.banner_text,
                    t_label=cm.t_label,
                    logo_url=cm.logo_url,
                    state_payload=cm.state_payload,
                    user_id=cm.user_id,
                    created_by=creator_name,
                    location=cm.location,
                    date=cm.date,
                    time=cm.time,
                )
                db.add(new_rp)
            await db.commit()
            rp_res = await db.execute(select(ReadingPlanChartMapping).order_by(ReadingPlanChartMapping.created_at.desc()))
            rp_rows = list(rp_res.scalars().all())

    # Resolve user names for any rows missing created_by
    user_ids = {r.user_id for r in rp_rows if r.user_id and not r.created_by}
    user_map = {}
    if user_ids:
        u_res = await db.execute(select(User).where(User.id.in_(user_ids)))
        for u in u_res.scalars().all():
            user_map[u.id] = u.name or u.email

    items = []
    for r in rp_rows:
        creator_str = r.created_by or user_map.get(r.user_id) or "Admin"
        items.append({
            "id": str(r.id),
            "module": r.module,
            "facet": r.facet,
            "phase": r.phase,
            "chart_name": r.banner_text or f"MAIN CHART (Mod {r.module} • Fct {r.facet} • Ph {r.phase})",
            "banner_text": r.banner_text or f"MAIN CHART (Mod {r.module} • Fct {r.facet} • Ph {r.phase})",
            "t_label": r.t_label or "T",
            "state_payload": r.state_payload or "",
            "user_id": str(r.user_id) if r.user_id else None,
            "created_by": creator_str,
            "location": r.location or "",
            "date": r.date or "",
            "time": r.time or "",
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return items


@router.get("/reading-plans/{chart_id}")
async def get_reading_plan_chart(chart_id: str, db: AsyncSession = Depends(get_db)):
    await ensure_chart_columns_ready(db)
    try:
        rp_uuid = uuid.UUID(chart_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid chart ID")

    res = await db.execute(select(ReadingPlanChartMapping).where(ReadingPlanChartMapping.id == rp_uuid))
    mapping = res.scalars().first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Reading Plan chart not found")

    parsed_logo1 = mapping.logo_url
    if mapping.logo_url and mapping.logo_url.startswith("{"):
        import json
        try:
            urls = json.loads(mapping.logo_url)
            parsed_logo1 = urls.get("logo1", mapping.logo_url)
        except Exception:
            pass

    return {
        "id": str(mapping.id),
        "module": mapping.module,
        "facet": mapping.facet,
        "phase": mapping.phase,
        "banner_text": mapping.banner_text,
        "t_label": mapping.t_label,
        "logo_url": parsed_logo1,
        "logo_urls_json": mapping.logo_url,
        "state_payload": mapping.state_payload,
        "user_id": str(mapping.user_id) if mapping.user_id else None,
        "created_by": mapping.created_by or "Admin",
        "location": mapping.location,
        "date": mapping.date,
        "time": mapping.time,
    }


@router.delete("/reading-plans/{chart_id}")
async def delete_reading_plan_chart(chart_id: str, db: AsyncSession = Depends(get_db)):
    await ensure_chart_columns_ready(db)
    try:
        rp_uuid = uuid.UUID(chart_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid chart ID")

    res = await db.execute(delete(ReadingPlanChartMapping).where(ReadingPlanChartMapping.id == rp_uuid))
    if res.rowcount == 0:
        await db.rollback()
        raise HTTPException(status_code=404, detail="Reading Plan chart not found")

    await sync_module5_rllt_lookup(db)
    await db.commit()
    return {"status": "success", "message": "Reading Plan chart deleted successfully"}

