const fs = require('fs');
let buffer = fs.readFileSync('frontend/public/player-mockup.png');
let b64 = buffer.toString('base64');
let code = fs.readFileSync('frontend/src/pages/admin/StudentReport.jsx', 'utf8');
code = code.replace(/\/player-mockup\.png\?v=\d+/, 'data:image/png;base64,' + b64);
fs.writeFileSync('frontend/src/pages/admin/StudentReport.jsx', code);
console.log("Inlined successfully.");
