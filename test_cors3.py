import urllib.request
import json
import urllib.error

url = "http://localhost:8000/api/ttom_users"
out = {}

req = urllib.request.Request(url, method="OPTIONS")
req.add_header("Origin", "http://localhost")
req.add_header("Access-Control-Request-Method", "POST")
req.add_header("Access-Control-Request-Headers", "content-type")
try:
    with urllib.request.urlopen(req) as response:
        out["options_status"] = response.status
        out["options_headers"] = dict(response.headers)
except urllib.error.HTTPError as e:
    out["options_status"] = e.code
    out["options_headers"] = dict(e.headers)

req_post = urllib.request.Request(url, data=b'{"name":"test"}', method="POST")
req_post.add_header("Origin", "http://localhost")
req_post.add_header("Content-Type", "application/json")
try:
    with urllib.request.urlopen(req_post) as response:
        out["post_status"] = response.status
        out["post_headers"] = dict(response.headers)
        out["post_body"] = response.read().decode('utf-8')
except urllib.error.HTTPError as e:
    out["post_status"] = e.code
    out["post_headers"] = dict(e.headers)
    out["post_body"] = e.read().decode('utf-8')

with open("cors_result.json", "w", encoding="utf-8") as f:
    json.dump(out, f, indent=2)
