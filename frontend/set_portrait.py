import os

folder = r"i:\RLLT\Webapp\frontend\src\pages\admin"

for filename in os.listdir(folder):
    if filename.endswith(".jsx"):
        path = os.path.join(folder, filename)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        # We are looking for the 'forPrint' section where we forced landscape
        # pdf = new jsPDF({
        #     orientation: 'landscape',
        #     unit: 'pt',
        #     format: 'a4'
        # });
        
        target = "orientation: 'landscape',"
        replacement = "orientation: 'portrait',"
        
        if "if (forPrint) {" in content and target in content:
            new_content = content.replace(target, replacement, 1) # Only replace the first one which is inside if (forPrint) 
            if new_content != content:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated to portrait in {filename}")
