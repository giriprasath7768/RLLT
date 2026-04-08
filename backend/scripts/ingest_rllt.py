import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession
from sqlalchemy.future import select

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.db.models import RlltLookup
from app.db.database import engine, Base

RLLT_LOOKUP_TABLE = [
  [1, 1, 1, 30, "1m", 30], [1, 2, 1, 30, "4m", 30], [1, 3, 1, 30, "5m", 30], [1, 4, 1, 30, "12m", 30], [1, 5, 1, 30, "10m", 30],
  [1, 6, 1, 30, "14m", 30], [1, 7, 1, 30, "28m", 30], [1, 8, 1, 30, "30m", 30], [1, 9, 1, 30, "35m", 30], [1, 10, 1, 30, "49m", 30],
  [2, 1, 1, 30, "2h.30m", 30], [2, 2, 2, 60, "1h.15m", 30], [2, 3, 3, 90, "50m", 30], [2, 4, 4, 120, "40m", 30], [2, 5, 5, 150, "35m", 30],
  [2, 6, 6, 180, "30m", 30], [2, 7, 7, 210, "28m", 30], [2, 8, 8, 240, "25m", 30], [2, 9, 9, 270, "22m", 30], [2, 10, 10, 300, "20m", 30],
  [2, 11, 11, 330, "18m", 30], [2, 12, 12, 360, "15m", 30],
  [3, 1, 1, 40, "1m", 40], [3, 2, 1, 40, "3m", 40], [3, 3, 1, 40, "3m", 40], [3, 4, 1, 40, "10m", 40], [3, 5, 1, 40, "10m", 40],
  [3, 6, 1, 40, "11m", 40], [3, 7, 1, 40, "12m", 40], [3, 8, 1, 40, "20m", 40], [3, 9, 1, 40, "25m", 40], [3, 10, 1, 40, "26m", 40],
  [3, 11, 1, 40, "40m", 40],
  [4, 1, 1, 40, "1h.50m", 40], [4, 2, 2, 80, "58m", 40], [4, 3, 3, 120, "40m", 40], [4, 4, 4, 160, "35m", 40], [4, 5, 5, 200, "28m", 40],
  [4, 6, 7, 280, "23m", 40], [4, 7, 9, 360, "18m", 40],
  [5, 1, 1, 30, "2h.30m", 30], [5, 2, 2, 60, "1h.15m", 30], [5, 3, 3, 90, "55m", 30], [5, 4, 6, 180, "30m", 30], [5, 5, 12, 360, "20m", 30]
]

async def seed_rllt():
    print("Connecting to DB engine to create table if missing...")
    # Base.metadata.create_all(bind=engine) natively doesn't work for async engines
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        # Avoid duplicating
        result = await session.execute(select(RlltLookup))
        existing_data = result.scalars().all()
        if existing_data:
            print("Table already contains data! Skipping seed to prevent duplicates.")
            return

        print("Seeding RLLT Table Data...")
        added = 0
        for entry in RLLT_LOOKUP_TABLE:
            rllt_obj = RlltLookup(
                module=entry[0],
                facet=entry[1],
                phase=entry[2],
                day=entry[3],
                art=str(entry[4]), # In case of casting needs
                scheduled_value_days=entry[5]
            )
            session.add(rllt_obj)
            added += 1
            
        await session.commit()
        print(f"Successfully seeded {added} rows into the RlltLookup table.")

if __name__ == '__main__':
    asyncio.run(seed_rllt())
