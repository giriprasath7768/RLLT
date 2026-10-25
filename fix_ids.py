import os
import glob
import re

admin_dir = r"i:\RLLT\Webapp\frontend\src\pages\admin"

# Fix broken id={`auto_$stuff`}
for filename in glob.glob(os.path.join(admin_dir, '*Chart.jsx')):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'id={`auto_$' in content:
        # Find all broken ids and just remove them, since we don't strictly need them
        # if they are weird expressions.
        # e.g., id={`auto_$d_m1b`} should be id={`auto_${d.m1b}`} but wait!
        # The replacement was: f'<input id={{`auto_${val.replace(".", "_")}`}}'
        # BUT I used python f-string without escaping the {{ and }}.
        # So it rendered id={`auto_${val.replace...}`} wait no, it rendered id={`auto_$d_m1b`} because of python f-string?
        # NO! In javascript it rendered id={`auto_$chunk_promises`} ?
        # Wait, the string was: f'<input id={{`auto_${val.replace(".", "_")}`}}'
        # Python evaluates {val.replace...} to `chunk_promises`, so it writes: id={`auto_$chunk_promises`} ???
        # Wait, the script outputted `id={`auto_$chunk_promises`}` which is literally the string "auto_$chunk_promises".
        # This is fine for HTML id, EXCEPT if there's a syntax error in Javascript!
        
        # Why did OilChart.jsx fail?
        # id={`auto_$`${extractBooksAndAuthors(rows)_bks`} -> this is invalid JS.
        pass

    # A simpler fix: remove any id={`auto_...`} from <input> and <textarea>
    # and just put a clean alphanumeric ID, or remove the ID completely if it's too complex.
    # Actually, the user doesn't strictly need the transformation color on non-state inputs.
    
    content = re.sub(r'\s+id=\{`auto_\$[^`]*`\}', '', content)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed broken IDs")
