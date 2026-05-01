import os

folder = r"i:\RLLT\Webapp\frontend\src\pages\admin"

jspdf_replacement = """const CSS_SCALE = 3;
            const pdfWidthPx = canvas.width / CSS_SCALE;
            const pdfHeightPx = canvas.height / CSS_SCALE;
            
            // Allow the canvas dimensions to dictate portrait/landscape
            const pdfOrientation = pdfWidthPx > pdfHeightPx ? 'landscape' : 'portrait';

            let pdf;
            if (forPrint) {
                // User explicitly requested SINGLE PAGE print layout for everything.
                pdf = new jsPDF({
                    orientation: pdfOrientation,
                    unit: 'pt',
                    format: 'a4'
                });
                
                const a4Width = pdf.internal.pageSize.getWidth();
                const a4Height = pdf.internal.pageSize.getHeight();
                
                // Standard 30pt hardware margin (~1cm) around the edges.
                const marginSafeW = a4Width - 60;
                const marginSafeH = a4Height - 60;
                
                // Scale aggressively by BOTH dimensions so the entire chart squeezes onto exactly 1 piece of paper natively.
                const ratio = Math.min(marginSafeW / pdfWidthPx, marginSafeH / pdfHeightPx);
                const printW = pdfWidthPx * ratio;
                const printH = pdfHeightPx * ratio;
                
                const marginX = (a4Width - printW) / 2;
                const marginY = (a4Height - printH) / 2;
                
                // Print directly to one page. (Produces ~6pt text on giant tables, approved by user).
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
            original_content = f.read()

        content = original_content

        # Font Replacements for global typography preference:
        content = content.replace("font-family: 'Roboto Condensed', 'Arial Narrow', sans-serif !important;", "font-family: 'Microsoft YaHei', sans-serif !important;")
        content = content.replace("fontFamily: 'Roboto Condensed, sans-serif'", "fontFamily: '\"Microsoft YaHei\", sans-serif'")
        content = content.replace("fontFamily: 'Arial, sans-serif'", "fontFamily: '\"Microsoft YaHei\", sans-serif'")

        # Reverting Print Engine to 1-page geometry:
        start_idx = content.find("const CSS_SCALE = 3;")
        if start_idx != -1:
            end_idx = content.find("return pdf;", start_idx)
            if end_idx != -1:
                end_idx += len("return pdf;")
                content = content[:start_idx] + jspdf_replacement + content[end_idx:]
                
        if content != original_content:
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Reverted to single-page format and mapped Microsoft YaHei font in {filename}")
