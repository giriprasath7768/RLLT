import sys
import os

# Add the project root to the python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'app')))

from app.services.email_service import send_leader_creation_email
import asyncio

print("Sending test email...")
result = send_leader_creation_email("giridharanm13@gmail.com", "Test Leader", "temp123")
print(f"Result: {result}")
