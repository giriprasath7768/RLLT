import os

folder = r"i:\RLLT\Webapp\frontend\src\pages\admin"

for filename in os.listdir(folder):
    if filename.endswith(".jsx"):
        path = os.path.join(folder, filename)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        original_content = content

        # Fix invalid Javascript string boundaries caused by previously nested quotes
        content = content.replace("''Arial Narrow', Arial, sans-serif'", "'\"Arial Narrow\", Arial, sans-serif'")
        
        if content != original_content:
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Fixed quotes in {filename}")

