import os
import re

folder = r"i:\RLLT\Webapp\frontend\src\pages\admin"

for filename in os.listdir(folder):
    if filename.endswith(".jsx"):
        path = os.path.join(folder, filename)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        # Update tableFontSize default state to 9
        original_content = content
        
        # Look for existing pattern like useState(14) or useState(6)
        content = re.sub(r'const \[tableFontSize, setTableFontSize\] = useState\(\d+\);', 
                         r'const [tableFontSize, setTableFontSize] = useState(9);', 
                         content)

        if content != original_content:
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Set text size to 9 in {filename}")
