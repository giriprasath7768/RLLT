import sys
import os
import json

try:
    import fitz  # PyMuPDF
except ImportError:
    print("PyMuPDF is not installed. Please install it using: pip install PyMuPDF")
    sys.exit(1)

def extract_pdf_to_html(pdf_path, output_dir):
    """
    Extracts a PDF file into structured HTML blocks.
    Saves the HTML into the output_dir with the same base name as the PDF.
    """
    if not os.path.exists(pdf_path):
        print(f"Error: File not found {pdf_path}")
        return

    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"Error opening PDF: {e}")
        return

    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    html_path = os.path.join(output_dir, f"{base_name}.html")
    json_path = os.path.join(output_dir, f"{base_name}.json")
    
    html_content = ["<div class='bookindex-reader-bg p-8 max-w-4xl mx-auto'>"]
    json_content = {"pages": []}
    
    for page_num, page in enumerate(doc):
        html_content.append(f"  <div class='pdf-page mb-8' data-page-number='{page_num + 1}'>")
        page_data = {"page_number": page_num + 1, "paragraphs": []}
        
        # Extract blocks using PyMuPDF dictionary
        blocks = page.get_text("dict")["blocks"]
        for b in blocks:
            if b.get('type') == 0:  # text block
                paragraph_text = ""
                for line in b.get("lines", []):
                    for span in line.get("spans", []):
                        paragraph_text += span.get("text", "")
                    paragraph_text += " "
                
                paragraph_text = paragraph_text.strip()
                if paragraph_text:
                    # Clean up random whitespace
                    paragraph_text = " ".join(paragraph_text.split())
                    
                    # HTML Generation
                    html_content.append(f"    <p class='pdf-selectable-paragraph my-4 text-lg leading-relaxed font-serif' id='para-{page_num + 1}-{len(page_data[\"paragraphs\"])}'>{paragraph_text}</p>")
                    
                    # JSON Generation
                    page_data["paragraphs"].append(paragraph_text)
                    
        html_content.append("  </div>")
        json_content["pages"].append(page_data)
        
    html_content.append("</div>")
    
    # Save HTML
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(html_content))
        
    # Save JSON
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(json_content, f, indent=4, ensure_ascii=False)
        
    print(f"✅ Successfully extracted structured content!")
    print(f"   HTML saved to: {html_path}")
    print(f"   JSON saved to: {json_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python extract_pdf.py <path_to_pdf> <output_directory>")
        sys.exit(1)
        
    pdf_input = sys.argv[1]
    out_dir = sys.argv[2]
    
    os.makedirs(out_dir, exist_ok=True)
    extract_pdf_to_html(pdf_input, out_dir)
