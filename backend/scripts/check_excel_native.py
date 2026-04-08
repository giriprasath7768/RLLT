import zipfile
import xml.etree.ElementTree as ET
import sys
import re

def get_shared_strings(zf):
    try:
        xml_data = zf.read('xl/sharedStrings.xml')
        root = ET.fromstring(xml_data)
        ns = {'ns': root.tag.split('}')[0].strip('{')} if '}' in root.tag else {}
        strings = []
        for si in root.findall('.//ns:si', ns) if ns else root.findall('.//si'):
            t = si.find('.//ns:t', ns) if ns else si.find('.//t')
            if t is not None:
                strings.append(t.text or '')
            else:
                strings.append('')
        return strings
    except KeyError:
        return []

def extract_headers(file_path):
    print(f"Reading {file_path}...")
    try:
        with zipfile.ZipFile(file_path, 'r') as zf:
            shared_strings = get_shared_strings(zf)
            
            # Read sheet1.xml
            sheet_xml = zf.read('xl/worksheets/sheet1.xml')
            root = ET.fromstring(sheet_xml)
            ns = {'ns': root.tag.split('}')[0].strip('{')} if '}' in root.tag else {}
            
            # Find the first row
            sheetData = root.find('.//ns:sheetData', ns) if ns else root.find('.//sheetData')
            if sheetData is None:
                print("No sheet data found.")
                return
                
            first_row = sheetData.find('.//ns:row', ns) if ns else sheetData.find('.//row')
            if first_row is None:
                print("No rows found.")
                return
                
            headers = []
            cells = first_row.findall('.//ns:c', ns) if ns else first_row.findall('.//c')
            
            for cell in cells:
                val_node = cell.find('.//ns:v', ns) if ns else cell.find('.//v')
                if val_node is not None:
                    obj_type = cell.get('t')
                    if obj_type == 's':  # Shared string
                        idx = int(val_node.text)
                        headers.append(shared_strings[idx])
                    else:
                        headers.append(val_node.text)
                else:
                    headers.append('')
                    
            print("\n--- EXACT HEADERS EXTRACTED ---")
            print(headers)
            print("-------------------------------")
            
    except Exception as e:
        print(f"Error parsing ZIP/XML: {e}")

if __name__ == "__main__":
    extract_headers("sampledata/Bookmaster.xlsx")
