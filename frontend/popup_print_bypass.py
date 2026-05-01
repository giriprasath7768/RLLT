import os
import re

folder = r"i:\RLLT\Webapp\frontend\src\pages\admin"

# Regex to find handlePrint block and replace it entirely

handleprint_pattern = re.compile(
    r"const handlePrint = async \(\) => \{.+?(?:iframe\.src|toast\.current.+?Processing.+?)\}.+?catch \(e\) \{.+?Print Failed.+?\}\n\s*\};",
    re.DOTALL | re.IGNORECASE
)

handleprint_replacement = """const handlePrint = async () => {
        try {
            // STEP 1: Synchronously open the popup to bypass the blocker immediately on click
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                toast.current?.show({ severity: 'warn', summary: 'Popup Blocked', detail: 'Please allow popups for this site to view the print format.', life: 5000 });
                return;
            }
            
            // Show a visual loading state in the popup
            printWindow.document.write(`
                <html>
                <head><title>Generating Print...</title></head>
                <body style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; background:#f3f4f6;">
                    <h2>Preparing High-Quality Print Document...</h2>
                </body>
                </html>
            `);

            toast.current?.show({ severity: 'info', summary: 'Processing', detail: 'Preparing perfect print layout...', life: 2000 });
            
            // STEP 2: Asynchronously generate the perfectly scaled A4 PDF
            const pdf = await generatePdfBlob(false, true);
            pdf.autoPrint();
            const blobUrl = pdf.output('bloburl');

            // STEP 3: Redirect the already-trusted popup to the generated blob
            printWindow.location.href = blobUrl;

        } catch (e) {
            console.error(e);
            toast.current?.show({ severity: 'error', summary: 'Print Failed', detail: 'Could not prepare perfect document for printing.', life: 3000 });
        }
    };"""

for filename in os.listdir(folder):
    if filename.endswith(".jsx"):
        path = os.path.join(folder, filename)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        new_content = handleprint_pattern.sub(handleprint_replacement, content)
        if new_content != content:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated proxy print window in {filename}")
