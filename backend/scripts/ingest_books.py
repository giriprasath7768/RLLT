import asyncio
import os
import sys
import pandas as pd
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession, create_async_engine
import uuid

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.db.models import Book, Chapter
from app.db.database import engine

def parse_art(val):
    if pd.isna(val) or val == 'nan': return 0.0
    
    if isinstance(val, (int, float)):
        return float(val)

    val_str = str(val).strip().lower()
    if not val_str: return 0.0
    
    if 'h' in val_str or 'm' in val_str:
        h = 0
        m = 0
        if 'h' in val_str:
            parts = val_str.split('h')
            try: h = float(parts[0])
            except: pass
            val_str = parts[1]
        if 'm' in val_str:
            m_str = val_str.split('m')[0].replace('.', '').strip()
            if m_str:
                try: m = float(m_str)
                except: pass
        return h + m / 60.0

    try:
        return float(val_str)
    except ValueError:
        return 0.0

def parse_ppl(val):
    if pd.isna(val) or val == 'nan': return 0.0
    try:
        return float(val)
    except ValueError:
        return 0.0

async def ingest():
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    excel_path = 'i:/RLLT/Webapp/sampledata/masterchartdata.xlsx'
    df1 = pd.read_excel(excel_path, sheet_name=0)
    df2 = pd.read_excel(excel_path, sheet_name=1)
    
    df1.columns = df1.columns.str.strip()
    df2.columns = df2.columns.str.strip()
    
    df1['BookName'] = df1['BookName'].astype(str).str.strip()
    df2['Book Name'] = df2['Book Name'].astype(str).str.strip()

    books_by_name = {}
    
    async with AsyncSessionLocal() as session:
        # 1. Insert Books
        for _, row in df1.iterrows():
            author_val = str(row.get('Author')) if pd.notna(row.get('Author')) else "Unknown"
            if author_val.lower() == 'nan':
                author_val = "Unknown"
                
            book = Book(
                id=uuid.uuid4(),
                name=row['BookName'],
                short_form=str(row.get('Short_Form', '')),
                author=author_val,
                total_chapters=int(row.get('TotalChapter', 0)),
                total_verses=int(row.get('Total Vers', 0)),
                total_art=round(parse_art(row.get('Total ART', 0.0)), 2),
                ppl=parse_ppl(row.get('PPL', 0.0))
            )
            session.add(book)
            books_by_name[book.name] = book.id
            
        await session.flush()
        
        # 2. Insert Chapters
        for _, row in df2.iterrows():
            b_name = row['Book Name']
            if b_name in books_by_name:
                chapter = Chapter(
                    id=uuid.uuid4(),
                    book_id=books_by_name[b_name],
                    chapter_number=int(row.get('Chapter Number', 0)),
                    verse_count=int(row.get('Verse Count', 0)),
                    art=round(parse_art(row.get('ART', 0.0)), 2)
                )
                session.add(chapter)
                
        await session.commit()
        print("Data ingestion complete!")

if __name__ == '__main__':
    asyncio.run(ingest())
