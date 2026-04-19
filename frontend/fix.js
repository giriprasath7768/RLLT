import fs from 'fs';
let s = fs.readFileSync('src/pages/admin/SevenTNTMainChartView.jsx', 'utf8');
s = s.split("\\'").join("'");
fs.writeFileSync('src/pages/admin/SevenTNTMainChartView.jsx', s);
console.log("FIXED");
