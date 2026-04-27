import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { FileUpload } from 'primereact/fileupload';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

const parseTime = (t) => {
    if (!t) return 0;
    t = t.toString().trim().toLowerCase();
    if (t.includes('h')) {
        const match = t.match(/(\d+)h\.?(\d+)m?/);
        if (match) {
            return (parseInt(match[1] || 0) * 60) + parseInt(match[2] || 0);
        }
    } else if (t.includes('.')) {
        const parts = t.split('.');
        let sStr = parts[1] || "0";
        if (sStr.length === 1) sStr += '0'; // Handle '3.3' meaning 3 minutes 30 seconds
        return parseInt(parts[0] || 0) + (parseInt(sStr.substring(0, 2)) / 60);
    } else {
        return parseInt(t) || 0;
    }
    return 0;
};

const formatSum = (totalMins, formatType) => {
    const rawMins = Math.round(totalMins);
    if (rawMins === 0) return '';
    if (formatType === 'HrMins') return rawMins >= 60 ? `${Math.floor(rawMins / 60)} Hr ${rawMins % 60} Mins` : `${rawMins} Mins`;
    if (formatType === 'Hm') return `${Math.floor(rawMins / 60)}H ${rawMins % 60}m`;
    return `${rawMins} Mins`;
};

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
                <img src={imageUrl} className="w-full h-full object-contain" alt="Logo" />
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 p-1 text-center w-full h-full">
                    <i className="pi pi-camera text-xl group-hover:text-[#00a8ff] transition-colors"></i>
                    {label && <span className="text-[10px] font-bold leading-tight mt-1">{label}</span>}
                </div>
            )}
        </label>
    );
};

