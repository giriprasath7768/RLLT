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
from app.db.models import Content, Book, Chapter
from app.schemas.content import BulkContentRequest

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/sync")
async def sync_content(
    book_id: uuid.UUID = Form(...),
    chapter_id: uuid.UUID = Form(...),
    ref_link: str = Form(""),
    audio: Optional[UploadFile] = File(None),
    video: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    try:
        audio_url = None
        video_url = None
        
        # Check if an existing row exists to preserve its media if an empty file is sent
        result = await db.execute(select(Content).filter(
            Content.book_id == book_id,
            Content.chapter_id == chapter_id
        ))
        existing = result.scalars().first()

        if audio and audio.filename:
            ext = os.path.splitext(audio.filename)[1]
            filename = f"audio_{book_id.hex}_{chapter_id.hex}_{uuid.uuid4().hex}{ext}"
            file_path = os.path.join(UPLOAD_DIR, filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(audio.file, buffer)
            audio_url = f"/api/uploads/{filename}"
        elif existing:
            audio_url = existing.audio_url
            
        if video and video.filename:
            ext = os.path.splitext(video.filename)[1]
            filename = f"video_{book_id.hex}_{chapter_id.hex}_{uuid.uuid4().hex}{ext}"
            file_path = os.path.join(UPLOAD_DIR, filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(video.file, buffer)
            video_url = f"/api/uploads/{filename}"
        elif existing:
            video_url = existing.video_url

        upsert_stmt = insert(Content).values(
            id=uuid.uuid4(),
            book_id=book_id,
            chapter_id=chapter_id,
            audio_url=audio_url,
            video_url=video_url,
            ref_link=ref_link
        )
        
        on_conflict_stmt = upsert_stmt.on_conflict_do_update(
            index_elements=['book_id', 'chapter_id'],
            set_={
                'audio_url': upsert_stmt.excluded.audio_url,
                'video_url': upsert_stmt.excluded.video_url,
                'ref_link': upsert_stmt.excluded.ref_link
            }
        )
        
        await db.execute(on_conflict_stmt)
        await db.commit()
        
        return {
            "status": "success", 
            "audio_url": audio_url,
            "video_url": video_url,
            "ref_link": ref_link
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_contents(db: AsyncSession = Depends(get_db)):
    # Join with Book and Chapter to get names
    query = (
        select(Content, Book.name, Chapter.chapter_number)
        .join(Book, Content.book_id == Book.id)
        .join(Chapter, Content.chapter_id == Chapter.id)
        .order_by(Book.name, Chapter.chapter_number)
    )
    result = await db.execute(query)
    rows = result.fetchall()
    
    contents = []
    for content, book_name, chapter_number in rows:
        contents.append({
            "id": str(content.id),
            "book_id": str(content.book_id),
            "chapter_id": str(content.chapter_id),
            "book_name": book_name,
            "chapter_number": chapter_number,
            "audio_url": content.audio_url,
            "video_url": content.video_url,
            "ref_link": content.ref_link,
            "created_at": content.created_at
        })
    return contents

@router.post("/bulk")
async def bulk_sync_content(payload: BulkContentRequest, db: AsyncSession = Depends(get_db)):
    try:
        inserted_count = 0
        for item in payload.items:
            # Resolve book and chapter IDs
            book_res = await db.execute(select(Book).filter(Book.name == item.book_name))
            book = book_res.scalars().first()
            if not book:
                continue # Skip if book not found
                
            chap_res = await db.execute(select(Chapter).filter(
                Chapter.book_id == book.id, 
                Chapter.chapter_number == item.chapter_number
            ))
            chapter = chap_res.scalars().first()
            if not chapter:
                continue # Skip if chapter not found

            # Prepare upsert statement
            upsert_stmt = insert(Content).values(
                id=uuid.uuid4(),
                book_id=book.id,
                chapter_id=chapter.id,
                audio_url=item.audio_url,
                video_url=item.video_url,
                ref_link=item.ref_link
            )
            
            on_conflict_stmt = upsert_stmt.on_conflict_do_update(
                index_elements=['book_id', 'chapter_id'],
                set_={
                    'audio_url': upsert_stmt.excluded.audio_url,
                    'video_url': upsert_stmt.excluded.video_url,
                    'ref_link': upsert_stmt.excluded.ref_link
                }
            )
            
            await db.execute(on_conflict_stmt)
            inserted_count += 1
            
        await db.commit()
        return {"status": "success", "processed": inserted_count, "total_requested": len(payload.items)}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def delete_content(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(delete(Content).where(Content.id == id))
    if result.rowcount == 0:
        await db.rollback()
        raise HTTPException(status_code=404, detail="Content not found")
        
    await db.commit()
    return {"status": "success", "message": "Content deleted successfully"}
