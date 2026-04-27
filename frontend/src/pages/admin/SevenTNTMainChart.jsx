import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Checkbox } from 'primereact/checkbox';
import * as XLSX from 'xlsx';

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
        if (sStr.length === 1) sStr += '0';
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

const generateInitialData = (totalDays = 30) => {
    const numChunks = totalDays / 5;
    const defaultData = [];
    for (let c = 0; c < numChunks; c++) {
        const daysArray = [];
        for (let d = 1; d <= 5; d++) {
            daysArray.push({ id: (c * 5) + d, day: (c * 5) + d, content: '', pages: '', chap: 0, verse: 0, art: '', yes: false });
        }
        defaultData.push({
            id: `chunk_${c + 1}`,
            team: `TEAM-${c + 1}`,
            week: `WEEK ${c + 1}`,
            phase: 'PHASE - 1/1',
            promiseLabel: "GOD'S PROMISES :",
            promises: "ENTER GOD'S PROMISSES HERE",
            promiseInput: "",
            dayLabel: `DAY ${daysArray.map(d => d.day).join(', ')}`,
            bookNameHeader: "",
            footerHash: "########",
            days: daysArray
        });
    }
    return defaultData;
};

const promiseBorderColors = [
    '#5b9bd5', // 1: light blue
    '#00b050', // 2: green
    '#002060', // 3: navy
    '#ffff00', // 4: yellow
    '#7030a0', // 5: purple
    '#ed7d31', // 6: orange
    '#ff0000', // 7: red
    '#00b050', // 8: green
];

