import uuid as uuid_mod
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.db.models import Chapter, Book, User
from app.schemas.book import ChapterCreate, ChapterUpdate, ChapterWithBookResponse, ChapterResponse
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[ChapterWithBookResponse])
async def get_chapters(
    skip: int = 0, 
    limit: int = 1500, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # We load the related Book to return book_name
    result = await db.execute(select(Chapter).options(selectinload(Chapter.book)).offset(skip).limit(limit))
    chapters = result.scalars().all()
    
    response_list = []
    for chapter in chapters:
        chapter_dict = chapter.__dict__.copy()
        chapter_dict['book_name'] = chapter.book.name if chapter.book else "Unknown Book"
        response_list.append(ChapterWithBookResponse(**chapter_dict))
    return response_list

@router.post("/", response_model=ChapterResponse, status_code=status.HTTP_201_CREATED)
async def create_chapter(
    chapter_in: ChapterCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Verify book exists
    result = await db.execute(select(Book).where(Book.id == chapter_in.book_id))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Parent Book not found")

    new_chapter = Chapter(
        id=uuid_mod.uuid4(),
        **chapter_in.model_dump()
    )
    db.add(new_chapter)
    await db.commit()
    await db.refresh(new_chapter)
    return new_chapter

@router.post("/bulk", status_code=status.HTTP_201_CREATED)
async def bulk_create_chapters(
    chapters_in: List[ChapterCreate], 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    try:
        new_chapters = [
            Chapter(id=uuid_mod.uuid4(), **c.model_dump())
            for c in chapters_in
        ]
        db.add_all(new_chapters)
        await db.commit()
        return {"message": f"Successfully imported {len(new_chapters)} chapters."}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Bulk import failed: {str(e)}")

@router.put("/{chapter_id}", response_model=ChapterResponse)
async def update_chapter(
    chapter_id: uuid_mod.UUID, 
    chapter_in: ChapterUpdate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    result = await db.execute(select(Chapter).where(Chapter.id == chapter_id))
    chapter = result.scalars().first()
    
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
        
    update_data = chapter_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(chapter, field, value)
        
    await db.commit()
    await db.refresh(chapter)
    return chapter

@router.delete("/{chapter_id}")
async def delete_chapter(
    chapter_id: uuid_mod.UUID, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    result = await db.execute(select(Chapter).where(Chapter.id == chapter_id))
    chapter = result.scalars().first()
    
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
        
    await db.delete(chapter)
    await db.commit()
    return {"message": "Chapter successfully deleted"}
