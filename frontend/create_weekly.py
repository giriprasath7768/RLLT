import os
import re

weekly_chart_path = r"i:\RLLT\Webapp\frontend\src\pages\admin\WeeklyChart.jsx"
seven_tnt_main_path = r"i:\RLLT\Webapp\frontend\src\pages\admin\SevenTNTMainChart.jsx"
out_path = r"i:\RLLT\Webapp\frontend\src\pages\admin\SevenTNTWeeklyChart.jsx"

with open(weekly_chart_path, 'r', encoding='utf-8') as f:
    weekly = f.read()

with open(seven_tnt_main_path, 'r', encoding='utf-8') as f:
    seven_tnt = f.read()

# 1. We need to grab the header block from SevenTNTMainChart
header_match = re.search(r'(const promiseBorderColors.*?;)', seven_tnt, re.DOTALL)
colors_code = header_match.group(1) if header_match else ''

# Extract 7TNT header (from printable-chart-area opening to end of header tables)
header_ui_match = re.search(r'\{/\* TOP HEADER BLOCK - MATCHING SCREENSHOT EXACTLY \*/\}(.*?)\{/\* WEEKLY DATA TABLES GRID', seven_tnt, re.DOTALL)
seven_tnt_header_ui = header_ui_match.group(1) if header_ui_match else ''

if not seven_tnt_header_ui:
    # Alternative extraction if comment isn't there
    header_ui_match = re.search(r'(<div className="flex flex-col w-full mb-2">.*?</table>\s*</div>)', seven_tnt, re.DOTALL)
    seven_tnt_header_ui = header_ui_match.group(1) if header_ui_match else ''

# In the WeeklyChart, we pull out the whole `<div className="flex flex-col w-full mb-2">...</div>`
weekly = re.sub(r'\{/\* HEADER BLOCK EXACTLY LIKE MORNINGEVENINGCHART \*/\}.*?</table\>\s*</div\>', seven_tnt_header_ui, weekly, flags=re.DOTALL)

# 2. Swap out API endpoints
weekly = weekly.replace('api/charts/list', 'api/seven_tnt_charts/list')
weekly = weekly.replace('api/charts/sync', 'api/seven_tnt_charts/sync')
weekly = weekly.replace('WeeklyChart', 'SevenTNTWeeklyChart')
weekly = weekly.replace('Weekly Chart', '7TNT Weekly Chart')

# Logo states - 七TNT uses logo1, logo2, logo3. Weekly uses logoUrl.
# Let's keep it simple: weekly uses logoUrl, and the 7TNT header uses logo1. Let's just define logo1, logo2, logo3 in Weekly.
logo_state_replace = """    const [logoUrl, setLogoUrl] = useState(null);
    const [logo1, setLogo1] = useState(null);
    const [logo2, setLogo2] = useState(null);
    const [logo3, setLogo3] = useState(null);"""
weekly = re.sub(r'const \[logoUrl, setLogoUrl\] = useState\(null\);', logo_state_replace, weekly)

# When payload syncs
payload_sync_replace = """                setTLabel(data.t_label || "T");
                setLogo1(data.logo_url ? `http://localhost:8000${data.logo_url}` : null);
                setLogo2(data.logo_url ? `http://localhost:8000${data.logo_url}` : null);
                setLogo3(data.logo_url ? `http://localhost:8000${data.logo_url}` : null);"""
weekly = re.sub(r'setTLabel\(data\.t_label \|\| "T"\);\s*setLogoUrl\(.*?\);', payload_sync_replace, weekly)

