const fs = require('fs');
const lines = fs.readFileSync('i:/RLLT/Webapp/frontend/src/components/admin/WordToolbar.jsx', 'utf8').split('\n');
lines.forEach((line, i) => {
    if (line.includes('quillRef') || line.includes('editor.')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
    }
});
