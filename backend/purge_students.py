import asyncio
from sqlalchemy.future import select
from sqlalchemy import delete
from app.db.database import AsyncSessionLocal
from app.db.models import User, AssessmentResult, UserRole

async def main():
    async with AsyncSessionLocal() as db:
        # Fetch all students
        res = await db.execute(select(User).where(User.role == UserRole.student))
        students = res.scalars().all()
        student_ids = [s.id for s in students]
        
        if not student_ids:
            print("No students found to delete.")
            return
            
        print(f"Deleting {len(student_ids)} students and their assessment results...")
        
        # Delete related assessment results first to respect FK
        await db.execute(delete(AssessmentResult).where(AssessmentResult.user_id.in_(student_ids)))
        
        # Delete students
        await db.execute(delete(User).where(User.id.in_(student_ids)))
        
        await db.commit()
        print("Successfully purged all student records and assessment results from the database!")

if __name__ == "__main__":
    asyncio.run(main())
