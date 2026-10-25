import os
import glob

admin_dir = r"i:\RLLT\Webapp\frontend\src\pages\admin"

# Replace text-left with text-center for all Chart files to fulfill the centering requirement
for filename in glob.glob(os.path.join(admin_dir, '*Chart.jsx')) + glob.glob(os.path.join(admin_dir, '*ChartView.jsx')):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'text-left' in content:
        content = content.replace('text-left', 'text-center')
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Centered text in {os.path.basename(filename)}")

print("Done centering")
