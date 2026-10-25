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
    # e.g., formData.append("state_payload", JSON.stringify(chunks));
    if 'inputColors' not in re.search(r'formData\.append\("state_payload".*?\);', content).group(0):
        content = re.sub(
            r'formData\.append\("state_payload", JSON\.stringify\((chunks|rowsData|rows|vCards|scheduleChunks|dataChunks)\)\);',
            r'formData.append("state_payload", JSON.stringify({ _isWrapped: true, payload: \1, inputColors }));',
            content
        )

    # Unwrap state_payload when loading
    if 'parsed._isWrapped' not in content:
        # Looking for `const parsed = JSON.parse(data.state_payload);`
        # and replacing the assignment to the state variable.
        # This part is highly dependent on the file.
        pass

    # Add IDs to inputs and textareas that don't have them
    # For banner text
    content = content.replace('type="text"\n                                                value={bannerText}', 'type="text"\n                                                id="bannerText_input"\n                                                value={bannerText}')
    # Add text-center to banner text className if not present
    content = re.sub(r'(value=\{bannerText\}.*?className=".*?)text-black(.*?")', r'\1text-center text-black\2', content, flags=re.DOTALL)

    # For table inputs mapping over chunks/days
    # We will use regex to find inputs inside map functions and inject an ID if missing
    def inject_id(match):
        full_match = match.group(0)
        if 'id=' in full_match:
            return full_match
        
        # Determine variable names based on value={}
        value_match = re.search(r'value=\{([^}]+)\}', full_match)
        if value_match:
            val = value_match.group(1)
            # generate ID like id={`input_${val.replace('.', '_')}`}
            # Note: inside map we need unique IDs based on index too if val doesn't have it.
            # But wait, using string template for ID based on React variables is safer.
            return full_match.replace('<input', f'<input id={{`auto_${val.replace(".", "_")}`}}')
        return full_match
    
    # regex for <input ...> without id
    content = re.sub(r'<input\b(?![^>]*\bid=)[^>]+>', inject_id, content)
    content = re.sub(r'<textarea\b(?![^>]*\bid=)[^>]+>', inject_id, content)

    # Make headers centered
    # In table th, usually we have text-left. Change to text-center.
    content = content.replace('text-left', 'text-center')

    # Add popup component before <Toast ref={toast} />
    if '<TransformationColorPopup' not in content:
        content = content.replace('<Toast ref={toast} />', '<Toast ref={toast} />\n            <TransformationColorPopup inputColors={inputColors} setInputColors={setInputColors} />')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

import sys
process_file(sys.argv[1])
print(f"Processed {sys.argv[1]}")
