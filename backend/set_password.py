import asyncio
from sqlalchemy.future import select
from app.db.database import AsyncSessionLocal
from app.db.models import User
from app.core.security import get_password_hash

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.email.ilike("giriprasath7768@gmail.com")))
        user = res.scalars().first()
        if not user:
            print("User 'giriprasath7768@gmail.com' not found. Trying 'giri%'")
            res2 = await db.execute(select(User).where(User.name.ilike("giri%")))
            user = res2.scalars().first()

        if user:
            user.hashed_password = get_password_hash("studentpassword")
            user.is_active = True
            await db.commit()
            print(f"Successfully overrode password for user: {user.email}")
            print(f"NEW PASSWORD: studentpassword")
        else:
            print("No matching user found to override.")

if __name__ == "__main__":
    asyncio.run(main())
