import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.db.models import UserRole
from app.api.auth import get_current_user
from app.db.models import User
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Override auth dependency to allow hitting the endpoint
async def override_get_current_user():
    return User(id="123e4567-e89b-12d3-a456-426614174000", role=UserRole.admin, is_active=True, email="admin@test.com")

app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

def test_create_leader():
    import uuid
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.core.config import settings

    # Fetch a valid admin id directly via synchronous postgres engine if possible
    # We can also just hit the GET /api/admins endpoint!
    print("Fetching an admin ID from API...")
    admins_resp = client.get("/api/admins/")
    
    if admins_resp.status_code == 200 and len(admins_resp.json()) > 0:
        admin_id = admins_resp.json()[0]["id"]
    else:
        print("No valid admins found. Exiting.")
        return

    print("Sending POST request to /api/leaders/")
    response = client.post(
        "/api/leaders/",
        json={
            "name": f"Test Leader {uuid.uuid4().hex[:4]}",
            "email": f"leader{uuid.uuid4().hex[:4]}@gmail.com",
            "mobile_number": "9999999999",
            "address": "123 Test St",
            "admin_id": admin_id,
            "is_active": True
        }
    )
    print(f"Response Status: {response.status_code}")
    print(f"Response Body: {response.json()}")

if __name__ == "__main__":
    test_create_leader()
