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
students = res2.json()

target_student = None
for st in students:
    if st.get("name") and "giri" in st.get("name").lower():
        target_student = st
        break

if not target_student:
    print("Giriprasath not found")
    exit(1)

student_id = target_student["id"]
print("Initial touch counts for", target_student["name"], ":", target_student.get("touch_counts"))

# Perform PUT request to update
put_payload = {
    "transformation": 1,
    "team_transformation": 0,
    "klt_reading_plan": 0
}
res3 = s.put(f"http://localhost:8000/api/students/{student_id}/touch-counts", json=put_payload)
print("PUT response status:", res3.status_code)
print("PUT response body:", json.dumps(res3.json().get("touch_counts"), indent=2))

# Fetch again to see if it persisted
res4 = s.get("http://localhost:8000/api/students")
students_after = res4.json()
target_student_after = None
for st in students_after:
    if st["id"] == student_id:
        target_student_after = st
        break

print("After reload touch counts for", target_student_after["name"], ":", target_student_after.get("touch_counts"))
