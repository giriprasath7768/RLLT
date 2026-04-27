import os
import uuid
import shutil
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.database import get_db
from app.db.models import ImageGallery

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_images(files: List[UploadFile] = File(...), db: AsyncSession = Depends(get_db)):
    uploaded_urls = []
    try:
        for file in files:
            file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            file_path = os.path.join(UPLOAD_DIR, unique_filename)
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # create URL
            image_url = f"/api/uploads/{unique_filename}"
            
            # Save to db
            new_image = ImageGallery(image_url=image_url)
            db.add(new_image)
            uploaded_urls.append(image_url)
            
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
    return {"message": "Images uploaded successfully", "urls": uploaded_urls}

from pydantic import BaseModel
class URLsPayload(BaseModel):
    urls: List[str]

@router.post("/urls")
async def upload_urls(payload: URLsPayload, db: AsyncSession = Depends(get_db)):
    try:
        urls = []
        for url in payload.urls:
            if not url or url.strip() == "":
                continue
            new_image = ImageGallery(image_url=url.strip())
            db.add(new_image)
            urls.append(url.strip())
        await db.commit()
        return {"message": "Image URLs imported successfully", "count": len(urls)}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_images(db: AsyncSession = Depends(get_db)):
    try:
        stmt = select(ImageGallery).order_by(ImageGallery.created_at.desc())
        result = await db.execute(stmt)
        images = result.scalars().all()
        return [{"id": str(img.id), "url": img.image_url, "created_at": img.created_at} for img in images]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{image_id}")
async def delete_image(image_id: str, db: AsyncSession = Depends(get_db)):
    try:
        stmt = select(ImageGallery).where(ImageGallery.id == image_id)
        result = await db.execute(stmt)
        image = result.scalar_one_or_none()
        if not image:
            raise HTTPException(status_code=404, detail="Image not found")
            
        # Delete from filesystem if it's a local file
        if image.image_url.startswith("/api/uploads/"):
            filename = image.image_url.split("/")[-1]
            file_path = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                
        # Delete from DB
        await db.delete(image)
        await db.commit()
        return {"message": "Image deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