# 3. Create the massive custom 5-row day structure for 7TNT
custom_tbody = """
                                <colgroup>
                                    <col className="w-[4%]" />
                                    <col className="w-[10%]" />
                                    <col className="w-[45%]" />
                                    <col className="w-[6%]" />
                                    <col className="w-[6%]" />
                                    <col className="w-[8%]" />
                                    <col className="w-[8%]" />
                                    <col className="w-[6%]" />
                                    <col className="w-[4%]" />
                                </colgroup>
                                {chunks.map((chunk, chunkIndex) => (
                                    chunk.days.map((day, dayIndex) => {
                                        const periodInputKey = `${chunkIndex}_${dayIndex}`;
                                        const currentPeriod = periodInputs[periodInputKey] !== undefined ? periodInputs[periodInputKey] : "";

                                        const defaultPromises = [
                                            "I WILL MAKE YOU A GREAT NATION: GEN 12:2",
                                            "I WILL GIVE YOU TREASURES HIDDEN IN THE DARKNESS - SECRET PLACES: ISA 45:3",
                                            "ONLY ASK, I WILL GIVE YOU NATIONS AS YOUR INHERITANCE: PSA 2:8",
                                            "GOD CREATED ALL THINGS. EVERYTHIG IS FROM HIS HANDS: JOH 1:3",
                                            "I AM WITH YOU ALWAYS, GO, TRAIN, MULTIPLY: MAT 28:18-20",
                                            "I WILL INSTRUCT YOU AND TEACH YOU: PSA 32:8"
                                        ];
                                        const defaultPromiseStr = defaultPromises[chunkIndex % 6];
                                        const promiseKey = `${chunkIndex}_${dayIndex}_promise`;
                                        const currentPromise = periodInputs[promiseKey] !== undefined ? periodInputs[promiseKey] : defaultPromiseStr;

                                        const boxColors = ['border-[#00b0f0]', 'border-[#00b050]', 'border-[#ffff00]', 'border-[#ff0000]', 'border-[#ff00ff]', 'border-[#7030a0]'];
                                        const boxColor = boxColors[chunkIndex % 6];

                                        const renderInput = (keySuffix) => {
                                            const v = periodInputs[`${chunkIndex}_${dayIndex}_${keySuffix}`] || '';
                                            return (
                                                <input 
                                                    className="w-full text-center bg-transparent border-none focus:outline-none font-bold text-black"
                                                    style={{ fontSize: getFS(12) }}
                                                    value={v}
                                                    onChange={(e) => handlePeriodChange(chunkIndex, `${dayIndex}_${keySuffix}`, e.target.value)}
                                                />
                                            );
                                        };

                                        return (
                                            <tbody key={`chunk${chunkIndex}_day${dayIndex}`} className="text-black font-bold text-sm rllt-condensed w-full print:page-break-inside-avoid">
                                                
                                                {/* GOD'S PROMISES ROW */}
                                                {dayIndex === 0 && (
                                                <tr className="bg-white h-[35px]">
                                                    <td colSpan={2} className="border-2 border-black bg-white"></td>
                                                    <td className="border-2 border-black px-2 align-middle border-r-0">
                                                        <div className="flex items-center">
                                                            <span className="font-bold whitespace-nowrap mr-2 text-black" style={{ fontSize: getFS(14) }}>GOD'S PROMISES</span>
                                                            <input 
                                                                className="flex-1 font-bold bg-transparent border-none focus:outline-none uppercase text-black w-full" 
                                                                style={{ fontSize: getFS(14) }} 
                                                                value={currentPromise}
                                                                onChange={(e) => handlePeriodChange(chunkIndex, `${dayIndex}_promise`, e.target.value)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td colSpan={6} className="border-2 border-black p-1 align-middle border-l-0">
                                                        <div className={`w-40 h-full border-[3px] ${boxColor} bg-white min-h-[22px] mx-auto`}></div>
                                                    </td>
                                                </tr>
                                                )}

                                                {/* HEADER ROW */}
                                                <tr className="bg-white text-center font-bold h-[25px]">
                                                    <th colSpan={2} className="border-2 border-black p-1 align-middle bg-white" style={{ fontSize: getFS(13) }}>
                                                        DATE
                                                    </th>
                                                    <th className="border-2 border-black"></th>
                                                    <th className="border-2 border-black text-center bg-white" style={{ fontSize: getFS(11) }}>PAGES</th>
                                                    <th className="border-2 border-black text-center bg-white" style={{ fontSize: getFS(11) }}>TIME</th>
                                                    <th className="border-2 border-black text-center bg-white" style={{ fontSize: getFS(11) }}>CHAP</th>
                                                    <th className="border-2 border-black text-center bg-white" style={{ fontSize: getFS(11) }}>PAGE</th>
                                                    <th className="border-2 border-black text-center bg-white" style={{ fontSize: getFS(11) }}>ART</th>
                                                    <th className="border-2 border-black text-center bg-white" style={{ fontSize: getFS(11) }}>DAY</th>
                                                </tr>

                                                {/* ONE DAY PER TEAM ROW */}
                                                {[0, 1, 2, 3, 4].map((rIdx) => {
                                                    return (
                                                        <tr key={`chunk${chunkIndex}_day${dayIndex}_r${rIdx}`} className="bg-white h-[32px]">
                                                            
                                                            {rIdx === 0 && (
                                                                <td rowSpan={5} className="border-2 border-black p-0 align-middle bg-white relative overflow-hidden">
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-white z-10 w-full h-full">
                                                                        <div className="whitespace-nowrap tracking-widest font-extrabold text-black uppercase text-vertical" style={{ fontSize: getFS(14) }}>
                                                                            TEAM / WEEK - <span className="text-[#cc0000] font-black">{chunkIndex + 1}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            )}

                                                            {rIdx === 0 && (
                                                                <td rowSpan={5} className="border-2 border-black p-0 text-center align-middle whitespace-normal leading-tight bg-white">
                                                                    <div className="flex flex-col items-center justify-center h-full w-full py-1">
                                                                        <div className="font-extrabold mb-1 uppercase" style={{ fontSize: getFS(12) }}>{dayNames[dayIndex % 6]}</div>
                                                                        <div className="font-black text-red-600 mb-1" style={{ fontSize: getFS(26), lineHeight: '1' }}>{day.day}</div>
                                                                    </div>
                                                                </td>
                                                            )}
                                                            
                                                            {rIdx === 0 && (
                                                                <td rowSpan={5} className="border-2 border-black p-0 text-center align-middle whitespace-normal leading-tight bg-white">
                                                                    <div className="flex flex-col items-center justify-center h-full w-full py-1">
                                                                        <textarea 
                                                                            spellCheck="false"
                                                                            className="w-full text-center bg-transparent border-none focus:outline-none resize-none overflow-hidden font-bold leading-tight uppercase"
                                                                            style={{ fontSize: getFS(12), height: '100%' }}
                                                                            value={currentPeriod}
                                                                            onChange={(e) => handlePeriodChange(chunkIndex, dayIndex, e.target.value)}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            )}
                                                            
                                                            <td className={`border-2 border-black px-1 pb-0 bg-white align-middle`} style={{ fontSize: getFS(13) }}>
                                                                {renderInput(`p_${rIdx}`)}
                                                            </td>
                                                            
                                                            <td className={`border-2 border-black px-1 pb-0 align-middle bg-white`} style={{ fontSize: getFS(13) }}>
                                                                {renderInput(`t_${rIdx}`)}
                                                            </td>
                                                            
                                                            {rIdx === 0 && (
                                                                <>
                                                                    <td rowSpan={2} className="border-2 border-black text-center align-middle font-bold bg-white" style={{ fontSize: getFS(13) }}>{day.chap || ''}</td>
                                                                    <td rowSpan={2} className="border-2 border-black text-center align-middle font-bold bg-white" style={{ fontSize: getFS(13) }}>{day.pages || ''}</td>
                                                                    <td rowSpan={2} className="border-2 border-black text-center align-middle font-bold bg-white" style={{ fontSize: getFS(13) }}>{day.art || ''}</td>
                                                                    <td rowSpan={2} className="border-2 border-black text-center align-middle font-extrabold bg-white" style={{ fontSize: getFS(14) }}>{day.day || ''}</td>
                                                                </>
                                                            )}
                                                            {rIdx === 2 && (
                                                                <td colSpan={4} rowSpan={3} className="border-2 border-black text-center align-middle font-black tracking-widest bg-white" style={{ fontSize: getFS(14), fontFamily: 'Arial, sans-serif' }}>
                                                                    BOOKS OVERVIEW
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        );
                                    })
                                ))}
"""

# Replace the giant <colgroup>...</colgroup> and standard chunks.map with ours
weekly = re.sub(r'<colgroup>.*?\)\)\)}', custom_tbody, weekly, flags=re.DOTALL)

with open(out_path, 'w', encoding='utf-8') as f:
    f.write(weekly)

print("Done")
