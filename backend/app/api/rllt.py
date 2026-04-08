from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.db.models import RlltLookup
from app.schemas.rllt import RlltLookupCreate, RlltLookupUpdate, RlltLookupResponse

router = APIRouter()

@router.get("/", response_model=List[RlltLookupResponse])
async def get_all_rllt(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RlltLookup).order_by(RlltLookup.module, RlltLookup.facet, RlltLookup.phase, RlltLookup.day))
    data = result.scalars().all()
    return data

@router.post("/", response_model=RlltLookupResponse, status_code=status.HTTP_201_CREATED)
async def create_rllt(rllt_in: RlltLookupCreate, db: AsyncSession = Depends(get_db)):
    db_rllt = RlltLookup(**rllt_in.model_dump())
    db.add(db_rllt)
    try:
        await db.commit()
        await db.refresh(db_rllt)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_rllt

@router.post("/bulk", status_code=status.HTTP_201_CREATED)
async def bulk_create_rllt(rllt_in: List[RlltLookupCreate], db: AsyncSession = Depends(get_db)):
    try:
        new_items = [RlltLookup(**r.model_dump()) for r in rllt_in]
        db.add_all(new_items)
        await db.commit()
        return {"message": f"Successfully imported {len(new_items)} RLLT entries."}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Bulk import failed: {str(e)}")

@router.put("/{rllt_id}", response_model=RlltLookupResponse)
async def update_rllt(rllt_id: UUID, rllt_in: RlltLookupUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RlltLookup).filter(RlltLookup.id == rllt_id))
    db_rllt = result.scalars().first()
    if not db_rllt:
        raise HTTPException(status_code=404, detail="Item not found")
        
    update_data = rllt_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_rllt, key, value)
        
    await db.commit()
    await db.refresh(db_rllt)
    return db_rllt

@router.delete("/{rllt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rllt(rllt_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RlltLookup).filter(RlltLookup.id == rllt_id))
    db_rllt = result.scalars().first()
    if not db_rllt:
        raise HTTPException(status_code=404, detail="Item not found")
        
    await db.delete(db_rllt)
    await db.commit()
    return None
