from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID
import uuid

from app.db.database import get_db
from app.db.models import Book, Chapter
from app.schemas.book import BookCreate, BookUpdate, BookResponse

router = APIRouter()

@router.get("", response_model=List[BookResponse])
async def get_books(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Book).options(selectinload(Book.chapters)).order_by(Book.name))
    books = result.scalars().all()
    return books

@router.get("/", response_model=List[BookResponse], include_in_schema=False)
async def get_books_slash(db: AsyncSession = Depends(get_db)):
    return await get_books(db)

@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book(book_in: BookCreate, db: AsyncSession = Depends(get_db)):
    db_book = Book(id=uuid.uuid4(), **book_in.model_dump())
    db.add(db_book)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
        
    result = await db.execute(select(Book).options(selectinload(Book.chapters)).filter(Book.id == db_book.id))
    return result.scalars().first()

@router.post("/", response_model=BookResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_book_slash(book_in: BookCreate, db: AsyncSession = Depends(get_db)):
    return await create_book(book_in, db)


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
    
    result = await db.execute(select(Book).options(selectinload(Book.chapters)).filter(Book.id == book_id))
    return result.scalars().first()

@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(book_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Book).filter(Book.id == book_id))
    db_book = result.scalars().first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    await db.delete(db_book)
    await db.commit()
    return None
