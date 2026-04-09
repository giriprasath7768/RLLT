import asyncio
from app.core.config import settings
from app.db.database import AsyncSessionLocal
from app.db.models import User
from sqlalchemy.future import select

async def check():
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User))
            users = result.scalars().all()
            with open("dump.txt", "w", encoding="utf-8") as f:
                f.write(f"Total: {len(users)}\n")
                for u in users:
                    f.write(f"Email: {u.email}\n")
    except Exception as e:
        with open("dump_error.txt", "w", encoding="utf-8") as f:
            f.write(str(e))

asyncio.run(check())