const SevenTNTDayCycleChart = () => {
    const toast = useRef(null);

    const [headerSubtitle, setHeaderSubtitle] = useState("NO CHART SELECTED");
    const [headerTitle, setHeaderTitle] = useState("7TNT Day Cycle Chart");
    const [bannerText, setBannerText] = useState("");
    const [tLabel, setTLabel] = useState("T");
    const [logo1, setLogo1] = useState(null);
    const [logo2, setLogo2] = useState(null);
    const [logo3, setLogo3] = useState(null);
    const [phaseLabel, setPhaseLabel] = useState("1");

    // Meta fields
    const [h1, setH1] = useState("");
    const [h2, setH2] = useState("");
    const [h3, setH3] = useState("");
    const [promiseLabel, setPromiseLabel] = useState("GOD'S PROMISES :");
    const [promises, setPromises] = useState("ENTER GOD'S PROMISSES HERE");
    const [promiseInput, setPromiseInput] = useState("");

    // User dynamic days
    const [totalDays, setTotalDays] = useState(7);
    const [rowsData, setRowsData] = useState(Array.from({ length: 7 }, (_, i) => ({ id: i + 1, day: i + 1, m1b: '', m1t: '', m2b: '', m2t: '', m3b: '', m3t: '', chap: '', verse: '', art: '', yes: false })));

    const [showPopup, setShowPopup] = useState(false);
    const [rlltDB, setRlltDB] = useState([]);
    const [mdl, setMdl] = useState(1);
    const [fct, setFct] = useState(1);
    const [phs, setPhs] = useState(1);
    const [maxPhases, setMaxPhases] = useState(1);
    const [maxFacets, setMaxFacets] = useState(1);

    // UI Expand State
    const [expandedDay, setExpandedDay] = useState(-1);

    // Book Dropdown Configuration Mappings
    const initialBookRow = () => ({ id: Math.random().toString(36).substr(2, 9), book_id: null, chFrom: null, chTo: null });
    const initialDayObj = () => ({ s1: [initialBookRow()], s2: [initialBookRow()], s3: [initialBookRow()] });
    const [mappingConfig, setMappingConfig] = useState(Array.from({ length: 7 }, () => initialDayObj()));

    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);

    useEffect(() => {
        axios.get('http://' + window.location.hostname + ':8000/api/books', { withCredentials: true })
            .then(res => {
                const booksWithDisplay = res.data.map(b => ({
                    ...b,
                    displayName: b.short_form ? `${b.short_form} - ${b.name}` : b.name
                }));
                setBooksDB(booksWithDisplay);
            })
            .catch(err => console.error("Could not fetch books", err));

        axios.get('http://' + window.location.hostname + ':8000/api/chapters?limit=3000', { withCredentials: true })
            .then(res => setChaptersDB(res.data))
            .catch(err => console.error("Could not fetch chapters", err));

        axios.get('http://' + window.location.hostname + ':8000/api/rllt_lookup', { withCredentials: true })
            .then(res => {
                const data = res.data;
                setRlltDB(data);
                if (data.length > 0) {
                    const uniqueModules = [...new Set(data.map(d => d.module))].sort((a, b) => a - b);
                    if (uniqueModules.length > 0) setMdl(uniqueModules[0]);
                }
            })
            .catch(() => { });
    }, []);

    useEffect(() => {
        const availableFacets = rlltDB.filter(d => d.module === mdl);
        const uniqueFacets = [...new Set(availableFacets.map(d => d.facet))];
        const highestFacet = uniqueFacets.length > 0 ? Math.max(...uniqueFacets) : 1;
        setMaxFacets(highestFacet);
    }, [mdl, rlltDB]);

    useEffect(() => {
        const availablePhases = rlltDB.filter(d => d.module === mdl && d.facet === fct);
        const uniquePhases = [...new Set(availablePhases.map(d => d.phase))];
        const highestPhase = uniquePhases.length > 0 ? Math.max(...uniquePhases) : 1;
        setMaxPhases(highestPhase);
        setPhaseLabel(phs.toString());
        setHeaderSubtitle(`MODULE${mdl}:FACET${fct}:PHASE-${phs}/${highestPhase}`);
    }, [mdl, fct, rlltDB, phs]);

    const mdlOptions = useMemo(() => {
        const uniqueModules = [...new Set(rlltDB.map(d => d.module))];
        const highestMod = uniqueModules.length > 0 ? Math.max(...uniqueModules) : 1;
        return Array.from({ length: highestMod }, (_, i) => ({ label: `Module ${i + 1}`, value: i + 1 }));
    }, [rlltDB]);

    const fctOptions = useMemo(() => {
        const availableFacets = rlltDB.filter(d => d.module === mdl);
        const uniqueFacets = [...new Set(availableFacets.map(d => d.facet))];
        const highestFacet = uniqueFacets.length > 0 ? Math.max(...uniqueFacets) : 1;
        return Array.from({ length: highestFacet }, (_, i) => ({ label: `Facet ${i + 1}`, value: i + 1 }));
    }, [mdl, rlltDB]);

    const phsOptions = useMemo(() => {
        const availablePhases = rlltDB.filter(d => d.module === mdl && d.facet === fct);
        const uniquePhases = [...new Set(availablePhases.map(d => d.phase))];
        const highestPhase = uniquePhases.length > 0 ? Math.max(...uniquePhases) : 1;
        return Array.from({ length: highestPhase }, (_, i) => ({ label: `Phase ${i + 1}`, value: i + 1 }));
    }, [mdl, fct, rlltDB]);




    const handleTotalDaysChange = (val) => {
        const newTotal = val || 1;
        setTotalDays(newTotal);
        setRowsData(Array.from({ length: newTotal }, (_, i) => {
            if (i < rowsData.length) return rowsData[i];
            return { id: i + 1, day: i + 1, m1b: '', m1t: '', m2b: '', m2t: '', m3b: '', m3t: '', chap: '', verse: '', art: '', yes: false };
        }));
        setMappingConfig(Array.from({ length: newTotal }, (_, i) => {
            if (i < mappingConfig.length) return mappingConfig[i];
            return initialDayObj();
        }));
    };

    const handleDownloadTemplate = () => {
        const templateData = [];
        for (let i = 1; i <= totalDays; i++) {
            templateData.push({
                'Day': i,
                'S1 Book': '', 'S1 From': '', 'S1 To': '',
                'S2 Book': '', 'S2 From': '', 'S2 To': '',
                'S3 Book': '', 'S3 From': '', 'S3 To': ''
            });
        }
        const ws = XLSX.utils.json_to_sheet(templateData);
        ws['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 10 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `${totalDays} Day Mapping`);
        XLSX.writeFile(wb, `DayCycleChart_${totalDays}Days_Mapping_Template.xlsx`);
    };

    const handleExcelImportSubmit = (e) => {
        const file = e.files[0];
        if (!file) return;

        if (booksDB.length === 0) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Books must be loaded first to map Excel.' });
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
                    toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No valid rows found to import.' });
                    e.options.clear();
                    return;
                }

                const newConfig = Array.from({ length: totalDays }, () => ({ s1: [], s2: [], s3: [] }));
                let mappedCount = 0;
                let lastDay = null;

                data.forEach((row, idx) => {
                    const normalized = {};
                    Object.keys(row).forEach(k => {
                        const cleanKey = k.toLowerCase().replace(/\s+/g, '');
                        normalized[cleanKey] = row[k];
                    });

                    let dayVal = parseInt(normalized['day']);
                    if (isNaN(dayVal)) {
                        dayVal = lastDay;
                    } else {
                        lastDay = dayVal;
                    }

                    if (dayVal >= 1 && dayVal <= totalDays) {
                        const dIdx = dayVal - 1;
                        mappedCount++;

                        const parseSegment = (bkKey, fromKey, toKey) => {
                            const val = normalized[bkKey];
                            if (val === undefined || val === null) return null;
                            const rawBook = String(val).trim();
                            if (!rawBook || rawBook.toLowerCase() === 'undefined' || rawBook.toLowerCase() === 'null') return null;

                            const bookStrClean = rawBook.toLowerCase().replace(/[^a-z0-9]/g, '');
                            const matchBook = booksDB.find(b => {
                                const bNameClean = (b.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                                const bShortClean = (b.short_form || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                                return bNameClean === bookStrClean || bShortClean === bookStrClean;
                            });

                            if (!matchBook) return null;

                            return {
                                id: `${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
                                book_id: matchBook.id,
                                chFrom: parseInt(normalized[fromKey]) || null,
                                chTo: parseInt(normalized[toKey]) || null
                            };
                        };

                        const s1Bk = parseSegment('s1book', 's1from', 's1to');
                        if (s1Bk) newConfig[dIdx].s1.push(s1Bk);

                        const s2Bk = parseSegment('s2book', 's2from', 's2to');
                        if (s2Bk) newConfig[dIdx].s2.push(s2Bk);

                        const s3Bk = parseSegment('s3book', 's3from', 's3to');
                        if (s3Bk) newConfig[dIdx].s3.push(s3Bk);
                    }
                });

                newConfig.forEach(day => {
                    if (day.s1.length === 0) day.s1 = [initialBookRow()];
                    if (day.s2.length === 0) day.s2 = [initialBookRow()];
                    if (day.s3.length === 0) day.s3 = [initialBookRow()];
                });

                if (mappedCount === 0) {
                    toast.current?.show({ severity: 'error', summary: 'Import Failed', detail: `No valid mapping matching Day 1-${totalDays} found.` });
                } else {
                    setMappingConfig([...newConfig]);
                    toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Template imported successfully! Please confirm details and Map.', life: 4000 });
                }
            } catch (err) {
                console.error(err);
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to parse Excel file', life: 3000 });
            } finally {
                e.options.clear();
            }
        };
        reader.readAsBinaryString(file);
    };




    const handleAddDetails = () => {
        const buildString = (rows) => {
            return rows.filter(r => r.book_id).map(r => {
                const book = booksDB.find(b => b.id === r.book_id);
                const abbr = book ? (book.short_form || book.name) : 'UNK';
                if (r.chFrom && r.chTo) return `${abbr} ${r.chFrom}-${r.chTo}`;
                if (r.chFrom) return `${abbr} ${r.chFrom}`;
                return abbr;
            }).join(', ');
        };

        const calculateStats = (rows) => {
            let totalChapters = 0, totalVerses = 0, totalArt = 0.0;
            rows.filter(r => r.book_id).forEach(r => {
                const book = booksDB.find(b => b.id === r.book_id);
                if (book) {
                    const startCh = r.chFrom || 1;
                    const endCh = r.chTo || r.chFrom || book.total_chapters;
                    totalChapters += (endCh - startCh) + 1;

                    const matchedChapters = chaptersDB.filter(c => c.book_id === book.id && c.chapter_number >= startCh && c.chapter_number <= endCh);
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
                }
            });
            return { totalChapters, totalVerses, totalArt };
        };

        const formatHrMin = (mins) => {
            if (!mins) return "";
            const h = Math.floor(mins / 60);
            const m = Math.round(mins % 60);
            if (h > 0 && m > 0) return `${h}h.${m}m`;
            if (h > 0) return `${h}h`;
            return `${m}m`;
        };

        const newRows = [...rowsData];

        for (let dIdx = 0; dIdx < totalDays; dIdx++) {
            const conf = mappingConfig[dIdx];
            const m1bString = buildString(conf.s1);
            const m1Stats = calculateStats(conf.s1);
            const m2bString = buildString(conf.s2);
            const m2Stats = calculateStats(conf.s2);
            const m3bString = buildString(conf.s3);
            const m3Stats = calculateStats(conf.s3);

            const dayChapters = m1Stats.totalChapters + m2Stats.totalChapters + m3Stats.totalChapters;
            const dayVerses = m1Stats.totalVerses + m2Stats.totalVerses + m3Stats.totalVerses;
            const dayArtFloat = m1Stats.totalArt + m2Stats.totalArt + m3Stats.totalArt;

            const dayObj = newRows[dIdx];
            if (dayObj) {
                if (m1bString) { dayObj.m1b = m1bString; dayObj.m1t = formatHrMin(m1Stats.totalArt); }
                if (m2bString) { dayObj.m2b = m2bString; dayObj.m2t = formatHrMin(m2Stats.totalArt); }
                if (m3bString) { dayObj.m3b = m3bString; dayObj.m3t = formatHrMin(m3Stats.totalArt); }

                if (m1bString || m2bString || m3bString) {
                    dayObj.chap = dayChapters || dayObj.chap;
                    dayObj.verse = dayVerses || dayObj.verse;
                    dayObj.art = formatHrMin(dayArtFloat) || dayObj.art;
                }
            }
        }

        setHeaderSubtitle(`MODULE${mdl}:FACET${fct}:PHASE-${phs}/${maxPhases}`);
        setRowsData(newRows);
        toast.current?.show({ severity: 'success', summary: 'Success', detail: `All ${totalDays} Days mapped successfully!`, life: 3000 });
        setShowPopup(false);
    };

    const renderBookRows = (label, rows, setRows) => {
        return (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4">
                <h4 className="font-bold mb-3 text-sm text-black">{label}</h4>
                {rows.map((row, index) => {
                    const selectedBook = booksDB.find(b => b.id === row.book_id);
                    const chapCount = selectedBook ? selectedBook.total_chapters : 0;
                    const chapterOptions = Array.from({ length: chapCount }, (_, i) => ({ label: `Ch ${i + 1}`, value: i + 1 }));
                    const toChapterOptions = row.chFrom ? chapterOptions.filter(opt => opt.value >= row.chFrom) : chapterOptions;

                    return (
                        <div key={row.id} className="flex gap-2 items-center mb-2">
                            <Dropdown
                                value={row.book_id} options={booksDB} optionLabel="displayName" optionValue="id" placeholder="Select Book" filter
                                className="flex-1 bg-white text-black border border-gray-400 shadow-sm custom-white-dropdown" panelClassName="bg-white text-black custom-white-panel"
                                onChange={(e) => { const newRows = [...rows]; newRows[index] = { ...newRows[index], book_id: e.value, chFrom: null, chTo: null }; setRows(newRows); }}
                            />
                            <Dropdown
                                value={row.chFrom} options={chapterOptions} placeholder="From" disabled={!row.book_id}
                                className="w-28 bg-white text-black border border-gray-400 shadow-sm custom-white-dropdown" panelClassName="bg-white text-black custom-white-panel"
                                onChange={(e) => { const newRows = [...rows]; const updatedRow = { ...newRows[index], chFrom: e.value }; if (updatedRow.chTo && updatedRow.chTo < e.value) updatedRow.chTo = null; newRows[index] = updatedRow; setRows(newRows); }}
                            />
                            <Dropdown
                                value={row.chTo} options={toChapterOptions} placeholder="To" disabled={!row.chFrom}
                                className="w-28 bg-white text-black border border-gray-400 shadow-sm custom-white-dropdown" panelClassName="bg-white text-black custom-white-panel"
                                onChange={(e) => { const newRows = [...rows]; newRows[index] = { ...newRows[index], chTo: e.value }; setRows(newRows); }}
                            />
                            {index === rows.length - 1 ? (
                                <Button type="button" icon="pi pi-plus" className="p-button-primary bg-blue-600 text-white w-12 h-10 border-none p-0 flex justify-center items-center shadow-md" onClick={() => setRows([...rows, initialBookRow()])} />
                            ) : (
                                <Button type="button" icon="pi pi-minus" className="p-button-danger bg-red-600 text-white w-12 h-10 border-none p-0 flex justify-center items-center shadow-md" onClick={() => setRows(rows.filter(r => r.id !== row.id))} />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };


    const [hashVal2, setHashVal2] = useState("########");
    const [blueBox, setBlueBox] = useState("");

    const [tableFontSize, setTableFontSize] = useState(12);
    const getFS = (base) => (base + (tableFontSize - 12)) + 'px';

    const saveChart = async () => {
        const formData = new FormData();
        formData.append("module", mdl);
        formData.append("facet", fct);
        formData.append("phase", phs);
        formData.append("banner_text", "7TNT DAY CYCLE CHART");
        formData.append("t_label", "T");
        formData.append("state_payload", JSON.stringify(rowsData));

        try {
            await axios.post('http://' + window.location.hostname + ':8000/api/seven_tnt_daycycle_charts/sync', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Day Cycle Chart Configuration Saved Successfully!', life: 3000 });
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save chart data', life: 3000 });
        }
    };

    return (
        <div className="p-8 w-full max-w-full overflow-x-auto bg-gray-50 min-h-screen print:bg-white print:p-0 print:overflow-visible">
            <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700&display=swap" rel="stylesheet" />
            <style>{`
                @media print {
                    @page { size: landscape; margin: 10mm; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    body { background-color: transparent !important; }
                    .print\\:overflow-visible { overflow: visible !important; }
                }
                .rllt-condensed { font-family: 'Roboto Condensed', 'Arial Narrow', sans-serif !important; }
                .text-vertical {
                    writing-mode: vertical-rl;
                    transform: scale(-1);
                    text-align: center;
                }
            `}</style>
            <Toast ref={toast} />

            <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden mb-6 print:hidden">
                <div className="bg-gradient-to-r from-[#051220] to-[#0A1F35] py-3 px-6 flex flex-col xl:flex-row justify-between items-center text-white border-b-2 border-gray-100 gap-2">
                    <div className="flex-shrink-0 text-center xl:text-left mb-2 xl:mb-0">
                        <h1 className="text-xl font-black tracking-tight mb-0.5 text-[#c8a165] whitespace-nowrap">{headerTitle}</h1>
                        <p className="text-[11px] font-medium text-gray-300 uppercase tracking-widest mb-1.5">Creation Component</p>

                        <div className="flex gap-2 items-center bg-white/10 px-2 py-1 rounded-lg border border-white/20 shadow-inner inline-flex">
                            <span className="text-[10px] uppercase font-black text-gray-300 mr-2">Scale</span>
                            <Button icon="pi pi-minus" className="p-button-rounded p-button-text text-white h-7 w-7 min-w-[28px] p-0 hover:bg-white/20 transition-all border border-transparent hover:border-white/30" onClick={() => setTableFontSize(prev => Math.max(8, prev - 1))} />
                            <span className="font-black text-base w-6 text-center text-[#c8a165] drop-shadow-sm">{tableFontSize}</span>
                            <Button icon="pi pi-plus" className="p-button-rounded p-button-text text-white h-7 w-7 min-w-[28px] p-0 hover:bg-white/20 transition-all border border-transparent hover:border-white/30" onClick={() => setTableFontSize(prev => Math.min(20, prev + 1))} />
                        </div>
                    </div>

                    <div className="flex flex-col xl:flex-row items-center flex-wrap gap-4 w-full flex-1 xl:ml-6 mt-3 xl:mt-0">

                        <div className="flex items-center gap-3 bg-white p-1.5 px-3 rounded-lg shadow-inner border border-gray-200 w-full md:w-auto">
                            <span className="text-black font-semibold text-sm whitespace-nowrap px-1">Total Days:</span>
                            <InputNumber
                                value={totalDays}
                                onValueChange={(e) => handleTotalDaysChange(e.value)}
                                min={1} max={365}
                                className="w-20"
                                inputClassName="w-full text-center font-bold text-black bg-white !border-gray-500 !border px-2 py-1 rounded"
                            />
                        </div>

                        <div className="flex gap-2 items-center w-full md:w-auto justify-center xl:ml-auto">

                            <Button
                                label="Add Details"
                                icon="pi pi-list"
                                className="p-button-sm shadow-md font-bold px-4 py-2 rounded-full"
                                style={{ backgroundColor: '#c8a165', border: 'none' }}
                                onClick={() => setShowPopup(true)}
                            />
                            <Button label="Save Chart" icon="pi pi-save" className="p-button-success p-button-sm shadow-md font-bold px-4 py-2 rounded-full" onClick={saveChart} />
                        </div>
                    </div>
                </div>
            </div>

            <div id="printable-chart-area" className="w-full bg-white pb-6 rounded-b-2xl pt-6 px-6 relative">
                <div className="w-full border-[3px] border-black p-3 flex flex-col bg-white">

                    {/* CORE HEADERS */}
                    <div className="flex flex-col w-full mb-2">
                        <table className="w-full bg-white table-fixed border-collapse border-2 border-black" style={{ borderSpacing: 0 }}>
                            <tbody>
                                <tr className="h-[55px]">
                                    <td className="w-[55px] bg-[#00b050] border-r-2 border-black p-0 align-middle">
                                        <input className="w-full h-full text-center text-white bg-transparent outline-none font-serif text-[32px] font-normal leading-none placeholder-white/70"
                                            value={tLabel} onChange={e => setTLabel(e.target.value)} placeholder="T" />
                                    </td>
                                    <td className="p-0 align-middle text-center bg-white relative">
                                        <div className="flex items-center justify-center">
                                            <span className="text-[#ff0000] font-bold text-[20px] tracking-wide uppercase mr-2" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                                REAL LIFE LEADERSHIP TRAINING -
                                            </span>
                                            <input className="text-[#ff0000] bg-transparent outline-none font-bold text-[16px] tracking-wide uppercase placeholder-red-300 min-w-[200px]"
                                                value={headerSubtitle} onChange={e => setHeaderSubtitle(e.target.value)} placeholder="ENTER TITLE" />
                                        </div>
                                    </td>
                                    <td className="w-[60px] bg-[#00b050] border-l-2 border-black p-0 h-[55px]">
                                        <div className="flex flex-col h-[55px] w-full">
                                            <div className="flex-1 flex items-center justify-center border-b-2 border-black">
                                                <span className="text-white font-black text-[15px] tracking-tighter">PH</span>
                                            </div>
                                            <div className="flex-1 flex items-center justify-center">
                                                <input className="w-full text-center text-white bg-transparent outline-none font-bold text-[18px] placeholder-white/70"
                                                    value={phaseLabel} onChange={e => setPhaseLabel(e.target.value)} placeholder="1" />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <table className="w-full bg-white table-fixed border-collapse border-b-2 border-l-2 border-r-2 border-black" style={{ borderSpacing: 0 }}>
                            <tbody>
                                <tr className="h-[65px]">
                                    <td className="w-[85px] border-r-2 border-black p-0 align-middle bg-white overflow-hidden">
                                        <ImageUploadPlaceholder state={logo1} setState={setLogo1} label="Logo 1" />
                                    </td>
                                    <td className="w-[85px] border-r-2 border-black p-0 align-middle bg-white overflow-hidden">
                                        <ImageUploadPlaceholder state={logo2} setState={setLogo2} label="Logo 2" />
                                    </td>
                                    <td className="w-[85px] border-r-2 border-black p-0 align-middle bg-white overflow-hidden">
                                        <ImageUploadPlaceholder state={logo3} setState={setLogo3} label="Logo 3" />
                                    </td>
                                    <td className="border-r-2 border-black p-1 align-middle bg-white relative">
                                        <div className="absolute inset-[3px] border-[4px] border-[#e47636] pointer-events-none"></div>
                                        <div className="w-full h-full min-h-[50px] flex items-center px-4 relative z-10">
                                            <input className="w-full text-black font-bold text-[22px] uppercase bg-transparent outline-none placeholder-gray-300"
                                                value={bannerText} onChange={e => setBannerText(e.target.value)} placeholder="ENTER BANNER TITLE" />
                                        </div>
                                    </td>
                                    <td className="w-[140px] bg-[#ffff00] p-0 h-[65px] align-middle">
                                        <div className="flex flex-col h-[65px] w-full">
                                            <div className="flex-1 flex items-center justify-center border-b-2 border-black pt-1">
                                                <span className="text-black font-black tracking-widest text-[20px] drop-shadow-sm whitespace-nowrap" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.15em' }}>B K - A R</span>
                                            </div>
                                            <div className="flex-1 flex items-center justify-center pb-1">
                                                <span className="text-black font-black tracking-widest text-[18px] drop-shadow-sm whitespace-nowrap" style={{ letterSpacing: '0.15em' }}>6 6 - 4 0 +</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* DAY CYCLE TABLE FORMAT - REBUILT TO SCREENSHOT */}
                    <div className="w-full mt-2 mb-2 relative">
                        <table className="w-full bg-white table-fixed border-collapse" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
                            <colgroup>
                                <col className="w-[28px]" />   {/* TEA Side */}
                                <col className="w-[35px]" />   {/* DAY */}
                                <col className="w-[16%]" />      {/* WIDE 1 */}
                                <col className="w-[45px]" />   {/* TIME 1 */}
                                <col className="w-[16%]" />      {/* WIDE 2 */}
                                <col className="w-[45px]" />   {/* TIME 2 */}
                                <col className="w-auto" />      {/* WIDE 3 */}
                                <col className="w-[45px]" />   {/* TIME 3 */}
                                <col className="w-[35px]" />   {/* CHAP */}
                                <col className="w-[40px]" />   {/* VERSE */}
                                <col className="w-[35px]" />   {/* ART */}
                                <col className="w-[35px]" />   {/* YES */}
                                <col className="w-[28px]" />  {/* MODULE Side */}
                            </colgroup>
                            <tbody>
                                {/* GOD'S PROMISES ROW */}
                                <tr className="bg-white border-2 border-black h-[35px]">
                                    <td className="border-2 border-black bg-white"></td>
                                    <td colSpan={10} className="border-2 border-l-0 border-black px-2 align-middle bg-white">
                                        <div className="flex w-full items-center">
                                            <input
                                                value={promises}
                                                onChange={(e) => setPromises(e.target.value)}
                                                className="w-full h-full flex-1 outline-none font-bold bg-transparent text-black font-serif tracking-tight text-left uppercase pl-2"
                                                style={{ fontSize: getFS(15) }}
                                                placeholder="GOD'S PROMISES : ENTER GOD'S PROMISES HERE"
                                            />
                                        </div>
                                    </td>
                                    <td colSpan={2} className="border-2 border-black p-0 align-middle bg-white border-t-[3.5px] border-r-[3.5px] border-[#00b0f0]">
                                        <div className="w-full h-full min-h-[35px] flex items-center justify-center p-1">
                                            <input
                                                className="w-full h-full text-center font-bold text-black focus:outline-none bg-transparent"
                                                style={{ fontSize: getFS(14) }}
                                                value={promiseInput}
                                                onChange={(e) => setPromiseInput(e.target.value)}
                                            />
                                        </div>
                                    </td>
                                </tr>

                                {/* TABLE HEADERS */}
                                <tr className="bg-white border-2 border-black text-center font-bold h-[25px]" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
                                    <th rowSpan={totalDays + 3} className="border-2 border-black p-0 align-middle bg-white relative overflow-hidden" style={{ fontSize: getFS(10) }}>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div style={{ transform: 'rotate(-90deg)', fontSize: getFS(12) }} className="whitespace-nowrap tracking-widest font-extrabold text-black uppercase">
                                                TEA
                                            </div>
                                        </div>
                                    </th>
                                    <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-black">DAY</th>
                                    <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white">
                                        <input className="w-full text-center bg-transparent outline-none font-bold block" value={h1} onChange={(e) => setH1(e.target.value)} />
                                    </th>
                                    <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-black">TIME</th>
                                    <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white">
                                        <input className="w-full text-center bg-transparent outline-none font-bold block" value={h2} onChange={(e) => setH2(e.target.value)} />
                                    </th>
                                    <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-black">TIME</th>
                                    <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white">
                                        <input className="w-full text-center bg-transparent outline-none font-bold block" value={h3} onChange={(e) => setH3(e.target.value)} />
                                    </th>
                                    <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-black">TIME</th>
                                    <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-black">CHAP</th>
                                    <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-black">VERSE</th>
                                    <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-black">ART</th>
                                    <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-black">YES</th>
                                    <th rowSpan={totalDays + 1} className="border-2 border-black p-0 align-middle bg-white relative overflow-hidden" style={{ fontSize: getFS(10) }}>
                                        <div className="absolute inset-0 flex items-center justify-center w-full h-full bg-white z-[5]">
                                            <div style={{ transform: 'rotate(-90deg)', fontSize: getFS(11) }} className="whitespace-nowrap font-extrabold text-black origin-center">
                                                <input className="bg-transparent text-center outline-none border-none uppercase font-extrabold" value={headerSubtitle} onChange={(e) => setHeaderSubtitle(e.target.value)} style={{ width: `${(totalDays * 35) + 105}px` }} placeholder="MODULE1:FACET1:PHASE-1/1" />
                                            </div>
                                        </div>
                                    </th>
                                </tr>

                                {/* LOOP DYNAMIC ROWS */}
                                {rowsData.slice(0, totalDays).map((d, dIdx) => (
                                    <tr key={`row-${dIdx}`} className="bg-white text-center border-b-2 border-black h-[35px] hover:bg-gray-50">
                                        <td className="border-2 border-black p-0 font-extrabold bg-white text-black" style={{ fontSize: getFS(15) }}>{d.day}</td>

                                        <td className="border-2 border-black p-0 bg-white">
                                            <input className="w-[95%] text-left ml-[5%] outline-none bg-transparent font-bold uppercase leading-tight" style={{ fontSize: getFS(14) }} value={d.m1b} onChange={(e) => {
                                                const newData = [...rowsData];
                                                if (newData[dIdx]) newData[dIdx].m1b = e.target.value;
                                                setRowsData(newData);
                                            }} />
                                        </td>
                                        <td className="border-2 border-black p-0 bg-white">
                                            <input className="w-full text-center outline-none bg-transparent font-bold" style={{ fontSize: getFS(13) }} value={d.m1t} onChange={(e) => {
                                                const newData = [...rowsData];
                                                if (newData[dIdx]) newData[dIdx].m1t = e.target.value;
                                                setRowsData(newData);
                                            }} />
                                        </td>

                                        <td className="border-2 border-black p-0 bg-white">
                                            <input className="w-[95%] text-left ml-[5%] outline-none bg-transparent font-bold uppercase leading-tight" style={{ fontSize: getFS(14) }} value={d.m2b} onChange={(e) => {
                                                const newData = [...rowsData];
                                                if (newData[dIdx]) newData[dIdx].m2b = e.target.value;
                                                setRowsData(newData);
                                            }} />
                                        </td>
                                        <td className="border-2 border-black p-0 bg-white">
                                            <input className="w-full text-center outline-none bg-transparent font-bold" style={{ fontSize: getFS(13) }} value={d.m2t} onChange={(e) => {
                                                const newData = [...rowsData];
                                                if (newData[dIdx]) newData[dIdx].m2t = e.target.value;
                                                setRowsData(newData);
                                            }} />
                                        </td>

                                        <td className="border-2 border-black p-0 bg-white">
                                            <input className="w-[95%] text-left ml-[5%] outline-none bg-transparent font-bold uppercase leading-tight" style={{ fontSize: getFS(14) }} value={d.m3b} onChange={(e) => {
                                                const newData = [...rowsData];
                                                if (newData[dIdx]) newData[dIdx].m3b = e.target.value;
                                                setRowsData(newData);
                                            }} />
                                        </td>
                                        <td className="border-2 border-black p-0 bg-white">
                                            <input className="w-full text-center outline-none bg-transparent font-bold" style={{ fontSize: getFS(13) }} value={d.m3t} onChange={(e) => {
                                                const newData = [...rowsData];
                                                if (newData[dIdx]) newData[dIdx].m3t = e.target.value;
                                                setRowsData(newData);
                                            }} />
                                        </td>

                                        <td className="border-2 border-black p-0 bg-white">
                                            <input className="w-full text-center outline-none bg-transparent font-extrabold text-black" style={{ fontSize: getFS(13) }} value={d.chap} onChange={(e) => {
                                                const newData = [...rowsData];
                                                if (newData[dIdx]) newData[dIdx].chap = e.target.value;
                                                setRowsData(newData);
                                            }} />
                                        </td>
                                        <td className="border-2 border-black p-0 bg-white">
                                            <input className="w-full text-center outline-none bg-transparent font-extrabold text-black" style={{ fontSize: getFS(13) }} value={d.verse} onChange={(e) => {
                                                const newData = [...rowsData];
                                                if (newData[dIdx]) newData[dIdx].verse = e.target.value;
                                                setRowsData(newData);
                                            }} />
                                        </td>
                                        <td className="border-2 border-black p-0 bg-white">
                                            <input className="w-full text-center outline-none bg-transparent font-extrabold text-black" style={{ fontSize: getFS(13) }} value={d.art} onChange={(e) => {
                                                const newData = [...rowsData];
                                                if (newData[dIdx]) newData[dIdx].art = e.target.value;
                                                setRowsData(newData);
                                            }} />
                                        </td>
                                        <td className="border-2 border-black p-0 text-center bg-white">
                                            <div className="w-full h-full flex items-center justify-center p-[2px]">
                                                <div
                                                    className="w-[18px] h-[18px] border-[1.5px] border-black cursor-pointer bg-white rounded-[2px] relative flex items-center justify-center hover:bg-gray-100"
                                                    onClick={() => {
                                                        const newData = [...rowsData];
                                                        if (newData[dIdx]) newData[dIdx].yes = !newData[dIdx].yes;
                                                        setRowsData(newData);
                                                    }}
                                                >
                                                    {d.yes && <i className="pi pi-check text-[14px] text-gray-700 font-extrabold stroke-2"></i>}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-white">
                                <tr className="text-black font-extrabold tracking-wide uppercase h-[35px]" style={{ fontSize: getFS(14) }}>
                                    <td colSpan={7} className="border-2 border-black p-1 text-center font-extrabold uppercase tracking-wide bg-white">
                                        TOTAL AVERAGE READING TIME {formatSum(
                                            rowsData.slice(0, totalDays).reduce((acc, current) => acc + parseTime(current.art), 0),
                                            'HrMins'
                                        )}
                                    </td>
                                    <td className="border-2 border-black p-1 text-center font-extrabold bg-white text-black">
                                        {rowsData.slice(0, totalDays).reduce((acc, current) => acc + (parseInt(current.chap) || 0), 0)}
                                    </td>
                                    <td className="border-2 border-black p-1 text-center font-extrabold bg-white text-blue-900">
                                        {rowsData.slice(0, totalDays).reduce((acc, current) => acc + (parseInt(current.verse) || 0), 0)}
                                    </td>
                                    <td className="border-2 border-black p-1 text-center font-extrabold bg-white">
                                        {formatSum(
                                            rowsData.slice(0, totalDays).reduce((acc, current) => acc + parseTime(current.art), 0),
                                            'Hm'
                                        )}
                                    </td>
                                    <td colSpan={2} className="border-2 border-black p-1 text-center font-extrabold bg-white"></td>
                                </tr>
                                <tr className="bg-white text-black text-center font-bold italic h-[25px]" style={{ fontSize: getFS(11) }}>
                                    <td colSpan={12} className="border-2 border-black p-0 align-middle">
                                        <input
                                            className="w-full text-center outline-none bg-transparent whitespace-nowrap overflow-hidden text-ellipsis italic font-bold"
                                            style={{ fontSize: getFS(11) }}
                                            defaultValue={`It is the same with my word. I send it out, and it always produces fruit. It will accomplish all I want it to, and it will prosper everywhere I send it. Isaiah 55:11`}
                                        />
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
            {/* Popup Dialog for Adding Details */}
            <Dialog
                header={
                    <div className="flex items-center gap-3 w-full border-b pb-3 border-gray-200">
                        <i className="pi pi-list text-2xl text-blue-600"></i>
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600">Bind Component Day Mapping</h2>
                    </div>
                }
                visible={showPopup}
                onHide={() => setShowPopup(false)}
                style={{ width: '45rem' }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                className="p-fluid shadow-2xl"
                contentClassName="bg-gray-100 p-4"
                footer={<Button label="Add Details Sync -> Map" icon="pi pi-check" onClick={handleAddDetails} className="p-button-lg p-button-primary mt-4 font-bold" />}
            >
                <div className="flex flex-col gap-6 mt-2 p-4 bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <style>{`
                        .custom-white-dropdown .p-dropdown-label { color: black !important; font-weight: bold; }
                        .custom-white-panel .p-dropdown-item { color: black !important; font-weight: bold; }
                        .custom-white-panel .p-dropdown-item.p-highlight { background-color: #f3f4f6 !important; color: #1d4ed8 !important; }
                    `}</style>
                    {/* Row 1: MDL, FCT, PHS */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="font-semibold block mb-2 text-black">Module (MDL)</label>
                            <Dropdown value={mdl} options={mdlOptions} onChange={(e) => setMdl(e.value)} className="w-full bg-white text-black border border-gray-400 shadow-sm h-12 flex items-center px-2 custom-white-dropdown" panelClassName="bg-white text-black custom-white-panel" />
                        </div>
                        <div className="flex-1">
                            <label className="font-semibold block mb-2 text-black">Facet (FCT)</label>
                            <Dropdown value={fct} options={fctOptions} onChange={(e) => setFct(e.value)} className="w-full bg-white text-black border border-gray-400 shadow-sm h-12 flex items-center px-2 custom-white-dropdown" panelClassName="bg-white text-black custom-white-panel" />
                        </div>
                        <div className="flex-1">
                            <label className="font-semibold block mb-2 text-black">Phase (PHS)</label>
                            <Dropdown value={phs} options={phsOptions} onChange={(e) => setPhs(e.value)} className="w-full bg-white text-black border border-gray-400 shadow-sm h-12 flex items-center px-2 custom-white-dropdown" panelClassName="bg-white text-black custom-white-panel" />
                        </div>
                    </div>

                    {/* Excel Upload Area */}
                    <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Bulk Map {totalDays}-Day Configuration (Via Excel)</h3>
                            <Button label="Download Template" icon="pi pi-download" outlined size="small" className="p-button-secondary" onClick={handleDownloadTemplate} />
                        </div>
                        <div className="w-full border border-gray-200 rounded-xl overflow-hidden p-2 bg-gray-50">
                            <FileUpload
                                name="excelFile"
                                customUpload
                                uploadHandler={handleExcelImportSubmit}
                                accept=".xlsx,.csv"
                                maxFileSize={5000000}
                                emptyTemplate={<p className="text-center text-gray-500 m-0 py-2 text-sm">Drag and drop mapping template here</p>}
                                chooseLabel="Browse"
                                uploadLabel="Map Automatically"
                                className="text-sm p-fileupload-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Master Mapping Configuration Container */}
                <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                    {mappingConfig.map((dayConf, dIdx) => (
                        <div key={dIdx} className="shrink-0 bg-white rounded-xl border border-gray-300 overflow-hidden shadow-sm">
                            <button
                                type="button"
                                className={`w-full px-4 py-3 font-bold text-left flex justify-between items-center transition-colors shrink-0 ${expandedDay === dIdx ? 'bg-[#c8a165] text-white' : 'bg-[#051220] hover:bg-gray-800 text-white'}`}
                                onClick={() => setExpandedDay(expandedDay === dIdx ? -1 : dIdx)}
                            >
                                <span className="tracking-wide text-lg">Day {dIdx + 1} Configuration</span>
                                <i className={`pi ${expandedDay === dIdx ? 'pi-chevron-down' : 'pi-chevron-right'} text-xl`}></i>
                            </button>

                            {expandedDay === dIdx && (
                                <div className="p-4 bg-gray-50 border-t border-gray-200">
                                    {renderBookRows(`Segment 1: Book Mapping`, dayConf.s1, (newRows) => {
                                        const newConfig = [...mappingConfig];
                                        newConfig[dIdx] = { ...newConfig[dIdx], s1: newRows };
                                        setMappingConfig(newConfig);
                                    })}
                                    {renderBookRows(`Segment 2: Book Mapping`, dayConf.s2, (newRows) => {
                                        const newConfig = [...mappingConfig];
                                        newConfig[dIdx] = { ...newConfig[dIdx], s2: newRows };
                                        setMappingConfig(newConfig);
                                    })}
                                    {renderBookRows(`Segment 3: Book Mapping`, dayConf.s3, (newRows) => {
                                        const newConfig = [...mappingConfig];
                                        newConfig[dIdx] = { ...newConfig[dIdx], s3: newRows };
                                        setMappingConfig(newConfig);
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

            </Dialog>
        </div>
    );
};

export default SevenTNTDayCycleChart;
