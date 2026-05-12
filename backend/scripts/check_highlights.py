import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))

# Need to import config to get DB URL
from app.core.config import settings

async def check_db():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(text("SELECT count(*) FROM student_highlights"))
        count = result.scalar()
        print(f"Total highlights in DB: {count}")
        
        if count > 0:
            result = await session.execute(text("SELECT * FROM student_highlights LIMIT 5"))
            for row in result.fetchall():
                print(row)

if __name__ == "__main__":
    asyncio.run(check_db())
