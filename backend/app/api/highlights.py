from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
import uuid
from typing import List, Optional
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import StudentHighlight, User
from app.api.auth import get_current_user

router = APIRouter()

class RectSchema(BaseModel):
    top: float
    left: float
    width: float
    height: float

class HighlightCreateSchema(BaseModel):
    book_id: str
    chapter_id: str
    page_number: int
    selected_text: Optional[str] = None
    color: Optional[str] = None
    label: Optional[str] = None
    format: Optional[str] = None
    style_option: Optional[str] = None
    rects: List[RectSchema]

@router.post("")
async def create_highlight(
    payload: HighlightCreateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        highlight = StudentHighlight(
            id=uuid.uuid4(),
            user_id=current_user.id,
            book_id=uuid.UUID(payload.book_id),
            chapter_id=uuid.UUID(payload.chapter_id),
            page_number=payload.page_number,
            selected_text=payload.selected_text,
            color=payload.color,
            label=payload.label,
            format=payload.format,
            style_option=payload.style_option,
            rects=[rect.dict() for rect in payload.rects]
        )
        db.add(highlight)
        await db.commit()
        await db.refresh(highlight)
        return {
            "status": "success",
            "id": str(highlight.id),
            "selected_text": highlight.selected_text
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("")
async def get_my_highlights(
    book_id: Optional[str] = None,
    chapter_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        query = select(StudentHighlight).filter(StudentHighlight.user_id == current_user.id)
        if book_id:
            query = query.filter(StudentHighlight.book_id == uuid.UUID(book_id))
        if chapter_id:
            query = query.filter(StudentHighlight.chapter_id == uuid.UUID(chapter_id))
            
        result = await db.execute(query)
        highlights = result.scalars().all()
        
        return [
            {
                "id": str(h.id),
                "book_id": str(h.book_id),
                "chapter_id": str(h.chapter_id),
                "pageNumber": h.page_number,
                "text": h.selected_text,
                "color": h.color,
                "label": h.label,
                "format": h.format,
                "styleOption": h.style_option,
                "rects": h.rects,
                "isSquare": h.format in ['square', 'circle', 'oval']
            }
            for h in highlights
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{highlight_id}")
async def delete_highlight(
    highlight_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = await db.execute(select(StudentHighlight).filter(
            StudentHighlight.id == uuid.UUID(highlight_id),
            StudentHighlight.user_id == current_user.id
        ))
        highlight = result.scalars().first()
        
        if not highlight:
            raise HTTPException(status_code=404, detail="Highlight not found")
            
        await db.delete(highlight)
        await db.commit()
        return {"status": "success"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
