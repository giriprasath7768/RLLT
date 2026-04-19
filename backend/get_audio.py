import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
import pprint

DATABASE_URL = "postgresql+asyncpg://postgres:postgrespassword@localhost:5432/media_platform"
engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def check_audio():
    async with AsyncSessionLocal() as db:
        result = await db.execute(text("""
            SELECT c.audio_url
            FROM contents c 
            JOIN books b ON c.book_id = b.id 
            JOIN chapters ch ON c.chapter_id = ch.id 
            WHERE b.name ILIKE '%psalm%' AND ch.chapter_number = 1
        """))
        contents = result.fetchall()
        print("AUDIO URLS:")
        for c in contents:
            print(str(c[0]))

if __name__ == "__main__":
    asyncio.run(check_audio())
