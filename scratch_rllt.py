import sys
import json
import urllib.request

req = urllib.request.Request("http://127.0.0.1:8000/api/rllt_lookup")
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        mod5 = [d for d in data if d['module'] == 5]
        print(f"Total rows for module 5: {len(mod5)}")
        if mod5:
            print("First 10 rows:")
            for r in mod5[:10]:
                print(r)
            unique_days = sorted(list(set([r['day'] for r in mod5])))
            print(f"\nUnique days in module 5: {unique_days}")
            unique_scheduled = sorted(list(set([r['scheduled_value_days'] for r in mod5])))
            print(f"Unique scheduled_value_days in module 5: {unique_scheduled}")
except Exception as e:
    print(e)
