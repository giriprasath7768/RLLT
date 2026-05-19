import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Tooltip } from 'primereact/tooltip';
import { Toast } from 'primereact/toast';


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
    // Old Testament group colors based on screenshot
    if (index >= 0 && index <= 4) return { text: 'text-[#c00000]', bg: 'bg-[#c00000]', activeText: 'text-white' }; // Red
    if (index >= 5 && index <= 16) return { text: 'text-[#a67c00]', bg: 'bg-[#a67c00]', activeText: 'text-white' }; // Gold/Brown
    if (index >= 17 && index <= 21) return { text: 'text-[#007020]', bg: 'bg-[#007020]', activeText: 'text-white' }; // Green
    if (index >= 22 && index <= 26) return { text: 'text-[#0055a4]', bg: 'bg-[#0055a4]', activeText: 'text-white' }; // Blue
    if (index >= 27 && index <= 38) return { text: 'text-[#4b0082]', bg: 'bg-[#4b0082]', activeText: 'text-white' }; // Purple
    
    // New Testament group colors based on screenshot
    if (index >= 39 && index <= 42) return { text: 'text-[#c00000]', bg: 'bg-[#c00000]', activeText: 'text-white' }; // Red (Gospels)
    if (index === 43) return { text: 'text-[#a67c00]', bg: 'bg-[#a67c00]', activeText: 'text-white' }; // Gold (Acts)
    if (index >= 44 && index <= 55) return { text: 'text-[#007020]', bg: 'bg-[#007020]', activeText: 'text-white' }; // Green (Romans to Titus)
    if (index >= 56 && index <= 63) return { text: 'text-[#0055a4]', bg: 'bg-[#0055a4]', activeText: 'text-white' }; // Blue (Philemon to 3 John)
    if (index >= 64 && index <= 66) return { text: 'text-[#4b0082]', bg: 'bg-[#4b0082]', activeText: 'text-white' }; // Purple (Jude, Revelation)
    
    return { text: 'text-[#2b4c7e]', bg: 'bg-[#2b4c7e]', activeText: 'text-white' };
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
    <div className="flex flex-col items-center justify-center flex-1 py-3">
        <div className="text-[14px] font-bold text-[#0B2149] mb-2 [text-shadow:1px_1px_0_#ccc,2px_2px_0_#aaa,3px_3px_0_#888,4px_4px_3px_rgba(0,0,0,0.4)]">{title}</div>
        <i className={`${icon} ${color} text-3xl mb-2 [text-shadow:1px_1px_0_#ccc,2px_2px_0_#aaa,3px_3px_0_#888,4px_4px_3px_rgba(0,0,0,0.4)]`}></i>
        <div className={`${color} font-bold text-xl leading-none [text-shadow:1px_1px_0_#ccc,2px_2px_0_#aaa,3px_3px_0_#888,4px_4px_3px_rgba(0,0,0,0.4)]`}>{value}</div>
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
    const [cycle, setCycle] = useState(3);
    const [isViewing, setIsViewing] = useState(false);
    const [dayValidationError, setDayValidationError] = useState('');
    const [bookValidationError, setBookValidationError] = useState('');

    const [chartStats, setChartStats] = useState(null);
    const [enteredDays, setEnteredDays] = useState('');
    const [userRole, setUserRole] = useState(null);
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
        axios.get('http://' + window.location.hostname + ':8000/api/me', { withCredentials: true })
            .then(res => setUserRole(res.data.role))
            .catch(err => console.error("Could not fetch user role", err));

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
        setBookValidationError('');
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

    let eachPhsDays = 0;
    if (Number(mdl) === 5) {
        eachPhsDays = enteredDays ? parseInt(enteredDays) : 0;
    } else {
        let currentPhaseData = rlltDB.find(d => Number(d.module) === Number(mdl) && Number(d.facet) === Number(fct) && Number(d.phase) === Number(phs));
        if (!currentPhaseData) {
            // Fallback if exact phase not found
            currentPhaseData = rlltDB.find(d => Number(d.module) === Number(mdl) && Number(d.facet) === Number(fct));
        }
        eachPhsDays = currentPhaseData ? currentPhaseData.scheduled_value_days : 0;
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
        setDayValidationError('');
        setEnteredDays(prev => {
            if (prev.length < 3) {
                return prev + num.toString();
            }
            return prev;
        });
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
            setDayValidationError('Please enter a day first.');
            return;
        }

        const dVal = parseInt(enteredDays);
        if (dVal > 366) {
            setDayValidationError('Limit Exceeded: Max 366 days.');
            return;
        }
        if (selectedBooks.length === 0) {
            setBookValidationError('Please select at least one book.');
            return;
        }
        setBookValidationError('');

        const validBooks = selectedBooks.map(id => booksDB.find(b => b.id === id)).filter(Boolean);
        const isSpecialProcess = validBooks.some(b => {
            const n = (b.name + " " + (b.short_form || "")).toUpperCase();
            return n.includes("119") || n.includes("DAVID") || n.match(/\b(PSA|PSAM|PSALM|PSALMS)\s*1\b/);
        });

        if (dVal % 3 !== 0 && dVal % 5 !== 0 && dVal % 7 !== 0) {
            setDayValidationError('Invalid: Multiples of 3, 5, or 7 only.');
            return;
        }
        setDayValidationError('');

        let targetMdl = mdl;
        let targetFct = fct;
        let targetPhs = phs;

        const mod4Match = rlltDB.find(d => Number(d.module) === 4 && Number(d.day) === dVal);
        const mod5Match = rlltDB.find(d => Number(d.module) === 5 && Number(d.day) === dVal);

        let chartLength = dVal || 0;
        let isMainChart = false;

        if (mod4Match) {
            isMainChart = true;
            targetMdl = 4;
        } else if (mod5Match) {
            isMainChart = true;
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

            // Looping logic for books that don't have enough chapters to fill the days
            if (allChaps.length < daysOutCount) {
                const daysOut = [];
                for (let day = 0; day < daysOutCount; day++) {
                    const c = allChaps[day % allChaps.length];
                    const portionStr = `${c._bookAbbr} ${c.chapter_number}`;
                    const segART = typeof c.art === 'number' ? c.art : parseTime(c.art);
                    let timeStr = "";
                    const h = Math.floor(segART / 60);
                    const m = Math.round(segART % 60);
                    if (h > 0 && m > 0) timeStr = `${h}h.${m}m`;
                    else if (h > 0) timeStr = `${h}h`;
                    else timeStr = `${m}m`;

                    daysOut.push({
                        portion: portionStr,
                        time: segART,
                        timeStr: timeStr,
                        timeFloat: segART,
                        chapCount: 1,
                        verseCount: c.verse_count || 0
                    });
                }
                return daysOut;
            }

            let cum = [], sum = 0;
            for (let c of allChaps) { 
                sum += (typeof c.art === 'number' ? c.art : parseTime(c.art)); 
                cum.push(sum); 
            }
            const totalART = sum;
            const daysOut = [];
            let lastChapterIndex = -1;
            let overflowDayIndex = 0;

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
                    const c = allChaps[overflowDayIndex % allChaps.length];
                    const portionStr = `${c._bookAbbr} ${c.chapter_number}`;
                    const segART = typeof c.art === 'number' ? c.art : parseTime(c.art);
                    let timeStr = "";
                    const h = Math.floor(segART / 60);
                    const m = Math.round(segART % 60);
                    if (h > 0 && m > 0) timeStr = `${h}h.${m}m`;
                    else if (h > 0) timeStr = `${h}h`;
                    else timeStr = `${m}m`;

                    daysOut.push({ portion: portionStr, time: segART, timeStr: timeStr, timeFloat: segART, chapCount: 1, verseCount: c.verse_count || 0 });
                    overflowDayIndex++;
                }
            }
            return daysOut;
        };
        
        const use5Segments = isSpecialProcess;
        const daysPerChunk = cycle;

        const seg1Books = validBooks.slice(0, 1);
        const seg2Books = validBooks.slice(1, 2);
        const seg3Books = use5Segments ? validBooks.slice(2, 3) : validBooks.slice(2);
        const seg4Books = use5Segments ? validBooks.slice(3, 4) : [];
        const seg5Books = use5Segments ? validBooks.slice(4) : [];

        const newChunks = [];

        const dist1 = distributeBooks(seg1Books, chartLength);
        const dist2 = distributeBooks(seg2Books, chartLength);
        const dist3 = distributeBooks(seg3Books, chartLength);
        const dist4 = use5Segments ? distributeBooks(seg4Books, chartLength) : [];
        const dist5 = use5Segments ? distributeBooks(seg5Books, chartLength) : [];

        const numChunks = Math.ceil(chartLength / daysPerChunk);
        let dayCounter = 1;

        for (let c = 0; c < numChunks; c++) {
            const chunkDays = [];
            for (let d = 0; d < daysPerChunk; d++) {
                if (dayCounter > chartLength) break;
                const dIndex = dayCounter - 1;
                
                const bd1 = dist1[dIndex] || { portion: '', timeStr: '', timeFloat: 0, chapCount: 0, verseCount: 0 };
                const bd2 = dist2[dIndex] || { portion: '', timeStr: '', timeFloat: 0, chapCount: 0, verseCount: 0 };
                const bd3 = dist3[dIndex] || { portion: '', timeStr: '', timeFloat: 0, chapCount: 0, verseCount: 0 };
                const bd4 = use5Segments ? (dist4[dIndex] || { portion: '', timeStr: '', timeFloat: 0, chapCount: 0, verseCount: 0 }) : null;
                const bd5 = use5Segments ? (dist5[dIndex] || { portion: '', timeStr: '', timeFloat: 0, chapCount: 0, verseCount: 0 }) : null;
                
                const totChap = bd1.chapCount + bd2.chapCount + bd3.chapCount + (use5Segments ? bd4.chapCount + bd5.chapCount : 0);
                const totVerse = bd1.verseCount + bd2.verseCount + bd3.verseCount + (use5Segments ? bd4.verseCount + bd5.verseCount : 0);
                const totArtFloat = (bd1.timeFloat || 0) + (bd2.timeFloat || 0) + (bd3.timeFloat || 0) + (use5Segments ? (bd4.timeFloat || 0) + (bd5.timeFloat || 0) : 0);

                let totArtStr = "";
                if (totArtFloat > 0) {
                    const h = Math.floor(totArtFloat / 60);
                    const m = Math.round(totArtFloat % 60);
                    if (h > 0 && m > 0) totArtStr = `${h}h.${m}m`;
                    else if (h > 0) totArtStr = `${h}h`;
                    else totArtStr = `${m}m`;
                }

                const dayObj = {
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
                };

                if (use5Segments) {
                    dayObj.m4b = bd4.portion;
                    dayObj.m4t = bd4.timeStr;
                    dayObj.m5b = bd5.portion;
                    dayObj.m5t = bd5.timeStr;
                }

                chunkDays.push(dayObj);
                
                dayCounter++;
            }
            if (chunkDays.length > 0) {
                const maxPhases = availablePhases.length;
                const phaseStr = isMainChart ? `PHASE - 1/1` : `MDL ${targetMdl}: FCT ${targetFct}: PHS - ${targetPhs}/${maxPhases}`;
                
                const chunkObj = {
                    id: `chunk_${c + 1}`,
                    team: `TEAM -${c + 1}`,
                    phase: phaseStr,
                    promiseLabel: "GOD'S PROMISES :",
                    promises: "ENTER GOD'S PROMISSES HERE",
                    promiseInput: "",
                    h1: "",
                    h2: "",
                    h3: "",
                    days: chunkDays
                };

                if (use5Segments) {
                    chunkObj.h4 = "";
                    chunkObj.h5 = "";
                }

                newChunks.push(chunkObj);
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
            
            // Update the RLLT lookup table with chosen book metrics
            const matchingLookup = rlltDB.find(d => Number(d.module) === Number(targetMdl) && Number(d.facet) === Number(targetFct) && Number(d.phase) === Number(targetPhs));
            
            if (Number(targetMdl) === 5 && ['super_admin', 'admin'].includes(userRole)) {
                let ot_count = 0;
                let nt_count = 0;
                let total_chp = 0;
                let total_ver = 0;
                let total_art = 0;

                validBooks.forEach(b => {
                    if (b.book_type && (b.book_type === 'OT' || b.book_type.toLowerCase().includes('old'))) {
                        ot_count++;
                    } else if (b.book_type && (b.book_type === 'NT' || b.book_type.toLowerCase().includes('new'))) {
                        nt_count++;
                    } else {
                        if (b.id <= 39) ot_count++;
                        else nt_count++;
                    }
                    
                    total_art += (Number(b.total_art) || 0);
                    
                    const bChaps = chaptersDB.filter(c => c.book_id === b.id);
                    total_chp += bChaps.length;
                    bChaps.forEach(c => total_ver += (c.verse_count || 0));
                });

                const rlltPayload = {
                    day: chartLength,
                    ot_bks: String(ot_count),
                    nt_bks: String(nt_count),
                    chp: total_chp,
                    ver: total_ver,
                    art: String(Math.round(total_art)),
                    pro: "1",
                    psa: "1",
                    ppl: String(chartLength)
                };

                try {
                    if (matchingLookup && matchingLookup.id) {
                        await axios.put(`http://${window.location.hostname}:8000/api/rllt_lookup/${matchingLookup.id}`, rlltPayload, { withCredentials: true });
                    } else {
                        // Create a new lookup entry if one does not exist for this combination
                        const createPayload = {
                            ...rlltPayload,
                            module: Number(targetMdl),
                            facet: Number(targetFct),
                            phase: Number(targetPhs),
                            we5: "5",
                            scheduled_value_days: chartLength
                        };
                        await axios.post(`http://${window.location.hostname}:8000/api/rllt_lookup/`, createPayload, { withCredentials: true });
                    }
                } catch (putErr) {
                    console.error("Failed to update/create RLLT lookup", putErr);
                }
            }

            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Chart Automated Successfully!', life: 2000 });
            setTimeout(() => {
                if (isSpecialProcess) {
                    navigate(`/admin/twenty-four-seven-chart?editMod=${targetMdl}&editFct=${targetFct}&editPhs=${targetPhs}`);
                } else {
                    navigate(`/admin/chart-creation/357-chart?editMod=${targetMdl}&editFct=${targetFct}&editPhs=${targetPhs}`);
                }
            }, 1000);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to generate chart or update RLLT data', life: 3000 });
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
                    className={`book-tooltip-item border border-[#d3c09b] rounded-[5px] flex items-center justify-center py-2 text-center text-sm font-bold font-serif tracking-widest cursor-pointer shadow-md transition-all w-[calc(20%-0.5rem)] ${isSelected ? `${colors.bg} ${colors.activeText} shadow-inner` : `bg-[#fbf6ec] hover:bg-[#f0e4cd] ${colors.text}`}`}
                    onClick={() => book && toggleBook(book.id)}
                    data-pr-tooltip={book ? getBookTooltip(book) : ''}
                >
                    {bookCode}
                </div>
            );
        });
    };

    return (
        <div className="min-h-screen bg-white p-8 flex justify-center items-start font-sans">
            <Toast ref={toast} />
            <Tooltip target=".book-tooltip-item" position="top" />
            <div className="bg-[#fcf8ef] rounded-[20px] shadow-[12px_12px_30px_rgba(0,0,0,0.25)] w-full max-w-[650px] p-8 calc-border-6 relative">
                {/* Decorative dots in corners */}
                <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-[#d3c09b]"></div>
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#d3c09b]"></div>
                <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-[#d3c09b]"></div>
                <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-[#d3c09b]"></div>

                {/* Header Section */}
                <div className="text-center mb-4">
                    <div className="flex justify-center items-center gap-1 mb-1">
                        <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                        <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                        <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    </div>
                    <p className="text-[#8c7355] italic text-xs font-serif">Unlocking Transformation Through</p>
                    <div className="flex items-center justify-center gap-2 my-2">
                        <div className="h-[1px] bg-[#d3c09b] w-12"></div>
                        <span className="text-[9px] text-[#555] font-bold tracking-[0.2em] [text-shadow:1px_1px_0_#ccc,2px_2px_0_#aaa,3px_3px_0_#888,4px_4px_3px_rgba(0,0,0,0.4)]">THE WORD</span>
                        <div className="h-[1px] bg-[#d3c09b] w-12"></div>
                    </div>
                    <h1 className="text-4xl text-[#0B2149] tracking-wider mt-1 mb-2 [text-shadow:1px_1px_0_#ccc,2px_2px_0_#aaa,3px_3px_0_#888,4px_4px_3px_rgba(0,0,0,0.4)]" style={{fontFamily: "'Algerian', serif"}}>SHANAZ 357</h1>
                    <div className="flex items-center justify-center">
                        <span className="text-[#d3c09b] text-lg leading-none">✧</span>
                    </div>
                </div>

                <div className="px-1">
                    {/* Stats Section */}
                    <div className="flex justify-between calc-border-4 rounded-lg mb-4 bg-[#fdfbf6] shadow-sm overflow-hidden py-1">
                        <StatItem title="BKS" icon="pi pi-book" value={displayStats.bks} color="text-[#1976d2]" />
                        <div className="w-px bg-[#e8dcb9] my-1"></div>
                        <StatItem title="CHP" icon="pi pi-file" value={displayStats.chp} color="text-[#388e3c]" />
                        <div className="w-px bg-[#e8dcb9] my-1"></div>
                        <StatItem title="VRS" icon="pi pi-crown" value={displayStats.vrs} color="text-[#f57c00]" />
                        <div className="w-px bg-[#e8dcb9] my-1"></div>
                        <StatItem title="ART" icon="pi pi-clock" value={displayStats.art} color="text-[#7b1fa2]" />
                        <div className="w-px bg-[#e8dcb9] my-1"></div>
                        <StatItem title="DAYS" icon="pi pi-calendar" value={eachPhsDays || 0} color="text-[#d32f2f]" />
                    </div>

                    <style>{`
                        .scrollbar-hide::-webkit-scrollbar { display: none; }
                        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                        .calc-border-4 {
                            border: 1px solid #69512a;
                            box-shadow: inset 0 0 0 1px #fffdf8, inset 0 0 0 3px #d3c09b;
                        }
                        .calc-border-6 {
                            border: 1px solid #69512a;
                            box-shadow: inset 0 0 0 2px #fffdf8, inset 0 0 0 6px #d3c09b, inset 0 0 0 7px #a48654;
                        }
                    `}</style>

                    {/* Books Grid */}
                    <div className="calc-border-4 rounded-lg shadow-sm overflow-hidden flex flex-col mb-4">
                        <div className="bg-[#0B2149] text-white py-1.5 flex items-center justify-center relative border-b-[3px] border-[#c7a96b]">
                            <div className="absolute left-3 text-[#d3c09b] text-[10px]">❖</div>
                            <div className="h-px bg-[#d3c09b] w-8 mx-2"></div>
                            <div className="text-sm tracking-widest text-[#fdfbf6] [text-shadow:1px_1px_0_#000,2px_2px_0_#000,3px_3px_0_#000,4px_4px_3px_rgba(0,0,0,0.5)]" style={{fontFamily: "'Algerian', serif"}}>OLD TESTAMENT</div>
                            <div className="h-px bg-[#d3c09b] w-8 mx-2"></div>
                            <div className="absolute right-3 text-[#d3c09b] text-[10px]">❖</div>
                        </div>
                        <div className="overflow-y-auto max-h-[260px] scrollbar-hide bg-[#fcf8ef]">
                            <div className="p-3 flex flex-wrap justify-center gap-2">
                                {booksDB.length > 0 && renderBooks(0, 39)}
                            </div>
                            
                            <div className="bg-[#0B2149] text-white py-1 flex items-center justify-center relative border-y-[3px] border-[#c7a96b]">
                                <div className="absolute left-3 text-[#d3c09b] text-[10px]">❖</div>
                                <div className="h-px bg-[#d3c09b] w-6 mx-2"></div>
                                <div className="text-xs tracking-widest text-[#fdfbf6] [text-shadow:1px_1px_0_#000,2px_2px_0_#000,3px_3px_0_#000,4px_4px_3px_rgba(0,0,0,0.5)]" style={{fontFamily: "'Algerian', serif"}}>NEW TESTAMENT</div>
                                <div className="h-px bg-[#d3c09b] w-6 mx-2"></div>
                                <div className="absolute right-3 text-[#d3c09b] text-[10px]">❖</div>
                            </div>
                            <div className="p-3 flex flex-wrap justify-center gap-2">
                                {booksDB.length > 0 && renderBooks(39, 66)}
                            </div>
                        </div>
                    </div>

                    {/* Middle Input Section */}
                    <div className="calc-border-4 rounded-lg p-2 bg-[#fdfbf6] shadow-sm mb-4">
                        <div className="flex gap-3 min-h-[4.5rem]">
                            {(() => {
                                const p119Book = booksDB.find(b => b.name.includes('119') || (b.short_form && b.short_form.includes('119')));
                                const p119Selected = p119Book && selectedBooks.includes(p119Book.id);
                                
                                const p75Book = booksDB.find(b => b.name.toUpperCase().includes('DAVID') || b.name.includes('75'));
                                const p75Selected = p75Book && selectedBooks.includes(p75Book.id);

                                return (
                                    <>
                                        <div 
                                            className={`book-tooltip-item flex-1 border border-[#7a9e7a] rounded-[4px] flex flex-col items-center justify-center text-center text-sm font-bold uppercase cursor-pointer transition-all ${
                                                p119Selected 
                                                    ? 'bg-[#e2efe2] text-[#1c3a1c] ring-1 ring-[#1c3a1c] shadow-inner' 
                                                    : 'bg-[#f0f7f0] text-[#3b603b] hover:bg-[#e2efe2]'
                                            }`}
                                            onClick={() => p119Book && toggleBook(p119Book.id)}
                                            data-pr-tooltip={p119Book ? getBookTooltip(p119Book) : 'Book Not Found'}
                                        >
                                            <span>PSALMS</span><span>CHP 119</span>
                                        </div>
                                        <div className="flex-[1.5] border border-[#e8dcb9] bg-white rounded-[4px] flex justify-evenly items-center px-1">
                                            <button onClick={() => setCycle(3)} className={`font-bold text-sm transition-colors ${cycle === 3 ? 'text-[#0B2149]' : 'text-gray-400 hover:text-gray-600'}`}>3 DAYS</button>
                                            <div className="h-8 w-px bg-[#e8dcb9]"></div>
                                            <button onClick={() => setCycle(5)} className={`font-bold text-sm transition-colors ${cycle === 5 ? 'text-[#0B2149]' : 'text-gray-400 hover:text-gray-600'}`}>5 DAYS</button>
                                            <div className="h-8 w-px bg-[#e8dcb9]"></div>
                                            <button onClick={() => setCycle(7)} className={`font-bold text-sm transition-colors ${cycle === 7 ? 'text-[#0B2149]' : 'text-gray-400 hover:text-gray-600'}`}>7 DAYS</button>
                                        </div>
                                        <div 
                                            className={`book-tooltip-item flex-1 border border-[#7a9e7a] rounded-[4px] flex flex-col items-center justify-center text-center text-sm font-bold uppercase cursor-pointer transition-all ${
                                                p75Selected 
                                                    ? 'bg-[#e2efe2] text-[#1c3a1c] ring-1 ring-[#1c3a1c] shadow-inner' 
                                                    : 'bg-[#f0f7f0] text-[#3b603b] hover:bg-[#e2efe2]'
                                            }`}
                                            onClick={() => p75Book && toggleBook(p75Book.id)}
                                            data-pr-tooltip={p75Book ? getBookTooltip(p75Book) : 'Book Not Found'}
                                        >
                                            <span>PSA OF DAVID</span><span>75 CHP</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Numbers Card */}
                    <div className="calc-border-4 rounded-lg p-3 bg-[#fdfbf6] shadow-sm mb-4 relative">
                        {dayValidationError && (
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-red-600 border border-red-500 font-bold px-2 py-1 rounded shadow-lg text-[10px] z-50 whitespace-nowrap animate-bounce flex items-center gap-1">
                                <span>{dayValidationError}</span>
                                <i className="pi pi-times ml-1 cursor-pointer" onClick={() => { setDayValidationError(''); setEnteredDays(''); }}></i>
                            </div>
                        )}
                        {bookValidationError && (
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-red-600 border border-red-500 font-bold px-2 py-1 rounded shadow-lg text-[10px] z-50 whitespace-nowrap animate-bounce flex items-center gap-1">
                                <span>{bookValidationError}</span>
                                <i className="pi pi-times ml-1 cursor-pointer" onClick={() => setBookValidationError('')}></i>
                            </div>
                        )}

                        <div className="flex justify-between items-center px-4 mb-3">
                            <button 
                                onClick={() => { setEnteredDays(''); setSelectedBooks([]); setChartStats(null); setDayValidationError(''); setBookValidationError(''); }}
                                className="w-6 h-6 rounded-full border border-[#9c2929] text-[#9c2929] flex items-center justify-center hover:bg-red-50 transition-colors"
                            >
                                <i className="pi pi-refresh text-[10px] font-bold"></i>
                            </button>
                            <div className="relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#c3b08e] text-xs font-bold tracking-widest bg-[#fdfbf6] px-2 z-10 whitespace-nowrap">DAYS</div>
                                <div className="w-16 h-10 border border-[#e8dcb9] rounded-full flex items-center justify-center bg-white shadow-inner">
                                    {enteredDays && <span className="text-xl font-black text-[#0B2149] z-20 bg-white px-2 rounded">{enteredDays}</span>}
                                </div>
                            </div>
                            <button 
                                onClick={handleSubmit}
                                className="w-6 h-6 rounded-full border border-[#2e532e] text-[#2e532e] flex items-center justify-center hover:bg-green-50 transition-colors"
                            >
                                <i className="pi pi-check text-[10px] font-bold"></i>
                            </button>
                        </div>
                        
                        <div className="flex justify-between items-center bg-[#f7eedc] rounded px-3 py-3 calc-border-4">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button 
                                    key={num} 
                                    onClick={() => handleNumberClick(num)} 
                                    className="text-[#0B2149] font-bold text-2xl w-8 h-8 flex items-center justify-center hover:bg-[#ebd8b7] rounded transition-colors"
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Lower Controls Section */}
                    <div className="calc-border-4 rounded-lg p-3 bg-[#fdfbf6] shadow-sm mb-4">
                        {/* Plus/Minus Section */}
                        <div className="flex items-center justify-between mb-3 gap-2">
                            <div className="flex-1 h-6 bg-white border border-[#e8dcb9] rounded-sm"></div>
                            <button 
                                className={`text-xl font-bold px-1 pb-1 ${uniqueModules.indexOf(mdl) > 0 ? 'text-[#8c7355] hover:text-[#5c4a35]' : 'text-gray-300'}`}
                                onClick={handleDecrement} disabled={uniqueModules.indexOf(mdl) <= 0}
                            >-</button>
                            
                            <div className="border border-[#d4af37] bg-[#f7eedc] px-6 py-1 rounded-[4px] flex flex-col items-center justify-center shadow-sm min-w-[70px]">
                                <div className="text-[11px] font-bold text-[#8c7355]">MDL.</div>
                                <div className="text-xl font-black text-[#8c7355] leading-none mt-0.5">{mdl}</div>
                            </div>
                            
                            <button 
                                className={`text-xl font-bold px-1 pb-1 ${uniqueModules.indexOf(mdl) < uniqueModules.length - 1 ? 'text-[#8c7355] hover:text-[#5c4a35]' : 'text-gray-300'}`}
                                onClick={handleIncrement} disabled={uniqueModules.indexOf(mdl) >= uniqueModules.length - 1}
                            >+</button>
                            <div className="flex-1 h-6 bg-white border border-[#e8dcb9] rounded-sm"></div>
                        </div>

                        {/* PHS Stats Section */}
                        <div className="border border-[#7a9e7a] bg-[#f0f7f0] rounded-[4px] flex justify-between p-3 mb-3 text-center text-[#2e532e]">
                            <div className="flex flex-col items-center flex-1">
                                <div className="text-xs font-bold mb-1">PAGES</div>
                                <div className="flex items-center gap-1 text-base font-bold">
                                    <button onClick={handleFctDec} disabled={availableFacets.indexOf(fct) <= 0} className={availableFacets.indexOf(fct) > 0 ? 'hover:text-[#1c3a1c]' : 'opacity-30'}><i className="pi pi-angle-left text-sm"></i></button>
                                    <span className="w-4">{fct || '-'}</span>
                                    <button onClick={handleFctInc} disabled={availableFacets.indexOf(fct) >= availableFacets.length - 1} className={availableFacets.indexOf(fct) < availableFacets.length - 1 ? 'hover:text-[#1c3a1c]' : 'opacity-30'}><i className="pi pi-angle-right text-sm"></i></button>
                                </div>
                            </div>
                            <div className="w-px bg-[#7a9e7a] my-1 opacity-50"></div>
                            <div className="flex flex-col items-center flex-1">
                                <div className="text-xs font-bold mb-1">PHS.</div>
                                <div className="flex items-center gap-1 text-base font-bold">
                                    <button onClick={handlePhsDec} disabled={availablePhases.indexOf(phs) <= 0} className={availablePhases.indexOf(phs) > 0 ? 'hover:text-[#1c3a1c]' : 'opacity-30'}><i className="pi pi-angle-left text-sm"></i></button>
                                    <span className="w-4">{phs || '-'}</span>
                                    <button onClick={handlePhsInc} disabled={availablePhases.indexOf(phs) >= availablePhases.length - 1} className={availablePhases.indexOf(phs) < availablePhases.length - 1 ? 'hover:text-[#1c3a1c]' : 'opacity-30'}><i className="pi pi-angle-right text-sm"></i></button>
                                </div>
                            </div>
                            <div className="w-px bg-[#7a9e7a] my-1 opacity-50"></div>
                            <div className="flex flex-col items-center flex-[1.5]">
                                <div className="text-xs font-bold mb-1">EACH PHS.</div>
                                <div className="text-base font-bold flex items-center h-5">{eachPhsDays ? `${eachPhsDays} DAYS` : '0 DAYS'}</div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-2">
                            <button className="flex items-center justify-center gap-1.5 border border-[#4a5e78] text-[#4a5e78] rounded-[4px] py-1.5 text-xs font-bold bg-white hover:bg-gray-50 transition-colors">
                                <i className="pi pi-print text-sm"></i> PRINT
                            </button>
                            <button onClick={handleViewClick} disabled={isViewing} className="flex items-center justify-center gap-1.5 border border-[#2e532e] text-[#2e532e] rounded-[4px] py-1.5 text-xs font-bold bg-white hover:bg-green-50 transition-colors">
                                <i className={`pi ${isViewing ? 'pi-spin pi-spinner' : 'pi-eye'} text-sm`}></i> VIEW
                            </button>
                            <button className="flex items-center justify-center gap-1.5 border border-[#6b3582] text-[#6b3582] rounded-[4px] py-1.5 text-xs font-bold bg-white hover:bg-purple-50 transition-colors">
                                <i className="pi pi-send text-sm"></i> SEND
                            </button>
                        </div>
                    </div>

                    {/* Footer Image Area */}
                    <div className="mt-4 w-full flex justify-center shadow-sm">
                        {/* 
                          To use your custom image:
                          1. Place the image in the frontend/public folder
                          2. Change the src below to match your filename (e.g., "/my-image.png")
                        */}
                        <img src="/footer-image.png" alt="Footer Illustration" className="w-full h-auto block" />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Shanaz357;
