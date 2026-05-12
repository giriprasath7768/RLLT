import urllib.request
import json
req = urllib.request.urlopen("http://localhost:8000/api/books")
data = json.loads(req.read())
print([(d.get('name'), d.get('short_form'), d.get('author')) for d in data[:10]])
with open("test_books.json", "w") as f:
    json.dump(data, f)
