import requests
import json

s = requests.Session()
login_payload = {
    "username": "admin@example.com",
    "password": "adminpassword"
}
res = s.post("http://localhost:8000/api/auth/login", data=login_payload)
print("Login status:", res.status_code)

res2 = s.get("http://localhost:8000/api/students")
print("Students status:", res2.status_code)
try:
    students = res2.json()
    for st in students:
        if st.get("name") and "giri" in st.get("name").lower() or st.get("email") and "giri" in st.get("email").lower():
            print("Found Giriprasath:")
            print(json.dumps(st, indent=2))
except Exception as e:
    print("Error parsing JSON:", e)
