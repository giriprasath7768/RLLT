import asyncio
import os
import sys
import pandas as pd
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession
from sqlalchemy.future import select

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.db.models import Book, Chapter
from app.db.database import engine

def parse_art_advanced(val):
    if pd.isna(val) or val == 'nan': return 0.0
    
    # Generic float conversion for raw numbers from Excel
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

async def update():
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    print("Loading Excel file...")
    excel_path = 'i:/RLLT/Webapp/sampledata/masterchartdata.xlsx'
    
    try:
        # The original script read sheet_name=1 for chapters
        df2 = pd.read_excel(excel_path, sheet_name=1)
    except Exception as e:
        print(f"Could not load Excel: {e}")
        return

    df2.columns = df2.columns.str.strip()
    df2['Book Name'] = df2['Book Name'].astype(str).str.strip()

    print("Fetching Chapters from database...")
    async with AsyncSessionLocal() as session:
        # Get all chapters joined with Book, so we know their book name
        result = await session.execute(select(Chapter, Book).join(Book, Chapter.book_id == Book.id))
        rows = result.all()
        
        # Build lookup dict: (book_name, chapter_number) -> chapter object
        db_chapters = {}
        for chapter, book in rows:
            db_chapters[(book.name.strip(), chapter.chapter_number)] = chapter
            
        print(f"Loaded {len(db_chapters)} chapters from DB. Comparing to Excel...")
        
        updated_count = 0
        
        for _, row in df2.iterrows():
            b_name = str(row.get('Book Name', '')).strip()
            try:
                c_num = int(row.get('Chapter Number', 0))
            except:
                continue
                
            raw_art = row.get('ART', 0.0)
            parsed_art = parse_art_advanced(raw_art)
            
            key = (b_name, c_num)
            if key in db_chapters:
                chapter = db_chapters[key]
                if chapter.art != round(parsed_art, 2):
                    chapter.art = round(parsed_art, 2)
                    updated_count += 1
                
        if updated_count > 0:
            print(f"Found {updated_count} chapters requiring an ART update. Committing...")
            await session.commit()
            print("Data update complete!")
        else:
            print("No zeroed ART columns needed updating.")

if __name__ == '__main__':
    asyncio.run(update())
