import os
import re

folder = r"i:\RLLT\Webapp\frontend\src\pages\admin"

# Regex 1: update generatePdfBlob signature
sig_pattern = re.compile(r"const generatePdfBlob = async \((returnCanvasOnly = false)\) => \{")

# Regex 2: update jsPDF logic block (targeting our exact previous replacement)
jspdf_pattern = re.compile(
    r"const CSS_SCALE = 3;\s*"
    r"const pdfWidthPx = canvas\.width / CSS_SCALE;\s*"
    r"const pdfHeightPx = canvas\.height / CSS_SCALE;\s*"
    r"const pdfOrientation = pdfWidthPx > pdfHeightPx \? 'landscape' : 'portrait';\s*"
    r"const pdf = new jsPDF\(\{\s*"
    r"orientation: pdfOrientation,\s*"
    r"unit: 'pt',\s*"
    r"format: \[pdfWidthPx, pdfHeightPx\]\s*"
    r"\}\);\s*"
    r"pdf\.addImage\(imgData, 'PNG', 0, 0, pdfWidthPx, pdfHeightPx\);\s*"
    r"return pdf;"
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
                
                const ratio = Math.min(a4Width / pdfWidthPx, a4Height / pdfHeightPx);
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

# Regex 3: update handlePrint to pass true
handleprint_pattern = re.compile(r"(const handlePrint = async \(\) => \{.+?const pdf = await generatePdfBlob\()(\);)", re.DOTALL)


for filename in os.listdir(folder):
    if filename.endswith(".jsx"):
        path = os.path.join(folder, filename)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        # Only touch files containing generatePdfBlob
        if "generatePdfBlob" in content:
            new_content = sig_pattern.sub(r"const generatePdfBlob = async (returnCanvasOnly = false, forPrint = false) => {", content)
            new_content = jspdf_pattern.sub(jspdf_replacement, new_content)
            
            # This handles replacing `generatePdfBlob();` ONLY inside handlePrint
            new_content = handleprint_pattern.sub(r"\g<1>false, true);", new_content)

            if new_content != content:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated print format in {filename}")
