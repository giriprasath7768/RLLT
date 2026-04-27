import urllib.request
import json
import urllib.error

url = "http://localhost:8000/api/ttom_users"

# Test OPTIONS
print("Testing OPTIONS...")
req = urllib.request.Request(url, method="OPTIONS")
req.add_header("Origin", "http://localhost")
req.add_header("Access-Control-Request-Method", "POST")
req.add_header("Access-Control-Request-Headers", "content-type")

try:
    with urllib.request.urlopen(req) as response:
        print("OPTIONS Status Code:", response.status)
        print("OPTIONS Headers:", dict(response.headers))
except urllib.error.HTTPError as e:
    print("OPTIONS Error Status Code:", e.code)
    print("OPTIONS Error Headers:", dict(e.headers))
except Exception as e:
    print("OPTIONS Exception:", e)

# Test POST
print("\nTesting POST...")
post_data = json.dumps({"name": "test"}).encode('utf-8')
req_post = urllib.request.Request(url, data=post_data, method="POST")
req_post.add_header("Origin", "http://localhost")
req_post.add_header("Content-Type", "application/json")

try:
    with urllib.request.urlopen(req_post) as response:
        print("POST Status Code:", response.status)
        print("POST Headers:", dict(response.headers))
        print("POST Body:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("POST Error Status Code:", e.code)
    print("POST Error Headers:", dict(e.headers))
    print("POST Error Body:", e.read().decode('utf-8'))
except Exception as e:
    print("POST Exception:", e)
