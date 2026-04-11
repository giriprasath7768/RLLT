import asyncio
import uuid
from sqlalchemy.future import select
from app.db.database import AsyncSessionLocal
from app.db.models import User, Assessment, AssessmentResult

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.name == "giri prasath"))
        user = res.scalars().first()
        if not user:
            print("User 'giri prasath' not found.")
            # Fallback grab any first pending review student
            res2 = await db.execute(select(User).where(User.role == 'student').where(User.assessment_status == 'under_review'))
            user = res2.scalars().first()
            if not user:
                print("No users under review found.")
                return
            
        # Grab all assessments
        res_asm = await db.execute(select(Assessment))
        assessments = res_asm.scalars().all()
        
        count = 0
        for asm in assessments:
            res_ex = await db.execute(select(AssessmentResult).where(AssessmentResult.user_id == user.id, AssessmentResult.assessment_id == asm.id))
            if not res_ex.scalars().first():
                grade = getattr(asm, "grade_1", "0")
                try:
                    fgrade = float(grade) if grade else 0.0
                except:
                    fgrade = 0.0
                
                db.add(AssessmentResult(
                    user_id=user.id,
                    assessment_id=asm.id,
                    selected_choice=1,
                    awarded_grade=fgrade
                ))
                count += 1
        
        await db.commit()
        print(f"Successfully populated {count} historic Assessment Result rows for user: {user.name}")

if __name__ == "__main__":
    asyncio.run(main())
