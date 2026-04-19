import asyncio
import random
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.db.models import User, UserRole, Location, Admin
from app.core.security import get_password_hash

async def update_students():
    async with AsyncSessionLocal() as db:
        # Create or get location
        stmt = select(Location).where(Location.city == "Ooty")
        result = await db.execute(stmt)
        location = result.scalars().first()
        if not location:
            location = Location(continent="Asia", country="India", city="Ooty")
            db.add(location)
            await db.commit()
            await db.refresh(location)
            print("Location Ooty created.")
        
        # Create or get admin Giriprasad
        stmt_user = select(User).where(User.email == "giriprasad@admin.com")
        result_user = await db.execute(stmt_user)
        admin_user = result_user.scalars().first()
        if not admin_user:
            admin_user = User(
                email="giriprasad@admin.com",
                hashed_password=get_password_hash("password"),
                role=UserRole.admin,
                is_active=True,
                name="Giriprasad",
                location_id=location.id
            )
            db.add(admin_user)
            await db.commit()
            await db.refresh(admin_user)
            
            admin_profile = Admin(
                user_id=admin_user.id,
                name="Giriprasad",
                mobile_number="9999999999",
                address="Admin Office, Ooty",
                location_id=location.id
            )
            db.add(admin_profile)
            await db.commit()
            print("Admin Giriprasad created.")
        else:
            # ensure location matches
            if admin_user.location_id != location.id:
                admin_user.location_id = location.id
            
            stmt_profile = select(Admin).where(Admin.user_id == admin_user.id)
            result_profile = await db.execute(stmt_profile)
            admin_profile = result_profile.scalars().first()
            if not admin_profile:
                admin_profile = Admin(
                    user_id=admin_user.id,
                    name="Giriprasad",
                    mobile_number="9999999999",
                    address="Admin Office, Ooty",
                    location_id=location.id
                )
                db.add(admin_profile)
                await db.commit()
            elif admin_profile.location_id != location.id:
                admin_profile.location_id = location.id
                await db.commit()
            print("Admin Giriprasad retrieved/updated.")

        # Update mock students
        stmt_students = select(User).where(User.email.like("student_mock_%@test.com"))
        result_students = await db.execute(stmt_students)
        students = result_students.scalars().all()
        
        for stu in students:
            # Assign age that falls under Stage 1 (e.g., 13-17, 38-42, 63-67)
            # as per frontend calculateStudentLevel logic
            age = random.choice([13, 14, 15, 16, 17, 38, 39, 40, 41, 42, 63, 64, 65, 66, 67])
            # Set stage specifically to 1
            stu.stage = "1"
            
            # Since dob determines the category in frontend dynamically,
            # this aligns them to stage 1 based on their age category.
            stu.dob = datetime.now(timezone.utc) - timedelta(days=365.25 * age)  
            
            # Associate to Ooty location
            stu.location_id = location.id
            
        await db.commit()
        print(f"Updated {len(students)} mock students successfully to stage 1, location Ooty.")

if __name__ == "__main__":
    asyncio.run(update_students())
