import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { parseDayForOilChart } from '../../utils/chartDataSplitter';

const ImageUploadPlaceholder = ({ state, setState, label }) => {
    const imageUrl = typeof state === 'object' && state !== null ? state.url : state;
    
    return (
        <label className="w-full h-full flex items-center justify-center cursor-pointer bg-white overflow-hidden relative group">
            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                if(e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setState({ file, url: URL.createObjectURL(file) });
                }
            }} />
            {imageUrl ? (
                <img src={imageUrl} className="w-full h-full object-contain" />
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 p-1 text-center w-full h-full">
                    <i className="pi pi-camera text-xl group-hover:text-[#00a8ff] transition-colors"></i>
                    {label && <span className="text-[10px] font-bold leading-tight mt-1">{label}</span>}
                </div>
            )}
        </label>
    );
};

const OilChart = () => {
    const toast = useRef(null);
    const location = useLocation();
    
    // Header & Meta State
    const [mdl, setMdl] = useState(1);
    const [fct, setFct] = useState(1);
    const [phs, setPhs] = useState(1);
    const [tLabel, setTLabel] = useState("T");
    const [bannerText, setBannerText] = useState("OIL CHART - WISDOM & OT BOOKS");
    const [headerSubtitle, setHeaderSubtitle] = useState("MODULE 2: FACT 3: PHASE 1/3");
    const [logo1, setLogo1] = useState(null);
    const [tableFontSize, setTableFontSize] = useState(14);
    
    // Chart Content State (5 specialized rows - Empty Template)
    const initialRows = [
        { id: 1, books: "", timeline: "", theme: "", themeColor: "#00b050", time: "", lessons: "", chaps: 0, verses: 0 },
        { id: 2, books: "", timeline: "", theme: "", themeColor: "#00b050", time: "", lessons: "", chaps: 0, verses: 0 },
        { id: 3, books: "", timeline: "", theme: "", themeColor: "#00b050", time: "", lessons: "", chaps: 0, verses: 0 },
        { id: 4, books: "", timeline: "", theme: "", themeColor: "#002060", time: "", lessons: "", chaps: 0, verses: 0 },
        { id: 5, books: "", timeline: "", theme: "", themeColor: "#002060", time: "", lessons: "", chaps: 0, verses: 0 }
    ];
    
    const [rows, setRows] = useState(initialRows);

    const [chartsList, setChartsList] = useState([]);
    const [mainChartsList, setMainChartsList] = useState([]);
    const [selectedChartRef, setSelectedChartRef] = useState(null);
    
    // Day Selection State
    const [availableDays, setAvailableDays] = useState([]);
    const [selectedDayObj, setSelectedDayObj] = useState(null);

    // Reference DBs for Parser
    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);

    const getFS = (base) => (base + (tableFontSize - 14)) + 'px';

    useEffect(() => {
        fetchChartsLists();
    }, []);

    const fetchChartsLists = async () => {
        try {
            const resOils = await axios.get('http://localhost:8000/api/oils/list', { withCredentials: true });
            setChartsList(resOils.data);
            
            const resMain = await axios.get('http://localhost:8000/api/charts/list', { withCredentials: true });
            setMainChartsList(resMain.data);

            const booksRes = await axios.get('http://localhost:8000/api/books', { withCredentials: true });
            setBooksDB(booksRes.data);
            
            const chapRes = await axios.get('http://localhost:8000/api/chapters', { withCredentials: true });
            setChaptersDB(chapRes.data);
        } catch (err) {
            console.error("Failed to fetch charts lists", err);
        }
    };

    const loadMainChartToOil = async (ref) => {
        if (!ref) return;
        try {
            const res = await axios.get(`http://localhost:8000/api/charts/sync/${ref.module}/${ref.facet}/${ref.phase}`, { withCredentials: true });
            const data = res.data;
            
            setMdl(data.module || 1);
            setFct(data.facet || 1);
            setPhs(data.phase || 1);
            if (data.banner_text) setBannerText(data.banner_text);
            if (data.t_label) setTLabel(data.t_label);
            
            if (data.state_payload) {
                const parsed = JSON.parse(data.state_payload);
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].days && parsed[0].days.length > 0) {
                    const allDays = parsed.flatMap(chunk => chunk.days);
                    const formattedDays = allDays.map((d, index) => ({
                        ...d,
                        label: `Day ${index + 1}` // Generating sequential day labels 1 to N
                    }));
                    
                    setAvailableDays(formattedDays);
                    setSelectedDayObj(null); // Wait for user to select day
                }
            }
            
            toast.current?.show({ severity: 'success', summary: 'Loaded', detail: 'Main Chart imported. Please select a Day to view.', life: 3000 });
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not load Main Chart.', life: 3000 });
        }
    };

    const handleDaySelect = (dayObj) => {
        setSelectedDayObj(dayObj);
        if (dayObj) {
            const newRows = JSON.parse(JSON.stringify(initialRows));
            const extractedBooks = parseDayForOilChart(dayObj, booksDB, chaptersDB);
            
            for (let i = 0; i < Math.min(extractedBooks.length, 5); i++) {
                newRows[i].books = extractedBooks[i].books;
                newRows[i].chaps = extractedBooks[i].chaps;
                newRows[i].verses = extractedBooks[i].verses;
                newRows[i].time = extractedBooks[i].time;
            }
            
            setRows(newRows);
        }
    };

    const saveChart = async () => {
        const formData = new FormData();
        formData.append("module", mdl);
        formData.append("facet", fct);
        formData.append("phase", phs);
        formData.append("banner_text", bannerText);
        formData.append("t_label", tLabel);
        formData.append("state_payload", JSON.stringify(rows));
        
        if (logo1 && typeof logo1 === 'object' && logo1.file) {
            formData.append("logo", logo1.file);
        }

        try {
            await axios.post('http://localhost:8000/api/oils/sync', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Oil Chart Saved Successfully', life: 3000 });
            fetchChartsLists();
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save chart', life: 3000 });
        }
    };

    const updateRow = (index, field, value) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);
    };

    const avgReadingTime = useMemo(() => {
        const totalMins = rows.reduce((acc, r) => {
            const m = parseInt(r.time) || 0;
            return acc + m;
        }, 0);
        return rows.length > 0 ? (totalMins / rows.length).toFixed(0) : 0;
    }, [rows]);

    const totalChapters = useMemo(() => rows.reduce((acc, r) => acc + (parseInt(r.chaps) || 0), 0), [rows]);
    const totalVerses = useMemo(() => rows.reduce((acc, r) => acc + (parseInt(r.verses) || 0), 0), [rows]);

    // Unified Grid Definition
    const gridCols = "45px minmax(200px, 1fr) 40px 180px 80px minmax(200px, 1fr) 45px";

    return (
        <>
            <div className="p-8 w-full max-w-full overflow-x-auto bg-gray-50 min-h-screen">
             <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700&family=Oswald:wght@400;700&display=swap" rel="stylesheet" />
            <style>{`
                .rllt-condensed { font-family: 'Roboto Condensed', sans-serif; }
                .oswald { font-family: 'Oswald', sans-serif; }
                .vertical-text { writing-mode: vertical-rl; transform: rotate(180deg); }
                .editable-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px; }
                .right-bar-segment { display: flex; align-items: center; justify-content: center; overflow: hidden; }
            `}</style>
            <Toast ref={toast} />

            {/* Outer Encapsulating White Card */}
            <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden mb-6">
            
            {/* Admin Controls */}
            <div className="bg-gradient-to-r from-[#051220] to-[#0A1F35] p-6 flex flex-wrap justify-between text-white items-center gap-6 border-b-2 border-gray-100 print:hidden">
                <div className="flex flex-col gap-1 flex-shrink-0">
                    <h1 className="text-2xl font-black tracking-tight text-[#c8a165] uppercase">Oil Chart Viewer</h1>
                    <p className="text-gray-300 text-[10px] font-bold tracking-widest uppercase mt-0.5">Administrative Chart Database (Read-Only)</p>
                </div>

                <div className="flex items-center gap-4 ml-auto">
                    <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-lg shadow">
                        <span className="text-black font-bold text-sm whitespace-nowrap">Select Chart:</span>
                        <Dropdown value={selectedChartRef} options={mainChartsList} optionLabel="label" placeholder="Select a saved chart..." className="w-[250px] bg-gray-50 border border-gray-200 text-black font-medium h-10 flex items-center text-sm rounded-md px-2" onChange={(e) => { setSelectedChartRef(e.value); loadMainChartToOil(e.value); }} />
                    </div>
                    
                    {availableDays.length > 0 && (
                        <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-lg shadow">
                            <span className="text-black font-bold text-sm whitespace-nowrap">Select Day:</span>
                            <Dropdown value={selectedDayObj} options={availableDays} optionLabel="label" placeholder="Select a Day..." className="w-[150px] bg-gray-50 border border-gray-200 text-black font-medium h-10 flex items-center text-sm rounded-md px-2" onChange={(e) => handleDaySelect(e.value)} />
                        </div>
                    )}

                    <Button icon="pi pi-print" className="p-button-secondary bg-white/10 hover:bg-white/20 border-white/20 text-white h-14 w-14 rounded-lg shadow-lg" onClick={() => window.print()} />
                </div>
            </div>

            {/* Printable Chart Area Wrapper */}
            <div className="p-4 pb-4 pt-6">
                <div id="printable-oilchart" className="chart-print-container border-[3px] border-black p-3 flex flex-col transition-all duration-300 mx-auto bg-white overflow-hidden w-full">
                
                {/* NEW HEADER LAYOUT */}
                <div className="flex flex-col w-full bg-white border-[3px] border-black">
                    {/* ROW 1: T-Box, Title, PH-Box */}
                    <div className="flex w-full h-[50px] border-b-[1px] border-black">
                        {/* T Box */}
                        <div className="w-[4.28%] shrink-0 bg-[#00b050] flex items-center justify-center border-r-[1px] border-black">
                            <input 
                                className="w-full bg-transparent text-white text-center text-[28px] outline-none" 
                                style={{fontFamily: 'Times New Roman, serif'}}
                                value={tLabel || "T"} 
                                onChange={(e) => setTLabel(e.target.value)} 
                            />
                        </div>
                        {/* Center Title */}
                        <div className="flex-1 flex items-center justify-center bg-white p-2">
                            <input
                                className="w-full text-center bg-transparent border-none outline-none font-bold text-[18px] text-[#ff0000] tracking-wide"
                                style={{fontFamily: 'Arial, Helvetica, sans-serif'}}
                                value={bannerText || "REAL LIFE LEADERSHIP TRAINING - NO CHART SELECTED"}
                                onChange={(e) => setBannerText(e.target.value)}
                            />
                        </div>
                        {/* PH Box */}
                        <div className="w-[4.76%] shrink-0 bg-[#00b050] flex flex-col border-l-[1px] border-black text-white font-bold" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
                            <div className="flex-1 flex items-center justify-center border-b-[1px] border-black text-[14px] leading-none pt-0.5">PH</div>
                            <div className="flex-1 flex items-center justify-center">
                                 <input 
                                    className="w-full bg-transparent text-center outline-none text-white text-[16px] leading-none pb-0.5" 
                                    value={phs || "1"} 
                                    onChange={(e) => setPhs(e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* ROW 2: Empty Space Columns, Orange Box, Yellow Box */}
                    <div className="flex w-full h-[60px]">
                        {/* 3 Empty Columns */}
                        <div className="w-[4.28%] shrink-0 border-r-[1px] border-black bg-white"></div>
                        <div className="w-[5.71%] shrink-0 border-r-[1px] border-black bg-white"></div>
                        <div className="w-[5.71%] shrink-0 border-r-[1px] border-black bg-white"></div>
                        
                        {/* Orange Box Area */}
                        <div className="flex-1 flex items-center border-r-[1px] border-black p-[3px] bg-white">
                            <div className="w-full h-full border-[3px] border-[#d9662a]">
                                <input className="w-full h-full bg-transparent outline-none px-2 text-[16px] font-bold text-black" defaultValue="" />
                            </div>
                        </div>

                        {/* Yellow Area */}
                        <div className="w-[9.52%] shrink-0 bg-[#ffff00] flex flex-col font-black justify-center" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
                            <div className="flex-1 flex items-center justify-center border-b-[1px] border-black">
                                <input className="w-full bg-transparent text-center outline-none text-[14px] font-black tracking-widest pt-0.5" defaultValue="B K - A R" />
                            </div>
                            <div className="flex-1 flex items-center justify-center">
                                <input className="w-full bg-transparent text-center outline-none text-[14px] font-black tracking-widest pt-0.5" defaultValue="6 6 - 4 0 +" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* NEW DATA GRID AREA */}
                <div className="flex flex-col w-full mt-[4px] border-[3px] border-black bg-white box-border">
                    {/* FULL-WIDTH HEADER ROW */}
                    <div className="flex w-full h-[40px] divide-x-[1px] divide-black font-bold uppercase text-[15px] text-black bg-white text-center box-border border-b-[1px] border-black" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
                        <div className="w-[23.33%] shrink-0 flex items-center justify-center box-border">WISDOM &amp; OT BOOKS</div>
                        <div className="w-[34.28%] shrink-0 flex items-center justify-center box-border">THEME</div>
                        <div className="w-[5.71%] shrink-0 flex items-center justify-center box-border">TIME</div>
                        <div className="flex-1 flex items-center justify-center tracking-tight text-[12px] px-2 overflow-hidden whitespace-nowrap box-border">
                            <span className="text-[17px] mr-[1px] -translate-y-[1px]">O</span>BSERVATION&nbsp;&nbsp;&nbsp;
                            <span className="text-[17px] mr-[1px] -translate-y-[1px]">I</span>MAGINATION&nbsp;&nbsp;&nbsp;
                            <span className="text-[17px] mr-[1px] -translate-y-[1px]">L</span>ESSONS
                        </div>
                    </div>

                    {/* BODY AREA (Split Left and Right Pillar) */}
                    <div className="flex w-full flex-1">
                        {/* LEFT: Rows */}
                        <div className="flex flex-col w-[93.33%] shrink-0 border-r-[1px] border-black box-border">
                            {/* Data Rows */}
                            {rows.map((row, idx) => (
                                <div key={row.id} className="flex h-[160px] divide-x-[1px] divide-black box-border">
                                    {/* Col 1 */}
                                    <div className="w-[4.59%] shrink-0 flex items-center justify-center box-border">
                                        <span className="vertical-text font-black text-[12px] tracking-widest uppercase text-center whitespace-nowrap" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
                                             <span className="text-black">THEME /&nbsp;</span><span className="text-[#ff0000]">TEAM - {idx + 1}</span>
                                        </span>
                                    </div>
                                    {/* Col 2 */}
                                    <div className="w-[20.40%] shrink-0 flex flex-col p-2 relative box-border bg-white">
                                        <span className="absolute left-2 top-2 text-[#00b050] font-black text-[14px]" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>{idx + 1}.</span>
                                        <textarea 
                                            value={row.books} 
                                            onChange={e => updateRow(idx, 'books', e.target.value)}
                                            className="flex-1 w-full bg-transparent outline-none resize-none font-bold text-[#00b050] pt-4 pl-4 uppercase"
                                            style={{ fontSize: getFS(15), fontFamily: 'Arial, Helvetica, sans-serif' }}
                                        />
                                    </div>
                                    {/* Col 3 */}
                                    <div className="w-[4.08%] shrink-0 flex items-center justify-center overflow-hidden box-border bg-white">
                                         <textarea 
                                            value={row.timeline} 
                                            onChange={e => updateRow(idx, 'timeline', e.target.value)}
                                            className="vertical-text text-black font-bold text-[14px] tracking-tighter text-center bg-transparent resize-none h-full w-full outline-none py-2"
                                            style={{fontFamily: 'Arial, Helvetica, sans-serif'}}
                                        />
                                    </div>
                                    {/* Col 4 */}
                                    <div className="w-[32.65%] shrink-0 flex flex-col p-2 relative box-border bg-white">
                                        <span 
                                            className="absolute left-6 top-[13px] editable-dot shadow-sm cursor-pointer flex-shrink-0" 
                                            style={{ backgroundColor: row.themeColor, width: '12px', height: '12px' }}
                                            onClick={() => {
                                                const colors = ["#00b050", "#002060", "#f1c40f", "#ff0000"];
                                                const nextColor = colors[(colors.indexOf(row.themeColor) + 1) % colors.length];
                                                updateRow(idx, 'themeColor', nextColor);
                                            }}
                                        ></span>
                                        <textarea 
                                            value={row.theme} 
                                            onChange={e => updateRow(idx, 'theme', e.target.value)}
                                            className="flex-1 w-full bg-transparent outline-none resize-none font-bold text-[14px] font-serif uppercase text-black pt-[10px] pl-[34px]"
                                        />
                                    </div>
                                    {/* Col 5 */}
                                    <div className="w-[6.12%] shrink-0 flex items-center justify-center group relative box-border bg-white">
                                        <div className="flex items-center justify-center text-[#00b050] font-bold" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
                                            <input 
                                                value={row.time} 
                                                onChange={e => updateRow(idx, 'time', e.target.value)}
                                                className="w-[20px] text-right bg-transparent outline-none text-[15px]"
                                            /><span className="text-[15px] ml-1">m</span>
                                        </div>
                                        <div className="absolute bottom-0 inset-x-0 h-[24px] flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 border-t border-gray-100 p-0.5">
                                            <input type="number" placeholder="CH" value={row.chaps} onChange={e => updateRow(idx, 'chaps', e.target.value)} className="w-1/2 text-[10px] text-center outline-none bg-gray-50 rounded border" />
                                            <input type="number" placeholder="VS" value={row.verses} onChange={e => updateRow(idx, 'verses', e.target.value)} className="w-1/2 text-[10px] text-center outline-none bg-gray-50 rounded border" />
                                        </div>
                                    </div>
                                    {/* Col 6 */}
                                    <div className="w-[32.14%] shrink-0 flex flex-col items-center justify-center box-border bg-white">
                                        <textarea 
                                            value={row.lessons} 
                                            onChange={e => updateRow(idx, 'lessons', e.target.value)}
                                            className="flex-1 w-full p-2 bg-transparent outline-none resize-none font-medium text-gray-800 text-[14px]"
                                            placeholder=" "
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* RIGHT PILLAR: Average Time, Verses, Chapters */}
                        <div className="flex-1 flex flex-col box-border border-l-[1px] border-black">
                            {/* Top Block: Average Reading Time (Red) */}
                            <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden bg-white box-border border-b-[1px] border-black pb-4 pt-4">
                                <span className="vertical-text text-[#ff0000] font-bold text-[14px] whitespace-nowrap uppercase" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
                                    AVERAGE READING TIME PER DAY: {avgReadingTime} m
                                </span>
                            </div>

                            {/* Middle Block: Verse */}
                            <div className="flex-[0.6] w-full flex items-center justify-center relative overflow-hidden bg-white box-border border-b-[1px] border-black py-4">
                                <span className="vertical-text text-black font-bold text-[14px] whitespace-nowrap uppercase tracking-wider" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
                                    VERSE - {totalVerses}
                                </span>
                            </div>

                            {/* Bottom Block: Chapters */}
                            <div className="flex-[0.6] w-full flex items-center justify-center relative overflow-hidden bg-white box-border py-4">
                                <span className="vertical-text text-black font-bold text-[14px] whitespace-nowrap uppercase tracking-wider" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
                                    CHAPTERS - {totalChapters}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* QUOTE FOOTER ROW INSIDE BORDER */}
                    <div className="flex w-full items-center justify-center p-[4px] border-t-[1px] border-black box-border bg-white">
                        <span className="font-serif text-[13.5px] font-medium text-center w-full text-black">
                            It is the same with my word. I send it out, and it always produces fruit. It will accomplish all I want it to, and it will prosper everywhere I send it. Isaiah 55:11
                        </span>
                    </div>
                </div>

                {/* BOTTOM CAPTION ROW OUTSIDE BORDER */}
                <div className="flex w-full mt-1 box-border relative">
                    <div className="w-1/3 flex justify-start items-center text-[10px] font-black tracking-widest uppercase text-black" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
                        ALL DATES ARE APPROXIMATE
                    </div>
                    <div className="w-1/3 flex justify-center items-center text-[10px] font-black tracking-widest uppercase text-black" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
                        MODEL 2 FACT 3 PHASE 1/3
                    </div>
                    <div className="w-1/3 flex justify-end items-center text-[14px] font-black text-black pr-2" style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
                        1
                    </div>
                </div>

            </div>
            {/* End of Printable Chart Area Wrapper */}
            </div>
            
            {/* End of Outer White Card */}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700&family=Oswald:wght@400;700&family=Inter:wght@400;700;900&display=swap');
                
                .chart-print-container {
                    font-family: 'Inter', sans-serif;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                .oswald { font-family: 'Oswald', sans-serif; }
                .rllt-condensed { font-family: 'Roboto Condensed', sans-serif; }
                
                .vertical-text {
                    writing-mode: vertical-rl;
                    transform: rotate(180deg);
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .editable-dot {
                    display: inline-block;
                    border-radius: 50%;
                    transition: transform 0.2s;
                }
                .editable-dot:hover { transform: scale(1.3); }

                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; }
                    .chart-print-container { 
                        box-shadow: none !important; 
                        margin: 0 auto !important;
                        border: 2px solid black !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                }
            `}} />
            </div>
        </>
    );
};

export default OilChart;
