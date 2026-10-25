import os
import glob
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip files that don't have save_payload logic (not editable charts)
    if 'formData.append("state_payload"' not in content:
        print(f"Skipping {filepath} - no state_payload")
        return

    # Skip MainChart as we already did it manually
    if filepath.endswith('MainChart.jsx') and 'frontend\\src\\pages\\admin\\MainChart.jsx' in filepath:
        print(f"Skipping {filepath} - already done")
        return

    print(f"Processing {filepath}")

    # Add TransformationColorPopup import
    if 'TransformationColorPopup' not in content:
        content = content.replace("import axios from 'axios';", "import axios from 'axios';\nimport { TransformationColorPopup } from '../../components/TransformationColorPopup';")

    # Add inputColors state
    if 'const [inputColors, setInputColors]' not in content:
        content = re.sub(r'(const \[[a-zA-Z]+,\s*set[a-zA-Z]+\] = useState\(.*?\);)', r'\1\n    const [inputColors, setInputColors] = useState({});', content, count=1)

    # Wrap state_payload when saving
    # Find exact string of formData.append
    save_match = re.search(r'formData\.append\("state_payload",\s*JSON\.stringify\(([a-zA-Z]+)\)\);', content)
    if save_match:
        state_var = save_match.group(1)
        content = content.replace(
            save_match.group(0),
            f'formData.append("state_payload", JSON.stringify({{ _isWrapped: true, payload: {state_var}, inputColors }}));'
        )

    # Unwrap state_payload when loading
    if 'const parsed = JSON.parse(data.state_payload);' in content and 'parsed._isWrapped' not in content:
        # Find the set... call inside the try block
        set_match = re.search(r'if \(Array\.isArray\(parsed\)\) \{\s*(set[a-zA-Z]+\(.*?\);\s*set[a-zA-Z]+\(parsed\);)\s*\}', content)
        if set_match:
            statements = set_match.group(1)
            old_load = f"""if (Array.isArray(parsed)) {{
                                {statements}
                            }}"""
            
            # The payload might be assigned to different variables.
            statements_with_payload = statements.replace('parsed', 'parsed.payload')
            
            new_load = f"""if (parsed && parsed._isWrapped) {{
                                setInputColors(parsed.inputColors || {{}});
                                if (Array.isArray(parsed.payload)) {{
                                    {statements_with_payload}
                                }}
                            }} else if (Array.isArray(parsed)) {{
                                {statements}
                            }}"""
            content = content.replace(old_load, new_load)
        else:
            # Maybe there's a simpler assignment?
            set_match_simple = re.search(r'if \(parsed\) \{\s*(set[a-zA-Z]+\(parsed\);)\s*\}', content)
            if set_match_simple:
                statements = set_match_simple.group(1)
                statements_with_payload = statements.replace('parsed', 'parsed.payload')
                old_load = f"if (parsed) {{\n                                {statements}\n                            }}"
                new_load = f"""if (parsed && parsed._isWrapped) {{
                                setInputColors(parsed.inputColors || {{}});
                                if (parsed.payload) {{
                                    {statements_with_payload}
                                }}
                            }} else if (parsed) {{
                                {statements}
                            }}"""
                content = content.replace(old_load, new_load)

    # Add IDs to inputs and textareas that don't have them
    content = content.replace('type="text"\n                                                value={bannerText}', 'type="text"\n                                                id="bannerText_input"\n                                                value={bannerText}')
    # Add text-center to banner text className if not present
    content = re.sub(r'(value=\{bannerText\}.*?className=".*?)text-black(.*?")', r'\1text-center text-black\2', content, flags=re.DOTALL)

    # For table inputs mapping over chunks/days/rows
    def inject_id(match):
        full_match = match.group(0)
        if 'id=' in full_match:
            return full_match
        
        value_match = re.search(r'value=\{([^}]+)\}', full_match)
        if value_match:
            val = value_match.group(1)
            return full_match.replace('<input', f'<input id={{`auto_${val.replace(".", "_")}`}}')
        return full_match
    
    # regex for <input ...> without id
    content = re.sub(r'<input\b(?![^>]*\bid=)[^>]+>', inject_id, content)
    
    def inject_id_textarea(match):
        full_match = match.group(0)
        if 'id=' in full_match:
            return full_match
        
        value_match = re.search(r'value=\{([^}]+)\}', full_match)
        if value_match:
            val = value_match.group(1)
            return full_match.replace('<textarea', f'<textarea id={{`auto_${val.replace(".", "_")}`}}')
        return full_match

    content = re.sub(r'<textarea\b(?![^>]*\bid=)[^>]+>', inject_id_textarea, content)

    # Make headers centered
    content = content.replace('text-left', 'text-center')

    # Add popup component before <Toast ref={toast} />
    if '<TransformationColorPopup' not in content:
        content = content.replace('<Toast ref={toast} />', '<Toast ref={toast} />\n            <TransformationColorPopup inputColors={inputColors} setInputColors={setInputColors} />')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)


# Process all charts
admin_dir = r"i:\RLLT\Webapp\frontend\src\pages\admin"
for filename in glob.glob(os.path.join(admin_dir, '*Chart.jsx')):
    process_file(filename)

print("Batch processing complete.")
