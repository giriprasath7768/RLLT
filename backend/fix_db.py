import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import AsyncSessionLocal
from app.db.models import User, Location, Assessment, StudentGroup
from sqlalchemy.future import select
from sqlalchemy import update, delete

ADMIN_LOCATION_ID = "fb7e780c-5f00-4b23-a6bf-8159996d2ba9" # OOTY
STUDENT_LOCATION_ID = "a74add04-3fc3-47f6-91a4-25bf4ca64db2" # Ooty

async def main():
    async with AsyncSessionLocal() as session:
        # Migrate Students to Admin's Ooty
        await session.execute(
            update(User)
            .where(User.location_id == STUDENT_LOCATION_ID)
            .values(location_id=ADMIN_LOCATION_ID)
        )
        # Migrate any stray assessments to Admin's Ooty just in case
        await session.execute(
            update(Assessment)
            .where(Assessment.location_id == STUDENT_LOCATION_ID)
            .values(location_id=ADMIN_LOCATION_ID)
        )
        # Migrate Student Groups
        await session.execute(
            update(StudentGroup)
            .where(StudentGroup.location_id == STUDENT_LOCATION_ID)
            .values(location_id=ADMIN_LOCATION_ID)
        )
        
        # Delete duplicate location to prevent future fragmentation
        duplicate_loc = await session.execute(select(Location).where(Location.id == STUDENT_LOCATION_ID))
        if duplicate_loc.scalar_one_or_none():
            await session.execute(delete(Location).where(Location.id == STUDENT_LOCATION_ID))
            
        await session.commit()
        print("Successfully migrated all students to the primary OOTY location and removed duplicate.")

if __name__ == "__main__":
    asyncio.run(main())
