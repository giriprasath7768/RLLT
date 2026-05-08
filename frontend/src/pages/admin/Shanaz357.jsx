import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Tooltip } from 'primereact/tooltip';
import { Toast } from 'primereact/toast';
import { OverlayPanel } from 'primereact/overlaypanel';


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

const formatSum = (totalMins) => {
    const rawMins = Math.round(totalMins);
    if (rawMins === 0) return '0 Mins';
    return rawMins >= 60 ? `${Math.floor(rawMins / 60)} Hr ${rawMins % 60} Mins` : `${rawMins} Mins`;
};

const STANDARD_BOOKS = [
    "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", 
    "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO", 
    "ECC", "SOS", "ISA", "JER", "LAM", "EZE", "DAN", "HOS", "JOE", "AMO", 
    "OBA", "JON", "MIC", "NAH", "HAB", "ZEP", "HAG", "ZEC", "MAL",
    "MAT", "MAR", "LUK", "JOH", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", 
    "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAM", 
    "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV"
];

const getBookColorConfig = (index) => {
    const id = index + 1;
    // Old Testament
    if (id >= 1 && id <= 5) return { text: 'text-[#d32f2f]', border: 'border-[#d32f2f]', bg: 'bg-[#d32f2f]' };
    if (id >= 6 && id <= 17) return { text: 'text-[#f57c00]', border: 'border-[#f57c00]', bg: 'bg-[#f57c00]' };
    if (id >= 18 && id <= 22) return { text: 'text-[#388e3c]', border: 'border-[#388e3c]', bg: 'bg-[#388e3c]' };
    if (id >= 23 && id <= 27) return { text: 'text-[#1976d2]', border: 'border-[#1976d2]', bg: 'bg-[#1976d2]' };
    if (id >= 28 && id <= 39) return { text: 'text-[#7b1fa2]', border: 'border-[#7b1fa2]', bg: 'bg-[#7b1fa2]' };
    
    // New Testament
    if (id >= 40 && id <= 43) return { text: 'text-[#d32f2f]', border: 'border-[#d32f2f]', bg: 'bg-[#d32f2f]' };
    if (id === 44) return { text: 'text-[#f57c00]', border: 'border-[#f57c00]', bg: 'bg-[#f57c00]' };
    if (id >= 45 && id <= 56) return { text: 'text-[#388e3c]', border: 'border-[#388e3c]', bg: 'bg-[#388e3c]' };
    if (id >= 57 && id <= 64) return { text: 'text-[#1976d2]', border: 'border-[#1976d2]', bg: 'bg-[#1976d2]' };
    if (id >= 65 && id <= 66) return { text: 'text-[#7b1fa2]', border: 'border-[#7b1fa2]', bg: 'bg-[#7b1fa2]' };
    
    return { text: 'text-gray-700', border: 'border-gray-200', bg: 'bg-gray-700' };
};

const isBookMatch = (bookCode, book) => {
    if (book.short_form && book.short_form.toUpperCase() === bookCode) return true;
    
    // Some databases use full names like "1st John", "I John", "Song of Songs"
    const nameStr = book.name.toUpperCase().replace(/\s+/g, ''); // keep numbers and letters
    const rawName = book.name.toUpperCase();
    const code = bookCode.toUpperCase();
    
    if (code === "JDG" && (nameStr.startsWith("JUDG") || nameStr.startsWith("JDG"))) return true;
    if (code === "SOS" && (nameStr.startsWith("SONG") || nameStr.startsWith("CANTICLES") || nameStr.startsWith("SOS"))) return true;
    if (code === "PHP" && (nameStr.startsWith("PHILIP") || nameStr.startsWith("PHP"))) return true;
    if (code === "PHM" && (nameStr.startsWith("PHILEM") || nameStr.startsWith("PHM"))) return true;
    
    // John Epistles variations
    if (code === "1JN" && (nameStr.startsWith("1JO") || nameStr.startsWith("1STJO") || nameStr.startsWith("IJO") || nameStr.startsWith("1JN"))) return true;
    if (code === "2JN" && (nameStr.startsWith("2JO") || nameStr.startsWith("2NDJO") || nameStr.startsWith("IIJO") || nameStr.startsWith("2JN"))) return true;
    if (code === "3JN" && (nameStr.startsWith("3JO") || nameStr.startsWith("3RDJO") || nameStr.startsWith("IIIJO") || nameStr.startsWith("3JN"))) return true;

    // Standard map fallback
    const map = {
        "1SA": "1SAM", "2SA": "2SAM",
        "1KI": "1KIN", "2KI": "2KIN",
        "1CH": "1CHR", "2CH": "2CHR",
        "1TH": "1THE", "2TH": "2THE",
        "1TI": "1TIM", "2TI": "2TIM",
        "1PE": "1PET", "2PE": "2PET",
        "PSA": "PSALM", "NAM": "NAHUM", "NAH": "NAHUM"
    };
    
    if (map[code] && nameStr.startsWith(map[code])) return true;
    
    // Also try matching standard index if IDs are 1-66
    const standardIndex = STANDARD_BOOKS.indexOf(code) + 1;
    if (book.id === standardIndex) return true;

    return nameStr.startsWith(code.replace(/[^A-Z0-9]/g, ''));
};

