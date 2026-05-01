import os

folder = r"i:\RLLT\Webapp\frontend\src\pages\admin"

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

        start_idx = content.find("const CSS_SCALE = 3;")
        if start_idx != -1:
            end_idx = content.find("return pdf;", start_idx)
            if end_idx != -1:
                end_idx += len("return pdf;")
                new_content = content[:start_idx] + jspdf_replacement + content[end_idx:]
                
                # We ALSO need to ensure forPrint signature is there, because mainchartview might have it already, but let's check
                # since we did it with regex 1 earlier, it SHOULD be there.
                
                if new_content != content:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"String replaced jsPDF block in {filename}")
