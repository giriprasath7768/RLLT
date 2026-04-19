import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'components', 'admin', 'WordToolbar.jsx');
let text = fs.readFileSync(filePath, 'utf8');

text = text.replace('onMouseDown={(e) => e.preventDefault()}\n            onClick={(e) => e.stopPropagation()}', 'onClick={(e) => e.stopPropagation()}');

const pairs = [
    ['onClick={() => { setChartsDropdownOpen(false); alert("C Chart functionality pending implementation. Please clarify behavior."); }}', 'onMouseDown={(e) => { e.preventDefault(); setChartsDropdownOpen(false); alert("C Chart functionality pending implementation. Please clarify behavior."); }}'],
    ['onClick={() => { setChartsDropdownOpen(false); handleLionChartInsert(); }}', 'onMouseDown={(e) => { e.preventDefault(); setChartsDropdownOpen(false); handleLionChartInsert(); }}'],
    ["onClick={() => handleGraphInsert('bar')}", "onMouseDown={(e) => { e.preventDefault(); handleGraphInsert('bar'); }}"],
    ["onClick={() => handleGraphInsert('line')}", "onMouseDown={(e) => { e.preventDefault(); handleGraphInsert('line'); }}"],
    ["onClick={() => handleGraphInsert('pie')}", "onMouseDown={(e) => { e.preventDefault(); handleGraphInsert('pie'); }}"],
    ["onClick={() => handleGraphInsert('area')}", "onMouseDown={(e) => { e.preventDefault(); handleGraphInsert('area'); }}"],
    ["onClick={() => { setImageDropdownOpen(false); puzzleInputRef.current?.click(); }}", "onMouseDown={(e) => { e.preventDefault(); setImageDropdownOpen(false); puzzleInputRef.current?.click(); }}"],
    ["onClick={() => { setImageDropdownOpen(false); fileInputRef.current?.click(); }}", "onMouseDown={(e) => { e.preventDefault(); setImageDropdownOpen(false); fileInputRef.current?.click(); }}"],
    ["onClick={() => { setAgScriptDropdownOpen(false); setViewerScript(script); }}", "onMouseDown={(e) => { e.preventDefault(); setAgScriptDropdownOpen(false); setViewerScript(script); }}"],
    ["onClick={() => insertCountry(country)}", "onMouseDown={(e) => { e.preventDefault(); insertCountry(country); }}"],
    ["onClick={() => insertEmoji(emoji)}", "onMouseDown={(e) => { e.preventDefault(); insertEmoji(emoji); }}"],
    ["onClick={() => setWisdomMode(m.id)}", "onMouseDown={(e) => { e.preventDefault(); setWisdomMode(m.id); }}"],
    ["onClick={() => applyWisdom(color)}", "onMouseDown={(e) => { e.preventDefault(); applyWisdom(color); }}"],
    ["onClick={clearWisdom}", "onMouseDown={(e) => { e.preventDefault(); clearWisdom(); }}"]
];

pairs.forEach(([o, m]) => {
    text = text.split(o).join(m);
});

fs.writeFileSync(filePath, text, 'utf8');
console.log("Replacements complete");