const StatItem = ({ title, icon, value, color }) => (
    <div className="flex flex-col items-center justify-center flex-1 py-2">
        <div className="text-[10px] font-bold text-[#1e293b] mb-1">{title}</div>
        <i className={`${icon} ${color} text-xl mb-1`}></i>
        <div className={`${color} font-bold text-lg leading-none`}>{value}</div>
    </div>
);

const Shanaz357 = () => {
    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [rlltDB, setRlltDB] = useState([]);
    const [mdl, setMdl] = useState(1);
    const [fct, setFct] = useState(1);
    const [phs, setPhs] = useState(1);
    const [isViewing, setIsViewing] = useState(false);

    const daysOp = React.useRef(null);

    const moduleDaysOptions = React.useMemo(() => {
        const options = [];
        const seen = new Set();
        
        rlltDB.filter(d => Number(d.module) === Number(mdl)).forEach(d => {
            const days = d.day;
            if (days && !seen.has(days)) {
                seen.add(days);
                options.push({
                    days: days,
                    facet: d.facet
                });
            }
        });
        
        return options.sort((a, b) => parseInt(a.days) - parseInt(b.days));
    }, [rlltDB, mdl]);

    const handleDaySelect = (option) => {
        setEnteredDays(option.days.toString());
        setFct(Number(option.facet));
        daysOp.current?.hide();
    };

    const toggleDaySelection = (e) => {
        if (daysOp.current) {
            daysOp.current.toggle(e);
        }
    };
    const [chartStats, setChartStats] = useState(null);
    const [enteredDays, setEnteredDays] = useState('');
    const navigate = useNavigate();
    const toast = React.useRef(null);

    useEffect(() => {
        const days = parseInt(enteredDays);
        if (!days || isNaN(days)) return;

        const mod4Match = rlltDB.find(d => Number(d.module) === 4 && Number(d.day) === days);
        if (mod4Match) {
            setMdl(4);
            setFct(Number(mod4Match.facet));
            return;
        }

        const mod5Match = rlltDB.find(d => Number(d.module) === 5 && Number(d.day) === days);
        if (mod5Match) {
            setMdl(5);
            setFct(Number(mod5Match.facet));
            return;
        }
    }, [enteredDays, rlltDB]);

    useEffect(() => {
        axios.get('http://' + window.location.hostname + ':8000/api/books', { withCredentials: true })
            .then(res => setBooksDB(res.data))
            .catch(err => console.error(err));

        axios.get('http://' + window.location.hostname + ':8000/api/chapters?limit=3000', { withCredentials: true })
            .then(res => setChaptersDB(res.data))
            .catch(err => console.error(err));
            
        axios.get('http://' + window.location.hostname + ':8000/api/rllt_lookup', { withCredentials: true })
            .then(res => {
                const data = res.data;
                setRlltDB(data);
                const uniqueModules = [...new Set(data.map(d => d.module))];
                if (uniqueModules.length > 0) {
                    setMdl(Math.max(...uniqueModules)); // Default to highest module like 5
                }
            })
            .catch(err => console.error(err));
    }, []);

    const toggleBook = (id) => {
        setChartStats(null); // Clear phase-loaded stats if user interacts manually
        if (selectedBooks.includes(id)) {
            setSelectedBooks(selectedBooks.filter(b => b !== id));
        } else {
            setSelectedBooks([...selectedBooks, id]);
        }
    };

    const getBookTooltip = (book) => {
        const bChaps = chaptersDB.filter(c => c.book_id === book.id);
        const count = bChaps.length;
        const totalArt = bChaps.reduce((sum, c) => sum + (typeof c.art === 'number' ? c.art : parseTime(c.art)), 0);
        return `${book.name} - ${count} Chapters - ${formatSum(totalArt)}`;
    };

    const uniqueModules = (() => {
        const unique = [...new Set(rlltDB.map(d => Number(d.module)))];
        if (!unique.includes(Number(mdl))) unique.push(Number(mdl));
        return unique.sort((a, b) => a - b);
    })();
    
    // Derived available options based on selections (1 up to the highest recorded value)
    const availableFacets = (() => {
        let max = 1;
        const unique = [...new Set(rlltDB.filter(d => Number(d.module) === Number(mdl)).map(d => Number(d.facet)))];
        if (unique.length > 0) max = Math.max(max, ...unique);
        return Array.from({ length: max }, (_, i) => i + 1);
    })();

    const availablePhases = (() => {
        let max = 1;
        const unique = [...new Set(rlltDB.filter(d => Number(d.module) === Number(mdl) && Number(d.facet) === Number(fct)).map(d => Number(d.phase)))];
        if (unique.length > 0) max = Math.max(max, ...unique);
        return Array.from({ length: max }, (_, i) => i + 1);
    })();

    // Sync cascading defaults
    useEffect(() => {
        if (availableFacets.length > 0 && !availableFacets.includes(fct)) {
            setFct(Math.max(...availableFacets)); // Default to highest facet
        }
    }, [mdl, availableFacets, fct]);

    useEffect(() => {
        if (availablePhases.length > 0 && !availablePhases.includes(phs)) {
            setPhs(Math.max(...availablePhases)); // Default to highest phase
        }
    }, [mdl, fct, availablePhases, phs]);


    let currentPhaseData = rlltDB.find(d => Number(d.module) === Number(mdl) && Number(d.facet) === Number(fct) && Number(d.phase) === Number(phs));
    if (!currentPhaseData) {
        // Fallback: if exact phase is not found, use any phase's data within the same facet to grab the scheduled days
        currentPhaseData = rlltDB.find(d => Number(d.module) === Number(mdl) && Number(d.facet) === Number(fct));
    }
    let eachPhsDays = currentPhaseData ? currentPhaseData.scheduled_value_days : 0;
    if (!eachPhsDays) {
        const days = parseInt(enteredDays);
        if (Number(mdl) === 4 && days && days % 40 === 0) eachPhsDays = 40;
        if (Number(mdl) === 5 && days && days % 30 === 0) eachPhsDays = 30;
    }

    const stats = React.useMemo(() => {
        let bks = selectedBooks.length;
        let chp = 0;
        let vrs = 0;
        let artMins = 0;

        selectedBooks.forEach(bookId => {
            const bChaps = chaptersDB.filter(c => c.book_id === bookId);
            chp += bChaps.length;
            bChaps.forEach(c => {
                vrs += (c.verse_count || 0);
                artMins += (typeof c.art === 'number' ? c.art : parseTime(c.art));
            });
        });

        let formattedArt = '0:00H';
        if (artMins > 0) {
            const h = Math.floor(artMins / 60);
            const m = Math.round(artMins % 60);
            formattedArt = `${h}:${m.toString().padStart(2, '0')}H`;
        }

        return { bks, chp, vrs, art: formattedArt };
    }, [selectedBooks, chaptersDB]);

    const displayStats = chartStats || stats;

    const handleNumberClick = (num) => {
        setEnteredDays(prev => {
            if (prev.length < 3) {
                return prev + num.toString();
            }
            return prev;
        });
    };

    const clearEnteredDays = () => {
        setEnteredDays('');
    };

    const handleIncrement = () => {
        const currIdx = uniqueModules.indexOf(mdl);
        if (currIdx < uniqueModules.length - 1) setMdl(uniqueModules[currIdx + 1]);
    };

    const handleDecrement = () => {
        const currIdx = uniqueModules.indexOf(mdl);
        if (currIdx > 0) setMdl(uniqueModules[currIdx - 1]);
    };

    const handleFctDec = () => {
        const idx = availableFacets.indexOf(fct);
        if (idx > 0) setFct(availableFacets[idx - 1]);
    };

    const handleFctInc = () => {
        const idx = availableFacets.indexOf(fct);
        if (idx !== -1 && idx < availableFacets.length - 1) setFct(availableFacets[idx + 1]);
    };

    const handlePhsDec = () => {
        const idx = availablePhases.indexOf(phs);
        if (idx > 0) setPhs(availablePhases[idx - 1]);
    };

    const handlePhsInc = () => {
        const idx = availablePhases.indexOf(phs);
        if (idx !== -1 && idx < availablePhases.length - 1) setPhs(availablePhases[idx + 1]);
    };

    const handleViewClick = async () => {
        setIsViewing(true);
        try {
            const listRes = await axios.get(`http://${window.location.hostname}:8000/api/charts/list`, { withCredentials: true });
            const exists = listRes.data.some(c => Number(c.module) === Number(mdl) && Number(c.facet) === Number(fct) && Number(c.phase) === Number(phs));
            
            if (exists) {
                navigate(`/admin/charts?editMod=${mdl}&editFct=${fct}&editPhs=${phs}`);
            } else {
                toast.current?.show({ severity: 'warn', summary: 'Not Found', detail: `No saved chart found for Module ${mdl}, Facet ${fct}, Phase ${phs}. Please create it first.`, life: 4000 });
            }
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not verify chart existence.', life: 3000 });
        } finally {
            setIsViewing(false);
        }
    };

    const handleSubmit = async () => {
        if (!enteredDays) {
            toast.current?.show({ severity: 'warn', summary: 'Missing Selection', detail: 'Please enter or select a day first.' });
            return;
        }
        if (selectedBooks.length === 0) {
            toast.current?.show({ severity: 'warn', summary: 'Missing Books', detail: 'Please select at least one book.' });
            return;
        }

        let targetMdl = mdl;
        let targetFct = fct;
        let targetPhs = phs;

        const dVal = parseInt(enteredDays);
        const mod4Match = rlltDB.find(d => Number(d.module) === 4 && Number(d.day) === dVal);
        const mod5Match = rlltDB.find(d => Number(d.module) === 5 && Number(d.day) === dVal);

        let chartLength = dVal || 0;
        let isMainChart = false;

        if (mod4Match) {
            isMainChart = true;
            chartLength = parseInt(mod4Match.scheduled_value_days) || 40;
            targetMdl = 4;
        } else if (mod5Match) {
            isMainChart = true;
            chartLength = parseInt(mod5Match.scheduled_value_days) || 30;
            targetMdl = 5;
        }

        const bannerText = isMainChart ? `MAIN CHART - ${chartLength} DAYS` : `3-5-7 CHART - ${chartLength} DAY CYCLE`;



        const distributeBooks = (booksArr, daysOutCount) => {
            if (!booksArr || !booksArr.length) return Array.from({ length: daysOutCount }, () => null);
            let allChaps = [];
            for (let b of booksArr) {
                const bChaps = chaptersDB.filter(c => c.book_id === b.id).sort((a, b) => a.chapter_number - b.chapter_number);
                bChaps.forEach(c => c._bookAbbr = b.short_form || b.name);
                allChaps = allChaps.concat(bChaps);
            }
            if (!allChaps.length) return Array.from({ length: daysOutCount }, () => null);

            let cum = [], sum = 0;
            for (let c of allChaps) { 
                sum += (typeof c.art === 'number' ? c.art : parseTime(c.art)); 
                cum.push(sum); 
            }
            const totalART = sum;
            const daysOut = [];
            let lastChapterIndex = -1;

            for (let day = 1; day <= daysOutCount; day++) {
                const target = (day / daysOutCount) * totalART;
                let bestIdx = lastChapterIndex;
                let minDiffLocal = Infinity;
                for (let i = lastChapterIndex + 1; i < allChaps.length; i++) {
                    const diff = Math.abs(cum[i] - target);
                    if (diff <= minDiffLocal) { minDiffLocal = diff; bestIdx = i; } else break;
                }
                if (day === daysOutCount) bestIdx = allChaps.length - 1;

                if (bestIdx > lastChapterIndex) {
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
        
        const validBooks = selectedBooks.map(id => booksDB.find(b => b.id === id)).filter(Boolean);
        
        const seg1Books = validBooks.slice(0, 1);
        const seg2Books = validBooks.slice(1, 2);
        const seg3Books = validBooks.slice(2);

        const dist1 = distributeBooks(seg1Books, chartLength);
        const dist2 = distributeBooks(seg2Books, chartLength);
        const dist3 = distributeBooks(seg3Books, chartLength);

        const newChunks = [];
        const numChunks = Math.ceil(chartLength / 5);
        let dayCounter = 1;

        for (let c = 0; c < numChunks; c++) {
            const chunkDays = [];
            for (let d = 0; d < 5; d++) {
                if (dayCounter > chartLength) break;
                const dIndex = dayCounter - 1;
                
                const bd1 = dist1[dIndex] || { portion: '', timeStr: '', timeFloat: 0, chapCount: 0, verseCount: 0 };
                const bd2 = dist2[dIndex] || { portion: '', timeStr: '', timeFloat: 0, chapCount: 0, verseCount: 0 };
                const bd3 = dist3[dIndex] || { portion: '', timeStr: '', timeFloat: 0, chapCount: 0, verseCount: 0 };

                const totChap = bd1.chapCount + bd2.chapCount + bd3.chapCount;
                const totVerse = bd1.verseCount + bd2.verseCount + bd3.verseCount;
                const totArtFloat = (bd1.timeFloat || 0) + (bd2.timeFloat || 0) + (bd3.timeFloat || 0);

                let totArtStr = "";
                if (totArtFloat > 0) {
                    const h = Math.floor(totArtFloat / 60);
                    const m = Math.round(totArtFloat % 60);
                    if (h > 0 && m > 0) totArtStr = `${h}h.${m}m`;
                    else if (h > 0) totArtStr = `${h}h`;
                    else totArtStr = `${m}m`;
                }

                if (isMainChart) {
                    chunkDays.push({
                        id: dayCounter,
                        day: dayCounter,
                        m1b: bd1.portion,
                        m1t: bd1.timeStr,
                        m2b: bd2.portion,
                        m2t: bd2.timeStr,
                        m3b: bd3.portion,
                        m3t: bd3.timeStr,
                        chap: totChap,
                        verse: totVerse,
                        art: totArtStr,
                        yes: false
                    });
                } else {
                    chunkDays.push({
                        id: `day_${dayCounter}`,
                        day: dayCounter,
                        booksData: [bd1, bd2, bd3],
                        chap: totChap,
                        verse: totVerse,
                        art: totArtStr,
                        artFloat: totArtFloat,
                        yes: false
                    });
                }
                dayCounter++;
            }
            if (chunkDays.length > 0) {
                if (isMainChart) {
                    newChunks.push({
                        id: `chunk_${c + 1}`,
                        team: `TEAM -${c + 1}`,
                        phase: `PHASE - 1/1`,
                        promiseLabel: "GOD'S PROMISES :",
                        promises: "ENTER GOD'S PROMISSES HERE",
                        promiseInput: "",
                        h1: "",
                        h2: "",
                        h3: "",
                        days: chunkDays
                    });
                } else {
                    const maxPhases = availablePhases.length;
                    newChunks.push({
                        id: `chunk_${c + 1}`,
                        team: `TEAM -${c + 1}`,
                        phase: `MDL ${targetMdl}: FCT ${targetFct}: PHS - ${targetPhs}/${maxPhases}`,
                        h_books: Array(3).fill(''),
                        promiseLabel: "GOD'S PROMISES :",
                        promises: "ENTER GOD'S PROMISSES HERE",
                        promiseInput: "",
                        days: chunkDays
                    });
                }
            }
        }

        const formData = new FormData();
        formData.append("module", targetMdl);
        formData.append("facet", targetFct);
        formData.append("phase", targetPhs);
        formData.append("banner_text", bannerText);
        formData.append("t_label", "T");
        formData.append("state_payload", JSON.stringify(newChunks));

        try {
            await axios.post(`http://${window.location.hostname}:8000/api/charts/sync`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Chart Automated Successfully!', life: 2000 });
            setTimeout(() => {
                if (isMainChart) {
                    navigate(`/admin/charts?editMod=${targetMdl}&editFct=${targetFct}&editPhs=${targetPhs}`);
                } else {
                    navigate(`/admin/chart-creation/357-chart?editMod=${targetMdl}&editFct=${targetFct}&editPhs=${targetPhs}`);
                }
            }, 1000);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to generate chart', life: 3000 });
        }
    };

    const renderBooks = (startIndex, endIndex) => {
        return STANDARD_BOOKS.slice(startIndex, endIndex).map((bookCode, idx) => {
            const actualIndex = startIndex + idx;
            const colors = getBookColorConfig(actualIndex);
            
            // Find the matching book in booksDB using the robust matcher
            const book = booksDB.find(b => isBookMatch(bookCode, b));
            
            const isSelected = book ? selectedBooks.includes(book.id) : false;
            
            return (
                <div 
                    key={bookCode} 
                    className={`book-tooltip-item border rounded py-2 text-center text-[11px] font-bold cursor-pointer transition-colors shadow-sm w-[calc(20%-0.4rem)] ${isSelected ? `${colors.bg} text-white border-transparent` : `${colors.text} border-gray-300 hover:bg-gray-50`}`}
                    onClick={() => book && toggleBook(book.id)}
                    data-pr-tooltip={book ? getBookTooltip(book) : ''}
                >
                    {bookCode}
                </div>
            );
        });
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8 flex justify-center items-start font-sans">
            <Toast ref={toast} />
            <Tooltip target=".book-tooltip-item" position="top" />
            <div className="bg-white rounded-xl shadow-xl w-full max-w-[480px] p-6 border border-gray-200">
                {/* Header Section */}
                <div className="text-center mb-6">
                    <p className="text-gray-500 italic text-sm font-serif">Unlocking Transformation Through</p>
                    <div className="flex items-center justify-center gap-2 my-1">
                        <div className="h-px bg-gray-300 flex-1"></div>
                        <span className="text-[10px] text-gray-500 font-bold tracking-[0.2em]">THE WORD</span>
                        <div className="h-px bg-gray-300 flex-1"></div>
                    </div>
                    <h1 className="text-5xl font-black text-[#0B2149] tracking-tight mt-2 mb-2">SHANAZ 357</h1>
                    <div className="flex items-center justify-center">
                        <div className="h-px bg-[#0B2149] w-24"></div>
                        <div className="w-2 h-2 bg-[#0B2149] rotate-45 mx-2"></div>
                        <div className="h-px bg-[#0B2149] w-24"></div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="flex justify-between border border-gray-200 rounded-xl mb-6 bg-white shadow-sm overflow-hidden">
                    <StatItem title="BKS" icon="pi pi-book" value={displayStats.bks} color="text-[#1976d2]" />
                    <div className="w-px bg-gray-200 my-2"></div>
                    <StatItem title="CHP" icon="pi pi-file" value={displayStats.chp} color="text-[#388e3c]" />
                    <div className="w-px bg-gray-200 my-2"></div>
                    <StatItem title="VRS" icon="pi pi-crown" value={displayStats.vrs} color="text-[#f57c00]" />
                    <div className="w-px bg-gray-200 my-2"></div>
                    <StatItem title="ART" icon="pi pi-clock" value={displayStats.art} color="text-[#7b1fa2]" />
                    <div className="w-px bg-gray-200 my-2"></div>
                    <StatItem title="DAYS" icon="pi pi-calendar" value={eachPhsDays || 0} color="text-[#d32f2f]" />
                </div>

                {/* Books Grid - Combined Scrollable Card */}
                <style>{`
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                    .scrollbar-hide {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
                <div className="border border-gray-200 rounded-t-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-y-auto scrollbar-hide h-[215px]">
                        <div className="bg-[#0B2149] text-white text-center font-bold py-2 text-sm tracking-wide sticky top-0 z-10">
                            OLD TESTAMENT
                        </div>
                        <div className="p-3 flex flex-wrap justify-center gap-2 bg-white">
                            {booksDB.length > 0 && renderBooks(0, 39)}
                        </div>
                        
                        <div className="bg-[#0B2149] text-white text-center font-bold py-2 text-sm tracking-wide sticky top-0 z-10 border-t border-[#0B2149]">
                            NEW TESTAMENT
                        </div>
                        <div className="p-3 flex flex-wrap justify-center gap-2 bg-white">
                            {booksDB.length > 0 && renderBooks(39, 66)}
                        </div>
                    </div>
                </div>

                {/* Middle Input Section */}
                <div className="flex gap-2 mb-4 h-16 border border-gray-200 border-t-0 rounded-b-xl p-2 bg-white shadow-sm">
                    <div className="flex-1 border border-[#388e3c] rounded-lg flex items-center justify-center text-center text-[#388e3c] text-[10px] font-bold uppercase bg-[#f1f8e9]">
                        PSALMS<br/>CHP 119
                    </div>
                    <div className="flex-[1.5] border border-gray-300 rounded-lg flex justify-evenly items-center px-2">
                        <div className="h-6 w-px bg-gray-200"></div>
                        <div className="h-6 w-px bg-gray-200"></div>
                        <div className="h-6 w-px bg-gray-200"></div>
                    </div>
                    <div className="flex-1 border border-[#388e3c] rounded-lg flex items-center justify-center text-center text-[#388e3c] text-[10px] font-bold uppercase bg-[#f1f8e9]">
                        PSA OF DAVID<br/>73 CHP
                    </div>
                </div>

                {/* Numbers and Controls Section */}
                <div className="mb-4">
                    {/* Top Row: Refresh - Circle - Submit */}
                    <div className="flex justify-center items-center gap-6 mb-3">
                        <button 
                            onClick={() => {
                                setEnteredDays('');
                                setSelectedBooks([]);
                                setChartStats(null);
                            }}
                            className="w-10 h-10 rounded-full border-2 border-red-300 text-red-500 flex items-center justify-center bg-white hover:bg-red-50 transition-colors shadow-sm"
                            title="Refresh Data"
                        >
                            <i className="pi pi-refresh font-bold"></i>
                        </button>

                        <div className="w-16 h-16 shrink-0 rounded-full border-4 border-gray-100 flex items-center justify-center bg-white shadow-inner mx-4 overflow-hidden relative cursor-pointer hover:border-[#1976d2] transition-colors" onClick={toggleDaySelection} title="Click to select days">
                            {enteredDays ? <span className="text-xl font-black text-[#1976d2]">{enteredDays}</span> : <span className="text-[10px] font-bold text-gray-300">DAYS</span>}
                        </div>
                        
                        <OverlayPanel ref={daysOp} className="w-48 shadow-lg rounded-xl">
                            <div className="p-2 flex flex-col gap-1 max-h-60 overflow-y-auto">
                                <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider text-center">Module {mdl} Days</div>
                                {moduleDaysOptions.length > 0 ? moduleDaysOptions.map((opt, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => handleDaySelect(opt)}
                                        className="w-full text-left px-4 py-2 hover:bg-[#f8faff] hover:text-[#1976d2] rounded-lg transition-colors font-bold text-sm border border-transparent hover:border-[#e0ebf5]"
                                    >
                                        {opt.days} Days <span className="text-xs text-gray-400 font-normal ml-2">(Facet {opt.facet})</span>
                                    </button>
                                )) : (
                                    <div className="text-xs text-center text-gray-400 py-4">No days configured</div>
                                )}
                                <div className="border-t border-gray-100 mt-2 pt-2">
                                    <button 
                                        onClick={() => { clearEnteredDays(); daysOp.current?.hide(); }}
                                        className="w-full text-center px-4 py-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors font-bold text-xs"
                                    >
                                        Clear Selection
                                    </button>
                                </div>
                            </div>
                        </OverlayPanel>

                        <button 
                            onClick={handleSubmit}
                            className="w-10 h-10 rounded-full border-2 border-green-400 text-green-600 flex items-center justify-center bg-white hover:bg-green-50 transition-colors shadow-sm"
                            title="Submit"
                        >
                            <i className="pi pi-check font-bold text-lg"></i>
                        </button>
                    </div>

                    {/* Numbers Card */}
                    <div className="border border-[#1976d2] rounded-xl py-2 px-4 flex justify-between items-center text-lg font-black text-[#1976d2] bg-[#f8faff] shadow-sm">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button 
                                key={num} 
                                onClick={() => handleNumberClick(num)} 
                                className="hover:text-orange-500 transition-colors cursor-pointer w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-100"
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Plus/Minus Section */}
                <div className="flex items-center justify-between mb-4 gap-2">
                    <div className="flex-1 border border-gray-300 rounded-xl h-10 bg-gray-50"></div>
                    <button 
                        className={`font-bold text-2xl px-2 transition-colors ${uniqueModules.indexOf(mdl) > 0 ? 'text-[#f57c00] hover:text-orange-600 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
                        onClick={handleDecrement}
                        disabled={uniqueModules.indexOf(mdl) <= 0}
                    >-</button>
                    <div className="border border-[#f57c00] rounded-xl px-8 py-1 flex flex-col items-center justify-center bg-[#fff8e1]">
                        <div className="text-[10px] font-bold text-[#f57c00]">MDL</div>
                        <div className="text-xl font-bold text-[#f57c00] leading-none mt-1">{mdl}</div>
                    </div>
                    <button 
                        className={`font-bold text-2xl px-2 transition-colors ${uniqueModules.indexOf(mdl) < uniqueModules.length - 1 ? 'text-[#f57c00] hover:text-orange-600 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
                        onClick={handleIncrement}
                        disabled={uniqueModules.indexOf(mdl) >= uniqueModules.length - 1}
                    >+</button>
                    <div className="flex-1 border border-gray-300 rounded-xl h-10 bg-gray-50"></div>
                </div>

                {/* Bottom Stats Section */}
                <div className="border border-[#388e3c] rounded-xl mb-6 flex justify-between p-2 text-center text-[#388e3c] text-[10px] font-bold uppercase bg-[#f1f8e9]">
                    <div className="flex flex-col items-center justify-center flex-1">
                        <div className="mb-1">FACET</div>
                        <div className="flex items-center gap-2 text-base">
                            <button onClick={handleFctDec} disabled={availableFacets.indexOf(fct) <= 0} className={`p-1 transition-colors ${availableFacets.indexOf(fct) > 0 ? 'hover:text-green-800' : 'text-green-200 cursor-not-allowed'}`}><i className="pi pi-angle-left text-sm"></i></button>
                            <span className="w-5 text-center">{fct || '-'}</span>
                            <button onClick={handleFctInc} disabled={availableFacets.indexOf(fct) >= availableFacets.length - 1} className={`p-1 transition-colors ${availableFacets.indexOf(fct) < availableFacets.length - 1 ? 'hover:text-green-800' : 'text-green-200 cursor-not-allowed'}`}><i className="pi pi-angle-right text-sm"></i></button>
                        </div>
                    </div>
                    <div className="w-px bg-green-200 my-1"></div>
                    <div className="flex flex-col items-center justify-center flex-1">
                        <div className="mb-1">PHS</div>
                        <div className="flex items-center gap-2 text-base">
                            <button onClick={handlePhsDec} disabled={availablePhases.indexOf(phs) <= 0} className={`p-1 transition-colors ${availablePhases.indexOf(phs) > 0 ? 'hover:text-green-800' : 'text-green-200 cursor-not-allowed'}`}><i className="pi pi-angle-left text-sm"></i></button>
                            <span className="w-5 text-center">{phs || '-'}</span>
                            <button onClick={handlePhsInc} disabled={availablePhases.indexOf(phs) >= availablePhases.length - 1} className={`p-1 transition-colors ${availablePhases.indexOf(phs) < availablePhases.length - 1 ? 'hover:text-green-800' : 'text-green-200 cursor-not-allowed'}`}><i className="pi pi-angle-right text-sm"></i></button>
                        </div>
                    </div>
                    <div className="w-px bg-green-200 my-1"></div>
                    <div className="flex flex-col items-center justify-center flex-[1.5]">
                        <div className="mb-1">EACH PHS</div>
                        <div className="text-base flex items-center justify-center h-8">{eachPhsDays ? `${eachPhsDays} DAYS` : '-'}</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                    <button className="flex flex-row items-center justify-center gap-2 border border-[#1976d2] text-[#1976d2] rounded-xl py-2 font-bold text-xs hover:bg-blue-50 transition-colors bg-white">
                        <i className="pi pi-print text-base"></i> PRINT
                    </button>
                    <button 
                        onClick={handleViewClick}
                        disabled={isViewing}
                        className={`flex flex-row items-center justify-center gap-2 border border-[#388e3c] text-[#388e3c] rounded-xl py-2 font-bold text-xs transition-colors bg-white ${isViewing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-50'}`}
                    >
                        <i className={`pi ${isViewing ? 'pi-spin pi-spinner' : 'pi-eye'} text-base`}></i> VIEW
                    </button>
                    <button className="flex flex-row items-center justify-center gap-2 border border-[#7b1fa2] text-[#7b1fa2] rounded-xl py-2 font-bold text-xs hover:bg-purple-50 transition-colors bg-white">
                        <i className="pi pi-send text-base"></i> SEND
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Shanaz357;
