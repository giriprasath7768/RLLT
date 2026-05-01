import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { OverlayPanel } from 'primereact/overlaypanel';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

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

const getDaysList = (cycle) => {
    const list = [];
    for (let i = cycle; i <= 365; i += cycle) list.push(i);
    return list;
};

// Generate chunks based on chosen cycle, grouping 5 days per chunk for visual separation
const generateInitialData = (cycle = 3) => {
    const daysList = getDaysList(cycle);
    const numChunks = Math.ceil(daysList.length / 5);
    const defaultData = [];
    for (let c = 0; c < numChunks; c++) {
        const daysArray = [];
        for (let d = 0; d < 5; d++) {
            const idx = c * 5 + d;
            if (idx < daysList.length) {
                daysArray.push({ id: daysList[idx], day: daysList[idx], m1b: '', m1t: '', m2b: '', m2t: '', m3b: '', m3t: '', chap: 0, verse: 0, art: '', yes: false });
            }
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
            days: daysArray
        });
    }
    return defaultData;
};

const DynamicCycleChart = () => {
    const toast = useRef(null);
    const location = useLocation();
    const [chartCycle, setChartCycle] = useState(3);
    const [chunks, setChunks] = useState(generateInitialData(3));
    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);
    const [rlltDB, setRlltDB] = useState([]);
    const [headerSubtitle, setHeaderSubtitle] = useState("MODULE1:FACET1:PHASE-1/1");
    const [bannerText, setBannerText] = useState("3-5-7 CHART - 3 DAY CYCLE");
    const [tLabel, setTLabel] = useState("T");

    // Upload image states
    const [logo1, setLogo1] = useState(null);
    const [logo2, setLogo2] = useState(null);

    // Aesthetic & UX Scaling
    const [tableFontSize, setTableFontSize] = useState(8); // Default base data size now 8
    const getFS = (base) => (base + (tableFontSize - 14)) + 'px'; // scaling relative to the new 14px default

    // Popup state
    const [showPopup, setShowPopup] = useState(false);
    const op = useRef(null);
    const [validationInfo, setValidationInfo] = useState(null);

    const [mdl, setMdl] = useState(1);
    const [fct, setFct] = useState(1);
    const [phs, setPhs] = useState(1);
    const [maxPhases, setMaxPhases] = useState(1);
    const [maxFacets, setMaxFacets] = useState(1);

    const [numCols, setNumCols] = useState(3);
    const [modalTotalDays, setModalTotalDays] = useState(30);
    const [modalSegments, setModalSegments] = useState([[null], [null], [null]]);
    const [selectorVisible, setSelectorVisible] = useState(false);
    const [targetSegmentIndex, setTargetSegmentIndex] = useState(null);

    const STANDARD_BOOKS = [
        "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", 
        "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO", 
        "ECC", "SOS", "ISA", "JER", "LAM", "EZE", "DAN", "HOS", "JOE", "AMO", 
        "OBA", "JON", "MIC", "NAH", "HAB", "ZEP", "HAG", "ZEC", "MAL",
        "MAT", "MAR", "LUK", "JOH", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", 
        "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAM", 
        "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV"
    ];

    const getBookColorClass = (index) => {
        const id = index + 1;
        if (id >= 1 && id <= 5) return 'text-red-700 border-red-700 hover:bg-red-50';
        if (id >= 6 && id <= 17) return 'text-amber-700 border-amber-700 hover:bg-amber-50';
        if (id >= 18 && id <= 22) return 'text-green-700 border-green-700 hover:bg-green-50';
        if (id >= 23 && id <= 27) return 'text-blue-700 border-blue-700 hover:bg-blue-50';
        if (id >= 28 && id <= 39) return 'text-purple-700 border-purple-700 hover:bg-purple-50';
        if (id >= 40 && id <= 43) return 'text-red-700 border-red-700 hover:bg-red-50';
        if (id === 44) return 'text-amber-700 border-amber-700 hover:bg-amber-50';
        if (id >= 45 && id <= 57) return 'text-green-700 border-green-700 hover:bg-green-50';
        if (id >= 58 && id <= 65) return 'text-blue-700 border-blue-700 hover:bg-blue-50';
        if (id === 66) return 'text-purple-700 border-purple-700 hover:bg-purple-50';
        return 'text-gray-700 border-gray-700 hover:bg-gray-50';
    };

    const handleBookSelect = (bookId) => {
        if (targetSegmentIndex !== null) {
            const newSegs = [...modalSegments];
            const currentList = newSegs[targetSegmentIndex].filter(x => x !== null);
            currentList.push(bookId);
            newSegs[targetSegmentIndex] = currentList.length > 0 ? currentList : [null];
            setModalSegments(newSegs);
        }
        setSelectorVisible(false);
    };

    const handleChartTypeChange = (c) => {
        setChartCycle(c);
        setBannerText(`3-5-7 CHART - ${c} DAY CYCLE`);
    };

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
                const queryParams = new URLSearchParams(window.location.search);
                if (data.length > 0 && !queryParams.has('editMod')) {
                    const uniqueModules = [...new Set(data.map(d => d.module))].sort((a, b) => a - b);
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

            axios.get(`http://${window.location.hostname}:8000/api/charts/sync/${m}/${f}/${p}`, { withCredentials: true })
                .then(res => {
                    const data = res.data;
                    setBannerText(data.banner_text || "");
                    setTLabel(data.t_label || "T");
                    setLogo1(data.logo_url ? `http://${window.location.hostname}:8000${data.logo_url}` : null);

                    if (data.state_payload) {
                        try {
                            const parsed = JSON.parse(data.state_payload);
                            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].days.length > 0) {
                                const detectedCycle = parsed[0].days[0].day;
                                setChartCycle(detectedCycle);
                                setChunks(parsed);
                            }
                        } catch (e) { /* ignore parse error */ }
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
                const listRes = await axios.get('http://' + window.location.hostname + ':8000/api/charts/list', { withCredentials: true });
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
            const res = await axios.post('http://' + window.location.hostname + ':8000/api/charts/sync', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Chart Saved Successfully', life: 3000 });
            // User Request: Clear main chart after saving successfully
            setTimeout(() => {
                setChunks(generateInitialData(chartCycle));
                setBannerText(`3-5-7 CHART - ${chartCycle} DAY CYCLE`);
                setTLabel("T");
                setLogo1(null);
                setMappingConfig(Array.from({ length: getDaysList(chartCycle).length }, () => initialDayObj()));
                setHeaderSubtitle(`MODULE${mdl}:FACET${fct}:PHASE-${currentPhs}/${maxPhases}`);
            }, 500);
        } catch (err) {
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

    const distributeBooks = (booksArr, totalDays) => {
        if (!booksArr || !booksArr.length) return Array.from({ length: totalDays }, () => null);

        let allChaps = [];
        for (let b of booksArr) {
            const bChaps = chaptersDB.filter(c => c.book_id === b.id).sort((a, b) => a.chapter_number - b.chapter_number);
            bChaps.forEach(c => {
                c._bookAbbr = b.short_form || b.name;
            });
            allChaps = allChaps.concat(bChaps);
        }

        if (!allChaps.length) return Array.from({ length: totalDays }, () => null);

        let cum = [], sum = 0;
        for (let c of allChaps) {
            sum += (typeof c.art === 'number' ? c.art : parseTime(c.art));
            cum.push(sum);
        }
        const totalART = sum;
        const daysOut = [];
        let lastChapterIndex = -1;

        for (let day = 1; day <= totalDays; day++) {
            const target = (day / totalDays) * totalART;
            let bestIdx = lastChapterIndex;
            let minDiff = Infinity;
            for (let i = lastChapterIndex + 1; i < allChaps.length; i++) {
                const diff = Math.abs(cum[i] - target);
                if (diff <= minDiff) { minDiff = diff; bestIdx = i; } else break;
            }
            if (day === totalDays) bestIdx = allChaps.length - 1;

            if (bestIdx > lastChapterIndex) {
                // Group by book for portion string
                let portionStr = "";
                const segments = [];
                let currentBook = allChaps[lastChapterIndex + 1]._bookAbbr;
                let currentStartCh = allChaps[lastChapterIndex + 1].chapter_number;
                let currentEndCh = currentStartCh;

                for (let i = lastChapterIndex + 2; i <= bestIdx; i++) {
                    const c = allChaps[i];
                    if (c._bookAbbr === currentBook) {
                        currentEndCh = c.chapter_number;
                    } else {
                        segments.push(currentStartCh === currentEndCh ? `${currentBook} ${currentStartCh}` : `${currentBook} ${currentStartCh}-${currentEndCh}`);
                        currentBook = c._bookAbbr;
                        currentStartCh = c.chapter_number;
                        currentEndCh = c.chapter_number;
                    }
                }
                segments.push(currentStartCh === currentEndCh ? `${currentBook} ${currentStartCh}` : `${currentBook} ${currentStartCh}-${currentEndCh}`);
                portionStr = segments.join(', ');

                const segART = cum[bestIdx] - (lastChapterIndex >= 0 ? cum[lastChapterIndex] : 0);

                let vs = 0;
                for (let i = lastChapterIndex + 1; i <= bestIdx; i++) vs += (allChaps[i].verse_count || 0);

                // Format HR MIN
                let timeStr = "";
                const h = Math.floor(segART / 60);
                const m = Math.round(segART % 60);
                if (h > 0 && m > 0) timeStr = `${h}h.${m}m`;
                else if (h > 0) timeStr = `${h}h`;
                else timeStr = `${m}m`;

                daysOut.push({ portion: portionStr, time: segART, timeStr: timeStr, timeFloat: segART, chapCount: (bestIdx - lastChapterIndex), verseCount: vs });
                lastChapterIndex = bestIdx;
            } else {
                daysOut.push(null);
            }
        }
        return daysOut;
    };

    const handleAddDetailsOld = (e) => {
        /*
        if (modalBooks.some(b => !b)) {
            toast.current.show({ severity: 'warn', summary: 'Missing', detail: 'Assign a book for all slots.' });
            return;
        }

        const validBooksData = modalBooks.map(bId => booksDB.find(b => b.id === bId)).filter(b => b);

        const getChapsCount = (booksArr) => {
            let count = 0;
            booksArr.forEach(b => {
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
                const listRes = await axios.get('http://' + window.location.hostname + ':8000/api/charts/list', { withCredentials: true });
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
            const res = await axios.post('http://' + window.location.hostname + ':8000/api/charts/sync', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Chart Saved Successfully', life: 3000 });
            // User Request: Clear main chart after saving successfully
            setTimeout(() => {
                setChunks(generateInitialData(chartCycle));
                setBannerText(`3-5-7 CHART - ${chartCycle} DAY CYCLE`);
                setTLabel("T");
                setLogo1(null);
                setHeaderSubtitle(`MODULE${mdl}:FACET${fct}:PHASE-${currentPhs}/${maxPhases}`);
            }, 500);
        } catch (err) {
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

    const distributeBooks = (booksArr, totalDays) => {
        if (!booksArr || !booksArr.length) return Array.from({ length: totalDays }, () => null);
        
        let allChaps = [];
        for (let b of booksArr) {
            const bChaps = chaptersDB.filter(c => c.book_id === b.id).sort((a, b) => a.chapter_number - b.chapter_number);
            bChaps.forEach(c => {
                c._bookAbbr = b.short_form || b.name;
            });
            allChaps = allChaps.concat(bChaps);
        }

        if (!allChaps.length) return Array.from({ length: totalDays }, () => null);

        let cum = [], sum = 0;
        for (let c of allChaps) { 
            sum += (typeof c.art === 'number' ? c.art : parseTime(c.art)); 
            cum.push(sum); 
        }
        const totalART = sum;
        const daysOut = [];
        let lastChapterIndex = -1;

        for (let day = 1; day <= totalDays; day++) {
            const target = (day / totalDays) * totalART;
            let bestIdx = lastChapterIndex;
            let minDiff = Infinity;
            for (let i = lastChapterIndex + 1; i < allChaps.length; i++) {
                const diff = Math.abs(cum[i] - target);
                if (diff <= minDiff) { minDiff = diff; bestIdx = i; } else break;
            }
            if (day === totalDays) bestIdx = allChaps.length - 1;

            if (bestIdx > lastChapterIndex) {
                // Group by book for portion string
                let portionStr = "";
                const segments = [];
                let currentBook = allChaps[lastChapterIndex + 1]._bookAbbr;
                let currentStartCh = allChaps[lastChapterIndex + 1].chapter_number;
                let currentEndCh = currentStartCh;

                for (let i = lastChapterIndex + 2; i <= bestIdx; i++) {
                    const c = allChaps[i];
                    if (c._bookAbbr === currentBook) {
                        currentEndCh = c.chapter_number;
                    } else {
                        segments.push(currentStartCh === currentEndCh ? `${currentBook} ${currentStartCh}` : `${currentBook} ${currentStartCh}-${currentEndCh}`);
                        currentBook = c._bookAbbr;
                        currentStartCh = c.chapter_number;
                        currentEndCh = c.chapter_number;
                    }
                }
                segments.push(currentStartCh === currentEndCh ? `${currentBook} ${currentStartCh}` : `${currentBook} ${currentStartCh}-${currentEndCh}`);
                portionStr = segments.join(', ');

                const segART = cum[bestIdx] - (lastChapterIndex >= 0 ? cum[lastChapterIndex] : 0);
                
                let vs = 0;
                for (let i = lastChapterIndex + 1; i <= bestIdx; i++) vs += (allChaps[i].verse_count || 0);

                // Format HR MIN
                let timeStr = "";
                const h = Math.floor(segART / 60);
                const m = Math.round(segART % 60);
                if (h > 0 && m > 0) timeStr = `${h}h.${m}m`;
                else if (h > 0) timeStr = `${h}h`;
                else timeStr = `${m}m`;

                daysOut.push({ portion: portionStr, time: segART, timeStr: timeStr, timeFloat: segART, chapCount: (bestIdx - lastChapterIndex), verseCount: vs });
                lastChapterIndex = bestIdx;
            } else {
                daysOut.push(null);
            }
        }
        return daysOut;
    };

    */
    };

    const handleAddDetails = (e) => {
        const getChapsCount = (booksArr) => {
            let count = 0;
            booksArr.forEach(b => {
                count += chaptersDB.filter(c => c.book_id === b.id).length;
            });
            return count;
        };

        const segmentValidData = [];
        for (let i = 0; i < 3; i++) {
            const seg = modalSegments[i];
            if (seg.some(b => !b)) {
                toast.current.show({ severity: 'warn', summary: 'Missing', detail: `Assign a book for all slots in Segment ${i + 1}.` });
                return;
            }

            const validBooks = seg.map(bId => booksDB.find(b => b.id === bId)).filter(b => b);
            const totalCount = getChapsCount(validBooks);

            if (totalCount < modalTotalDays) {
                const shortfall = modalTotalDays - totalCount;
                const flatModalBooks = modalSegments.flat();
                const unusedBooks = booksDB.filter(b => !flatModalBooks.includes(b.id));
                const bookStats = unusedBooks.map(b => {
                    const bChaps = chaptersDB.filter(c => c.book_id === b.id);
                    const bArt = bChaps.reduce((sum, c) => sum + (typeof c.art === 'number' ? c.art : parseTime(c.art)), 0);
                    return {
                        id: b.id,
                        name: b.name,
                        displayName: b.displayName || b.name,
                        chapCount: bChaps.length,
                        artFormatted: formatSum(bArt, 'HrMins') || '0 Mins'
                    };
                }).sort((a, b) => b.chapCount - a.chapCount);

                let suggestions = bookStats.filter(b => b.chapCount >= shortfall).slice(0, 5);
                if (suggestions.length === 0) suggestions = bookStats.slice(0, 5);

                setValidationInfo({
                    type: 'shortfall',
                    segment: `Segment ${i + 1}`,
                    bookNames: validBooks.map(b => b.name).join(', '),
                    chaptersCount: totalCount,
                    days: modalTotalDays,
                    shortfall: shortfall,
                    suggestions: suggestions,
                    segmentIndex: i
                });
                if (op.current) op.current.toggle(e);
                return;
            }
            segmentValidData.push(validBooks);
        }

        const columnsData = [
            distributeBooks(segmentValidData[0], modalTotalDays),
            distributeBooks(segmentValidData[1], modalTotalDays),
            distributeBooks(segmentValidData[2], modalTotalDays)
        ];

        const newChunks = [];
        const numChunks = Math.ceil(modalTotalDays / chartCycle);
        let dayCounter = 1;

        const formatHrMin = (mins) => {
            if (!mins) return "";
            const h = Math.floor(mins / 60);
            const m = Math.round(mins % 60);
            if (h > 0 && m > 0) return `${h}h.${m}m`;
            if (h > 0) return `${h}h`;
            return `${m}m`;
        };

        for (let c = 0; c < numChunks; c++) {
            const chunkDays = [];
            for (let d = 0; d < chartCycle; d++) {
                if (dayCounter > modalTotalDays) break;
                const dIndex = dayCounter - 1;
                const booksForDay = columnsData.map(col => col[dIndex] || { portion: '', timeStr: '', timeFloat: 0, chapCount: 0, verseCount: 0 });

                let totChap = 0, totVerse = 0, totArt = 0;
                booksForDay.forEach(bd => { totChap += bd.chapCount; totVerse += bd.verseCount; totArt += (bd.time || 0); });

                chunkDays.push({
                    id: `day_${dayCounter}`,
                    day: dayCounter,
                    booksData: booksForDay,
                    chap: totChap,
                    verse: totVerse,
                    art: formatHrMin(totArt),
                    artFloat: totArt,
                    yes: false
                });
                dayCounter++;
            }
            if (chunkDays.length > 0) {
                newChunks.push({
                    id: `chunk_${c + 1}`,
                    team: `TEAM -${c + 1}`,
                    phase: `MDL ${mdl}: FCT ${fct}: PHS - ${phs}/${maxPhases}`,
                    h_books: Array(3).fill(''),
                    promiseLabel: "GOD'S PROMISES :",
                    promises: "ENTER GOD'S PROMISSES HERE",
                    promiseInput: "",
                    days: chunkDays
                });
            }
        }

        setHeaderSubtitle(`MODULE${mdl}:FACET${fct}:PHASE-${phs}/${maxPhases}`);
        setNumCols(3); // Fixes the reference error
        setChunks(newChunks);
        toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Smart configured mapping successfully generated!', life: 3000 });
        setShowPopup(false);
    };

    const updateDayBook = (chunkIndex, dayId, bIdx, field, value) => {
        const newChunks = [...chunks];
        const dayIndex = newChunks[chunkIndex].days.findIndex(d => d.id === dayId);
        if (dayIndex !== -1) {
            if (!newChunks[chunkIndex].days[dayIndex].booksData[bIdx]) {
                newChunks[chunkIndex].days[dayIndex].booksData[bIdx] = { portion: '', timeStr: '', timeFloat: 0, chapCount: 0, verseCount: 0 };
            }
            newChunks[chunkIndex].days[dayIndex].booksData[bIdx][field] = value;
            setChunks(newChunks);
        }
    };

    const updateChunkHBook = (chunkIndex, hIdx, value) => {
        const newChunks = [...chunks];
        if (!newChunks[chunkIndex].h_books) newChunks[chunkIndex].h_books = Array(3).fill('');
        newChunks[chunkIndex].h_books[hIdx] = value;
        setChunks(newChunks);
    };

    return (
        <div className="p-8 w-full max-w-full overflow-x-auto bg-gray-50 min-h-screen">
            <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700&display=swap" rel="stylesheet" />
            <style>{`
                .rllt-condensed, .rllt-condensed input, .rllt-condensed textarea {
                    font-family: 'Arial Narrow', Arial, sans-serif !important;
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
                        <h1 className="text-2xl font-black tracking-tight mb-1 text-[#c8a165] whitespace-nowrap">3-5-7 CHART - {chartCycle} DAY CYCLE</h1>
                        <p className="text-xs font-medium text-gray-300 uppercase tracking-widest mb-3">{chartCycle} Day Periodic Cycle</p>

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
                    <div className="flex flex-col items-center xl:items-end w-full xl:w-auto gap-3 mt-4 xl:mt-0">
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
                    <style>{`
                        .text-vertical {
                            writing-mode: vertical-rl;
                            transform: scale(-1);
                            text-align: center;
                        }
                    `}</style>
                    {/* NEW OUTER BORDER WRAPPER */}
                    <div id="printable-chart-area" className="w-full border-[3px] border-black p-3 flex flex-col bg-white overflow-hidden relative">
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
                                        <col style={{ width: '4%' }} />
                                        <col style={{ width: '4%' }} />
                                        <col style={{ width: '15%' }} />
                                        <col style={{ width: '4%' }} />
                                        <col style={{ width: '15%' }} />
                                        <col style={{ width: '4%' }} />
                                        <col style={{ width: '15%' }} />
                                        <col style={{ width: '4%' }} />
                                        <col style={{ width: '5%' }} />
                                        <col style={{ width: '5%' }} />
                                        <col style={{ width: '5%' }} />
                                        <col style={{ width: '3%' }} />
                                        <col style={{ width: '4%' }} />
                                    </colgroup>

                                    {chunks.map((chunk, cIdx) => {
                                        const booksTotals = Array.from({ length: 3 }).map((_, i) =>
                                            chunk.days.reduce((acc, curr) => acc + (curr.booksData && curr.booksData[i] ? (curr.booksData[i].timeFloat || parseTime(curr.booksData[i].timeStr)) : 0), 0)
                                        );
                                        const chapTotal = chunk.days.reduce((acc, curr) => acc + (parseInt(curr.chap) || 0), 0);
                                        const verseTotal = chunk.days.reduce((acc, curr) => acc + (parseInt(curr.verse) || 0), 0);
                                        const artTotal = chunk.days.reduce((acc, curr) => acc + parseTime(curr.art), 0);

                                        return (
                                            <tbody key={chunk.id} className="text-black font-bold text-sm rllt-condensed">
                                                <tr className="bg-white h-[35px]">
                                                    <td className="border-2 border-black bg-white"></td>
                                                    <td colSpan={6} className="border-2 border-black px-2 align-middle bg-white">
                                                        <div className="flex h-full w-full items-center">
                                                            <input
                                                                value={chunk.promises}
                                                                onChange={(e) => updateChunk(cIdx, 'promises', e.target.value)}
                                                                className="w-full h-full outline-none font-bold bg-transparent text-black font-serif tracking-tight text-left uppercase pl-2"
                                                                style={{ fontSize: getFS(20) }}
                                                                placeholder="GOD'S PROMISES : ENTER GOD'S PROMISES HERE"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td colSpan={5} className="bg-white p-0 align-middle" style={{ border: `3.5px solid ${CHUNK_COLORS[cIdx % CHUNK_COLORS.length]}` }}>
                                                        <input
                                                            className="w-full h-full outline-none p-1 font-bold text-center bg-transparent text-black block"
                                                            style={{ fontSize: getFS(20) }}
                                                            value={chunk.promiseInput}
                                                            onChange={(e) => updateChunk(cIdx, 'promiseInput', e.target.value)}
                                                        />
                                                    </td>
                                                    <td rowSpan={chunk.days.length + 3} className="border-2 border-black p-0 align-middle bg-white overflow-hidden relative w-[40px]" style={{ fontSize: getFS(20) }}>
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                            <div style={{ transform: 'rotate(-90deg)' }} className="whitespace-nowrap tracking-widest font-extrabold text-black uppercase origin-center text-center leading-none">
                                                                {headerSubtitle}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>

                                                <tr className="bg-white text-center font-bold h-[30px]" style={{ fontFamily: '"Arial Narrow", Arial, sans-serif' }}>
                                                    <th rowSpan={chunk.days.length + 1} className="border-2 border-black p-0 align-middle bg-white overflow-hidden relative cursor-text w-[40px]" style={{ fontSize: getFS(20) }} onClick={() => document.getElementById(`team-input-${chunk.id}`)?.focus()}>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <input
                                                                id={`team-input-${chunk.id}`}
                                                                className="bg-transparent text-center outline-none font-extrabold text-black uppercase leading-none w-[150px]"
                                                                style={{ transform: 'rotate(-90deg)', fontSize: getFS(20) }}
                                                                value={chunk.team}
                                                                onChange={(e) => updateChunk(cIdx, 'team', e.target.value)}
                                                            />
                                                        </div>
                                                    </th>
                                                    <th style={{ fontSize: getFS(20) }} className="border-2 border-black p-0 bg-white text-black align-middle">DAY</th>
                                                    {Array.from({ length: 3 }).map((_, i) => (
                                                        <React.Fragment key={i}>
                                                            <th style={{ fontSize: getFS(20) }} className="border-2 border-black p-0 bg-white text-center align-middle">
                                                                <input className="w-full bg-transparent outline-none font-bold text-center" value={chunk.h_books?.[i] || ''} onChange={(e) => updateChunkHBook(cIdx, i, e.target.value)} />
                                                            </th>
                                                            <th style={{ fontSize: getFS(20) }} className="border-2 border-black p-0 bg-white text-black text-center w-12 align-middle">TIME</th>
                                                        </React.Fragment>
                                                    ))}
                                                    <th style={{ fontSize: getFS(20) }} className="border-2 border-black p-0 bg-white text-black align-middle">CHAP</th>
                                                    <th style={{ fontSize: getFS(20) }} className="border-2 border-black p-0 bg-white text-black align-middle">VERSE</th>
                                                    <th style={{ fontSize: getFS(20) }} className="border-2 border-black p-0 bg-white text-black align-middle">ART</th>
                                                    <th style={{ fontSize: getFS(20) }} className="border-2 border-black p-0 bg-white text-black align-middle">YES</th>
                                                </tr>

                                                {chunk.days.map((d, dIdx) => (
                                                    <tr key={d.id} className="bg-white text-center hover:bg-gray-50 border-b-2 border-black h-[38px]">
                                                        <td className="border-2 border-black p-0 font-extrabold bg-white text-black align-middle" style={{ fontSize: getFS(20) }}>{d.day}</td>

                                                        {Array.from({ length: 3 }).map((_, bIdx) => {
                                                            const bInfo = d.booksData && d.booksData[bIdx] ? d.booksData[bIdx] : { portion: '', timeStr: '', timeFloat: 0 };
                                                            return (
                                                                <React.Fragment key={bIdx}>
                                                                    <td className="border-2 border-black p-1 bg-white text-center align-middle">
                                                                        <textarea className="w-full text-center outline-none bg-transparent font-bold uppercase resize-none overflow-hidden align-middle break-words block leading-tight" style={{ fontSize: getFS(20) }} rows={1} value={bInfo.portion} onChange={(e) => updateDayBook(cIdx, d.id, bIdx, 'portion', e.target.value)} />
                                                                    </td>
                                                                    <td className="border-2 border-black p-0 bg-white font-bold text-black align-middle">
                                                                        <input className="w-full text-center outline-none bg-transparent font-bold" style={{ fontSize: getFS(20) }} value={bInfo.timeStr} onChange={(e) => updateDayBook(cIdx, d.id, bIdx, 'timeStr', e.target.value)} />
                                                                    </td>
                                                                </React.Fragment>
                                                            );
                                                        })}

                                                        <td className="border-2 border-black p-0 align-middle">
                                                            <input className="w-full text-center outline-none bg-transparent font-bold text-black" style={{ fontSize: getFS(20) }} value={d.chap} onChange={(e) => updateDay(cIdx, d.id, 'chap', e.target.value)} />
                                                        </td>
                                                        <td className="border-2 border-black p-0 align-middle">
                                                            <input className="w-full text-center outline-none bg-transparent font-bold text-black" style={{ fontSize: getFS(20) }} value={d.verse} onChange={(e) => updateDay(cIdx, d.id, 'verse', e.target.value)} />
                                                        </td>
                                                        <td className="border-2 border-black p-0 align-middle">
                                                            <input className="w-full text-center outline-none bg-transparent font-bold text-black" style={{ fontSize: getFS(20) }} value={d.art} onChange={(e) => updateDay(cIdx, d.id, 'art', e.target.value)} />
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

                                                <tr className="bg-white text-center font-extrabold tracking-wide h-[35px]" style={{ fontSize: getFS(20) }}>
                                                    <td className="border-2 border-black bg-white"></td>
                                                    <td className="border-2 border-black bg-white"></td>
                                                    {booksTotals.map((bt, i) => (
                                                        <td colSpan={2} key={i} className="border-2 border-black bg-white">{formatSum(bt, 'HrMins')}</td>
                                                    ))}
                                                    <td className="border-2 border-black p-1 bg-white font-bold text-black" style={{ fontSize: getFS(20) }}>{chapTotal}</td>
                                                    <td className="border-2 border-black p-1 bg-white font-bold text-black" style={{ fontSize: getFS(20) }}>{verseTotal}</td>
                                                    <td colSpan={2} className="border-2 border-black p-1 bg-white font-bold text-black" style={{ fontSize: getFS(20) }}>{formatSum(artTotal, 'Hm')}</td>
                                                </tr>
                                            </tbody>
                                        );
                                    })}
                                    <tfoot className="pb-4 rllt-condensed">
                                        <tr className="bg-white text-black font-extrabold tracking-wide text-center uppercase" style={{ fontSize: getFS(25) }}>
                                            <td colSpan={8} className="border-2 border-black p-1 text-center font-extrabold uppercase tracking-wide bg-gray-50" style={{ fontSize: getFS(20) }}>
                                                TOTAL AVERAGE READING TIME {formatSum(
                                                    chunks.reduce((acc, chunk) => acc + chunk.days.reduce((dAcc, day) => dAcc + parseTime(day.art), 0), 0),
                                                    'HrMins'
                                                )}
                                            </td>
                                            <td className="border-2 border-black p-1 text-center font-extrabold" style={{ fontSize: getFS(20) }}>
                                                {chunks.reduce((acc, chunk) => acc + chunk.days.reduce((dAcc, day) => dAcc + (parseInt(day.chap) || 0), 0), 0)}
                                            </td>
                                            <td className="border-2 border-black p-1 text-center font-extrabold font-black text-blue-900" style={{ fontSize: getFS(20) }}>
                                                {chunks.reduce((acc, chunk) => acc + chunk.days.reduce((dAcc, day) => dAcc + (parseInt(day.verse) || 0), 0), 0)}
                                            </td>
                                            <td colSpan={3} className="border-2 border-black p-1 text-center font-extrabold bg-gray-50" style={{ fontSize: getFS(20) }}>
                                                {formatSum(
                                                    chunks.reduce((acc, chunk) => acc + chunk.days.reduce((dAcc, day) => dAcc + parseTime(day.art), 0), 0),
                                                    'Hm'
                                                )}
                                            </td>
                                        </tr>
                                        <tr className="bg-white text-black text-center font-medium italic" style={{ fontSize: getFS(25) }}>
                                            <td colSpan={13} className="border-2 border-black p-1 text-center font-semibold tracking-wide">
                                                <input
                                                    className="w-full text-center outline-none bg-transparent whitespace-nowrap overflow-hidden text-ellipsis italic font-semibold"
                                                    style={{ fontSize: getFS(25) }}
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
                                    <span className="font-extrabold text-[14px] tracking-widest text-black mr-4" style={{ fontFamily: '"Arial Narrow", Arial, sans-serif' }}>
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
                footer={<Button label="Add Details Sync -> Map" icon="pi pi-check" onClick={(e) => handleAddDetails(e)} className="p-button-lg p-button-primary mt-4 font-bold" />}
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

                    {/* Row 2: Setup Day Cycle, Total Days, Number of Books */}
                    <div className="flex border-t border-gray-200 mt-4 pt-4 items-center gap-4">
                        <div className="flex-1">
                            <label className="font-semibold block mb-2 text-black">Setup Day Cycle</label>
                            <Dropdown
                                value={chartCycle}
                                options={[{ label: '3 Day Cycle', value: 3 }, { label: '5 Day Cycle', value: 5 }, { label: '7 Day Cycle', value: 7 }]}
                                onChange={(e) => handleChartTypeChange(e.value)}
                                className="w-full bg-white text-black border border-gray-400 shadow-sm h-12 flex items-center px-2 custom-white-dropdown"
                                panelClassName="bg-white text-black custom-white-panel"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="font-semibold block mb-2 text-black">Total Chart Length (Days)</label>
                            <Dropdown
                                value={modalTotalDays}
                                options={getDaysList(chartCycle).map((d) => ({ label: `${d} Days`, value: d }))}
                                onChange={(e) => setModalTotalDays(e.value)}
                                className="w-full bg-white text-black border border-gray-400 shadow-sm h-12 flex items-center px-2 custom-white-dropdown"
                                panelClassName="bg-white text-black custom-white-panel"
                            />
                        </div>

                    </div>
                </div>

                {/* Master Mapping Configuration Container - Global Generator View */}
                <div className="bg-white rounded-xl border border-gray-300 overflow-hidden shadow-sm mt-4">
                    <div className="w-full px-4 py-3 font-bold text-left bg-[#051220] text-white md:flex md:justify-between items-center gap-2">
                        <span className="tracking-wide text-lg">Smart Book Generation Config</span>
                        <span className="text-gray-300 text-sm">Distributes readings across {modalTotalDays} Days with ideal 1~15 min lengths</span>
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-200 min-h-[300px]">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {modalSegments.map((segment, segIdx) => (
                                <div key={segIdx} className="p-4 bg-white border border-gray-300 rounded-lg shadow-sm flex flex-col gap-3">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="font-bold text-blue-900 text-sm uppercase tracking-wide">SEGMENT {segIdx + 1}</label>
                                        <button type="button" className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 flex items-center justify-center w-8 h-8 rounded-full transition-colors focus:outline-none border border-green-200" title="Add Book" onClick={(e) => {
                                            e.preventDefault();
                                            setTargetSegmentIndex(segIdx);
                                            setSelectorVisible(true);
                                        }}>
                                            <i className="pi pi-plus font-bold"></i>
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {segment.map((bId, bIdx) => {
                                            const book = booksDB.find(b => b.id === bId);
                                            return (
                                                <div key={bIdx} className="flex gap-2 items-center">
                                                    {bId && book ? (
                                                        <div className="flex-1 bg-white border border-gray-300 rounded-lg h-12 flex items-center px-3 shadow-sm font-bold text-gray-800 text-sm">
                                                            {book.displayName}
                                                        </div>
                                                    ) : (
                                                        <div className="flex-1 bg-gray-50 border border-dashed border-gray-400 rounded-lg h-12 flex items-center justify-center text-gray-500 italic text-sm">
                                                            Click + to add a book
                                                        </div>
                                                    )}
                                                    
                                                    {bId && (
                                                        <button type="button" className="text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center justify-center w-8 h-8 rounded-full transition-colors flex-shrink-0 focus:outline-none" title="Remove Book" onClick={(e) => {
                                                            e.preventDefault();
                                                            const newSegs = [...modalSegments];
                                                            const newSegBooks = [...newSegs[segIdx]];
                                                            newSegBooks.splice(bIdx, 1);
                                                            if (newSegBooks.length === 0) newSegBooks.push(null);
                                                            newSegs[segIdx] = newSegBooks;
                                                            setModalSegments(newSegs);
                                                        }}>
                                                            <i className="pi pi-trash"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </Dialog>
            <Dialog 
                header={
                    <div className="flex flex-col items-center border-b pb-2 border-gray-200 w-full">
                        <h2 className="text-2xl font-black tracking-widest text-black uppercase">SELECT BOOK</h2>
                    </div>
                }
                visible={selectorVisible} 
                onHide={() => setSelectorVisible(false)} 
                style={{ width: '80vw', maxWidth: '900px' }}
                className="p-fluid shadow-2xl"
                contentClassName="bg-white p-6"
            >
                <div className="flex flex-col gap-8">
                    {/* OLD TESTAMENT */}
                    <div>
                        <h3 className="text-center font-bold text-xl mb-4 tracking-wider text-black">OLD TESTAMENT</h3>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {STANDARD_BOOKS.slice(0, 39).map((sf, index) => {
                                const b = booksDB.find(bk => bk.short_form === sf || bk.name.toUpperCase().startsWith(sf));
                                if (!b) return null;
                                return (
                                    <button
                                        key={b.id}
                                        type="button"
                                        onClick={() => handleBookSelect(b.id)}
                                        title={`${b.name} (${chaptersDB.filter(c => c.book_id === b.id).length} Chapters)`}
                                        className={`w-16 h-12 flex items-center justify-center border-2 rounded-md font-bold text-lg cursor-pointer bg-white transition-colors focus:outline-none ${getBookColorClass(index)}`}
                                    >
                                        {b.short_form || b.name.substring(0, 3).toUpperCase()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* NEW TESTAMENT */}
                    <div>
                        <h3 className="text-center font-bold text-xl mb-4 tracking-wider text-black">NEW TESTAMENT</h3>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {STANDARD_BOOKS.slice(39).map((sf, index) => {
                                const b = booksDB.find(bk => bk.short_form === sf || bk.name.toUpperCase().startsWith(sf));
                                if (!b) return null;
                                return (
                                    <button
                                        key={b.id}
                                        type="button"
                                        onClick={() => handleBookSelect(b.id)}
                                        title={`${b.name} (${chaptersDB.filter(c => c.book_id === b.id).length} Chapters)`}
                                        className={`w-16 h-12 flex items-center justify-center border-2 rounded-md font-bold text-lg cursor-pointer bg-white transition-colors focus:outline-none ${getBookColorClass(index + 39)}`}
                                    >
                                        {b.short_form || b.name.substring(0, 3).toUpperCase()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </Dialog>
            <OverlayPanel ref={op} showCloseIcon>
                {validationInfo && (
                    <div className="flex flex-col gap-3 p-2" style={{ width: '450px' }}>
                        <div className="text-sm text-red-600 font-bold border-b border-red-100 pb-2 mb-2">
                            {validationInfo.type === 'excess'
                                ? `The selected book(s) contain ${validationInfo.chaptersCount} chapters, but the scheduled days is ${validationInfo.days}. Either change the book or change the days.`
                                : `The selected book(s) contain ${validationInfo.chaptersCount} chapters, which is insufficient for ${validationInfo.days} days. Either change the book or change the days.`}
                        </div>

                        {validationInfo.type === 'shortfall' && (
                            <>
                                <div className="text-xs text-gray-500 font-semibold mb-1">Click a suggestion to replace the book:</div>
                                <DataTable
                                    value={validationInfo.suggestions}
                                    selectionMode="single"
                                    onSelectionChange={(e) => {
                                        const newSegs = [...modalSegments];
                                        const currentList = newSegs[validationInfo.segmentIndex].filter(x => x !== null);
                                        currentList.push(e.value.id);
                                        newSegs[validationInfo.segmentIndex] = currentList;
                                        setModalSegments(newSegs);
                                        if (op.current) op.current.hide();
                                    }}
                                    className="p-datatable-sm"
                                >
                                    <Column field="name" header="Name" sortable></Column>
                                    <Column field="chapCount" header="Chapters" sortable></Column>
                                    <Column field="artFormatted" header="Total ART" sortable></Column>
                                </DataTable>
                            </>
                        )}

                        {validationInfo.type === 'excess' && (
                            <div className="flex flex-col gap-2 mt-2">
                                <label className="text-xs font-bold text-gray-700">Change Scheduled Days</label>
                                <Dropdown
                                    value={modalTotalDays}
                                    options={[
                                        { label: '15 Days', value: 15 },
                                        { label: '20 Days', value: 20 },
                                        { label: '25 Days', value: 25 },
                                        { label: '30 Days', value: 30 },
                                        { label: '35 Days', value: 35 },
                                        { label: '40 Days', value: 40 }
                                    ]}
                                    onChange={(e) => {
                                        setModalTotalDays(e.value);
                                        if (op.current) op.current.hide();
                                    }}
                                    className="w-full"
                                />
                            </div>
                        )}
                    </div>
                )}
            </OverlayPanel>





            {/*
                    <div className="flex justify-end gap-2 mt-4 border-t pt-4 border-gray-200">
                        <Button label="Cancel" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={() => setShowValidation(false)} />
                        <Button label="Re-validate & Apply" icon="pi pi-check" className="p-button-primary bg-blue-600 hover:bg-blue-700" onClick={() => {
                            setShowValidation(false);
                            handleAddDetails();
                        }} />
                    </div>
                }
            >
                {validationInfo && (
                    <div className="flex flex-col gap-5 p-2">
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-800 text-[15px]">
                            {validationInfo.type === 'excess' && (
                                <p>
                                    The selected book(s) for <strong>{validationInfo.segment}</strong> (<span className="font-semibold">{validationInfo.bookNames}</span>) contain <span className="font-bold">{validationInfo.chaptersCount} chapters</span>, but the scheduled duration is only <span className="font-bold">{validationInfo.days} days</span>. This means chapters would have to be grouped.
                                    <br /><br />
                                    <strong>Recommendation:</strong> Either change the book to a shorter one, or increase the scheduled days.
                                </p>
                            )}
                            {validationInfo.type === 'shortfall' && (
                                <p>
                                    The selected book(s) for <strong>{validationInfo.segment}</strong> (<span className="font-semibold">{validationInfo.bookNames}</span>) contain only <span className="font-bold">{validationInfo.chaptersCount} chapters</span>, which is insufficient for <span className="font-bold">{validationInfo.days} scheduled days</span> (leaving blank days).
                                    <br /><br />
                                    <strong>Recommendation:</strong> Either change the book to a larger one, or decrease the scheduled days.
                                </p>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded border border-gray-200">
                            <div className="flex flex-col gap-2">
                                <label className="font-semibold text-gray-700 text-sm">Change Scheduled Days</label>
                                <div className="p-inputgroup">
                                    <span className="p-inputgroup-addon bg-blue-50"><i className="pi pi-calendar text-blue-600"></i></span>
                                    <Dropdown 
                                        value={modalTotalDays} 
                                        options={[
                                            {label: '15 Days', value: 15},
                                            {label: '20 Days', value: 20},
                                            {label: '25 Days', value: 25},
                                            {label: '30 Days', value: 30},
                                            {label: '35 Days', value: 35},
                                            {label: '40 Days', value: 40}
                                        ]} 
                                        onChange={(e) => setModalTotalDays(e.value)} 
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="font-semibold text-gray-700 text-sm">Change Primary Book</label>
                                <div className="p-inputgroup">
                                    <span className="p-inputgroup-addon bg-green-50"><i className="pi pi-book text-green-600"></i></span>
                                    <Dropdown 
                                        value={modalBooks[validationInfo.segmentIndex]}
                                        options={booksDB}
                                        optionLabel="displayName"
                                        optionValue="id"
                                        onChange={(e) => {
                                            const newBooks = [...modalBooks];
                                            newBooks[validationInfo.segmentIndex] = e.value;
                                            setModalBooks(newBooks);
                                        }}
                                        filter
                                        filterPlaceholder="Search books"
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {validationInfo.type === 'shortfall' && (
                            <div className="mt-2">
                                <h3 className="font-bold text-gray-800 text-sm uppercase mb-3 flex items-center gap-2"><i className="pi pi-star-fill text-yellow-500"></i> Recommended Alternatives</h3>
                                <p className="text-xs text-gray-500 mb-3">These books have at least {validationInfo.shortfall} chapters to fulfill the schedule.</p>
                                <div className="flex flex-wrap gap-2">
                                    {validationInfo.suggestions.map(s => (
                                        <button 
                                            key={s.id} 
                                            className="bg-white border border-blue-300 text-blue-700 px-3 py-2 rounded shadow-sm hover:bg-blue-50 transition-colors text-sm font-medium flex items-center gap-2"
                                            onClick={() => {
                                                const newBooks = [...modalBooks];
                                                newBooks[validationInfo.segmentIndex] = s.id;
                                                setModalBooks(newBooks);
                                            }}
                                        >
                                            <i className="pi pi-plus-circle text-blue-500"></i> {s.name} <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full ml-1">{s.chapCount} chaps</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            */}

        </div>
    );
};

export default DynamicCycleChart;
