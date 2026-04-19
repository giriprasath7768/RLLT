import asyncio
import random
from app.db.database import AsyncSessionLocal
from app.db.models import User, UserRole
from app.core.security import get_password_hash

async def seed_students():
    async with AsyncSessionLocal() as db:
        # Create 29 student mock data
        password_hash = get_password_hash("password")
        for i in range(1, 30):
            mock_student = User(
                email=f"student_mock_{i}@test.com",
                hashed_password=password_hash,
                role=UserRole.student,
                is_active=True,
                name=f"Mock Student {i}",
                mobile_number=f"555000{i:02d}",
                category="Standard",
                stage="Initial",
                assessment_marks=random.randint(40, 100),
                enrollment_number=f"ENR-MOCK-{i}"
            )
            db.add(mock_student)
        
        await db.commit()
        print("29 test students added successfully")

if __name__ == "__main__":
    asyncio.run(seed_students())
