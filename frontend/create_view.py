import os
import re

main_view_path = r"i:\RLLT\Webapp\frontend\src\pages\admin\MainChartView.jsx"
seven_tnt_path = r"i:\RLLT\Webapp\frontend\src\pages\admin\SevenTNTMainChart.jsx"
out_path = r"i:\RLLT\Webapp\frontend\src\pages\admin\SevenTNTMainChartView.jsx"

with open(main_view_path, 'r', encoding='utf-8') as f:
    main_view = f.read()

with open(seven_tnt_path, 'r', encoding='utf-8') as f:
    seven_tnt = f.read()

gen_data_match = re.search(r'(const generateInitialData.*?return defaultData;\n};)', seven_tnt, re.DOTALL)
gen_data_code = gen_data_match.group(1) if gen_data_match else ''

colors_match = re.search(r'(const promiseBorderColors.*?;)', seven_tnt, re.DOTALL)
colors_code = colors_match.group(1) if colors_match else ''

chart_area_match = re.search(r'(<div className="w-full border-\[3px\].*?)\{/\* Smart Cells Dialog \*/\}', seven_tnt, re.DOTALL)
chart_area_code = chart_area_match.group(1) if chart_area_match else ''
if not chart_area_code:
    # After we removed the dialog, it ends with '</div>\n        </div>\n    );\n};'
    chart_area_match = re.search(r'(<div className="w-full border-\[3px\].*?)</div>\s*</div>\s*\);\s*};', seven_tnt, re.DOTALL)
    chart_area_code = chart_area_match.group(1) if chart_area_match else ''

chart_area_code = '<div id="printable-chart-area" className="w-full bg-white pb-6 rounded-b-2xl pt-6 px-6">\n' + chart_area_code + '\n</div>'

# Clean inputs
tLabelSub = '<div className="w-full h-full flex items-center justify-center"><span className="text-white font-serif text-[32px] font-normal leading-none" style={{ transform: \'translateY(-2px)\' }}>{tLabel}</span></div>'
chart_area_code = re.sub(r'<input className="w-full h-full text-center bg-transparent text-white font-serif text-\[32px\] border-none outline-none".*?/>', tLabelSub, chart_area_code, flags=re.DOTALL)

chart_area_code = re.sub(r'<input className="w-full flex-1 bg-transparent border-none text-black font-bold text-\[22px\] p-1 focus:outline-none uppercase placeholder-gray-400".*?/>', r'<span className="text-black font-bold text-[22px] uppercase">{bannerText}</span>', chart_area_code, flags=re.DOTALL)

chart_area_code = chart_area_code.replace('<ImageUploadPlaceholder state={logo1} setState={setLogo1} />', '<ImageBox url={logoUrl} label="" />')
chart_area_code = chart_area_code.replace('<ImageUploadPlaceholder state={logo2} setState={setLogo2} />', '<ImageBox url={logoUrl} label="" />')
chart_area_code = chart_area_code.replace('<ImageUploadPlaceholder state={logo3} setState={setLogo3} />', '<ImageBox url={logoUrl} label="" />')

# Process inputs for promises etc
chart_area_code = re.sub(r'<input[^>]*value=\{chunk\.promiseInput[^>]*\}[^>]*/>', '<div className="w-full h-full flex items-center justify-center p-1 text-center font-bold text-black px-2 block" style={{ fontSize: getFS(14) }}>{chunk.promiseInput}</div>', chart_area_code, flags=re.DOTALL)
chart_area_code = re.sub(r'<input[^>]*value=\{chunk\.promiseLabel[^>]*\}[^>]*/>', '<span className="font-bold whitespace-nowrap mr-2 text-black tracking-wide" style={{ fontSize: getFS(14) }}>{chunk.promiseLabel || "GOD\'S PROMISES :"}</span>', chart_area_code, flags=re.DOTALL)
chart_area_code = re.sub(r'<input[^>]*value=\{chunk\.promises\}[^>]*/>', '<span className="flex-1 font-bold text-center uppercase text-black leading-none tracking-tight" style={{ fontSize: getFS(14) }}>{chunk.promises}</span>', chart_area_code, flags=re.DOTALL)

# Convert all text inputs to spans in chunks.map
chart_area_code = re.sub(
    r'<input\s+className="w-full bg-transparent border-none text-black font-extrabold text-center focus:outline-none".*?type="text"\s+value=\{chunk\.dayLabel.*?/>',
    r'{chunk.dayLabel !== undefined ? chunk.dayLabel : `DAY ${chunk.days.map(d => d.day).join(\', \')}`}',
    chart_area_code,
    flags=re.DOTALL
)

chart_area_code = re.sub(
    r'<input\s+className="w-full bg-transparent border-none text-center font-bold text-black uppercase focus:outline-none".*?type="text"\s+value=\{chunk\.bookNameHeader.*?/>',
    r'{chunk.bookNameHeader || \'\'}',
    chart_area_code,
    flags=re.DOTALL
)

# For nested inputs in chunk.days.map
chart_area_code = re.sub(
    r'<input\s+className="bg-transparent text-center font-extrabold text-black uppercase origin-center w-32 border-none outline-none focus:ring-1 focus:ring-blue-500".*?value=\{chunk\.team\}.*?/>',
    r'<div className="bg-transparent text-center font-extrabold text-black uppercase origin-center w-32" style={{ transform: \'rotate(-90deg)\', fontSize: getFS(11) }}>{chunk.team}</div>',
    chart_area_code,
    flags=re.DOTALL
)

