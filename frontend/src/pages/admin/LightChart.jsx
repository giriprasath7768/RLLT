import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { FileUpload } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import * as XLSX from 'xlsx';
import axios from 'axios';

const ImageUploadPlaceholder = ({ state, setState, label }) => {
    const imageUrl = typeof state === 'object' && state !== null ? state.url : state;

    return (
        <label className="w-full h-full flex items-center justify-center cursor-pointer bg-white overflow-hidden relative group">
            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
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


const module1Data = [
    { sno: 1, fct: 1, dayPpl: 30, otBks: '-', ntBks: '-', phs: 1, we5: 6, pro: '-', psa: 1, chp: 2, ver: 352, art: '1m', ppl: 30 },
    { sno: 2, fct: 2, dayPpl: 30, otBks: '2', ntBks: '-', phs: 1, we5: 6, pro: '1', psa: 1, chp: 43, ver: 1137, art: '4m', ppl: 30 },
    { sno: 3, fct: 3, dayPpl: 30, otBks: '2', ntBks: '-', phs: 1, we5: 6, pro: '1', psa: 1, chp: 45, ver: 1489, art: '5m', ppl: 30 },
    { sno: 4, fct: 4, dayPpl: 30, otBks: '2', ntBks: '-', phs: 1, we5: 6, pro: '1', psa: 1, chp: 191, ver: 3577, art: '12m', ppl: 30 },
    { sno: 5, fct: 5, dayPpl: 30, otBks: '1', ntBks: '4', phs: 1, we5: 6, pro: '1', psa: 1, chp: 157, ver: 2573, art: '10m', ppl: 30 },
    { sno: 6, fct: 6, dayPpl: 30, otBks: '2', ntBks: '2', phs: 1, we5: 6, pro: '1', psa: 1, chp: 128, ver: 3496, art: '14m', ppl: 30 },
    { sno: 7, fct: 7, dayPpl: 30, otBks: '3+', ntBks: '4', phs: 1, we5: 6, pro: '1', psa: 1, chp: 283, ver: 7459, art: '28m', ppl: 30 },
    { sno: 8, fct: 8, dayPpl: 30, otBks: '5+', ntBks: '19', phs: 1, we5: 6, pro: '1', psa: 1, chp: 315, ver: 7763, art: '30m', ppl: 30 },
    { sno: 9, fct: 9, dayPpl: 30, otBks: '8+', ntBks: '-', phs: 1, we5: 6, pro: '1', psa: 1, chp: 317, ver: 8314, art: '35m', ppl: 30 },
    { sno: 10, fct: 10, dayPpl: 30, otBks: '5+', ntBks: '25', phs: 1, we5: 6, pro: '1', psa: 1, chp: 433, ver: 11917, art: '49m', ppl: 30 },
];

const LightChartTable = ({ moduleNum, data }) => {
    return (
        <div className="mb-2 mx-auto max-w-6xl w-full">
            <h2 className="text-center font-bold text-xs mb-1" style={{ color: '#00A859' }}>
                MODULE {moduleNum}: <span className="text-black">10 FACETS: 10 PHASES - EACH PHASE 30 DAYS</span>
            </h2>
            <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse border-2 border-black text-center text-[10px] sm:text-xs font-bold font-sans">
                    <thead>
                        <tr className="bg-white leading-tight">
                            <th className="border-2 border-black py-0.5 px-1 bg-black text-white w-10">S.NO</th>
                            <th className="border-2 border-black py-0.5 px-1">FCT</th>
                            <th className="border-2 border-black py-0.5 px-1">DAY/PPL</th>
                            <th className="border-2 border-black py-0.5 px-1">O.T BKS</th>
                            <th className="border-2 border-black py-0.5 px-1">N.T BKS</th>
                            <th className="border-2 border-black py-0.5 px-1">PHS</th>
                            <th className="border-2 border-black py-0.5 px-1">WE5</th>
                            <th className="border-2 border-black py-0.5 px-1">PRO</th>
                            <th className="border-2 border-black py-0.5 px-1">PSA</th>
                            <th className="border-2 border-black py-0.5 px-1">CHP</th>
                            <th className="border-2 border-black py-0.5 px-1">VER</th>
                            <th className="border-2 border-black py-0.5 px-1">ART</th>
                            <th className="border-2 border-black py-0.5 px-1">PPL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(data || module1Data).map((row, idx) => {
                            // Rows 2 and 8 are green, others light blue only for the first S.NO cell.
                            const isGreenRow = row.sno === 2 || row.sno === 8;
                            const snoColor = isGreenRow ? '#00E84D' : '#BCD2E8'; // Vivid green for 2&8

                            return (
                                <tr key={idx} className="border border-black leading-tight">
                                    <td className="border-2 border-black py-0.5 px-1 font-bold bg-white" style={{ backgroundColor: snoColor }}>{row.sno}</td>
                                    <td className="border-2 border-black py-0.5 px-1 bg-white" style={isGreenRow ? { backgroundColor: '#00E84D' } : {}}>{row.fct}</td>
                                    <td className="border-2 border-black py-0.5 px-1 bg-white">{row.dayPpl}</td>
                                    <td className="border-2 border-black py-0.5 px-1 bg-white">{row.otBks}</td>
                                    <td className="border-2 border-black py-0.5 px-1 bg-white">{row.ntBks}</td>
                                    <td className="border-2 border-black py-0.5 px-1 bg-white">{row.phs}</td>
                                    <td className="border-2 border-black py-0.5 px-1 bg-white">{row.we5}</td>
                                    <td className="border-2 border-black py-0.5 px-1 bg-white">{row.pro}</td>
                                    <td className="border-2 border-black py-0.5 px-1 bg-white">{row.psa}</td>
                                    <td className="border-2 border-black py-0.5 px-1 bg-white">{row.chp}</td>
                                    <td className="border-2 border-black py-0.5 px-1 bg-white">{row.ver}</td>
                                    <td className="border-2 border-black py-0.5 px-1 bg-white">{row.art}</td>
                                    <td className="border-2 border-black py-0.5 px-1 bg-white">{row.ppl}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const LightChart = () => {
    const [tLabel, setTLabel] = useState("T");
    const [headerSubtitle, setHeaderSubtitle] = useState("MODULE1:FACET1:PHASE-1/1");
    const [phs, setPhs] = useState(1);
    const [logo1, setLogo1] = useState(null);
    const [bannerText, setBannerText] = useState("MAIN CHART - 30 DAYS");

    const [chartDays, setChartDays] = useState(30);
    const [tableFontSize, setTableFontSize] = useState(14);

    // Feature States
    const toast = useRef(null);
    const [showPopup, setShowPopup] = useState(false);

    // DB
    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);
    const [rlltDB, setRlltDB] = useState([]);

    // Data State Map
    const [moduleData, setModuleData] = useState({
        1: module1Data,
        2: module1Data,
        3: module1Data,
        4: module1Data,
        5: module1Data,
    });

    useEffect(() => {
        const fetchRefs = async () => {
            try {
                const [booksRes, chaptersRes, rlltRes] = await Promise.all([
                    axios.get('/api/admin/books'),
                    axios.get('/api/admin/chapters'),
                    axios.get('/api/admin/rllt')
                ]);
                setBooksDB(booksRes.data);
                setChaptersDB(chaptersRes.data);
                setRlltDB(rlltRes.data);
            } catch (err) {
                console.error("Failed to fetch references:", err);
            }
        };
        fetchRefs();
    }, []);

    const handleDownloadTemplate = () => {
        const templateData = [{
            'Module': '',
            'Person/Day': '',
            'OTT BKS': '',
            'NT BKS': '',
            'WE5': '',
            'Book 1': '',
            'Chapter 1': '',
            'Book 2': '',
            'Chapter 2': '',
            'Book 3': '',
            'Chapter 3': ''
        }];
        const ws = XLSX.utils.json_to_sheet(templateData);
        ws['!cols'] = [{ wch: 8 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 10 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Bulk Mapping Template`);
        XLSX.writeFile(wb, `LightChart_Bulk_Module_Mapping_Template.xlsx`);
    };

    const handleExcelImportSubmit = (e) => {
        const file = e.files[0];
        if (!file) return;

        if (booksDB.length === 0 || rlltDB.length === 0) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Wait for databases to load before import.' });
            e.options.clear();
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'No valid rows found.' });
                    e.options.clear();
                    return;
                }

                const processBookSpan = (bookRaw, chapRaw) => {
                    const rawName = String(bookRaw || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (!rawName || rawName === 'undefined' || rawName === 'null') return { chapters: 0, verses: 0, art: 0 };

                    const matchBook = booksDB.find(b => {
                        const bNameClean = (b.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                        const bShortClean = (b.short_form || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                        return bNameClean === rawName || bShortClean === rawName;
                    });

                    if (!matchBook) return { chapters: 0, verses: 0, art: 0 };

                    const numChap = parseInt(chapRaw) || 1;
                    let totalChapters = numChap;
                    let totalVerses = 0;
                    let totalArt = 0.0;

                    const matchedChapters = chaptersDB.filter(c =>
                        c.book_id === matchBook.id &&
                        c.chapter_number >= 1 &&
                        c.chapter_number <= numChap
                    );

                    matchedChapters.forEach(c => {
                        totalVerses += c.verse_count || 0;
                        if (c.art != null) {
                            const valStr = c.art.toString();
                            if (valStr.includes('.')) {
                                const parts = valStr.split('.');
                                let sStr = parts[1] || "0";
                                if (sStr.length === 1) sStr += '0';
                                totalArt += parseInt(parts[0] || 0) + (parseInt(sStr.substring(0, 2)) / 60);
                            } else {
                                totalArt += parseFloat(valStr) || 0;
                            }
                        }
                    });

                    return { chapters: totalChapters, verses: totalVerses, art: totalArt };
                };

                const formatHrMin = (mins) => {
                    if (!mins) return "0m";
                    const h = Math.floor(mins / 60);
                    const m = Math.round(mins % 60);
                    if (h > 0 && m > 0) return `${h}h${m}m`;
                    if (h > 0) return `${h}h`;
                    return `${m}m`;
                };

                // Group by module
                const groupedData = {};
                data.forEach(row => {
                    const normalized = {};
                    Object.keys(row).forEach(k => normalized[k.trim().toLowerCase()] = row[k]);

                    let m = normalized['module'];
                    if (m === undefined || m === null || m === '') return;
                    m = parseInt(m);
                    if (!groupedData[m]) groupedData[m] = [];
                    groupedData[m].push(normalized);
                });

                if (Object.keys(groupedData).length === 0) {
                    toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'No valid "Module" column found in Excel.' });
                    e.options.clear();
                    return;
                }

                // Process each group
                const newDataMap = {};
                Object.keys(groupedData).forEach(modStr => {
                    const modNum = parseInt(modStr);
                    const modRows = groupedData[modStr];
                    const processedRows = [];

                    modRows.forEach((normalized, rawIdx) => {
                        const idx = rawIdx + 1; // 1-indexed Facet

                        // Lookup PHS directly from RlltLookup model
                        const rlltMatch = rlltDB.find(r => r.module === modNum && r.facet === idx);
                        const mappedPhase = rlltMatch ? rlltMatch.phase : 1;

                        const b1Span = processBookSpan(normalized['book 1'], normalized['chapter 1']);
                        const b2Span = processBookSpan(normalized['book 2'], normalized['chapter 2']);
                        const b3Span = processBookSpan(normalized['book 3'], normalized['chapter 3']);

                        const totalChp = b1Span.chapters + b2Span.chapters + b3Span.chapters;
                        const totalVer = b1Span.verses + b2Span.verses + b3Span.verses;
                        const totalArt = b1Span.art + b2Span.art + b3Span.art;

                        processedRows.push({
                            sno: idx,
                            fct: idx,
                            dayPpl: normalized['person/day'] || '-',
                            otBks: normalized['ott bks'] || '-',
                            ntBks: normalized['nt bks'] || '-',
                            phs: mappedPhase,
                            we5: normalized['we5'] || '-',
                            pro: 1, // Fixed placeholder
                            psa: 1, // Fixed placeholder
                            chp: totalChp || 0,
                            ver: totalVer || 0,
                            art: formatHrMin(totalArt),
                            ppl: normalized['person/day'] || '-'
                        });
                    });
                    newDataMap[modNum] = processedRows;
                });

                setModuleData(prev => ({
                    ...prev,
                    ...newDataMap
                }));
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'Bulk Excel mapping applied successfully for all modules found!' });
                setShowPopup(false);
                e.options.clear();
            } catch (err) {
                console.error("Excel mapping error:", err);
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Invalid Excel format.' });
                e.options.clear();
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="p-4 sm:p-8 w-full max-w-full overflow-x-auto bg-gray-50 min-h-screen print:bg-white print:p-0">
            <Toast ref={toast} />
            {/* Inject print styles for perfect A4 fitting */}
            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 5mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
                    .print\\:hidden { display: none !important; }
                    .print\\:p-0 { padding: 0 !important; }
                    .print\\:m-0 { margin: 0 !important; }
                    .print\\:bg-white { background: white !important; }
                    .print\\:shadow-none { box-shadow: none !important; border: none !important; }
                }
                
                /* Custom Dropdown Overrides inside LightChart */
                .custom-white-dropdown {
                    background-color: #fff !important;
                    color: #000 !important;
                }
                .custom-white-dropdown .p-dropdown-label {
                    color: #000 !important;
                }
                .custom-white-dropdown .p-dropdown-trigger {
                    color: #000 !important;
                }
                .p-dropdown-panel.custom-white-panel {
                    background-color: #fff !important;
                    color: #000 !important;
                }
                .p-dropdown-panel.custom-white-panel .p-dropdown-item {
                    color: #000 !important;
                    background-color: #fff !important;
                }
                .p-dropdown-panel.custom-white-panel .p-dropdown-item:hover,
                .p-dropdown-panel.custom-white-panel .p-dropdown-item.p-highlight {
                    background-color: #e2e8f0 !important;
                    color: #000 !important;
                }
                .custom-white-dropdown .p-placeholder {
                    color: #4b5563 !important;
                }
            `}</style>

            <div className="bg-white shadow-xl rounded-2xl border border-gray-100 print:shadow-none print:border-none print:rounded-none overflow-hidden mb-6 p-0 sm:p-0 mx-auto max-w-4xl">

                <div className="bg-gradient-to-r from-[#051220] to-[#0A1F35] p-4 sm:p-6 flex flex-col xl:flex-row justify-between items-center text-white border-b-2 border-gray-100 mb-4 print:hidden gap-4">
                    <div className="flex-shrink-0 text-center xl:text-left mb-4 xl:mb-0">
                        <h1 className="text-2xl font-black tracking-tight mb-1 text-[#c8a165] whitespace-nowrap">Light Chart</h1>

                        {/* Font Size Scaling Controls */}
                        <div className="flex gap-2 items-center bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 shadow-inner inline-flex">
                            <span className="text-[11px] uppercase font-black text-gray-300 mr-2">Scale</span>
                            <Button
                                icon="pi pi-minus"
                                className="p-button-rounded p-button-text text-white h-7 w-7 min-w-[28px] p-0 hover:bg-white/20 transition-all border border-transparent hover:border-white/30"
                                onClick={() => setTableFontSize(prev => Math.max(8, prev - 1))}
                            />
                            <span className="font-black text-lg w-8 text-center text-[#c8a165] drop-shadow-sm">{tableFontSize}</span>
                            <Button
                                icon="pi pi-plus"
                                className="p-button-rounded p-button-text text-white h-7 w-7 min-w-[28px] p-0 hover:bg-white/20 transition-all border border-transparent hover:border-white/30"
                                onClick={() => setTableFontSize(prev => Math.min(20, prev + 1))}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col items-center xl:items-end w-full xl:w-auto gap-3">
                        <div className="flex items-center gap-3 justify-center w-full">
                            <Button
                                label="Add Details"
                                icon="pi pi-list"
                                className="p-button-sm shadow-md font-bold px-4 py-2"
                                style={{ backgroundColor: '#c8a165', border: 'none' }}
                                onClick={() => setShowPopup(true)}
                            />
                            <Button
                                label="Save Chart"
                                icon="pi pi-save"
                                className="p-button-sm p-button-success shadow-md font-bold px-4 py-2"
                                onClick={() => { }}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 pt-0 print:pt-4">

                    {/* Global Header Above Tables */}
                    <div className="w-full border-[2px] border-black p-1.5 flex flex-col bg-white overflow-hidden mb-3 max-w-6xl mx-auto">
                        <div className="flex flex-col w-full mb-1">
                            {/* ROW 1: T | REAL LIFE... | PH */}
                            <table className="w-full bg-white table-fixed border-collapse border-[1.5px] border-black" style={{ borderSpacing: 0 }}>
                                <tbody>
                                    <tr className="h-[35px]">
                                        {/* T BLOCK */}
                                        <td className="w-[40px] bg-[#00b050] border-r-[1.5px] border-black p-0 align-middle">
                                            <input
                                                className="w-full h-full text-center bg-transparent text-white font-serif text-[22px] border-none outline-none"
                                                value={tLabel}
                                                onChange={(e) => setTLabel(e.target.value)}
                                            />
                                        </td>

                                        {/* CENTER TEXT */}
                                        <td className="p-0 align-middle text-center bg-white">
                                            <span className="text-[#ff0000] font-bold text-[14px] sm:text-[16px] tracking-wide uppercase" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                                REAL LIFE LEADERSHIP TRAINING - <span className="text-[12px] sm:text-[14px] font-bold">{headerSubtitle}</span>
                                            </span>
                                        </td>

                                        {/* PH BLOCK */}
                                        <td className="w-[45px] bg-[#00b050] border-l-[1.5px] border-black p-0 h-[35px]">
                                            <div className="flex flex-col h-[35px] w-full">
                                                <div className="flex-1 flex items-center justify-center border-b-[1.5px] border-black">
                                                    <span className="text-white font-black text-[11px] tracking-tighter">PH</span>
                                                </div>
                                                <div className="flex-1 flex items-center justify-center">
                                                    <span className="text-white font-bold text-[13px]">{phs}</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* ROW 2: 3 MAPS | ORANGE INPUT | BK-AR */}
                            <table className="w-full bg-white table-fixed border-collapse border-b-[1.5px] border-l-[1.5px] border-r-[1.5px] border-black" style={{ borderSpacing: 0 }}>
                                <tbody>
                                    <tr className="h-[45px]">
                                        {/* MAP 1 */}
                                        <td className="w-[60px] border-r-[1.5px] border-black p-0 align-middle bg-white">
                                            <div className="w-[60px] h-[45px] p-0.5 overflow-hidden flex items-center justify-center">
                                                <ImageUploadPlaceholder state={logo1} setState={setLogo1} label="" />
                                            </div>
                                        </td>
                                        {/* MAP 2 */}
                                        <td className="w-[60px] border-r-[1.5px] border-black p-0 align-middle bg-white">
                                            <div className="w-[60px] h-[45px] p-0.5 overflow-hidden flex items-center justify-center">
                                                <ImageUploadPlaceholder state={logo1} setState={setLogo1} label="" />
                                            </div>
                                        </td>
                                        {/* MAP 3 */}
                                        <td className="w-[60px] border-r-[1.5px] border-black p-0 align-middle bg-white">
                                            <div className="w-[60px] h-[45px] p-0.5 overflow-hidden flex items-center justify-center">
                                                <ImageUploadPlaceholder state={logo1} setState={setLogo1} label="" />
                                            </div>
                                        </td>

                                        {/* ORANGE BANNER BOX */}
                                        <td className="border-r-[1.5px] border-black p-1 align-middle bg-white relative">
                                            <div className="absolute inset-[2px] border-[2px] border-[#e47636] pointer-events-none"></div>
                                            <input
                                                type="text"
                                                value={bannerText}
                                                onChange={(e) => setBannerText(e.target.value)}
                                                className="w-full h-full min-h-[35px] outline-none text-black font-bold px-2 text-[14px] sm:text-[18px] uppercase bg-transparent relative z-10"
                                                placeholder="..."
                                            />
                                        </td>

                                        {/* BK-AR BLOCK */}
                                        <td className="w-[100px] bg-[#ffff00] p-0 h-[45px] align-middle">
                                            <div className="flex flex-col h-[45px] w-full">
                                                <div className="flex-1 flex items-center justify-center border-b-[1.5px] border-black pt-0.5">
                                                    <span className="text-black font-black tracking-widest text-[14px] sm:text-[16px] drop-shadow-sm whitespace-nowrap" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.1em' }}>B K - A R</span>
                                                </div>
                                                <div className="flex-1 flex items-center justify-center pb-0.5">
                                                    <span className="text-black font-black tracking-widest text-[13px] sm:text-[15px] drop-shadow-sm whitespace-nowrap" style={{ letterSpacing: '0.1em' }}>6 6 - 4 0 +</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:gap-3 w-full items-center justify-center pt-1">
                        {[1, 2, 3, 4, 5].map((moduleNum) => (
                            <LightChartTable key={moduleNum} moduleNum={moduleNum} data={moduleData[moduleNum]} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Config Dialog */}
            <Dialog
                header={<span className="font-bold text-xl text-black">Light Chart Configuration</span>}
                visible={showPopup}
                className="w-[90vw] md:w-[60vw] max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden custom-dialog"
                contentClassName="p-0 bg-gray-50"
                headerClassName="bg-white border-b border-gray-200 px-6 py-4"
                onHide={() => setShowPopup(false)}
            >
                <div className="p-6">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-blue-800 font-bold text-lg mb-1">Bulk Module Upload</h3>
                            <p className="text-blue-600 text-sm">Upload a single Excel file defining mappings across multiple Modules simultaneously. Be sure your Excel sheet contains the "Module" column!</p>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-black flex items-center gap-2">
                                <i className="pi pi-file-excel text-green-600 text-xl"></i>
                                Upload Excel Mapping
                            </h4>
                            <Button
                                type="button"
                                label="Template"
                                icon="pi pi-download"
                                className="p-button-outlined p-button-success p-button-sm font-bold border-green-600 text-green-700 hover:bg-green-50"
                                onClick={handleDownloadTemplate}
                            />
                        </div>
                        <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200 border-l-4 border-l-orange-500">
                            <strong>Note:</strong> Upload an Excel file matching the template exact headers. Rows populate S.NO & FCT sequentially. The PHS (Phase) is synced automatically via the RLRT database matching the chosen Module.
                        </p>
                        <FileUpload
                            name="demo[]"
                            customUpload={true}
                            uploadHandler={handleExcelImportSubmit}
                            accept=".xlsx, .xls"
                            maxFileSize={1000000}
                            emptyTemplate={<p className="m-0 text-center text-gray-500 py-6">Drag and drop Excel (.xlsx) file here to configure the Facets mapping instantly.</p>}
                            chooseLabel="Select Excel File"
                            uploadLabel="Process Layout"
                            className="text-black bg-gray-50 border-dashed border-2 border-gray-300 rounded-xl"
                        />
                    </div>
                </div>
            </Dialog>

        </div>
    );
};

export default LightChart;
