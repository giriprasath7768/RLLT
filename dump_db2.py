import urllib.request
import json

req = urllib.request.Request('http://localhost:8000/api/contents/list')
with urllib.request.urlopen(req) as res:
    data = json.loads(res.read().decode('utf-8'))
    audios = [c for c in data if c.get('audio_url')]
    for c in audios[:5]:
        print("AUDIO:", c.get('audio_url'))
        print("LANG:", c.get('audio_language'))
        print("---")
