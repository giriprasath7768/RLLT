import os
import re

folder = r"i:\RLLT\Webapp\frontend\src\pages\admin"

# We want to replace the jsPDF block which looks like:
# const pdf = new jsPDF({ ... \n ... pdf.addImage(..., height);
# The regex can match everything from "const imgData = canvas.toDataURL('image/png');" to "return pdf;"

pattern = re.compile(
    r"const\s+imgData\s*=\s*canvas\.toDataURL\('image/png'\);.*?"
    r"pdf\.addImage\(imgData,\s*'PNG',\s*marginX,\s*marginY,\s*width,\s*height\);\s*return\s+pdf;", 
    re.DOTALL
)

replacement = """const imgData = canvas.toDataURL('image/png');
            
            const pdfWidthPx = canvas.width;
            const pdfHeightPx = canvas.height;
            const pdfOrientation = pdfWidthPx > pdfHeightPx ? 'landscape' : 'portrait';

            const pdf = new jsPDF({
                orientation: pdfOrientation,
                unit: 'px',
                format: [pdfWidthPx, pdfHeightPx]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidthPx, pdfHeightPx);
            return pdf;"""

for filename in os.listdir(folder):
    if filename.endswith(".jsx"):
        path = os.path.join(folder, filename)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        new_content = pattern.sub(replacement, content)
        if new_content != content:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated {filename}")
