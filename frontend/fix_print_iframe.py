import os
import re

folder = r"i:\RLLT\Webapp\frontend\src\pages\admin"

# Regex to find handlePrint block and replace it entirely to use iframe hidden injection

handleprint_pattern = re.compile(
    r"const handlePrint = async \(\) => \{.+?(?:printWindow|toast\.current.+?Popup Blocked.+?)\}.+?catch \(e\) \{.+?print Failed.+?\}\n\s*\};",
    re.DOTALL
)

handleprint_replacement = """const handlePrint = async () => {
        try {
            toast.current?.show({ severity: 'info', summary: 'Processing', detail: 'Preparing perfect print layout...', life: 2000 });
            const pdf = await generatePdfBlob(false, true);
            pdf.autoPrint();
            const blobUrl = pdf.output('bloburl');

            // Inject an invisible iframe to seamlessly load the PDF and trigger the native print dialog without popup blockers!
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            iframe.src = blobUrl;
            document.body.appendChild(iframe);

            // Once the iframe loads the PDF payload, the embedded autoPrint() script fires immediately.
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
            print(f"Updated iframe print handle in {filename}")
