import requests

try:
    # First, login as super admin
    login_data = {"username": "admin@example.com", "password": "securepassword"}
    print("Logging in...")
    res = requests.post("http://localhost:8000/api/login", data=login_data)
    print("Login status:", res.status_code)
    
    cookies = res.cookies
    
    # Then try /api/me
    print("Fetching /api/me...")
    res_me = requests.get("http://localhost:8000/api/me", cookies=cookies)
    print("/api/me status:", res_me.status_code)
    print("/api/me response:", res_me.text)
    
    # Then try /api/users/me just in case
    print("Fetching /api/users/me...")
    res_users_me = requests.get("http://localhost:8000/api/users/me", cookies=cookies)
    print("/api/users/me status:", res_users_me.status_code)

except Exception as e:
    print(f"Error: {e}")
