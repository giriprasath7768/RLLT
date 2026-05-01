import os

folder = r"i:\RLLT\Webapp\frontend\src\pages\admin"

for filename in os.listdir(folder):
    if filename.endswith(".jsx"):
        path = os.path.join(folder, filename)
        with open(path, "r", encoding="utf-8") as f:
            original_content = f.read()

        content = original_content

        # Since we enforced single page, the entire chart squishes by a factor of ~ 0.43
        # Therefore, we MUST artificially multiply the user's requested (pt) sizes by 2.3
        # inside the digital CSS DOM, so when the squash naturally occurs during print format, 
        # the text lands perfectly into the 8 - 18pt range on the final physical document.
        
        # Original Body (was 9) -> requested 8-10pt. Target 20.
        content = content.replace("getFS(9)", "getFS(20)")
        
        # Original Header & Labels (was 11) -> requested 10-12pt. Target 25.
        content = content.replace("getFS(11)", "getFS(25)")
        content = content.replace("getFS(10)", "getFS(23)")
        
        # Original Title (was 16) -> requested 14-18pt. Target 36.
        content = content.replace("getFS(16)", "getFS(36)")

        if content != original_content:
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Compensated typographical scaling ratio natively in {filename}")
