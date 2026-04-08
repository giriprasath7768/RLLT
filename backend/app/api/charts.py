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
from app.db.models import ChartMapping

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/sync")
async def sync_chart(
    module: int = Form(...),
    facet: int = Form(...),
    phase: int = Form(...),
    banner_text: str = Form(""),
    t_label: str = Form(""),
    state_payload: str = Form(...),
    logo: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    try:
        logo_url = None
        
        # Check if an existing row exists to preserve its logo if an empty file is sent
        result = await db.execute(select(ChartMapping).filter(
            ChartMapping.module == module,
            ChartMapping.facet == facet,
            ChartMapping.phase == phase
        ))
        existing = result.scalars().first()

        if logo and logo.filename:
            # Save the new file
            ext = os.path.splitext(logo.filename)[1]
            filename = f"logo_{module}_{facet}_{phase}_{uuid.uuid4().hex}{ext}"
            file_path = os.path.join(UPLOAD_DIR, filename)
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(logo.file, buffer)
            
            logo_url = f"/api/uploads/{filename}"
        elif existing:
            # Preserve existing logo URL if no new upload provided
            logo_url = existing.logo_url
            
        upsert_stmt = insert(ChartMapping).values(
            id=uuid.uuid4(),
            module=module,
            facet=facet,
            phase=phase,
            banner_text=banner_text,
            t_label=t_label,
            logo_url=logo_url,
            state_payload=state_payload
        )
        
        on_conflict_stmt = upsert_stmt.on_conflict_do_update(
            index_elements=['module', 'facet', 'phase'], # Note: Need unique constraint for this! Or doing it manually.
            set_={
                'banner_text': upsert_stmt.excluded.banner_text,
                't_label': upsert_stmt.excluded.t_label,
                'state_payload': upsert_stmt.excluded.state_payload,
                'logo_url': upsert_stmt.excluded.logo_url
            }
        )
        
        await db.execute(on_conflict_stmt)
        await db.commit()
        
        return {"status": "success", "logo_url": logo_url}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_charts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChartMapping).order_by(ChartMapping.module, ChartMapping.facet, ChartMapping.phase))
    mappings = result.scalars().all()
    
    charts = []
    for m in mappings:
        # Use banner text if available, fallback to Unnamed
        name_str = m.banner_text if m.banner_text else "Unnamed Chart"
        label = f"{name_str} (Mod {m.module} | Fct {m.facet} | Ph {m.phase})"
        charts.append({
            "id": str(m.id),
            "label": label,
            "module": m.module,
            "facet": m.facet,
            "phase": m.phase
        })
    return charts


@router.get("/sync/{module}/{facet}/{phase}")
async def get_chart(module: int, facet: int, phase: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChartMapping).filter(
        ChartMapping.module == module,
        ChartMapping.facet == facet,
        ChartMapping.phase == phase
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
        "state_payload": mapping.state_payload
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
        
    await db.commit()
    return {"status": "success", "message": "Chart mapping deleted successfully"}
