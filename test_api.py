import urllib.request as r
req = r.Request('http://localhost:8000/api/forgot-password', data=b'{"email":"reallifeleadershiptraining@gmail.com"}', headers={'Content-Type':'application/json'})
try:
    res = r.urlopen(req)
    print(res.read().decode())
except Exception as e:
    print(e)
