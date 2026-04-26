import requests

res = requests.get('http://localhost:8000/api/contents/list')
data = res.json()
audios = [c for c in data if c['audio_url']]
for x in audios[:5]:
    print(x['audio_url'])
    print("---")
