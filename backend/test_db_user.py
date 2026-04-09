import asyncio
from app.core.config import settings
from app.db.database import AsyncSessionLocal
from app.db.models import User
from sqlalchemy.future import select

async def check():
    print(f"SMTP Config: {settings.SMTP_HOST}:{settings.SMTP_PORT} User: {settings.SMTP_USERNAME}")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        print(f"Total Users: {len(users)}")
        for i, u in enumerate(users[:10]):
            print(f"[{i}] Email: '{u.email}' Role: {u.role}")

asyncio.run(check())