const SevenTNTMainChart = () => {
    const toast = useRef(null);
    const location = useLocation();
    const [chartDays, setChartDays] = useState(30);
    const [chunks, setChunks] = useState(generateInitialData(30));
    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);
    const [rlltDB, setRlltDB] = useState([]);
    const [headerSubtitle, setHeaderSubtitle] = useState("MODULE1:FACET1:PHASE-1/1");
    const [bannerText, setBannerText] = useState("7TNT MAIN CHART - 30 DAYS");
    const [tLabel, setTLabel] = useState("T");
    const [grandTotalHash1, setGrandTotalHash1] = useState("########");
    const [grandTotalHash2, setGrandTotalHash2] = useState("#########");

    const [logo1, setLogo1] = useState(null);
    const [logo2, setLogo2] = useState(null);
    const [logo3, setLogo3] = useState(null);

    const [tableFontSize, setTableFontSize] = useState(14);
    const getFS = (base) => (base + (tableFontSize - 14)) + 'px';

    const [showPopup, setShowPopup] = useState(false);
    const [mdl, setMdl] = useState(1);
    const [fct, setFct] = useState(1);
    const [phs, setPhs] = useState(1);
    const [maxPhases, setMaxPhases] = useState(1);
    const [maxFacets, setMaxFacets] = useState(1);

    const initialBookRow = () => ({ id: Date.now() + Math.random(), book_id: null, chFrom: null, chTo: null });
    const initialDayObj = () => ({ s1: [initialBookRow()], s2: [initialBookRow()], s3: [initialBookRow()] });

    const [mappingConfig, setMappingConfig] = useState(Array.from({ length: 30 }, () => initialDayObj()));

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
            });
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
    }, [mdl, fct, rlltDB]);

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

    const handleChartTypeChange = (days) => {
        setChartDays(days);
        setMappingConfig(Array.from({ length: days }, () => initialDayObj()));
        setChunks(generateInitialData(days));
        setBannerText(days === 40 ? "7TNT MAIN Chart - 40 DAYS" : "7TNT MAIN CHART - 30 DAYS");
    };

    const handleExcelUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Empty Excel file', life: 3000 });
                    return;
                }

                const normalizeKeys = (obj) => {
                    const normalized = {};
                    for (let key in obj) {
                        normalized[key.trim().toLowerCase()] = obj[key];
                    }
                    return normalized;
                };

                const newChunks = [...chunks];

                data.forEach(rowRaw => {
                    const row = normalizeKeys(rowRaw);
                    const dayNum = parseInt(row['day']);
                    if (isNaN(dayNum) || dayNum < 1 || dayNum > chartDays) return;

                    const chunkIdx = Math.floor((dayNum - 1) / 5);
                    const dayIdx = (dayNum - 1) % 5;

                    if (chunkIdx >= newChunks.length) return;

                    const chunkInfo = newChunks[chunkIdx];
                    const dayInfo = chunkInfo.days[dayIdx];

                    if (row['book name']) {
                        chunkInfo.bookNameHeader = row['book name'];
                    }

                    if (row['verses'] !== undefined) dayInfo.content = row['verses'].toString();

                    const pFrom = row['page from'] !== undefined ? row['page from'] : row['pages from'];
                    const pTo = row['page to'] !== undefined ? row['page to'] : row['pages to'];

                    if (pFrom !== undefined && pTo !== undefined) {
                        dayInfo.pages = `${pFrom}-${pTo}`;
                    } else if (row['pages'] !== undefined) {
                        dayInfo.pages = row['pages'].toString();
                    } else if (pFrom !== undefined) {
                        dayInfo.pages = pFrom.toString();
                    }

                    if (row['chapter'] !== undefined) dayInfo.chap = row['chapter'].toString();
                    if (row['art'] !== undefined) dayInfo.art = row['art'].toString();
                });

                setChunks(newChunks);
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Excel Imported Successfully', life: 3000 });
            } catch (err) {
                console.error(err);
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to parse Excel file', life: 3000 });
            }
        };
        reader.readAsBinaryString(file);
    };

    const saveChart = async () => {
        const formData = new FormData();
        formData.append("module", mdl);
        formData.append("facet", fct);
        formData.append("phase", phs);
        formData.append("banner_text", bannerText);
        formData.append("t_label", tLabel);
        formData.append("state_payload", JSON.stringify(chunks));

        if (logo1 && typeof logo1 === 'object' && logo1.file) {
            formData.append("logo", logo1.file);
        }

        try {
            const res = await axios.post('http://' + window.location.hostname + ':8000/api/seven_tnt_charts/sync', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            toast.current?.show({ severity: 'success', summary: 'Success', detail: '7TNT Chart Saved Successfully', life: 3000 });
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save chart', life: 3000 });
        }
    };

    const handleAddDetails = () => {
        const getBookAbbrs = (rows) => rows.filter(r => r.book_id).map(r => {
            const b = booksDB.find(bk => bk.id === r.book_id);
            return b ? (b.short_form || b.name) : '';
        }).join(', ');

        const getPagesStr = (rows) => rows.filter(r => r.book_id && r.chFrom).map(r => {
            if (r.chFrom && r.chTo && r.chFrom !== r.chTo) return `${r.chFrom}-${r.chTo}`;
            return `${r.chFrom}`;
        }).join(', ');

        const calculateStats = (rows) => {
            let totalChapters = 0;
            let totalVerses = 0;
            let totalArt = 0.0;

            rows.filter(r => r.book_id).forEach(r => {
                const book = booksDB.find(b => b.id === r.book_id);
                if (book) {
                    const startCh = r.chFrom || 1;
                    const endCh = r.chTo || r.chFrom || book.total_chapters;
                    totalChapters += (endCh - startCh) + 1;

                    const matchedChapters = chaptersDB.filter(c =>
                        c.book_id === book.id &&
                        c.chapter_number >= startCh &&
                        c.chapter_number <= endCh
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

        const newChunks = [...chunks];
        const finalPhaseStr = `MDL ${mdl}: FCT ${fct}: PHS - ${phs}/${maxPhases}`;

        for (let dIdx = 0; dIdx < chartDays; dIdx++) {
            const conf = mappingConfig[dIdx];
            const dayNum = dIdx + 1;

            const m1bString = getBookAbbrs(conf.s1);
            const m2bString = getBookAbbrs(conf.s2);
            const m3bString = getBookAbbrs(conf.s3);

            const p1 = getPagesStr(conf.s1);
            const p2 = getPagesStr(conf.s2);
            const p3 = getPagesStr(conf.s3);
            const pagesTotal = [p1, p2, p3].filter(x => x).join(' | ');

            const m1Stats = calculateStats(conf.s1);
            const m2Stats = calculateStats(conf.s2);
            const m3Stats = calculateStats(conf.s3);

            const dayChapters = m1Stats.totalChapters + m2Stats.totalChapters + m3Stats.totalChapters;
            const dayVerses = m1Stats.totalVerses + m2Stats.totalVerses + m3Stats.totalVerses;
            const dayArtFloat = m1Stats.totalArt + m2Stats.totalArt + m3Stats.totalArt;

            for (let c of newChunks) {
                c.phase = finalPhaseStr;
                const dayObj = c.days.find(d => d.day === dayNum);
                if (dayObj) {
                    const contentValues = [m1bString, m2bString, m3bString].filter(x => x);
                    dayObj.content = contentValues.join(', ');
                    dayObj.pages = pagesTotal;

                    if (m1bString || m2bString || m3bString) {
                        dayObj.chap = dayChapters || dayObj.chap;
                        dayObj.verse = dayVerses || dayObj.verse;
                        dayObj.art = formatHrMin(dayArtFloat) || dayObj.art;
                    }
                }
            }
        }

        setHeaderSubtitle(`MODULE${mdl}:FACET${fct}:PHASE-${phs}/${maxPhases}`);
        setChunks(newChunks);
        toast.current.show({ severity: 'success', summary: 'Success', detail: `Days configured successfully!`, life: 3000 });
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

                    const toChapterOptions = row.chFrom
                        ? chapterOptions.filter(opt => opt.value >= row.chFrom)
                        : chapterOptions;

                    return (
                        <div key={row.id} className="flex gap-2 items-center mb-2">
                            <Dropdown
                                value={row.book_id}
                                options={booksDB}
                                optionLabel="displayName"
                                optionValue="id"
                                placeholder="Select Book"
                                filter
                                className="flex-1 bg-white text-black border border-gray-400 shadow-sm"
                                onChange={(e) => {
                                    const newRows = [...rows];
                                    newRows[index] = { ...newRows[index], book_id: e.value, chFrom: null, chTo: null };
                                    setRows(newRows);
                                }}
                            />
                            <Dropdown
                                value={row.chFrom}
                                options={chapterOptions}
                                placeholder="From"
                                disabled={!row.book_id}
                                className="w-28 bg-white text-black border border-gray-400 shadow-sm"
                                onChange={(e) => {
                                    const newRows = [...rows];
                                    const updatedRow = { ...newRows[index], chFrom: e.value };
                                    if (updatedRow.chTo && updatedRow.chTo < e.value) updatedRow.chTo = null;
                                    newRows[index] = updatedRow;
                                    setRows(newRows);
                                }}
                            />
                            <Dropdown
                                value={row.chTo}
                                options={toChapterOptions}
                                placeholder="To"
                                disabled={!row.chFrom}
                                className="w-28 bg-white text-black border border-gray-400 shadow-sm"
                                onChange={(e) => {
                                    const newRows = [...rows];
                                    newRows[index] = { ...newRows[index], chTo: e.value };
                                    setRows(newRows);
                                }}
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

    return (
        <div className="p-8 w-full max-w-full overflow-x-auto bg-gray-50 min-h-screen">
            <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700&display=swap" rel="stylesheet" />
            <Toast ref={toast} />

            <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden mb-6">

                <div className="bg-gradient-to-r from-[#051220] to-[#0A1F35] p-6 flex flex-col xl:flex-row justify-between items-center text-white border-b-2 border-gray-100 pb-4 gap-4">
                    <div className="flex-shrink-0 text-center xl:text-left mb-4 xl:mb-0">
                        <h1 className="text-2xl font-black tracking-tight mb-1 text-[#c8a165] whitespace-nowrap">{bannerText}</h1>
                        <p className="text-xs font-medium text-gray-300 uppercase tracking-widest mb-3">7TNT Specifications</p>
                    </div>
                    <div className="flex flex-col items-center xl:items-end w-full xl:w-auto gap-3">
                        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
                            <style>{`
                                .black-dropdown .p-dropdown-label {
                                    color: black !important;
                                    font-weight: bold;
                                }
                            `}</style>
                            <span className="text-black font-bold whitespace-nowrap text-sm">Setup:</span>
                            <Dropdown
                                value={chartDays}
                                options={[{ label: '30 Days Tracking', value: 30 }, { label: '40 Days Tracking', value: 40 }]}
                                onChange={(e) => handleChartTypeChange(e.value)}
                                className="bg-gray-100 text-black border border-gray-300 shadow-sm w-[200px] black-dropdown"
                            />
                        </div>
                        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
                            <Dropdown
                                value={mdl}
                                options={mdlOptions}
                                onChange={(e) => setMdl(e.value)}
                                className="bg-gray-100 text-black border border-gray-300 shadow-sm w-[130px] black-dropdown"
                            />
                            <Dropdown
                                value={fct}
                                options={fctOptions}
                                onChange={(e) => setFct(e.value)}
                                className="bg-gray-100 text-black border border-gray-300 shadow-sm w-[130px] black-dropdown"
                            />
                            <Dropdown
                                value={phs}
                                options={phsOptions}
                                onChange={(e) => setPhs(e.value)}
                                className="bg-gray-100 text-black border border-gray-300 shadow-sm w-[130px] black-dropdown"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                id="excel-upload"
                                accept=".xlsx, .xls, .csv"
                                className="hidden"
                                onChange={handleExcelUpload}
                            />
                            <Button label="Import Excel" icon="pi pi-file-excel" className="bg-[#5b9bd5] text-white border-none p-button-sm shadow-md font-bold px-4 py-2" onClick={() => document.getElementById('excel-upload').click()} />
                            <Button label="Save 7TNT Chart" icon="pi pi-save" className="p-button-success p-button-sm shadow-md font-bold px-4 py-2" onClick={saveChart} />
                        </div>
                    </div>
                </div>

                <div className="p-4 pb-4 pt-6">
                    <div className="w-full border-[3px] border-black p-3 flex flex-col bg-white overflow-hidden">

                        {/* Header Architecture replicating Main Chart */}
                        <div className="flex flex-col w-full mb-2">
                            <table className="w-full bg-white table-fixed border-collapse border-2 border-black" style={{ borderSpacing: 0 }}>
                                <tbody>
                                    <tr className="h-[55px]">
                                        <td className="w-[55px] bg-[#00b050] border-r-2 border-black p-0 align-middle">
                                            <input className="w-full h-full text-center bg-transparent text-white font-serif text-[32px] border-none outline-none" value={tLabel} onChange={(e) => setTLabel(e.target.value)} />
                                        </td>
                                        <td className="p-0 align-middle text-center bg-white">
                                            <span className="text-[#ff0000] font-bold text-[20px] tracking-wide uppercase" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                                REAL LIFE LEADERSHIP TRAINING - <span className="text-[16px] font-bold">{headerSubtitle}</span>
                                            </span>
                                        </td>
                                        <td className="w-[60px] bg-[#00b050] border-l-2 border-black p-0 h-[55px]">
                                            <div className="flex flex-col h-[55px] w-full">
                                                <div className="flex-1 flex items-center justify-center border-b-2 border-black">
                                                    <span className="text-white font-black text-[15px] tracking-tighter">PH</span>
                                                </div>
                                                <div className="flex-1 flex items-center justify-center">
                                                    <span className="text-white font-bold text-[18px]">{phs}</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <table className="w-full bg-white table-fixed border-collapse border-b-2 border-l-2 border-r-2 border-black" style={{ borderSpacing: 0 }}>
                                <tbody>
                                    <tr className="h-[65px]">
                                        <td className="w-[85px] border-r-2 border-black p-0 align-middle bg-white"><div className="w-[85px] h-[65px] p-1"><ImageUploadPlaceholder state={logo1} setState={setLogo1} /></div></td>
                                        <td className="w-[85px] border-r-2 border-black p-0 align-middle bg-white"><div className="w-[85px] h-[65px] p-1"><ImageUploadPlaceholder state={logo2} setState={setLogo2} /></div></td>
                                        <td className="w-[85px] border-r-2 border-black p-0 align-middle bg-white"><div className="w-[85px] h-[65px] p-1"><ImageUploadPlaceholder state={logo3} setState={setLogo3} /></div></td>
                                        <td className="border-r-2 border-black p-1 align-middle bg-white relative">
                                            <div className="absolute inset-[3px] border-[4px] border-[#e47636] pointer-events-none"></div>
                                            <div className="w-full h-full min-h-[50px] flex items-center px-4 relative z-10">
                                                <input className="w-full flex-1 bg-transparent border-none text-black font-bold text-[22px] p-1 focus:outline-none uppercase placeholder-gray-400" value={bannerText} onChange={(e) => setBannerText(e.target.value)} placeholder="ENTER TEXT HERE" />
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

                        <div className="pb-1 overflow-x-auto w-full">
                            <style>{`
                            .rllt-condensed { font-family: 'Roboto Condensed', 'Arial Narrow', sans-serif !important; }
                        `}</style>
                            <table className="w-full bg-white table-fixed border-collapse rllt-condensed" style={{ border: '3px solid #000' }}>
                                {/* 11 Column setup as per 7TNT Specs */}
                                <colgroup>
                                    <col style={{ width: '4%' }} />  {/* TEAM Label Col */}
                                    <col style={{ width: '5%' }} />  {/* DAY identifier */}
                                    <col style={{ width: '60%' }} /> {/* BOOK/CONTENT */}
                                    <col style={{ width: '10%' }} /> {/* PAGES */}
                                    <col style={{ width: '8%' }} />  {/* CHAP */}
                                    <col style={{ width: '6%' }} />  {/* ART */}
                                    <col style={{ width: '3%' }} />  {/* YES */}
                                    <col style={{ width: '4%' }} />  {/* WEEK Label Col */}
                                </colgroup>

                                {chunks.map((chunk, cIdx) => (
                                    <tbody key={chunk.id} className="text-black font-bold text-sm rllt-condensed">
                                        <tr className="bg-white text-center border-b-2 border-black h-[40px]">
                                            <td colSpan={2} className="border-2 border-black p-0 bg-gray-50 align-middle text-center overflow-hidden relative cursor-pointer hover:bg-gray-100 transition-colors group">
                                                {chunk.headerImage ? (
                                                    <img src={chunk.headerImage} alt="Header" className="absolute inset-0 w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full opacity-60 group-hover:opacity-100">
                                                        <i className="pi pi-cloud-upload text-xl text-[#5b9bd5]"></i>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            const reader = new FileReader();
                                                            reader.onload = (ev) => {
                                                                const newChunks = [...chunks];
                                                                newChunks[cIdx].headerImage = ev.target.result;
                                                                setChunks(newChunks);
                                                            };
                                                            reader.readAsDataURL(e.target.files[0]);
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td className="border-2 border-black p-0 align-middle bg-white font-extrabold text-black">
                                                <input
                                                    className="w-full bg-transparent border-none text-black font-extrabold text-center focus:outline-none"
                                                    style={{ fontSize: getFS(12) }}
                                                    type="text"
                                                    value={chunk.dayLabel !== undefined ? chunk.dayLabel : `DAY ${chunk.days.map(d => d.day).join(', ')}`}
                                                    onChange={(e) => {
                                                        const newChunks = [...chunks];
                                                        newChunks[cIdx].dayLabel = e.target.value;
                                                        setChunks(newChunks);
                                                    }}
                                                />
                                            </td>
                                            <td colSpan={4} className="border-2 border-black p-1 align-middle bg-white">
                                                <input
                                                    className="w-full bg-transparent border-2 text-black font-bold focus:outline-none px-1"
                                                    style={{ fontSize: getFS(11), height: '20px', borderColor: promiseBorderColors[cIdx % promiseBorderColors.length] }}
                                                    type="text"
                                                    value={chunk.promiseInput || ''}
                                                    onChange={(e) => {
                                                        const newChunks = [...chunks];
                                                        newChunks[cIdx].promiseInput = e.target.value;
                                                        setChunks(newChunks);
                                                    }}
                                                />
                                            </td>
                                            <td className="border-2 border-black p-0 bg-white align-middle">
                                                {/* Empty cell matching WK column */}
                                            </td>
                                        </tr>
                                        <tr className="bg-white text-center font-bold h-[30px]">
                                            <th className="border-2 border-black p-0 bg-white" style={{ fontSize: getFS(10) }}></th>
                                            <th className="border-2 border-black p-0 bg-white text-black" style={{ fontSize: getFS(10) }}>DAY</th>
                                            <th className="border-2 border-black p-0 bg-white" style={{ fontSize: getFS(10) }}>
                                                <input
                                                    className="w-full bg-transparent border-none text-center font-bold text-black uppercase focus:outline-none"
                                                    style={{ fontSize: getFS(10) }}
                                                    type="text"
                                                    value={chunk.bookNameHeader || ''}
                                                    onChange={(e) => {
                                                        const newChunks = [...chunks];
                                                        newChunks[cIdx].bookNameHeader = e.target.value;
                                                        setChunks(newChunks);
                                                    }}
                                                />
                                            </th>
                                            <th className="border-2 border-black p-0 bg-white text-black" style={{ fontSize: getFS(10) }}>PAGES</th>
                                            <th className="border-2 border-black p-0 bg-white text-black" style={{ fontSize: getFS(10) }}>CHAP</th>
                                            <th className="border-2 border-black p-0 bg-white text-black" style={{ fontSize: getFS(10) }}>ART</th>
                                            <th className="border-2 border-black p-0 bg-white text-black" style={{ fontSize: getFS(10) }}>YES</th>
                                            <th className="border-2 border-black p-0 bg-white" style={{ fontSize: getFS(10) }}></th>
                                        </tr>
                                        {chunk.days.map((d, dIdx) => (
                                            <tr key={d.id} className="bg-white text-center border-b-2 border-black h-[38px]">
                                                {/* LEFT SIDEBAR LABEL */}
                                                {dIdx === 0 && (
                                                    <td rowSpan={6} className="border-2 border-black p-0 align-middle bg-white overflow-hidden relative">
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <input
                                                                className="bg-transparent text-center font-extrabold text-black uppercase origin-center w-32 border-none outline-none focus:ring-1 focus:ring-blue-500"
                                                                style={{ transform: 'rotate(-90deg)', fontSize: getFS(11) }}
                                                                value={chunk.team}
                                                                onChange={(e) => {
                                                                    const newChunks = [...chunks];
                                                                    newChunks[cIdx].team = e.target.value;
                                                                    setChunks(newChunks);
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                )}

                                                <td className="border-2 border-black p-0 font-extrabold bg-white leading-none text-black whitespace-nowrap px-1" style={{ fontSize: getFS(12) }}>{d.day}</td>

                                                {/* BOOKS/CONTENT CELLS */}
                                                <td className="border-2 border-black p-0 bg-white align-middle">
                                                    <input
                                                        className="w-full bg-transparent border-none text-left uppercase font-bold text-black focus:outline-none px-1"
                                                        style={{ fontSize: getFS(12) }}
                                                        type="text"
                                                        value={d.content || ''}
                                                        onChange={(e) => {
                                                            const newChunks = [...chunks];
                                                            newChunks[cIdx].days[dIdx].content = e.target.value;
                                                            setChunks(newChunks);
                                                        }}
                                                    />
                                                </td>

                                                {/* PAGES */}
                                                <td className="border-2 border-black p-0 bg-white align-middle">
                                                    <input
                                                        className="w-full bg-transparent border-none text-center uppercase font-bold text-black focus:outline-none px-1"
                                                        style={{ fontSize: getFS(13) }}
                                                        type="text"
                                                        value={d.pages || ''}
                                                        onChange={(e) => {
                                                            const newChunks = [...chunks];
                                                            newChunks[cIdx].days[dIdx].pages = e.target.value;
                                                            setChunks(newChunks);
                                                        }}
                                                    />
                                                </td>

                                                {/* STATS */}
                                                <td className="border-2 border-black p-0 bg-white align-middle">
                                                    <input
                                                        className="w-full bg-transparent border-none text-center font-bold text-black focus:outline-none"
                                                        style={{ fontSize: getFS(11) }}
                                                        type="text"
                                                        value={d.chap || ''}
                                                        onChange={(e) => {
                                                            const newChunks = [...chunks];
                                                            newChunks[cIdx].days[dIdx].chap = e.target.value;
                                                            setChunks(newChunks);
                                                        }}
                                                    />
                                                </td>
                                                <td className="border-2 border-black p-0 bg-white align-middle">
                                                    <input
                                                        className="w-full bg-transparent border-none text-center font-bold text-black focus:outline-none"
                                                        style={{ fontSize: getFS(11) }}
                                                        type="text"
                                                        value={d.art || ''}
                                                        onChange={(e) => {
                                                            const newChunks = [...chunks];
                                                            newChunks[cIdx].days[dIdx].art = e.target.value;
                                                            setChunks(newChunks);
                                                        }}
                                                    />
                                                </td>

                                                {/* CHECKBOX */}
                                                <td className="border-2 border-black p-0 text-center align-middle hover:bg-gray-100 cursor-pointer" onClick={() => {
                                                    const newChunks = [...chunks];
                                                    newChunks[cIdx].days[dIdx].yes = !newChunks[cIdx].days[dIdx].yes;
                                                    setChunks(newChunks);
                                                }}>
                                                    {d.yes ? '✔️' : ''}
                                                </td>

                                                {/* RIGHT SIDEBAR LABEL */}
                                                {dIdx === 0 && (
                                                    <td rowSpan={6} className="border-2 border-black p-0 align-middle bg-white overflow-hidden relative">
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <input
                                                                className="bg-transparent text-center font-extrabold text-black uppercase origin-center w-32 border-none outline-none focus:ring-1 focus:ring-blue-500"
                                                                style={{ transform: 'rotate(-90deg)', fontSize: getFS(11) }}
                                                                value={chunk.week}
                                                                onChange={(e) => {
                                                                    const newChunks = [...chunks];
                                                                    newChunks[cIdx].week = e.target.value;
                                                                    setChunks(newChunks);
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}

                                        {/* Footer row with ART sum */}
                                        <tr className="bg-white text-center h-[25px]">
                                            <td className="border-2 border-black bg-white"></td>
                                            <td colSpan={3} className="border-2 border-black p-0 bg-white align-middle text-center">
                                                <input
                                                    className="w-full bg-transparent border-none text-center font-extrabold tracking-[0.2em] text-black focus:outline-none uppercase"
                                                    style={{ fontSize: getFS(12) }}
                                                    type="text"
                                                    value={chunk.footerHash || ''}
                                                    onChange={(e) => {
                                                        const newChunks = [...chunks];
                                                        newChunks[cIdx].footerHash = e.target.value;
                                                        setChunks(newChunks);
                                                    }}
                                                />
                                            </td>
                                            <td colSpan={2} className="border-2 border-black p-0 font-bold text-black" style={{ fontSize: getFS(11) }}>
                                                {formatSum(chunk.days.reduce((acc, curr) => acc + parseTime(curr.art), 0), 'Hm').replace('H ', '.').replace('m', '.h')}
                                            </td>
                                        </tr>
                                    </tbody>
                                ))}
                                {/* GRAND TOTAL ROWS */}
                                <tbody className="text-black font-bold text-sm rllt-condensed">
                                    <tr className="bg-white text-center h-[25px]">
                                        <td className="border-2 border-black bg-white"></td>
                                        <td className="border-2 border-black bg-white"></td>
                                        <td colSpan={3} className="border-2 border-black p-0 bg-white align-middle text-center">
                                            <input
                                                className="w-full bg-transparent border-none text-center font-extrabold tracking-[0.2em] text-black focus:outline-none uppercase"
                                                style={{ fontSize: getFS(12) }}
                                                type="text"
                                                value={grandTotalHash1}
                                                onChange={(e) => setGrandTotalHash1(e.target.value)}
                                            />
                                        </td>
                                        <td colSpan={3} className="border-2 border-black p-0 font-bold text-black" style={{ fontSize: getFS(11) }}>
                                            {formatSum(chunks.flatMap(c => c.days).reduce((acc, curr) => acc + parseTime(curr.art), 0), 'Hm').replace('H ', '.').replace('m', '.h')}
                                        </td>
                                    </tr>
                                    <tr className="bg-white text-center h-[25px]">
                                        <td colSpan={8} className="border-2 border-black p-0 bg-white align-middle text-center">
                                            <input
                                                className="w-full bg-transparent border-none text-center font-extrabold tracking-[0.5em] text-black focus:outline-none uppercase"
                                                style={{ fontSize: getFS(12) }}
                                                type="text"
                                                value={grandTotalHash2}
                                                onChange={(e) => setGrandTotalHash2(e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default SevenTNTMainChart;