chart_area_code = re.sub(
    r'<input\s+className="w-full bg-transparent border-none text-left uppercase font-bold text-black focus:outline-none px-1".*?value=\{d\.content.*?/>',
    r'<div className="w-full text-left uppercase font-bold text-black px-1" style={{ fontSize: getFS(12) }}>{d.content || \'\'}</div>',
    chart_area_code,
    flags=re.DOTALL
)

chart_area_code = re.sub(
    r'<input\s+className="w-full bg-transparent border-none text-center uppercase font-bold text-black focus:outline-none px-1".*?value=\{d\.pages.*?/>',
    r'<div className="w-full text-center uppercase font-bold text-black px-1" style={{ fontSize: getFS(13) }}>{d.pages || \'\'}</div>',
    chart_area_code,
    flags=re.DOTALL
)

chart_area_code = re.sub(
    r'<input\s+className="w-full bg-transparent border-none text-center font-bold text-black focus:outline-none".*?value=\{d\.chap.*?/>',
    r'<div className="w-full text-center font-bold text-black" style={{ fontSize: getFS(11) }}>{d.chap || \'\'}</div>',
    chart_area_code,
    flags=re.DOTALL
)

chart_area_code = re.sub(
    r'<input\s+className="w-full bg-transparent border-none text-center font-bold text-black focus:outline-none".*?value=\{d\.art.*?/>',
    r'<div className="w-full text-center font-bold text-black" style={{ fontSize: getFS(11) }}>{d.art || \'\'}</div>',
    chart_area_code,
    flags=re.DOTALL
)

chart_area_code = re.sub(
    r'<input\s+className="bg-transparent text-center font-extrabold text-black uppercase origin-center w-32 border-none outline-none focus:ring-1 focus:ring-blue-500".*?value=\{chunk\.week\}.*?/>',
    r'<div className="bg-transparent text-center font-extrabold text-black uppercase origin-center w-32" style={{ transform: \'rotate(-90deg)\', fontSize: getFS(11) }}>{chunk.week}</div>',
    chart_area_code,
    flags=re.DOTALL
)

# Replace table td onClick that modifies checkboxes
chart_area_code = re.sub(
    r'onClick=\{.*?\newChunks\[cIdx\].days\[dIdx\].yes.*?\}',
    r'',
    chart_area_code,
    flags=re.DOTALL
)
chart_area_code = chart_area_code.replace('cursor-pointer', '')

# Replace grand total footers
chart_area_code = re.sub(r'<td colSpan=\{3\}[^>]*>\s*<input[^>]*value=\{chunk\.footerHash \|\| \'\'\}[^>]*/>\s*</td>', r'<td colSpan={3} className="border-2 border-black p-0 bg-white align-middle text-center"><span className="font-extrabold tracking-[0.2em] uppercase" style={{ fontSize: getFS(12) }}>{chunk.footerHash || \'########\'}</span></td>', chart_area_code, flags=re.DOTALL)
chart_area_code = re.sub(r'<td colSpan=\{3\}[^>]*>\s*<input[^>]*value=\{grandTotalHash1\}[^>]*/>\s*</td>', r'<td colSpan={3} className="border-2 border-black p-0 bg-white align-middle text-center"><span className="font-extrabold tracking-[0.2em] uppercase" style={{ fontSize: getFS(12) }}>{grandTotalHash1}</span></td>', chart_area_code, flags=re.DOTALL)
chart_area_code = re.sub(r'<td colSpan=\{8\}[^>]*>\s*<input[^>]*value=\{grandTotalHash2\}[^>]*/>\s*</td>', r'<td colSpan={8} className="border-2 border-black p-0 bg-white align-middle text-center"><span className="font-extrabold tracking-[0.5em] uppercase" style={{ fontSize: getFS(12) }}>{grandTotalHash2}</span></td>', chart_area_code, flags=re.DOTALL)


# Put the view together
new_view = main_view.replace("MainChartView", "SevenTNTMainChartView")
new_view = new_view.replace("api/charts/", "api/seven_tnt_charts/")
new_view = new_view.replace("Main Chart Viewer", "7TNT Main Chart Viewer")
new_view = new_view.replace('className="w-full bg-white pdf-table table-fixed border-collapse"', 'className="w-full bg-white table-fixed border-collapse rllt-condensed" style={{ border: \'3px solid #000\' }}')

new_view = re.sub(r'const generateInitialData.*?(const SevenTNTMainChartView)', gen_data_code + '\n\n' + colors_code + '\n\n' + r'\1', new_view, flags=re.DOTALL)

state_declaration = """const [headerSubtitle, setHeaderSubtitle] = useState("NO CHART SELECTED");
    const [grandTotalHash1, setGrandTotalHash1] = useState("########");
    const [grandTotalHash2, setGrandTotalHash2] = useState("#########");"""
new_view = new_view.replace('const [headerSubtitle, setHeaderSubtitle] = useState("NO CHART SELECTED");', state_declaration)

new_view = re.sub(r'<div id="printable-chart-area".*?(?=</div\>\s*</div\>\s*\);)', chart_area_code, new_view, flags=re.DOTALL)

with open(out_path, 'w', encoding='utf-8') as f:
    f.write(new_view)
print("done")
