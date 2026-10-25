import sys
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add TransformationColorPopup import
    if 'TransformationColorPopup' not in content:
        content = content.replace("import axios from 'axios';", "import axios from 'axios';\nimport { TransformationColorPopup } from '../../components/TransformationColorPopup';")

    # Add inputColors state
    if 'const [inputColors, setInputColors]' not in content:
        content = re.sub(r'(const \[[a-zA-Z]+,\s*set[a-zA-Z]+\] = useState\(.*?\);)', r'\1\n    const [inputColors, setInputColors] = useState({});', content, count=1)

    # Wrap state_payload when saving
    if 'formData.append("state_payload", JSON.stringify(chunks));' in content:
        content = content.replace(
            'formData.append("state_payload", JSON.stringify(chunks));',
            'formData.append("state_payload", JSON.stringify({ _isWrapped: true, payload: chunks, inputColors }));'
        )

    # Unwrap state_payload when loading
    if 'const parsed = JSON.parse(data.state_payload);' in content and 'parsed._isWrapped' not in content:
        old_load = """                            const parsed = JSON.parse(data.state_payload);
                            if (Array.isArray(parsed)) {
                                setChartDays(parsed.length * 5);
                                setChunks(parsed);
                            }"""
        new_load = """                            const parsed = JSON.parse(data.state_payload);
                            if (parsed && parsed._isWrapped) {
                                setInputColors(parsed.inputColors || {});
                                if (Array.isArray(parsed.payload)) {
                                    setChartDays(parsed.payload.length * 5);
                                    setChunks(parsed.payload);
                                }
                            } else if (Array.isArray(parsed)) {
                                setChartDays(parsed.length * 5);
                                setChunks(parsed);
                            }"""
        content = content.replace(old_load, new_load)

    # Add IDs to inputs and textareas that don't have them
    content = content.replace('type="text"\n                                                value={bannerText}', 'type="text"\n                                                id="bannerText_input"\n                                                value={bannerText}')
    # Add text-center to banner text className if not present
    content = re.sub(r'(value=\{bannerText\}.*?className=".*?)text-black(.*?")', r'\1text-center text-black\2', content, flags=re.DOTALL)

    # For table inputs mapping over chunks/days
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

import sys
process_file(sys.argv[1])
print(f"Processed {sys.argv[1]}")
