import requests
import json

url = "http://localhost:8000/api/ttom_users"

headers = {
    "Origin": "http://localhost",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type"
}
try:
    print("Testing OPTIONS...")
    response = requests.options(url, headers=headers)
    print("OPTIONS Status Code:", response.status_code)
    print("OPTIONS Headers:", dict(response.headers))

    print("\nTesting POST (simulating 422 to see if CORS is returned)...")
    post_headers = {
        "Origin": "http://localhost",
        "Content-Type": "application/json"
    }
    response2 = requests.post(url, headers=post_headers, json={"name": "test"})
    print("POST Status Code:", response2.status_code)
    print("POST Headers:", dict(response2.headers))
    try:
        print("POST Response:", response2.json())
    except:
        print("POST Response:", response2.text)
except Exception as e:
    print("Error:", e)
