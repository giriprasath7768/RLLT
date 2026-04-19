from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from pydantic import UUID4
from app.db.database import get_db
from app.db.models import WordDocument, User
from app.schemas.documents import DocumentCreate, DocumentUpdate, DocumentResponse
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[DocumentResponse])
async def get_documents(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(WordDocument).where(WordDocument.user_id == current_user.id))
    docs = result.scalars().all()
    return docs

@router.post("/", response_model=DocumentResponse)
async def create_document(doc: DocumentCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_doc = WordDocument(**doc.model_dump(), user_id=current_user.id)
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)
    return new_doc

@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(doc_id: UUID4, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(WordDocument).where(WordDocument.id == doc_id, WordDocument.user_id == current_user.id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.put("/{doc_id}", response_model=DocumentResponse)
async def update_document(doc_id: UUID4, doc_update: DocumentUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(WordDocument).where(WordDocument.id == doc_id, WordDocument.user_id == current_user.id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    update_data = doc_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(doc, key, value)
        
    await db.commit()
    await db.refresh(doc)
    return doc

@router.delete("/{doc_id}")
async def delete_document(doc_id: UUID4, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(WordDocument).where(WordDocument.id == doc_id, WordDocument.user_id == current_user.id))
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    await db.delete(doc)
    await db.commit()
    return {"message": "Document deleted successfully"}
