import os
import re

folder = r"i:\RLLT\Webapp\frontend\src\pages\admin"

# Regex pattern to find scale inside html2canvas objects or close enough:
pattern = re.compile(r'scale:\s*\d+')

for filename in os.listdir(folder):
    if filename.endswith(".jsx"):
        path = os.path.join(folder, filename)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        # If it uses html2canvas to export PDF
        if "html2canvas" in content and "scale:" in content:
            new_content = pattern.sub('scale: 3', content)
            if new_content != content:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Regex Updated {filename}")
