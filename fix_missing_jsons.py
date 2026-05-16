import os
import sys

# Ensure backend scripts can be imported
backend_path = os.path.join(os.path.dirname(__file__), "backend")
sys.path.append(backend_path)

try:
    from scripts.extract_pdf import extract_pdf_to_html
except ImportError as e:
    print("Error importing extract_pdf. Please ensure PyMuPDF is installed: pip install PyMuPDF")
    print(f"Details: {e}")
    sys.exit(1)

def main():
    uploads_dir = os.path.join(backend_path, "app", "uploads")
    if not os.path.exists(uploads_dir):
        print(f"Uploads directory not found: {uploads_dir}")
        sys.exit(1)

    print(f"Scanning {uploads_dir} for PDFs without JSONs...")
    
    count = 0
    for filename in os.listdir(uploads_dir):
        if filename.lower().endswith(".pdf"):
            base_name = os.path.splitext(filename)[0]
            json_path = os.path.join(uploads_dir, f"{base_name}.json")
            
            if not os.path.exists(json_path):
                pdf_path = os.path.join(uploads_dir, filename)
                print(f"Missing JSON for {filename}, extracting...")
                try:
                    extract_pdf_to_html(pdf_path, uploads_dir)
                    count += 1
                except Exception as e:
                    print(f"Failed to extract {filename}: {e}")

    print(f"Done. Extracted JSONs for {count} PDFs.")

if __name__ == "__main__":
    main()
