import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Load DATABASE_URL from environment or use config settings
DB_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://postgres:postgrespassword@localhost:5432/media_platform")

async def add_column():
    print(f"Connecting to database: {DB_URL}")
    engine = create_async_engine(DB_URL)
    try:
        async with engine.begin() as conn:
            print("Checking/adding word_editor_touches column to student_touch_counts...")
            await conn.execute(text("ALTER TABLE student_touch_counts ADD COLUMN IF NOT EXISTS word_editor_touches INTEGER DEFAULT 0;"))
            print("Successfully added word_editor_touches column to student_touch_counts!")
    except Exception as e:
        print(f"Error executing migration: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(add_column())
