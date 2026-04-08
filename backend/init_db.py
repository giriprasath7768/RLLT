import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from app.db.database import Base
from app.db.models import User, UserRole, PasswordReset, Location, Admin, Leader, SuperAdmin, Assessment
from app.core.security import get_password_hash
from app.core.config import settings

# If running from outside docker, we might need to override the URL
DB_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://postgres:postgrespassword@localhost:5432/media_platform")
engine = create_async_engine(DB_URL)

async def init_db():
    print("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    print("Database tables created.")

    # Create a test super_admin
    from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession
    
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        # Create Locations
        loc1 = Location(continent="Asia", country="India", city="Mumbai")
        loc2 = Location(continent="Europe", country="UK", city="London")
        session.add_all([loc1, loc2])
        await session.flush()

        # Create a test super_admin
        test_user = User(
            email="admin@example.com",
            hashed_password=get_password_hash("adminpassword"),
            role=UserRole.super_admin,
            is_active=True
        )
        session.add(test_user)
        await session.flush()
        
        super_admin_profile = SuperAdmin(
            user_id=test_user.id,
            name="Super Administrator",
            mobile_number="0000000000",
            address="Headquarters",
            profile_image_url="https://primefaces.org/cdn/primereact/images/avatar/amyelsner.png"
        )
        session.add(super_admin_profile)
        
        # Create a test admin user and profile
        admin_user = User(
            email="admin_user@example.com",
            hashed_password=get_password_hash("adminpassword"),
            role=UserRole.admin,
            is_active=True
        )
        session.add(admin_user)
        await session.flush()

        admin_profile = Admin(
            user_id=admin_user.id,
            name="Primary Admin",
            mobile_number="1234567890",
            address="123 Tech Park",
            location_id=loc1.id
        )
        session.add(admin_profile)

        test_ttom = User(
            email="ttom@example.com",
            hashed_password=get_password_hash("ttompassword"),
            role=UserRole.ttom_user,
            is_active=True
        )
        session.add(test_ttom)
        await session.commit()
    
    print("Initial data seeded.")
    print("Test users created: admin@example.com (super_admin), admin_user@example.com (admin), ttom@example.com (ttom_user).")

if __name__ == "__main__":
    asyncio.run(init_db())
