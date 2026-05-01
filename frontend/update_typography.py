import os
import re

folder = r"i:\RLLT\Webapp\frontend\src\pages\admin"

for filename in os.listdir(folder):
    if filename.endswith(".jsx"):
        path = os.path.join(folder, filename)
        with open(path, "r", encoding="utf-8") as f:
            original_content = f.read()

        content = original_content

        # 1. Revert tableFontSize state from 9 back to 14 so math doesn't double-subtract.
        content = re.sub(r'const \[tableFontSize, setTableFontSize\] = useState\(\d+\);', 
                         r'const [tableFontSize, setTableFontSize] = useState(14);', 
                         content)

        # 2. Swap Font Families back to Arial Narrow exclusively.
        content = content.replace("'Microsoft YaHei', sans-serif", "'Arial Narrow', Arial, sans-serif")
        content = content.replace('"Microsoft YaHei", sans-serif', "'Arial Narrow', Arial, sans-serif")

        # 3. Typography Adjustments natively on getFS() attributes
        
        # Body text mappings. Usually previously 14px -> map to 9. (8-10 pt requested)
        content = content.replace("getFS(14)", "getFS(9)")
        content = content.replace("getFS(13)", "getFS(9)")
        
        # Header text mappings. Usually previously 11px, or 12px -> map to 11. (10-12 pt requested)
        content = content.replace("getFS(12)", "getFS(11)")
        content = content.replace("getFS(11)", "getFS(11)") # Remains 11.
        
        # Title text mappings. Usually previously 24px, 20px, 18px -> map to 16. (14-18 pt requested)
        content = content.replace("getFS(24)", "getFS(16)")
        content = content.replace("getFS(26)", "getFS(16)")
        content = content.replace("getFS(22)", "getFS(16)")
        content = content.replace("getFS(20)", "getFS(16)")
        content = content.replace("getFS(18)", "getFS(16)")

        if content != original_content:
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Updated typography rules natively in {filename}")
