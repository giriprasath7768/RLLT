import sys
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check save payload logic
    matches = re.findall(r'formData\.append\("state_payload".*?\);', content)
    print("Found save_payload logic:", matches)
    
    load_matches = re.findall(r'const parsed = JSON\.parse\(.*?\);', content)
    print("Found load logic:", load_matches)

process_file(r'i:\RLLT\Webapp\frontend\src\pages\admin\TwentyFourSevenChart.jsx')
