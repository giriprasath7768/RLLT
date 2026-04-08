from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.db.models import Book, Chapter
from app.schemas.book import BookCreate, BookUpdate, BookResponse

router = APIRouter()

@router.get("/", response_model=List[BookResponse])
async def get_books(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Book).options(selectinload(Book.chapters)).order_by(Book.name))
    books = result.scalars().all()
    return books

@router.post("/", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book(book_in: BookCreate, db: AsyncSession = Depends(get_db)):
    db_book = Book(**book_in.model_dump())
    db.add(db_book)
    try:
        await db.commit()
        await db.refresh(db_book)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_book

@router.post("/bulk", status_code=status.HTTP_201_CREATED)
async def bulk_create_books(books_in: List[BookCreate], db: AsyncSession = Depends(get_db)):
    try:
        new_books = [Book(**b.model_dump()) for b in books_in]
        db.add_all(new_books)
        await db.commit()
        return {"message": f"Successfully imported {len(new_books)} books."}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Bulk import failed: {str(e)}")

@router.put("/{book_id}", response_model=BookResponse)
async def update_book(book_id: UUID, book_in: BookUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Book).options(selectinload(Book.chapters)).filter(Book.id == book_id))
    db_book = result.scalars().first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    update_data = book_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_book, key, value)
        
    await db.commit()
    await db.refresh(db_book)
    return db_book

@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(book_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Book).filter(Book.id == book_id))
    db_book = result.scalars().first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    await db.delete(db_book)
    await db.commit()
    return None
