import os
import re

folder = r"i:\RLLT\Webapp\frontend\src\pages\admin"

jspdf_pattern = re.compile(
    r"const CSS_SCALE = 3;\s*"
    r"const pdfWidthPx = canvas\.width \/ CSS_SCALE;\s*"
    r"const pdfHeightPx = canvas\.height \/ CSS_SCALE;\s*"
    r"const pdfOrientation = pdfWidthPx > pdfHeightPx \? 'landscape' : 'portrait';s*.*?"
    r"const pdf = new jsPDF\(\{.*?"
    r"return pdf;",
    re.DOTALL
)

jspdf_replacement = """const CSS_SCALE = 3;
            const pdfWidthPx = canvas.width / CSS_SCALE;
            const pdfHeightPx = canvas.height / CSS_SCALE;
            const pdfOrientation = pdfWidthPx > pdfHeightPx ? 'landscape' : 'portrait';

            let pdf;
            if (forPrint) {
                pdf = new jsPDF({
                    orientation: pdfOrientation,
                    unit: 'pt',
                    format: 'a4'
                });
                
                const a4Width = pdf.internal.pageSize.getWidth();
                const a4Height = pdf.internal.pageSize.getHeight();
                
                // Add a guaranteed 30pt hardware margin (~1cm) around the edges.
                // This ensures all printers, strictly preventing mechanical cutoff.
                const marginSafeW = a4Width - 60;
                const marginSafeH = a4Height - 60;
                
                const ratio = Math.min(marginSafeW / pdfWidthPx, marginSafeH / pdfHeightPx);
                const printW = pdfWidthPx * ratio;
                const printH = pdfHeightPx * ratio;
                
                const marginX = (a4Width - printW) / 2;
                const marginY = (a4Height - printH) / 2;
                
                pdf.addImage(imgData, 'PNG', marginX, marginY, printW, printH);
            } else {
                pdf = new jsPDF({
                    orientation: pdfOrientation,
                    unit: 'pt',
                    format: [pdfWidthPx, pdfHeightPx]
                });
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidthPx, pdfHeightPx);
            }

            return pdf;"""

for filename in os.listdir(folder):
    if filename.endswith(".jsx"):
        path = os.path.join(folder, filename)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        if "const CSS_SCALE = 3;" in content:
            new_content = jspdf_pattern.sub(jspdf_replacement, content)
            if new_content != content:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Successfully injected A4 formatting block in {filename}")
