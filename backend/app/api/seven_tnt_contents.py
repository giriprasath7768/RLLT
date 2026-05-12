from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert
import uuid
import os
import shutil
from typing import Optional, List
import json

from app.db.database import get_db
from app.db.models import SevenTNTContent, Book

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/sync")
async def sync_content(
    content_id: str = Form(None),
    book_id: uuid.UUID = Form(...),
    verses: str = Form(""),
    ref_link: str = Form(""),
    audio_language: str = Form(""),
    audio: Optional[UploadFile] = File(None),
    audios: List[UploadFile] = File(default=[]),
    audio_languages: str = Form("[]"),
    existing_audios: str = Form(None),
    existing_videos: str = Form(None),
    videos: List[UploadFile] = File(default=[]),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Check if an existing row exists by id or (book and verses)
        existing = None
        if content_id and content_id.strip() not in ("null", "undefined", ""):
            try:
                parsed_id = uuid.UUID(content_id.strip(' \'"'))
                result = await db.execute(select(SevenTNTContent).filter(SevenTNTContent.id == parsed_id))
                existing = result.scalars().first()
            except Exception as e:
                print(f"Error parsing UUID: {e}")
        if not existing:
            result = await db.execute(select(SevenTNTContent).filter(
                SevenTNTContent.book_id == book_id,
                SevenTNTContent.verses == verses
            ))
            existing = result.scalars().first()

        existing_audios_list = []
        if existing_audios is not None:
            try:
                existing_audios_list = json.loads(existing_audios)
            except Exception:
                existing_audios_list = []
        else:
            if existing and existing.audio_url:
                try:
                    parsed = json.loads(existing.audio_url)
                    if isinstance(parsed, list):
                        existing_audios_list = parsed
                    else:
                        existing_audios_list = [{"url": existing.audio_url, "language": existing.audio_language or ""}]
                except Exception:
                    existing_audios_list = [{"url": existing.audio_url, "language": existing.audio_language or ""}]

        try:
            new_languages = json.loads(audio_languages) if audio_languages else []
        except Exception:
            new_languages = []

        if audio and audio.filename:
            ext = os.path.splitext(audio.filename)[1]
            filename = f"7tnt_audio_{uuid.uuid4().hex}{ext}"
            file_path = os.path.join(UPLOAD_DIR, filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(audio.file, buffer)
            existing_audios_list.append({"url": f"/api/uploads/{filename}", "language": audio_language or ""})
            
        for i, a_file in enumerate(audios):
            if a_file and a_file.filename:
                ext = os.path.splitext(a_file.filename)[1]
                filename = f"7tnt_audio_{uuid.uuid4().hex}{ext}"
                file_path = os.path.join(UPLOAD_DIR, filename)
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(a_file.file, buffer)
                lang = new_languages[i] if i < len(new_languages) else ""
                existing_audios_list.append({"url": f"/api/uploads/{filename}", "language": lang})

        audio_url_json = json.dumps(existing_audios_list) if existing_audios_list else None
        
        first_lang = existing_audios_list[0]["language"] if existing_audios_list and "language" in existing_audios_list[0] else audio_language
            
        video_urls = []
        if existing_videos is not None:
            try:
                video_urls = json.loads(existing_videos)
            except Exception:
                video_urls = []
        else:
            if existing and existing.video_url:
                try:
                    parsed = json.loads(existing.video_url)
                    if isinstance(parsed, list):
                        video_urls = parsed
                    else:
                        video_urls = [existing.video_url]
                except Exception:
                    video_urls = [existing.video_url]

        for video in videos:
            if video and video.filename:
                ext = os.path.splitext(video.filename)[1]
                filename = f"7tnt_video_{uuid.uuid4().hex}{ext}"
                file_path = os.path.join(UPLOAD_DIR, filename)
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(video.file, buffer)
                video_urls.append(f"/api/uploads/{filename}")
                
        video_url_json = json.dumps(video_urls) if video_urls else None

        if existing:
            existing.book_id = book_id
            existing.verses = verses
            existing.audio_url = audio_url_json
            existing.audio_language = first_lang
            existing.video_url = video_url_json
            existing.ref_link = ref_link
        else:
            new_content = SevenTNTContent(
                id=uuid.uuid4(),
                book_id=book_id,
                verses=verses,
                audio_url=audio_url_json,
                audio_language=first_lang,
                video_url=video_url_json,
                ref_link=ref_link
            )
            db.add(new_content)
        
        await db.commit()
        
        return {
            "status": "success", 
            "audio_url": audio_url_json,
            "audio_language": first_lang,
            "video_url": video_url_json,
            "ref_link": ref_link
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_contents(db: AsyncSession = Depends(get_db)):
    query = (
        select(SevenTNTContent, Book.name)
        .join(Book, SevenTNTContent.book_id == Book.id)
        .order_by(Book.name, SevenTNTContent.created_at.desc())
    )
    result = await db.execute(query)
    rows = result.fetchall()
    
    contents = []
    for content, book_name in rows:
        contents.append({
            "id": str(content.id),
            "book_id": str(content.book_id),
            "book_name": book_name,
            "verses": content.verses,
            "audio_url": content.audio_url,
            "audio_language": content.audio_language,
            "video_url": content.video_url,
            "ref_link": content.ref_link,
            "created_at": content.created_at
        })
    return contents

@router.delete("/{id}")
async def delete_content(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(delete(SevenTNTContent).where(SevenTNTContent.id == id))
    if result.rowcount == 0:
        await db.rollback()
        raise HTTPException(status_code=404, detail="Content not found")
        
    await db.commit()
    return {"status": "success", "message": "Content deleted successfully"}
