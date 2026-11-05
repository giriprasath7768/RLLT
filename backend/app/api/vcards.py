from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert
import uuid
import os
import shutil
from typing import Optional

from app.db.database import get_db
from app.db.models import VCardMapping, User
from app.api.auth import get_current_user_optional
from app.api.charts import ensure_chart_columns_ready, resolve_chart_creator_meta

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/sync")
async def sync_vcard(
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
    logo: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    try:
        await ensure_chart_columns_ready(db)
        logo_url = None
        
        # Check if an existing row exists to preserve its logo if an empty file is sent
        result = await db.execute(select(VCardMapping).filter(
            VCardMapping.module == module,
            VCardMapping.facet == facet,
            VCardMapping.phase == phase
        ))
        existing = result.scalars().first()

        resolved_user_id, resolved_location, resolved_date, resolved_time = await resolve_chart_creator_meta(
            db, current_user, user_id, location, date, time, existing
        )

        if logo and logo.filename:
            # Save the new file
            ext = os.path.splitext(logo.filename)[1]
            filename = f"vcard_logo_{module}_{facet}_{phase}_{uuid.uuid4().hex}{ext}"
            file_path = os.path.join(UPLOAD_DIR, filename)
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(logo.file, buffer)
            
            logo_url = f"/api/uploads/{filename}"
        elif existing:
            # Preserve existing logo URL if no new upload provided
            logo_url = existing.logo_url
            
        upsert_stmt = insert(VCardMapping).values(
            id=uuid.uuid4(),
            module=module,
            facet=facet,
            phase=phase,
            banner_text=banner_text,
            t_label=t_label,
            logo_url=logo_url,
            state_payload=state_payload,
            user_id=resolved_user_id,
            location=resolved_location,
            date=resolved_date,
            time=resolved_time,
        )
        
        on_conflict_stmt = upsert_stmt.on_conflict_do_update(
            index_elements=['module', 'facet', 'phase'],
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
        await db.commit()
        
        return {
            "status": "success",
            "logo_url": logo_url,
            "user_id": str(resolved_user_id) if resolved_user_id else None,
            "location": resolved_location,
            "date": resolved_date,
            "time": resolved_time,
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_vcards(db: AsyncSession = Depends(get_db)):
    await ensure_chart_columns_ready(db)
    result = await db.execute(select(VCardMapping).order_by(VCardMapping.module, VCardMapping.facet, VCardMapping.phase))
    mappings = result.scalars().all()
    
    vcards = []
    for m in mappings:
        name_str = m.banner_text if m.banner_text else "Unnamed V-Card"
        label = f"{name_str} (Mod {m.module} | Fct {m.facet} | Ph {m.phase})"
        vcards.append({
            "id": str(m.id),
            "label": label,
            "module": m.module,
            "facet": m.facet,
            "phase": m.phase,
            "user_id": str(m.user_id) if m.user_id else None,
            "location": m.location,
            "date": m.date,
            "time": m.time,
        })
    return vcards

@router.get("/sync/{module}/{facet}/{phase}")
async def get_vcard(module: int, facet: int, phase: int, db: AsyncSession = Depends(get_db)):
    await ensure_chart_columns_ready(db)
    result = await db.execute(select(VCardMapping).filter(
        VCardMapping.module == module,
        VCardMapping.facet == facet,
        VCardMapping.phase == phase
    ))
    mapping = result.scalars().first()
    
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
        
    return {
        "module": mapping.module,
        "facet": mapping.facet,
        "phase": mapping.phase,
        "banner_text": mapping.banner_text,
        "t_label": mapping.t_label,
        "logo_url": mapping.logo_url,
        "state_payload": mapping.state_payload,
        "user_id": str(mapping.user_id) if mapping.user_id else None,
        "location": mapping.location,
        "date": mapping.date,
        "time": mapping.time,
    }

@router.delete("/sync/{module}/{facet}/{phase}")
async def delete_vcard(module: int, facet: int, phase: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(delete(VCardMapping).where(
        VCardMapping.module == module,
        VCardMapping.facet == facet,
        VCardMapping.phase == phase
    ))
    
    if result.rowcount == 0:
        await db.rollback()
        raise HTTPException(status_code=404, detail="Mapping not found")
        
    await db.commit()
    return {"status": "success", "message": "V-Card mapping deleted successfully"}
