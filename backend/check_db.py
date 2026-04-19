import asyncio
import os
import sys

# Add app to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import AsyncSessionLocal
from app.db.models import User, AssessmentResult
from sqlalchemy.future import select

async def main():
    async with AsyncSessionLocal() as session:
        # Find user
        result = await session.execute(select(User).where(User.id == "59b2947b-fb6b-43f0-a1f5-cf15ca724c7b"))
        user = result.scalars().first()
        
        if not user:
            print("User not found!")
            return
            
        print(f"Found User: {user.id} | Email: {user.email} | Role: {user.role}")
        
        # Check results
        from sqlalchemy.orm import selectinload
        results_stmt = select(AssessmentResult).options(selectinload(AssessmentResult.assessment)).where(AssessmentResult.user_id == user.id)
        results = await session.execute(results_stmt)
        assessment_results = results.scalars().all()
        
        print(f"Found {len(assessment_results)} assessment results for this user.")
        for r in assessment_results:
            has_assessment = r.assessment is not None
            print(f"Result ID: {r.id}, Has Assessment: {has_assessment}")
            if has_assessment:
                print(f"  -> Q: {r.assessment.question_text}")
        
if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
