const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/admin/StudentReport.jsx', 'utf8');
const lines = content.split('\n');
lines[319] = '                            <img src={playerMockup} alt="Player Mockup" className="w-full h-full object-fill opacity-95" />';
content = lines.join('\n');
content = `import playerMockup from '../../../public/player-mockup.png';\n` + content;
fs.writeFileSync('frontend/src/pages/admin/StudentReport.jsx', content);
