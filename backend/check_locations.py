import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import AsyncSessionLocal
from app.db.models import User, Admin, Leader, Location
from sqlalchemy.future import select

async def main():
    async with AsyncSessionLocal() as session:
        print("--- LOCATIONS ---")
        loc_res = await session.execute(select(Location))
        for loc in loc_res.scalars().all():
            print(f"Location: {loc.id} | {loc.city}")
            
        print("\n--- ADMINS ---")
        admin_res = await session.execute(select(Admin))
        for admin in admin_res.scalars().all():
            print(f"Admin: {admin.id} | User ID: {admin.user_id} | Location ID: {admin.location_id}")
            
        print("\n--- LEADERS ---")
        leader_res = await session.execute(select(Leader))
        for leader in leader_res.scalars().all():
            print(f"Leader: {leader.id} | User ID: {leader.user_id} | Admin ID: {leader.admin_id}")
            
        print("\n--- STUDENTS ---")
        student_res = await session.execute(select(User).where(User.role == 'student'))
        students = student_res.scalars().all()
        print(f"Total Students: {len(students)}")
        for s in students:
            print(f"Student: {s.id} | Email: {s.email} | Location ID: {s.location_id}")

if __name__ == "__main__":
    asyncio.run(main())
