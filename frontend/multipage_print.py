import os

folder = r"i:\RLLT\Webapp\frontend\src\pages\admin"

jspdf_replacement = """const CSS_SCALE = 3;
            const pdfWidthPx = canvas.width / CSS_SCALE;
            const pdfHeightPx = canvas.height / CSS_SCALE;
            const pdfOrientation = pdfWidthPx > pdfHeightPx ? 'landscape' : 'portrait';

            let pdf;
            if (forPrint) {
                // For Physical Prints, we must prioritize TEXT SIZE (Width Scaling) over forcing height to fit 1 page.
                pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'pt',
                    format: 'a4'
                });
                
                const a4W = pdf.internal.pageSize.getWidth();
                const a4H = pdf.internal.pageSize.getHeight();
                
                const marginSafeW = a4W - 60;
                const marginSafeH = a4H - 60;
                
                // Scale width exactly to fit the horizontal boundaries. Ignore height (allow multi-page)
                const ratio = marginSafeW / pdfWidthPx;
                const printW = pdfWidthPx * ratio;
                const printH = pdfHeightPx * ratio;
                
                const marginX = (a4W - printW) / 2;
                const marginY = 30; // 30pt top margin
                
                let heightLeft = printH;
                let position = marginY;
                
                // PAGE 1
                pdf.addImage(imgData, 'PNG', marginX, position, printW, printH);
                heightLeft -= marginSafeH;
                
                // ANY REMAINING PAGES
                while (heightLeft > 0) {
                    position = position - marginSafeH; 
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', marginX, position, printW, printH);
                    heightLeft -= marginSafeH;
                }
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
                
                if new_content != content:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"Injected multi-page pagination print algorithm in {filename}")
