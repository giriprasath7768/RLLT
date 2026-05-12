import re
import os

files = [
    "TwentyFourSevenChart.jsx",
    "SevenTNTWeeklyChart.jsx",
    "SevenTNTMainChartView.jsx",
    "SevenTNTMainChart.jsx",
    "MorningEveningChart.jsx",
    "TwentyFourSevenMorningEveningChart.jsx",
    "TwentyFourSevenChartView.jsx",
    "MainChartView.jsx",
    "LightChart.jsx",
    "DynamicCycleChart.jsx",
    "TwentyFourSevenDLSizeChart.jsx",
    "DLSizeChart.jsx",
    "VCardChart.jsx",
    "CChart.jsx",
    "WeeklyChart.jsx",
    "SevenTNTDayCycleChartView.jsx",
    "SevenTNTDayCycleChart.jsx",
]

base_dir = "i:/RLLT/Webapp/frontend/src/pages/admin/"

for fname in files:
    fpath = os.path.join(base_dir, fname)
    if not os.path.exists(fpath):
        print(f"Skipping {fname}, not found.")
        continue

    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    pattern_tr = re.compile(r'(<tr className="h-\[.*?\]">)([\s\S]*?)(<td className="w-\[(?:60px|50px|60px)\] bg-\[#00b050\] border-l-2)')
    
    def replacer(match):
        tr_start = match.group(1)
        inner = match.group(2)
        ph_start = match.group(3)

        dt_pattern = re.compile(r'(\s*(?:\{\/\*\s*DATE & TIME BLOCK\s*\*\/\}\s*)?<td className="w-\[100px\] border-r-2 border-black p-0 align-middle bg-white">[\s\S]*?<\/td>)')
        dt_match = dt_pattern.search(inner)
        if not dt_match:
            return match.group(0)
        dt_block = dt_match.group(1)
        
        t_pattern = re.compile(r'(\s*(?:\{\/\*\s*T BLOCK\s*\*\/\}\s*)?<td className="w-\[\d+px\] bg-\[#00b050\] border-r-(?:2|\[1\.5px\]) border-black p-0 align-middle".*?>[\s\S]*?<\/td>)')
        t_match = t_pattern.search(inner)
        if not t_match:
            t_pattern = re.compile(r'(\s*(?:\{\/\*\s*T BLOCK\s*\*\/\}\s*)?<td className="w-\[\d+px\] bg-\[#00b050\] border-r-2 border-black p-0 align-middle" style={{ backgroundColor: \u0027#00b050 !important\u0027.*?>[\s\S]*?<\/td>)')
            t_match = t_pattern.search(inner)
            if not t_match:
                print(f"Could not find T BLOCK in {fname}")
                return match.group(0)
        t_block = t_match.group(1)

        c_pattern = re.compile(r'(\s*(?:\{\/\*\s*CENTER TEXT\s*\*\/\}\s*)?<td className="(?:p-0 )?align-middle text-center bg-white.*?".*?>[\s\S]*?<\/td>)')
        c_match = c_pattern.search(inner)
        if not c_match:
            print(f"Could not find CENTER TEXT in {fname}")
            return match.group(0)
        c_block = c_match.group(1)
        
        c_block_fixed = c_block.replace("pr-10", "")
        dt_block_fixed = dt_block.replace('border-r-2 border-black', 'border-l-2 border-black')

        new_inner = "\n" + t_block.lstrip("\n") + c_block_fixed + dt_block_fixed + "\n                                        "
        return tr_start + new_inner + ph_start

    new_content, count = pattern_tr.subn(replacer, content)
    
    if count > 0 and new_content != content:
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {fname}")
    else:
        print(f"No changes made to {fname} (or could not match correctly)")
