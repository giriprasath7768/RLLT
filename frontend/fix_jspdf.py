import os
import re

folder = r"i:\RLLT\Webapp\frontend\src\pages\admin"

pattern = re.compile(
    r"const imgData = canvas\.toDataURL\('image/png'\);\s*"
    r"const pdfWidthPx = canvas\.width;\s*"
    r"const pdfHeightPx = canvas\.height;\s*"
    r"const pdfOrientation = pdfWidthPx > pdfHeightPx \? 'landscape' : 'portrait';\s*"
    r"const pdf = new jsPDF\(\{\s*"
    r"orientation: pdfOrientation,\s*"
    r"unit: 'px',\s*"
    r"format: \[pdfWidthPx, pdfHeightPx\]\s*"
    r"\}\);\s*"
    r"pdf\.addImage\(imgData, 'PNG', 0, 0, pdfWidthPx, pdfHeightPx\);\s*"
    r"return pdf;"
)

replacement = """const imgData = canvas.toDataURL('image/png');
            
            // Revert back to logical CSS DOM dimensions by dividing by the scale factor (3)
            // This ensures default PDF zoom levels present the text at normal display sizes 
            // rather than zoomed out drastically from 3660 physical canvas units.
            const CSS_SCALE = 3;
            const pdfWidthPx = canvas.width / CSS_SCALE;
            const pdfHeightPx = canvas.height / CSS_SCALE;
            const pdfOrientation = pdfWidthPx > pdfHeightPx ? 'landscape' : 'portrait';

            const pdf = new jsPDF({
                orientation: pdfOrientation,
                unit: 'pt', // use points for perfect digital 1:1 scaling out of the box
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
            print(f"Updated logical layout scale in {filename}")
