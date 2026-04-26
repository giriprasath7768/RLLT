import requests
import json

url = 'http://localhost:8000/api/contents/sync'

files = [
    ('audios', ('file1.mp3', b'file1data', 'audio/mpeg')),
    ('audios', ('file2.mp3', b'file2data', 'audio/mpeg')),
]
data = {
    'book_id': '6b1d2a96-070c-4a00-b6fe-efcc1a9230f5',
    'chapter_id': '3054a7b8-4bc4-4034-81c2-cf2914ace358',
    'audio_languages': json.dumps(['Lang1', 'Lang2']),
    'existing_audios': '[]'
}

try:
    response = requests.post(url, data=data, files=files)
    print(response.status_code)
    print(response.text)
except Exception as e:
    print(e)
