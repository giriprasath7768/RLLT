import requests

def test_login():
    url = "http://localhost:8000/api/login"
    data = {
        "username": "admin@example.com",
        "password": "adminpassword"
    }
    try:
        response = requests.post(url, data=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login()
