import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
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

const CHUNK_COLORS = ['#00a8ff', '#2ed573', '#0A1F35', '#f1c40f', '#9b59b6', '#d35400', '#e74c3c'];

// Upload helper
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

// Generate chunks based on total days (5 days per chunk)
const generateInitialData = (totalDays = 30) => {
    const numChunks = totalDays / 5;
    const defaultData = [];
    for (let c = 0; c < numChunks; c++) {
        const daysArray = [];
        for (let d = 1; d <= 5; d++) {
            daysArray.push({ id: (c * 5) + d, day: (c * 5) + d, m1b: '', m1t: '', m2b: '', m2t: '', m3b: '', m3t: '', m4b: '', m4t: '', chap: 0, verse: 0, art: '', yes: false });
        }
        defaultData.push({
            id: `chunk_${c + 1}`,
            team: `TEAM -${c + 1}`,
            phase: 'PHASE - 1/1',
            promiseLabel: "GOD'S PROMISES :",
            promises: "ENTER GOD'S PROMISSES HERE",
            promiseInput: "",
            h1: "",
            h2: "",
            h3: "",
            h4: "",
            days: daysArray
        });
    }
    return defaultData;
};

const TwentyFourSevenChart = () => {
    const toast = useRef(null);
    const location = useLocation();
    const [chartDays, setChartDays] = useState(30);
    const [chunks, setChunks] = useState(generateInitialData(30));
    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);
    const [rlltDB, setRlltDB] = useState([]);
    const [headerSubtitle, setHeaderSubtitle] = useState("MODULE1:FACET1:PHASE-1/1");
    const [bannerText, setBannerText] = useState("24x7 CHART - 30 DAYS");
    const [tLabel, setTLabel] = useState("T");
    
    // Upload image states
    const [logo1, setLogo1] = useState(null);
    const [logo2, setLogo2] = useState(null);

    // Aesthetic & UX Scaling
    const [tableFontSize, setTableFontSize] = useState(14); // Default base data size now 14 (requested shift from 12->14)
    const getFS = (base) => (base + (tableFontSize - 14)) + 'px'; // scaling relative to the new 14px default

    // Popup state
    const [showPopup, setShowPopup] = useState(false);
    const [mdl, setMdl] = useState(1);
    const [fct, setFct] = useState(1);
    const [phs, setPhs] = useState(1);
    const [maxPhases, setMaxPhases] = useState(1);
    const [maxFacets, setMaxFacets] = useState(1);

    const initialBookRow = () => ({ id: Date.now() + Math.random(), book_id: null, chFrom: null, chTo: null });
    const initialDayObj = () => ({ s1: [initialBookRow()], s2: [initialBookRow()], s3: [initialBookRow()], s4: [initialBookRow()] });

    const [mappingConfig, setMappingConfig] = useState(Array.from({length: 30}, () => initialDayObj()));
    const [expandedDay, setExpandedDay] = useState(0);

    const setChartType = (days) => {
        setChartDays(days);
    };

    // Reset function for manual chart type changes
    const handleChartTypeChange = (days) => {
        setChartType(days);
        setMappingConfig(Array.from({length: days}, () => initialDayObj()));
        setChunks(generateInitialData(days));
        if (days === 40) {
            setBannerText("40 DAYS 24x7 CHART");
        } else {
            setBannerText("24x7 CHART - 30 DAYS");
        }
    };

    // Update mapping config length when chartDays changes during edit/load, 
    // but DON'T reset chunks here.
    useEffect(() => {
        setMappingConfig(prev => {
            if (prev.length === chartDays) return prev;
            return Array.from({length: chartDays}, () => initialDayObj());
        });
    }, [chartDays]);

    useEffect(() => {
        axios.get('http://localhost:8000/api/books', { withCredentials: true })
            .then(res => {
                const booksWithDisplay = res.data.map(b => ({
                    ...b, 
                    displayName: b.short_form ? `${b.short_form} - ${b.name}` : b.name 
                }));
                setBooksDB(booksWithDisplay);
            })
            .catch(err => console.error("Could not fetch books", err));

        axios.get('http://localhost:8000/api/chapters?limit=3000', { withCredentials: true })
            .then(res => setChaptersDB(res.data))
            .catch(err => console.error("Could not fetch chapters", err));

        axios.get('http://localhost:8000/api/rllt_lookup', { withCredentials: true })
            .then(res => {
                const data = res.data;
                setRlltDB(data);
                const queryParams = new URLSearchParams(window.location.search);
                if (data.length > 0 && !queryParams.has('editMod')) {
                    const uniqueModules = [...new Set(data.map(d => d.module))].sort((a,b)=>a-b);
                    if (uniqueModules.length > 0) setMdl(uniqueModules[0]);
                }
            })
            .catch(err => console.error("Could not fetch lookup", err));
    }, []);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const editMod = queryParams.get('editMod');
        const editFct = queryParams.get('editFct');
        const editPhs = queryParams.get('editPhs');

        if (editMod && editFct && editPhs) {
            const m = parseInt(editMod);
            const f = parseInt(editFct);
            const p = parseInt(editPhs);

            setMdl(m);
            setFct(f);
            setPhs(p);

            axios.get(`http://localhost:8000/api/charts/sync/${m}/${f}/${p}`, { withCredentials: true })
                .then(res => {
                    const data = res.data;
                    setBannerText(data.banner_text || "");
                    setTLabel(data.t_label || "T");
                    setLogo1(data.logo_url ? `http://localhost:8000${data.logo_url}` : null);
                    
                    if (data.state_payload) {
                        try {
                            const parsed = JSON.parse(data.state_payload);
                            if (Array.isArray(parsed)) {
                                setChartDays(parsed.length * 5);
                                setChunks(parsed);
                            }
                        } catch(e) { /* ignore parse error */ }
                    }
                    toast.current?.show({ severity: 'info', summary: 'Editing Session', detail: 'Chart loaded from listing', life: 3000 });
                })
                .catch(err => console.error("Could not load chart for edit"));
        }
    }, [location.search]);

    const mdlOptions = useMemo(() => {
        const uniqueModules = [...new Set(rlltDB.map(d => d.module))];
        const highestMod = uniqueModules.length > 0 ? Math.max(...uniqueModules) : 1;
        return Array.from({ length: highestMod }, (_, i) => ({ label: `Module ${i + 1}`, value: i + 1 }));
    }, [rlltDB]);

    useEffect(() => {
        const availableFacets = rlltDB.filter(d => d.module === mdl);
        const uniqueFacets = [...new Set(availableFacets.map(d => d.facet))];
        const highestFacet = uniqueFacets.length > 0 ? Math.max(...uniqueFacets) : 1;
        setMaxFacets(highestFacet);
    }, [mdl, rlltDB]);

    const fctOptions = useMemo(() => {
        const availableFacets = rlltDB.filter(d => d.module === mdl);
        const uniqueFacets = [...new Set(availableFacets.map(d => d.facet))];
        const highestFacet = uniqueFacets.length > 0 ? Math.max(...uniqueFacets) : 1;
        return Array.from({ length: highestFacet }, (_, i) => ({ label: `Facet ${i + 1}`, value: i + 1 }));
    }, [mdl, rlltDB]);

    useEffect(() => {
        const availablePhases = rlltDB.filter(d => d.module === mdl && d.facet === fct);
        const uniquePhases = [...new Set(availablePhases.map(d => d.phase))];
        const highestPhase = uniquePhases.length > 0 ? Math.max(...uniquePhases) : 1;
        setMaxPhases(highestPhase);
    }, [mdl, fct, rlltDB]);

    const phsOptions = useMemo(() => {
        const availablePhases = rlltDB.filter(d => d.module === mdl && d.facet === fct);
        const uniquePhases = [...new Set(availablePhases.map(d => d.phase))];
        const highestPhase = uniquePhases.length > 0 ? Math.max(...uniquePhases) : 1;
        return Array.from({ length: highestPhase }, (_, i) => ({ label: `Phase ${i + 1}`, value: i + 1 }));
    }, [mdl, fct, rlltDB]);

    // Removed DB SYNC HOOK as requested: old data should not auto-populate on load or when navigating to the creation menu.
    const saveChart = async () => {
        let currentPhs = phs;
        const queryParams = new URLSearchParams(window.location.search);
        const isEditing = queryParams.has('editMod') && queryParams.has('editFct') && queryParams.has('editPhs');

        // Prevent accidental overwrites when creating multiple new unlinked charts manually
        if (!isEditing) {
            try {
                const listRes = await axios.get('http://localhost:8000/api/charts/list', { withCredentials: true });
                const existingCharts = listRes.data.filter(c => c.module === mdl && c.facet === fct);
                if (existingCharts.length > 0) {
                    const maxUsedPhase = Math.max(...existingCharts.map(c => c.phase));
                    const isTaken = existingCharts.some(c => c.phase === currentPhs);
                    if (isTaken || currentPhs <= maxUsedPhase) {
                        currentPhs = maxUsedPhase + 1;
                        setPhs(currentPhs); // Align local state so header subtitle updates correctly
                    }
                }
            } catch (err) {
                console.error("Could not verify existing phases, proceeding with base state.", err);
            }
        }

        const formData = new FormData();
        formData.append("module", mdl);
        formData.append("facet", fct);
        formData.append("phase", currentPhs);
        formData.append("banner_text", bannerText);
        formData.append("t_label", tLabel);
        formData.append("state_payload", JSON.stringify(chunks));
        
        if (logo1 && typeof logo1 === 'object' && logo1.file) {
            formData.append("logo", logo1.file);
        }

        try {
            const res = await axios.post('http://localhost:8000/api/charts/sync', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Chart Saved Successfully', life: 3000 });
            // User Request: Clear main chart after saving successfully
            setTimeout(() => {
                setChunks(generateInitialData(chartDays));
                setBannerText(chartDays === 40 ? "40 DAYS 24x7 CHART" : "24x7 CHART - 30 DAYS");
                setTLabel("T");
                setLogo1(null);
                setMappingConfig(Array.from({length: chartDays}, () => initialDayObj()));
                setHeaderSubtitle(`MODULE${mdl}:FACET${fct}:PHASE-${currentPhs}/${maxPhases}`);
            }, 500);
        } catch(err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save chart', life: 3000 });
        }
    };

    const updateDay = (chunkIndex, dayId, field, value) => {
        const newChunks = [...chunks];
        const dayIndex = newChunks[chunkIndex].days.findIndex(d => d.id === dayId);
        if (dayIndex !== -1) {
            newChunks[chunkIndex].days[dayIndex] = { ...newChunks[chunkIndex].days[dayIndex], [field]: value };
            setChunks(newChunks);
        }
    };

    const updateChunk = (chunkIndex, field, value) => {
        const newChunks = [...chunks];
        newChunks[chunkIndex][field] = value;
        setChunks(newChunks);
    };

    const handleAddDetails = () => {
        // Build combined strings
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
            let totalChapters = 0;
            let totalVerses = 0;
            let totalArt = 0.0;
            
            rows.filter(r => r.book_id).forEach(r => {
                const book = booksDB.find(b => b.id === r.book_id);
                if (book) {
                    const startCh = r.chFrom || 1;
                    const endCh = r.chTo || r.chFrom || book.total_chapters;
                    totalChapters += (endCh - startCh) + 1;

                    // Filter chapters from DB
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

            const m1bString = buildString(conf.s1);
            const m1Stats = calculateStats(conf.s1);
            
            const m2bString = buildString(conf.s2);
            const m2Stats = calculateStats(conf.s2);
            
            const m3bString = buildString(conf.s3);
            const m3Stats = calculateStats(conf.s3);

            const m4bString = buildString(conf.s4);
            const m4Stats = calculateStats(conf.s4);

            const dayChapters = m1Stats.totalChapters + m2Stats.totalChapters + m3Stats.totalChapters + m4Stats.totalChapters;
            const dayVerses = m1Stats.totalVerses + m2Stats.totalVerses + m3Stats.totalVerses + m4Stats.totalVerses;
            const dayArtFloat = m1Stats.totalArt + m2Stats.totalArt + m3Stats.totalArt + m4Stats.totalArt;

            for (let c of newChunks) {
                c.phase = finalPhaseStr; // Update rotated phase globally
                const dayObj = c.days.find(d => d.day === dayNum);
                if (dayObj) {
                    if (m1bString) {
                        dayObj.m1b = m1bString;
                        dayObj.m1t = formatHrMin(m1Stats.totalArt);
                    }
                    if (m2bString) {
                        dayObj.m2b = m2bString;
                        dayObj.m2t = formatHrMin(m2Stats.totalArt);
                    }
                    if (m3bString) {
                        dayObj.m3b = m3bString;
                        dayObj.m3t = formatHrMin(m3Stats.totalArt);
                    }
                    if (m4bString) {
                        dayObj.m4b = m4bString;
                        dayObj.m4t = formatHrMin(m4Stats.totalArt);
                    }
                    
                    if (m1bString || m2bString || m3bString || m4bString) {
                        dayObj.chap = dayChapters || dayObj.chap;
                        dayObj.verse = dayVerses || dayObj.verse;
                        dayObj.art = formatHrMin(dayArtFloat) || dayObj.art;
                    }
                }
            }
        }

        // Apply updated title
        setHeaderSubtitle(`MODULE${mdl}:FACET${fct}:PHASE-${phs}/${maxPhases}`);
        setChunks(newChunks);
        toast.current.show({ severity: 'success', summary: 'Success', detail: `All ${chartDays} Days configured successfully!`, life: 3000 });
        setShowPopup(false);
    };

    // Generic Book Row Renderer
    const renderBookRows = (label, rows, setRows) => {
        return (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4">
                <h4 className="font-bold mb-3 text-sm text-black">{label}</h4>
                {rows.map((row, index) => {
                    // Calculate available chapters
                    const selectedBook = booksDB.find(b => b.id === row.book_id);
                    const chapCount = selectedBook ? selectedBook.total_chapters : 0;
                    const chapterOptions = Array.from({ length: chapCount }, (_, i) => ({ label: `Ch ${i + 1}`, value: i + 1 }));

                    // Dynamic 'To' options ensuring they are >= 'From'
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
                                className="flex-1 bg-white text-black border border-gray-400 shadow-sm custom-white-dropdown"
                                panelClassName="bg-white text-black custom-white-panel"
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
                                className="w-28 bg-white text-black border border-gray-400 shadow-sm custom-white-dropdown"
                                panelClassName="bg-white text-black custom-white-panel"
                                onChange={(e) => {
                                    const newRows = [...rows];
                                    const updatedRow = { ...newRows[index], chFrom: e.value };
                                    if (updatedRow.chTo && updatedRow.chTo < e.value) {
                                        updatedRow.chTo = null;
                                    }
                                    newRows[index] = updatedRow;
                                    setRows(newRows);
                                }}
                            />
                            <Dropdown 
                                value={row.chTo} 
                                options={toChapterOptions} 
                                placeholder="To"
                                disabled={!row.chFrom}
                                className="w-28 bg-white text-black border border-gray-400 shadow-sm custom-white-dropdown"
                                panelClassName="bg-white text-black custom-white-panel"
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

    const handleDownloadTemplate = () => {
        const templateData = [];
        for (let i = 1; i <= chartDays; i++) {
            templateData.push({
                'Day': i,
                'S1 Book': '',
                'S1 From': '',
                'S1 To': '',
                'S2 Book': '',
                'S2 From': '',
                'S2 To': '',
                'S3 Book': '',
                'S3 From': '',
                'S3 To': '',
                'S4 Book': '',
                'S4 From': '',
                'S4 To': ''
            });
        }
        const ws = XLSX.utils.json_to_sheet(templateData);
        // Style a bit or set column widths
        const wscols = [
            {wch:6}, {wch:15}, {wch:10}, {wch:10}, {wch:15}, {wch:10}, {wch:10}, {wch:15}, {wch:10}, {wch:10}, {wch:15}, {wch:10}, {wch:10}
        ];
        ws['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `${chartDays} Day Mapping`);
        XLSX.writeFile(wb, `TwentyFourSevenChart_${chartDays}Days_Mapping_Template.xlsx`);
    };

    const handleExcelImportSubmit = (e) => {
        const file = e.files[0];
        if (!file) return;

        if (booksDB.length === 0) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Books must be loaded first to map Excel.' });
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
                    toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'No valid rows found to import.' });
                    e.options.clear();
                    return;
                }

                const newConfig = Array.from({length: chartDays}, () => ({ s1: [], s2: [], s3: [], s4: [] }));
                let mappedCount = 0;
                let lastDay = null; // Sticky day tracker for multi-row entries

                data.forEach((row, idx) => {
                    const normalized = {};
                    Object.keys(row).forEach(k => {
                        const cleanKey = k.toLowerCase().replace(/\s+/g, '');
                        normalized[cleanKey] = row[k];
                    });

                    let dayVal = parseInt(normalized['day']);
                    
                    // If Day is blank/invalid, use the last successfully parsed day (sticky feature)
                    if (isNaN(dayVal)) {
                        dayVal = lastDay;
                    } else {
                        lastDay = dayVal;
                    }

                    if (dayVal >= 1 && dayVal <= chartDays) {
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
                                // High-precision unique ID for batch imports
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

                        const s4Bk = parseSegment('s4book', 's4from', 's4to');
                        if (s4Bk) newConfig[dIdx].s4.push(s4Bk);
                    }
                });

                // Post-process to ensure each segment has at least one row for UI if literally no mappings were found
                newConfig.forEach(day => {
                    if (day.s1.length === 0) day.s1 = [initialBookRow()];
                    if (day.s2.length === 0) day.s2 = [initialBookRow()];
                    if (day.s3.length === 0) day.s3 = [initialBookRow()];
                    if (day.s4.length === 0) day.s4 = [initialBookRow()];
                });

                if (mappedCount === 0) {
                    toast.current.show({ severity: 'error', summary: 'Import Failed', detail: `No valid mapping matching Day 1-${chartDays} found.` });
                } else {
                    setMappingConfig([...newConfig]);
                    toast.current.show({ severity: 'success', summary: 'Success', detail: 'Template imported successfully! Please confirm details and Map.', life: 4000 });
                }
            } catch (err) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not parse Excel file.' });
            } finally {
                e.options.clear();
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="p-8 w-full max-w-full overflow-x-auto bg-gray-50 min-h-screen">
            <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700&display=swap" rel="stylesheet" />
            <style>{`
                .rllt-condensed {
                    font-family: 'Roboto Condensed', 'Arial Narrow', sans-serif !important;
                }
                
                /* Ensure dropdown label text is black */
                .custom-white-dropdown .p-dropdown-label,
                .custom-white-dropdown .p-inputtext {
                    color: #000 !important;
                }
                
                /* Ensure dropdown item text is black */
                .p-dropdown-panel.custom-white-panel .p-dropdown-item {
                    color: #000 !important;
                    background-color: #fff !important;
                }

                /* Hover state for dropdown items */
                .p-dropdown-panel.custom-white-panel .p-dropdown-item:hover,
                .p-dropdown-panel.custom-white-panel .p-dropdown-item.p-highlight {
                    background-color: #e2e8f0 !important;
                    color: #000 !important;
                }

                .custom-white-dropdown .p-placeholder {
                    color: #4b5563 !important;
                }
            `}</style>
            <Toast ref={toast} />

            {/* Hidden logic processing */}
            {(() => {
                // Not rendering here, just computing grand total for later
                return null;
            })()}

            <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden mb-6">
                
                <div className="bg-gradient-to-r from-[#051220] to-[#0A1F35] p-6 flex flex-col xl:flex-row justify-between items-center text-white border-b-2 border-gray-100 pb-4 gap-4">
                    <div className="flex-shrink-0 text-center xl:text-left mb-4 xl:mb-0">
                        <h1 className="text-2xl font-black tracking-tight mb-1 text-[#c8a165] whitespace-nowrap">{chartDays === 40 ? "40 Days 24x7 Chart" : "24x7 Chart - 30 Days"}</h1>
                        <p className="text-xs font-medium text-gray-300 uppercase tracking-widest mb-3">{chartDays} Days Tracking</p>
                        
                        {/* Font Size Scaling Controls */}
                        <div className="flex gap-2 items-center bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 shadow-inner inline-flex">
                            <span className="text-[11px] uppercase font-black text-gray-300 mr-2">Scale</span>
                            <Button 
                                icon="pi pi-minus" 
                                className="p-button-rounded p-button-text text-white h-7 w-7 min-w-[28px] p-0 hover:bg-white/20 transition-all border border-transparent hover:border-white/30" 
                                onClick={() => setTableFontSize(prev => Math.max(8, prev - 1))}
                                tooltip="Decrease Font Size"
                                tooltipOptions={{ position: 'bottom' }}
                            />
                            <span className="font-black text-lg w-8 text-center text-[#c8a165] drop-shadow-sm">{tableFontSize}</span>
                            <Button 
                                icon="pi pi-plus" 
                                className="p-button-rounded p-button-text text-white h-7 w-7 min-w-[28px] p-0 hover:bg-white/20 transition-all border border-transparent hover:border-white/30" 
                                onClick={() => setTableFontSize(prev => Math.min(20, prev + 1))}
                                tooltip="Increase Font Size"
                                tooltipOptions={{ position: 'bottom' }}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col items-center xl:items-end w-full xl:w-auto gap-3">
                        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 w-full md:w-auto justify-center">
                            <span className="text-black font-bold whitespace-nowrap text-sm">Setup:</span>
                            <Dropdown 
                                value={chartDays} 
                                options={[{label: '30 Days Tracking', value: 30}, {label: '40 Days Tracking', value: 40}]} 
                                onChange={(e) => handleChartTypeChange(e.value)}
                                className="bg-gray-100 text-black border border-gray-300 shadow-sm w-[200px] h-[38px] flex items-center custom-white-dropdown"
                                panelClassName="bg-white text-black custom-white-panel"
                            />
                        </div>
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
                                onClick={saveChart} 
                            />
                        </div>
                    </div>
                </div>


                <div className="p-4 pb-4 pt-6">
                    {/* NEW OUTER BORDER WRAPPER */}
                    <div className="w-full border-[3px] border-black p-3 flex flex-col bg-white overflow-hidden">
                    {/* TOP HEADER BLOCK - MATCHING SCREENSHOT EXACTLY */}
                    <div className="flex flex-col w-full mb-2">
                        {/* ROW 1: T | REAL LIFE... | PH */}
                        <table className="w-full bg-white table-fixed border-collapse border-2 border-black" style={{ borderSpacing: 0 }}>
                            <tbody>
                                <tr className="h-[55px]">
                                    {/* T BLOCK */}
                                    <td className="w-[55px] bg-[#00b050] border-r-2 border-black p-0 align-middle">
                                        <input 
                                            className="w-full h-full text-center bg-transparent text-white font-serif text-[32px] border-none outline-none" 
                                            value={tLabel} 
                                            onChange={(e) => setTLabel(e.target.value)} 
                                        />
                                    </td>
                                    
                                    {/* CENTER TEXT */}
                                    <td className="p-0 align-middle text-center bg-white">
                                        <span className="text-[#ff0000] font-bold text-[20px] tracking-wide uppercase" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                            REAL LIFE LEADERSHIP TRAINING - <span className="text-[16px] font-bold">{headerSubtitle}</span>
                                        </span>
                                    </td>
                                    
                                    {/* PH BLOCK */}
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
                        
                        {/* ROW 2: 3 MAPS | ORANGE INPUT | BK-AR */}
                        <table className="w-full bg-white table-fixed border-collapse border-b-2 border-l-2 border-r-2 border-black" style={{ borderSpacing: 0 }}>
                            <tbody>
                                <tr className="h-[65px]">
                                    {/* MAP 1 */}
                                    <td className="w-[85px] border-r-2 border-black p-0 align-middle bg-white">
                                        <div className="w-[85px] h-[65px] p-1 overflow-hidden flex items-center justify-center">
                                            <ImageUploadPlaceholder state={logo1} setState={setLogo1} label="" />
                                        </div>
                                    </td>
                                    {/* MAP 2 */}
                                    <td className="w-[85px] border-r-2 border-black p-0 align-middle bg-white">
                                        <div className="w-[85px] h-[65px] p-1 overflow-hidden flex items-center justify-center">
                                            <ImageUploadPlaceholder state={logo1} setState={setLogo1} label="" />
                                        </div>
                                    </td>
                                    {/* MAP 3 */}
                                    <td className="w-[85px] border-r-2 border-black p-0 align-middle bg-white">
                                        <div className="w-[85px] h-[65px] p-1 overflow-hidden flex items-center justify-center">
                                            <ImageUploadPlaceholder state={logo1} setState={setLogo1} label="" />
                                        </div>
                                    </td>
                                    
                                    {/* ORANGE BANNER BOX */}
                                    <td className="border-r-2 border-black p-1 align-middle bg-white relative">
                                        <div className="absolute inset-[3px] border-[4px] border-[#e47636] pointer-events-none"></div>
                                        <input 
                                            type="text" 
                                            value={bannerText}
                                            onChange={(e) => setBannerText(e.target.value)}
                                            className="w-full h-full min-h-[50px] outline-none text-black font-bold px-4 text-[22px] uppercase bg-transparent relative z-10"
                                            placeholder="..."
                                        />
                                    </td>
                                    
                                    {/* BK-AR BLOCK */}
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

                {/* Nested Data Table Area */}
                <div className="pb-1 overflow-x-auto">
                    <style>{`
                        .editor-table, .editor-table td, .editor-table th { 
                            border: 1px solid #000 !important; 
                            border-collapse: collapse !important; 
                            position: relative !important;
                            top: 0 !important;
                            left: 0 !important;
                            box-sizing: border-box !important;
                        }
                        .editor-table {
                            table-layout: fixed !important;
                        }
                        .resize-handle-col {
                            position: absolute;
                            right: -5px;
                            top: 0;
                            bottom: 0;
                            width: 10px;
                            cursor: col-resize;
                            z-index: 50;
                            background: transparent;
                        }
                        .resize-handle-col:hover {
                            background: rgba(59, 130, 246, 0.4);
                        }
                        .resize-handle-col.active {
                            background: #3b82f6 !important;
                            width: 4px !important;
                            right: -2px !important;
                        }
                        .resize-handle-row {
                            position: absolute;
                            left: 0;
                            right: 0;
                            bottom: -3px;
                            height: 6px;
                            cursor: row-resize;
                            z-index: 30;
                            background: transparent;
                        }
                        .resize-handle-row:hover {
                            background: rgba(59, 130, 246, 0.5);
                        }
                        .resize-handle-row.active {
                            background: #3b82f6;
                        }
                    `}</style>
                    <div className="editor-table-container">
                    <table className="w-full bg-white table-fixed border-collapse" style={{ borderSpacing: 0 }}>
                        <colgroup>
                            <col style={{ width: '2%' }} />
                            <col style={{ width: '2%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '4%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '4%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '4%' }} />
                            <col style={{ width: '24%' }} />
                            <col style={{ width: '4%' }} />
                            <col style={{ width: '4%' }} />
                            <col style={{ width: '4%' }} />
                            <col style={{ width: '5%' }} />
                            <col style={{ width: '3%' }} />
                            <col style={{ width: '4%' }} />
                        </colgroup>
                        
                        {chunks.map((chunk, cIdx) => {
                            const m1Total = chunk.days.reduce((acc, curr) => acc + parseTime(curr.m1t), 0);
                            const m2Total = chunk.days.reduce((acc, curr) => acc + parseTime(curr.m2t), 0);
                            const m3Total = chunk.days.reduce((acc, curr) => acc + parseTime(curr.m3t), 0);
                            const m4Total = chunk.days.reduce((acc, curr) => acc + parseTime(curr.m4t), 0);
                            const chapTotal = chunk.days.reduce((acc, curr) => acc + (parseInt(curr.chap) || 0), 0);
                            const verseTotal = chunk.days.reduce((acc, curr) => acc + (parseInt(curr.verse) || 0), 0);
                            const artTotal = chunk.days.reduce((acc, curr) => acc + parseTime(curr.art), 0);

                            return (
                                <tbody key={chunk.id} className="text-black font-bold text-sm rllt-condensed">
                                    <tr className="bg-white h-[35px]">
                                        <td className="border-2 border-black bg-white"></td>
                                        <td colSpan={9} className="border-2 border-black px-2 align-middle bg-white">
                                            <div className="flex h-full w-full items-center">
                                                <input 
                                                    value={chunk.promiseLabel || "GOD'S PROMISES :"}
                                                    onChange={(e) => updateChunk(cIdx, 'promiseLabel', e.target.value)}
                                                    className="w-[150px] outline-none font-bold whitespace-nowrap mr-2 text-black tracking-wide bg-transparent font-serif"
                                                    style={{ fontSize: getFS(14) }}
                                                />
                                                <input 
                                                    value={chunk.promises}
                                                    onChange={(e) => updateChunk(cIdx, 'promises', e.target.value)}
                                                    className="outline-none flex-1 font-bold bg-transparent text-black font-serif tracking-tight text-center uppercase"
                                                    style={{ fontSize: getFS(14) }}
                                                    placeholder="ENTER GOD'S PROMISES HERE"
                                                />
                                            </div>
                                        </td>
                                        <td colSpan={5} className="bg-white p-0 align-middle" style={{ border: `3.5px solid ${CHUNK_COLORS[cIdx % CHUNK_COLORS.length]}` }}>
                                            <input 
                                                className="w-full h-full outline-none p-1 font-bold text-center bg-transparent text-black block"
                                                style={{ fontSize: getFS(14) }}
                                                value={chunk.promiseInput}
                                                onChange={(e) => updateChunk(cIdx, 'promiseInput', e.target.value)}
                                            />
                                        </td>
                                    </tr>

                                    <tr className="bg-white text-center font-bold h-[30px]" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
                                        <th rowSpan={6} className="border-2 border-black p-0 align-middle bg-white overflow-hidden relative" style={{ fontSize: getFS(10) }}>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div style={{ transform: 'rotate(-90deg)', fontSize: getFS(11) }} className="whitespace-nowrap tracking-widest font-extrabold text-black uppercase origin-center w-full">
                                                    <input 
                                                        className="bg-transparent text-center outline-none w-full font-extrabold"
                                                        value={chunk.team}
                                                        onChange={(e) => updateChunk(cIdx, 'team', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </th>
                                        <th style={{ fontSize: getFS(10) }} className="border-2 border-black p-0 bg-white text-black">DAY</th>
                                        <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-left pl-1 leading-none">
                                            <input className="w-full bg-transparent outline-none font-bold" value={chunk.h1} onChange={(e) => updateChunk(cIdx, 'h1', e.target.value)} />
                                        </th>
                                        <th style={{ fontSize: getFS(10) }} className="border-2 border-black p-0 bg-white text-black">TIME</th>
                                        <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-left pl-1 leading-none">
                                            <input className="w-full bg-transparent outline-none font-bold" value={chunk.h2} onChange={(e) => updateChunk(cIdx, 'h2', e.target.value)} />
                                        </th>
                                        <th style={{ fontSize: getFS(10) }} className="border-2 border-black p-0 bg-white text-black">TIME</th>
                                        <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-left pl-1 leading-none">
                                            <input className="w-full bg-transparent outline-none font-bold" value={chunk.h3} onChange={(e) => updateChunk(cIdx, 'h3', e.target.value)} />
                                        </th>
                                        <th style={{ fontSize: getFS(10) }} className="border-2 border-black p-0 bg-white text-black">TIME</th>
                                        <th style={{ fontSize: getFS(14) }} className="border-2 border-black p-1 bg-white text-left pl-2 leading-none">
                                            <input className="w-full bg-transparent outline-none font-bold" value={chunk.h4} onChange={(e) => updateChunk(cIdx, 'h4', e.target.value)} />
                                        </th>
                                        <th style={{ fontSize: getFS(10) }} className="border-2 border-black p-0 bg-white text-black">TIME</th>
                                        <th style={{ fontSize: getFS(10) }} className="border-2 border-black p-0 bg-white text-black">CHAP</th>
                                        <th style={{ fontSize: getFS(10) }} className="border-2 border-black p-0 bg-white text-black">VERSE</th>
                                        <th style={{ fontSize: getFS(10) }} className="border-2 border-black p-0 bg-white text-black">ART</th>
                                        <th style={{ fontSize: getFS(10) }} className="border-2 border-black p-0 bg-white text-black">YES</th>
                                        <th rowSpan={7} className="border-2 border-black p-0 align-middle bg-white overflow-hidden relative" style={{ fontSize: getFS(10) }}>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div style={{ transform: 'rotate(-90deg)' }} className="whitespace-nowrap tracking-widest font-extrabold text-black uppercase origin-center">
                                                    {headerSubtitle}
                                                </div>
                                            </div>
                                        </th>
                                    </tr>

                                    {chunk.days.map((d, dIdx) => (
                                        <tr key={d.id} className="bg-white text-center hover:bg-gray-50 border-b-2 border-black h-[38px]">
                                            <td className="border-2 border-black p-0 font-extrabold bg-white leading-none text-black" style={{ fontSize: getFS(12) }}>{d.day}</td>
                                            
                                            <td className="border-2 border-black p-0 bg-white">
                                                <input className="w-full text-center outline-none bg-transparent font-bold uppercase leading-tight" style={{ fontSize: getFS(12) }} value={d.m1b} onChange={(e) => updateDay(cIdx, d.id, 'm1b', e.target.value)} />
                                            </td>
                                            <td className="border-2 border-black p-0 bg-white font-bold text-black">
                                                <input className="w-full text-center outline-none bg-transparent font-bold" style={{ fontSize: getFS(11) }} value={d.m1t} onChange={(e) => updateDay(cIdx, d.id, 'm1t', e.target.value)} />
                                            </td>

                                            <td className="border-2 border-black p-0 bg-white">
                                                <input className="w-full text-center outline-none bg-transparent font-bold uppercase leading-tight" style={{ fontSize: getFS(12) }} value={d.m2b} onChange={(e) => updateDay(cIdx, d.id, 'm2b', e.target.value)} />
                                            </td>
                                            <td className="border-2 border-black p-0 bg-white font-bold text-black">
                                                <input className="w-full text-center outline-none bg-transparent font-bold" style={{ fontSize: getFS(11) }} value={d.m2t} onChange={(e) => updateDay(cIdx, d.id, 'm2t', e.target.value)} />
                                            </td>

                                            <td className="border-2 border-black p-0 bg-white">
                                                <input className="w-full text-center outline-none bg-transparent font-bold uppercase leading-tight" style={{ fontSize: getFS(12) }} value={d.m3b} onChange={(e) => updateDay(cIdx, d.id, 'm3b', e.target.value)} />
                                            </td>
                                            <td className="border-2 border-black p-0 bg-white font-bold text-black">
                                                <input className="w-full text-center outline-none bg-transparent font-bold" style={{ fontSize: getFS(11) }} value={d.m3t} onChange={(e) => updateDay(cIdx, d.id, 'm3t', e.target.value)} />
                                            </td>

                                            <td className="border-2 border-black p-1 bg-white text-left">
                                                <input className="w-full text-left outline-none bg-transparent font-bold uppercase resize-none overflow-hidden align-middle break-words block leading-tight" style={{ fontSize: getFS(13) }} value={d.m4b} onChange={(e) => updateDay(cIdx, d.id, 'm4b', e.target.value)} />
                                            </td>
                                            <td className="border-2 border-black p-0 bg-white font-bold text-black">
                                                <input className="w-full text-left outline-none bg-transparent font-bold px-1" style={{ fontSize: getFS(11) }} value={d.m4t} onChange={(e) => updateDay(cIdx, d.id, 'm4t', e.target.value)} />
                                            </td>

                                            <td className="border-2 border-black p-0">
                                                <input className="w-full text-center outline-none bg-transparent font-bold leading-none text-black" style={{ fontSize: getFS(11) }} value={d.chap} onChange={(e) => updateDay(cIdx, d.id, 'chap', e.target.value)} />
                                            </td>
                                            <td className="border-2 border-black p-0">
                                                <input className="w-full text-center outline-none bg-transparent font-bold leading-none text-black" style={{ fontSize: getFS(11) }} value={d.verse} onChange={(e) => updateDay(cIdx, d.id, 'verse', e.target.value)} />
                                            </td>
                                            <td className="border-2 border-black p-0">
                                                <input className="w-full text-center outline-none bg-transparent font-bold leading-none text-black" style={{ fontSize: getFS(11) }} value={d.art} onChange={(e) => updateDay(cIdx, d.id, 'art', e.target.value)} />
                                            </td>
                                            
                                            <td className="border-2 border-black p-0 text-center align-middle">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                                    checked={d.yes}
                                                    onChange={(e) => updateDay(cIdx, d.id, 'yes', e.target.checked)}
                                                />
                                            </td>
                                        </tr>
                                    ))}

                                    <tr className="bg-white text-center font-extrabold tracking-wide h-[35px]" style={{ fontSize: getFS(13) }}>
                                        <td className="border-2 border-black bg-white"></td>
                                        <td className="border-2 border-black bg-white"></td>
                                        <td colSpan={2} className="border-2 border-black bg-white">{formatSum(m1Total, 'HrMins')}</td>
                                        <td colSpan={2} className="border-2 border-black bg-white">{formatSum(m2Total, 'HrMins')}</td>
                                        <td colSpan={2} className="border-2 border-black bg-white">{formatSum(m3Total, 'HrMins')}</td>
                                        <td colSpan={2} className="border-2 border-black bg-white">{formatSum(m4Total, 'HrMins')}</td>
                                        <td className="border-2 border-black p-1 bg-white font-bold text-black" style={{ fontSize: getFS(13) }}>{chapTotal}</td>
                                        <td className="border-2 border-black p-1 bg-white font-bold text-black" style={{ fontSize: getFS(13) }}>{verseTotal}</td>
                                        <td colSpan={2} className="border-2 border-black p-1 bg-white font-bold text-black" style={{ fontSize: getFS(13) }}>{formatSum(artTotal, 'Hm')}</td>
                                    </tr>
                                </tbody>
                            );
                        })}
                        <tfoot className="pb-4 rllt-condensed">
                            <tr className="bg-white text-black font-extrabold tracking-wide text-center uppercase" style={{ fontSize: getFS(11) }}>
                                <td colSpan={10} className="border-2 border-black p-1 text-center font-extrabold uppercase tracking-wide bg-gray-50" style={{ fontSize: getFS(14) }}>
                                    TOTAL AVERAGE READING TIME {formatSum(
                                        chunks.reduce((acc, chunk) => acc + chunk.days.reduce((dAcc, day) => dAcc + parseTime(day.art), 0), 0), 
                                        'HrMins'
                                    )}
                                </td>
                                <td className="border-2 border-black p-1 text-center font-extrabold" style={{ fontSize: getFS(14) }}>
                                    {chunks.reduce((acc, chunk) => acc + chunk.days.reduce((dAcc, day) => dAcc + (parseInt(day.chap) || 0), 0), 0)}
                                </td>
                                <td className="border-2 border-black p-1 text-center font-extrabold font-black text-blue-900" style={{ fontSize: getFS(14) }}>
                                    {chunks.reduce((acc, chunk) => acc + chunk.days.reduce((dAcc, day) => dAcc + (parseInt(day.verse) || 0), 0), 0)}
                                </td>
                                <td colSpan={3} className="border-2 border-black p-1 text-center font-extrabold bg-gray-50" style={{ fontSize: getFS(14) }}>
                                    {formatSum(
                                        chunks.reduce((acc, chunk) => acc + chunk.days.reduce((dAcc, day) => dAcc + parseTime(day.art), 0), 0), 
                                        'Hm'
                                    )}
                                </td>
                            </tr>
                            <tr className="bg-white text-black text-center font-medium italic" style={{ fontSize: getFS(11) }}>
                                <td colSpan={15} className="border-2 border-black p-1">
                                    <input 
                                        className="w-full text-center outline-none bg-transparent whitespace-nowrap overflow-hidden text-ellipsis italic font-semibold"
                                        style={{ fontSize: getFS(11) }}
                                        defaultValue={`It is the same with my word. I send it out, and it always produces fruit. It will accomplish all I want it to, and it will prosper everywhere I send it. Isaiah 55:11`}
                                    />
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                    </div>
                    
                    <div className="flex items-center w-full px-2 pt-2 pb-4 bg-transparent mt-1 uppercase">
                        <span className="font-extrabold text-[15px] text-[#c8a165]">1</span>
                        <div className="flex-1 text-center">
                            <span className="font-extrabold text-[14px] tracking-widest text-black mr-4" style={{ fontFamily: 'Arial, sans-serif' }}>
                                MODULE {mdl} - FACET {fct}/{maxFacets}: PHASE - {phs}/{maxPhases}
                            </span>
                        </div>
                    </div>
                </div>
                </div> {/* END OF OUTER BORDER WRAPPER */}
                </div> {/* END OF P-4 WRAPPER */}
                </div> {/* END OF SHADOW-2XL MAIN CONTENT CONTAINER */}
            
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
                            <h3 className="font-bold text-gray-800">Bulk Map {chartDays}-Day Configuration (Via Excel)</h3>
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
                                    {renderBookRows(`Segment 4: Book Mapping`, dayConf.s4, (newRows) => {
                                        const newConfig = [...mappingConfig];
                                        newConfig[dIdx] = { ...newConfig[dIdx], s4: newRows };
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

export default TwentyFourSevenChart;
