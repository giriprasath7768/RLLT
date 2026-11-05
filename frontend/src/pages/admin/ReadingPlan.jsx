import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Tooltip } from 'primereact/tooltip';
import { Toast } from 'primereact/toast';
import { extractBooksAndAuthors } from '../../utils/bookUtils';


const parseTime = (t) => {
    if (!t) return 0;
    t = t.toString().trim().toLowerCase();
    if (t.includes('h')) {
        const match = t.match(/(\d+)h\s*\.?\s*(\d+)?m?/);
        if (match) {
            return (parseInt(match[1] || 0) * 60) + parseInt(match[2] || 0);
        }
    } else if (t.includes('.')) {
        const parts = t.split('.');
        let sStr = parts[1] || "0";
        if (sStr.length === 1) sStr += '0';
        return parseInt(parts[0] || 0) + (parseInt(sStr.substring(0, 2)) / 60);
    } else {
        return parseFloat(t) || 0;
    }
    return 0;
};

const formatChartTime = (totalMins, formatType = 'm') => {
    const rawMins = Math.round(totalMins);
    if (rawMins <= 0) return formatType === 'HrMins' ? '0 Mins' : '0m';
    const h = Math.floor(rawMins / 60);
    const m = rawMins % 60;
    if (formatType === 'HrMins') {
        return rawMins >= 60 ? `${h} Hr ${m} Mins` : `${rawMins} Mins`;
    }
    if (formatType === 'Hm') {
        return rawMins >= 60 ? `${h}H ${m}m` : `${rawMins}m`;
    }
    if (formatType === 'hm_compact') {
        return rawMins >= 60 ? `${h}h${m}m` : `${rawMins}m`;
    }
    return rawMins >= 60 ? `${h}H ${m}m` : `${rawMins}m`;
};

const DEFAULT_WEEK_PROMISES = [
    "I WILL MAKE YOU A GREAT NATION: GEN 12:2",
    "I WILL GIVE YOU TREASURES HIDDEN IN THE DARKNESS - SECRET PLACES: ISA 45:3",
    "ONLY ASK, I WILL GIVE YOU NATIONS AS YOUR INHERITANCE: PSA 2:8",
    "GOD IS MY FATHER AND POTTER. I AM, WORK OF HIS HAND. ISA 64:8",
    "GOD CREATED ALL THINGS. EVERYTHIG IS FROM HIS HANDS: JOH 1:3",
    "I AM WITH YOU ALWAYS, GO, TRAIN, MULTIPLY: MAT 28:18-20"
];

const PROMISE_BORDER_COLORS = [
    '#00b0f0',
    '#00b050',
    '#002060',
    '#ffff00',
    '#c000c0',
    '#c45911',
    '#ff0000',
    '#00b050'
];

const TRANSFORMATION_PALETTE_COLORS = [
    { color: '#00C0FF', label: 'Light Blue' },
    { color: '#00A638', label: 'Green' },
    { color: '#3340CD', label: 'Dark Blue' },
    { color: '#FAFA33', label: 'Yellow' },
    { color: '#BB43B1', label: 'Purple' },
    { color: '#FE6D01', label: 'Orange' },
    { color: '#FE0005', label: 'Red' }
];

const DAY_CYCLE_INITIALS = ['F', 'S', 'S', 'M', 'T', 'W', 'T'];

const STANDARD_BOOKS = [
    "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA",
    "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO",
    "ECC", "SOS", "ISA", "JER", "LAM", "EZE", "DAN", "HOS", "JOE", "AMO",
    "OBA", "JON", "MIC", "NAH", "HAB", "ZEP", "HAG", "ZEC", "MAL",
    "MAT", "MAR", "LUK", "JOH", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH",
    "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAM",
    "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV"
];

const BIBLE_BOOKS_META = {
    GEN: { name: "Genesis", chapters: 50 },
    EXO: { name: "Exodus", chapters: 40 },
    LEV: { name: "Leviticus", chapters: 27 },
    NUM: { name: "Numbers", chapters: 36 },
    DEU: { name: "Deuteronomy", chapters: 34 },
    JOS: { name: "Joshua", chapters: 24 },
    JDG: { name: "Judges", chapters: 21 },
    RUT: { name: "Ruth", chapters: 4 },
    "1SA": { name: "1 Samuel", chapters: 31 },
    "2SA": { name: "2 Samuel", chapters: 24 },
    "1KI": { name: "1 Kings", chapters: 22 },
    "2KI": { name: "2 Kings", chapters: 25 },
    "1CH": { name: "1 Chronicles", chapters: 29 },
    "2CH": { name: "2 Chronicles", chapters: 36 },
    EZR: { name: "Ezra", chapters: 10 },
    NEH: { name: "Nehemiah", chapters: 13 },
    EST: { name: "Esther", chapters: 10 },
    JOB: { name: "Job", chapters: 42 },
    PSA: { name: "Psalms", chapters: 150 },
    PRO: { name: "Proverbs", chapters: 31 },
    ECC: { name: "Ecclesiastes", chapters: 12 },
    SOS: { name: "Song of Solomon", chapters: 8 },
    ISA: { name: "Isaiah", chapters: 66 },
    JER: { name: "Jeremiah", chapters: 52 },
    LAM: { name: "Lamentations", chapters: 5 },
    EZE: { name: "Ezekiel", chapters: 48 },
    DAN: { name: "Daniel", chapters: 12 },
    HOS: { name: "Hosea", chapters: 14 },
    JOE: { name: "Joel", chapters: 3 },
    AMO: { name: "Amos", chapters: 9 },
    OBA: { name: "Obadiah", chapters: 1 },
    JON: { name: "Jonah", chapters: 4 },
    MIC: { name: "Micah", chapters: 7 },
    NAH: { name: "Nahum", chapters: 3 },
    HAB: { name: "Habakkuk", chapters: 3 },
    ZEP: { name: "Zephaniah", chapters: 3 },
    HAG: { name: "Haggai", chapters: 2 },
    ZEC: { name: "Zechariah", chapters: 14 },
    MAL: { name: "Malachi", chapters: 4 },
    MAT: { name: "Matthew", chapters: 28 },
    MAR: { name: "Mark", chapters: 16 },
    LUK: { name: "Luke", chapters: 24 },
    JOH: { name: "John", chapters: 21 },
    ACT: { name: "Acts", chapters: 28 },
    ROM: { name: "Romans", chapters: 16 },
    "1CO": { name: "1 Corinthians", chapters: 16 },
    "2CO": { name: "2 Corinthians", chapters: 13 },
    GAL: { name: "Galatians", chapters: 6 },
    EPH: { name: "Ephesians", chapters: 6 },
    PHP: { name: "Philippians", chapters: 4 },
    COL: { name: "Colossians", chapters: 4 },
    "1TH": { name: "1 Thessalonians", chapters: 5 },
    "2TH": { name: "2 Thessalonians", chapters: 3 },
    "1TI": { name: "1 Timothy", chapters: 6 },
    "2TI": { name: "2 Timothy", chapters: 4 },
    TIT: { name: "Titus", chapters: 3 },
    PHM: { name: "Philemon", chapters: 1 },
    HEB: { name: "Hebrews", chapters: 13 },
    JAM: { name: "James", chapters: 5 },
    "1PE": { name: "1 Peter", chapters: 5 },
    "2PE": { name: "2 Peter", chapters: 3 },
    "1JN": { name: "1 John", chapters: 5 },
    "2JN": { name: "2 John", chapters: 1 },
    "3JN": { name: "3 John", chapters: 1 },
    JUD: { name: "Jude", chapters: 1 },
    REV: { name: "Revelation", chapters: 22 }
};

const PDF_BOOK_ABBR = {
    GEN: "GEN", EXO: "EXO", LEV: "LEV", NUM: "NUM", DEU: "DEU",
    JOS: "JOS", JDG: "JUD", RUT: "RUT", "1SA": "1SAM", "2SA": "2SAM",
    "1KI": "1KIN", "2KI": "2KIN", "1CH": "1CHR", "2CH": "2CHR", EZR: "EZRA",
    NEH: "NEH", EST: "EST", JOB: "JOB", PSA: "PSA", PRO: "PRO",
    ECC: "ECC", SOS: "SON", ISA: "ISA", JER: "JER", LAM: "LAM",
    EZE: "EZE", DAN: "DAN", HOS: "HOS", JOE: "JOE", AMO: "AMO",
    OBA: "OBA", JON: "JON", MIC: "MIC", NAH: "NAH", HAB: "HAB",
    ZEP: "ZEP", HAG: "HAG", ZEC: "ZEC", MAL: "MAL",
    MAT: "MAT", MAR: "MAR", LUK: "LUK", JOH: "JOHN", ACT: "ACTS",
    ROM: "ROM", "1CO": "1COR", "2CO": "2COR", GAL: "GAL", EPH: "EPH",
    PHP: "PHP", COL: "COL", "1TH": "1THES", "2TH": "2THES", "1TI": "1TIM",
    "2TI": "2TIM", TIT: "TIT", PHM: "PLO", HEB: "HEB", JAM: "JAM",
    "1PE": "1PET", "2PE": "2PET", "1JN": "1JHN", "2JN": "2JHN", "3JN": "3JHN",
    JUD: "JUD", REV: "REV"
};

// Exact Proverbs 1..31 chapter ART values from the RLLT Master Chart PDF
const PRO_CHAPTER_TIMES = {
    1: 3.05, 2: 1.78, 3: 2.97, 4: 2.27, 5: 2.02,
    6: 3.20, 7: 2.27, 8: 2.05, 9: 3.18, 10: 2.83,
    11: 2.58, 12: 3.35, 13: 3.25, 14: 3.07, 15: 3.25,
    16: 3.07, 17: 2.85, 18: 2.02, 19: 2.98, 20: 2.70,
    21: 2.90, 22: 2.65, 23: 3.18, 24: 3.12, 25: 2.68,
    26: 2.60, 27: 2.62, 28: 3.00, 29: 2.57, 30: 6.00,
    31: 0.00
};

const formatChapterRangeList = (chapItems, useShort = true) => {
    if (!chapItems || chapItems.length === 0) return '';
    const getLabel = (item) => (useShort ? (item.shortCode || item.bookName) : item.bookName);
    const segments = [];
    let currBook = getLabel(chapItems[0]);
    let startCh = chapItems[0].chapterNumber;
    let endCh = startCh;

    for (let i = 1; i < chapItems.length; i++) {
        const item = chapItems[i];
        const itemLabel = getLabel(item);
        if (itemLabel === currBook && item.chapterNumber === endCh + 1) {
            endCh = item.chapterNumber;
        } else {
            segments.push(startCh === endCh ? `${currBook} ${startCh}` : `${currBook} ${startCh}-${endCh}`);
            currBook = itemLabel;
            startCh = item.chapterNumber;
            endCh = item.chapterNumber;
        }
    }
    segments.push(startCh === endCh ? `${currBook} ${startCh}` : `${currBook} ${startCh}-${endCh}`);
    return segments.join(', ');
};

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
    if (!book) return false;
    const rawCombined = ((book.name || '') + ' ' + (book.short_form || '')).toUpperCase();
    const code = bookCode.toUpperCase();

    // Never match partial Psalm subsets ("Psalm 119", "Psalms of David") when looking up canonical 150-chapter 'PSA'
    if (code === "PSA" && (rawCombined.includes("119") || rawCombined.includes("DAVID") || rawCombined.includes("75"))) {
        return false;
    }

    if (book.short_form && book.short_form.toUpperCase() === code) return true;

    // Some databases use full names like "1st John", "I John", "Song of Songs"
    const nameStr = (book.name || '').toUpperCase().replace(/\s+/g, ''); // keep numbers and letters

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

const ImageUploadPlaceholder = ({ state, setState, label }) => {
    const imageUrl = typeof state === 'object' && state !== null ? state.url : state;

    return (
        <label className="w-full h-full flex items-center justify-center cursor-pointer bg-white overflow-hidden relative group">
            <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            setState({ file, url: ev.target.result });
                        };
                        reader.readAsDataURL(file);
                    }
                }}
            />
            {imageUrl ? (
                <img src={imageUrl} className="w-full h-full object-contain" alt="Header Logo" />
            ) : (
                <div className="print-hide-empty-camera flex flex-col items-center justify-center text-gray-400 p-1 text-center w-full h-full">
                    <i className="pi pi-camera text-xl group-hover:text-[#00a8ff] transition-colors"></i>
                    {label && <span className="text-[10px] font-bold leading-tight mt-1">{label}</span>}
                </div>
            )}
        </label>
    );
};

const StatItem = ({ title, icon, value, color }) => (
    <div className="flex sm:flex-col items-center justify-between sm:justify-center flex-1 py-2 sm:py-3 px-3 sm:px-1">
        <div className="flex sm:flex-col items-center gap-2 sm:gap-0">
            <div className="text-[12px] sm:text-[14px] font-black text-[#0B2149] sm:mb-2 w-10 sm:w-auto text-left sm:text-center [text-shadow:1px_1px_0_#e6d5b8]">{title}</div>
            <i className={`${icon} ${color} text-lg sm:text-3xl sm:mb-2 drop-shadow-[1px_1px_0_rgba(200,200,200,1)]`}></i>
        </div>
        <div className={`${color} font-black text-lg sm:text-xl leading-none truncate text-right sm:text-center [text-shadow:1px_1px_0_#ddd]`}>{value}</div>
    </div>
);

const ReadingPlan = () => {
    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [assignedBooks, setAssignedBooks] = useState([]);
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [tLabel, setTLabel] = useState('T');
    const [bannerText, setBannerText] = useState('MAIN CHART - 30 DAYS');
    const [logo1, setLogo1] = useState(null);
    const [logo2, setLogo2] = useState(null);
    const [logo3, setLogo3] = useState(null);
    const [rlltDB, setRlltDB] = useState([]);
    const [mdl, setMdl] = useState(5);
    const [fct, setFct] = useState(2);
    const [phs, setPhs] = useState(1);
    const [cycle, setCycle] = useState(3);
    const [isViewing, setIsViewing] = useState(false);
    const [dayValidationError, setDayValidationError] = useState('');
    const [bookValidationError, setBookValidationError] = useState('');

    const [chartStats, setChartStats] = useState(null);
    const [enteredDays, setEnteredDays] = useState('');
    const [enteredPersons, setEnteredPersons] = useState('');
    const [durationHours, setDurationHours] = useState(0);
    const [durationMinutes, setDurationMinutes] = useState(0);
    const [showFreqBooks, setShowFreqBooks] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [selectedHour, setSelectedHour] = useState(() => {
        const h = new Date().getHours();
        return h % 12 === 0 ? 12 : h % 12;
    });
    const [selectedMinute, setSelectedMinute] = useState(() => new Date().getMinutes());
    const [selectedPeriod, setSelectedPeriod] = useState(() => (new Date().getHours() >= 12 ? 'PM' : 'AM'));
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [calendarViewDate, setCalendarViewDate] = useState(() => new Date());
    const [activeColorBoxPopupId, setActiveColorBoxPopupId] = useState(null);
    const [editingColorBoxId, setEditingColorBoxId] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userId, setUserId] = useState(null);
    const [userLocation, setUserLocation] = useState('');
    const [isSavingChart, setIsSavingChart] = useState(false);
    const navigate = useNavigate();
    const toast = React.useRef(null);
    const planTableRef = React.useRef(null);

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (!e.target.closest('.color-box-popup') && !e.target.closest('.promise-color-box')) {
                setActiveColorBoxPopupId(null);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const updateChunkColorBox = (chunkId, updates) => {
        setGeneratedPlan((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                chunks: prev.chunks.map((ch) =>
                    ch.id === chunkId ? { ...ch, ...updates } : ch
                )
            };
        });
    };

    const enableColorBoxEditing = (chunkId) => {
        setActiveColorBoxPopupId(null);
        setEditingColorBoxId(chunkId);
        setTimeout(() => {
            const inputEl = document.getElementById(`color-box-input-${chunkId}`);
            if (inputEl) {
                inputEl.focus();
            }
        }, 0);
    };

    const formattedSelectedDate = React.useMemo(() => {
        const d = selectedDate instanceof Date && !isNaN(selectedDate) ? selectedDate : new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }, [selectedDate]);

    const formattedSelectedTime = React.useMemo(() => {
        const hh = String(selectedHour).padStart(2, '0');
        const min = String(selectedMinute).padStart(2, '0');
        return `${hh}:${min} ${selectedPeriod}`;
    }, [selectedHour, selectedMinute, selectedPeriod]);

    // Keep generatedPlan dates & time in sync whenever the user picks a new Date or Time
    useEffect(() => {
        setGeneratedPlan(prev => {
            if (!prev) return prev;
            const baseStartDate = selectedDate instanceof Date && !isNaN(selectedDate) ? selectedDate : new Date();
            const weekdayInitials = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

            const updatedRows = (prev.rows || []).map((row, idx) => {
                const rowDate = new Date(baseStartDate.getFullYear(), baseStartDate.getMonth(), baseStartDate.getDate() + idx);
                const dateNum = rowDate.getDate();
                const dateInit = weekdayInitials[rowDate.getDay()];
                return {
                    ...row,
                    dateLabel: `${dateNum}-${dateInit}`
                };
            });

            const updatedChunks = (prev.chunks || []).map((chunk, w) => ({
                ...chunk,
                days: updatedRows.slice(w * 5, (w + 1) * 5)
            }));

            return {
                ...prev,
                selectedDateText: formattedSelectedDate,
                selectedTimeText: formattedSelectedTime,
                rows: updatedRows,
                chunks: updatedChunks
            };
        });
    }, [selectedDate, formattedSelectedDate, formattedSelectedTime]);

    const formattedDuration = React.useMemo(() => {
        if (durationHours === 0 && durationMinutes === 0) return '';
        if (durationHours > 0 && durationMinutes > 0) return `${durationHours} Hr ${durationMinutes} Min`;
        if (durationHours > 0) return `${durationHours} Hr`;
        return `${durationMinutes} Min`;
    }, [durationHours, durationMinutes]);

    useEffect(() => {
        axios.get('http://' + window.location.hostname + ':8000/api/me', { withCredentials: true })
            .then(res => {
                setUserRole(res.data.role);
                if (res.data.id) setUserId(res.data.id);
                if (res.data.location_name) setUserLocation(res.data.location_name);
            })
            .catch(err => console.error("Could not fetch user role", err));

        axios.get('http://' + window.location.hostname + ':8000/api/profile/me', { withCredentials: true })
            .then(res => {
                if (res.data?.user_id) setUserId(prev => prev || res.data.user_id);
                if (res.data?.address) setUserLocation(prev => prev || res.data.address);
            })
            .catch(() => {});

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

    const toggleAssignedBook = (id) => {
        setChartStats(null);
        setBookValidationError('');
        if (assignedBooks.includes(id)) {
            setAssignedBooks(assignedBooks.filter(b => b !== id));
        } else {
            setAssignedBooks([...assignedBooks, id]);
        }
    };

    const getBookTooltip = (book, fallbackCode = '') => {
        const matchedCode = fallbackCode || (book ? STANDARD_BOOKS.find(code => isBookMatch(code, book)) : '');
        const meta = matchedCode ? BIBLE_BOOKS_META[matchedCode] : null;

        let fullName = meta ? meta.name : (book?.name || matchedCode || 'Book');
        const rawUpper = ((book?.name || '') + ' ' + (book?.short_form || '')).toUpperCase();
        if (!meta) {
            if (rawUpper.includes('119')) fullName = 'Psalms 119';
            else if (rawUpper.includes('DAVID') || rawUpper.includes('75')) fullName = 'Psalms of David';
        }

        const bChaps = book ? chaptersDB.filter(c => c.book_id === book.id) : [];
        let count = meta ? meta.chapters : (bChaps.length || book?.total_chapters || 0);
        if (!meta) {
            if (rawUpper.includes('119')) count = 1;
            else if ((rawUpper.includes('DAVID') || rawUpper.includes('75')) && count === 0) count = 75;
        }

        return `${fullName} - ${count} ${count === 1 ? 'Chapter' : 'Chapters'}`;
    };

    const uniqueModules = (() => {
        const unique = [...new Set(rlltDB.map(d => Number(d.module)))];
        if (!unique.includes(Number(mdl))) unique.push(Number(mdl));
        return unique.sort((a, b) => a - b);
    })();

    // Facets start at 2 and go up to 5 (2, 3, 4, 5)
    const availableFacets = [2, 3, 4, 5];

    const availablePhases = (() => {
        let max = 1;
        const unique = [...new Set(rlltDB.filter(d => Number(d.module) === Number(mdl) && Number(d.facet) === Number(fct)).map(d => Number(d.phase)))];
        if (unique.length > 0) max = Math.max(max, ...unique);
        return Array.from({ length: max }, (_, i) => i + 1);
    })();

    // Sync cascading defaults
    useEffect(() => {
        if (availableFacets.length > 0 && !availableFacets.includes(fct)) {
            setFct(2); // Default to starting facet 2
        }
    }, [mdl, availableFacets, fct]);

    useEffect(() => {
        if (availablePhases.length > 0 && !availablePhases.includes(phs)) {
            setPhs(1); // Default to phase 1
        }
    }, [mdl, fct, availablePhases, phs]);

    // Keep generatedPlan module/facet/phase labels in sync when user changes FACES or PHS.
    useEffect(() => {
        setGeneratedPlan(prev => {
            if (!prev) return prev;
            const maxPhasesCount = availablePhases.length > 0 ? Math.max(...availablePhases) : (prev.maxPhases || 1);
            return {
                ...prev,
                mdl,
                fct,
                phs,
                maxPhases: maxPhasesCount,
                headerSubtitle: `MODULE${mdl}:FACET${fct}:PHASE-${phs}/${maxPhasesCount}`,
                footerPhaseText: `MODULE ${mdl} - FACET ${fct}: PHASE - ${phs}/${maxPhasesCount}`,
                chunks: (prev.chunks || []).map(ch => ({
                    ...ch,
                    phaseSideLabel: `MDL ${mdl}: FCT ${fct}: PHS - ${phs}`
                }))
            };
        });
    }, [mdl, fct, phs, availablePhases.length]);

    const numberOfDaysForPhase = parseInt(enteredDays, 10) > 0
        ? parseInt(enteredDays, 10)
        : (generatedPlan?.numDays || 0);
    const stats = React.useMemo(() => {
        const allSelectedIds = [...new Set([...selectedBooks, ...assignedBooks])];
        let bks = allSelectedIds.length;
        let chp = 0;
        let vrs = 0;
        let artMins = 0;

        allSelectedIds.forEach(bookId => {
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
    }, [selectedBooks, assignedBooks, chaptersDB]);

    const displayStats = chartStats || stats;

    const handleNumberClick = (num) => {
        setDayValidationError('');
        if (cycle === 5) {
            setEnteredPersons(prev => {
                if (prev.length < 3) {
                    return prev + num.toString();
                }
                return prev;
            });
        } else {
            setEnteredDays(prev => {
                if (prev.length < 3) {
                    return prev + num.toString();
                }
                return prev;
            });
        }
    };



    const handleIncrement = () => {
        const currIdx = uniqueModules.indexOf(mdl);
        if (currIdx < uniqueModules.length - 1) {
            setMdl(uniqueModules[currIdx + 1]);
            setEnteredDays('');
        }
    };

    const handleDecrement = () => {
        const currIdx = uniqueModules.indexOf(mdl);
        if (currIdx > 0) {
            setMdl(uniqueModules[currIdx - 1]);
            setEnteredDays('');
        }
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

    const handleViewClick = async (autoPrint = false) => {
        setIsViewing(true);
        try {
            const listRes = await axios.get(`http://${window.location.hostname}:8000/api/charts/list`, { withCredentials: true });
            const existsChart = listRes.data.find(c => Number(c.module) === Number(mdl) && Number(c.facet) === Number(fct) && Number(c.phase) === Number(phs));

            if (existsChart) {
                const baseRoute = userRole === 'student' ? '/dashboard/student' : '/admin';
                navigate(`${baseRoute}/reading-plan/view`, {
                    state: {
                        preselect: {
                            module: mdl,
                            facet: fct,
                            phase: phs
                        },
                        autoPrint: autoPrint === true
                    }
                });
            } else {
                toast.current?.show({ severity: 'warn', summary: 'Not Found', detail: `No saved chart found for Module ${mdl}, Facet ${fct}, Phase ${phs}. Please generate and save it first.`, life: 4000 });
            }
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not verify chart existence.', life: 3000 });
        } finally {
            setIsViewing(false);
        }
    };

    const getCanonicalOrderIndex = (book) => {
        if (!book) return 999;
        for (let i = 0; i < STANDARD_BOOKS.length; i++) {
            if (isBookMatch(STANDARD_BOOKS[i], book)) return i;
        }
        return 999;
    };

    const getBookDisplayInfo = (book) => {
        if (!book) return { name: 'Unknown', shortCode: 'UNK', code: '', chapters: [] };
        const rawUpper = ((book.name || '') + ' ' + (book.short_form || '')).toUpperCase();
        const combinedChaps = chaptersDB.filter(c => c.book_id === book.id);
        const sourceChaps = combinedChaps.length > 0
            ? combinedChaps
            : (Array.isArray(book.chapters) ? book.chapters : []);
        const dbChaps = [...sourceChaps].sort((a, b) => Number(a.chapter_number) - Number(b.chapter_number));

        const getChapArt = (dbChap, isP119 = false, proChapNum = null) => {
            if (proChapNum != null && PRO_CHAPTER_TIMES[proChapNum] !== undefined) {
                return PRO_CHAPTER_TIMES[proChapNum];
            }
            if (dbChap && dbChap.art != null) {
                const valStr = dbChap.art.toString().trim();
                let parsed = 0;
                if (valStr.includes('.')) {
                    const parts = valStr.split('.');
                    let sStr = parts[1] || '0';
                    if (sStr.length === 1) sStr += '0';
                    parsed = parseInt(parts[0] || 0, 10) + (parseInt(sStr.substring(0, 2), 10) / 60);
                } else {
                    parsed = parseFloat(valStr) || 0;
                }
                if (isP119 && parsed <= 2) {
                    return 15;
                }
                if (parsed > 0) return parsed;
            }
            return isP119 ? 15 : 3.5;
        };

        const getRawArtDisplay = (dbChap, proChapNum = null) => {
            if (proChapNum != null && PRO_CHAPTER_TIMES[proChapNum] !== undefined) {
                return PRO_CHAPTER_TIMES[proChapNum].toFixed(2);
            }
            if (dbChap && dbChap.art != null && !isNaN(Number(dbChap.art))) {
                return Number(dbChap.art).toFixed(2);
            }
            return null;
        };

        if (rawUpper.includes('119')) {
            const dbChap = dbChaps.find(c => Number(c.chapter_number) === 119) || dbChaps[0];
            return {
                name: 'Psalms',
                shortCode: 'PSA',
                headerName: 'PSALM 119',
                code: 'PSA',
                isSubsetPsalm: true,
                chapters: [{
                    bookName: 'Psalms',
                    shortCode: 'PSA',
                    chapterNumber: 119,
                    art: getChapArt(dbChap, true),
                    rawArtDisplay: '15.00',
                    verseCount: (dbChap?.verse_count && dbChap.verse_count >= 100) ? dbChap.verse_count : 176,
                    isPsalm119: true
                }]
            };
        }
        if (rawUpper.includes('DAVID') || rawUpper.includes('75')) {
            const count = dbChaps.length > 0 ? dbChaps.length : 75;
            return {
                name: 'Psalms of David',
                shortCode: 'PSA',
                headerName: 'PSALMS OF DAVID',
                code: 'PSA',
                isSubsetPsalm: true,
                chapters: Array.from({ length: count }, (_, idx) => {
                    const dbChap = dbChaps[idx];
                    return {
                        bookName: 'Psalms',
                        shortCode: 'PSA',
                        chapterNumber: dbChap?.chapter_number || (idx + 1),
                        art: getChapArt(dbChap, false),
                        rawArtDisplay: getRawArtDisplay(dbChap),
                        verseCount: dbChap?.verse_count || 0,
                        isPsalm119: false
                    };
                })
            };
        }

        const matchedCode = STANDARD_BOOKS.find(code => isBookMatch(code, book));
        const meta = matchedCode ? BIBLE_BOOKS_META[matchedCode] : null;
        const displayName = meta ? meta.name : (book.name || book.short_form || 'Book');
        const shortCode = matchedCode ? (PDF_BOOK_ABBR[matchedCode] || matchedCode) : ((book.short_form || displayName).toUpperCase());
        const count = meta ? meta.chapters : (dbChaps.length > 0 ? dbChaps.length : (book.total_chapters || 1));

        const chapters = Array.from({ length: count }, (_, idx) => {
            const chNum = idx + 1;
            const isP119 = matchedCode === 'PSA' && chNum === 119;
            const proChapNum = matchedCode === 'PRO' ? chNum : null;
            const dbChap = dbChaps.find(c => Number(c.chapter_number) === chNum) || dbChaps[idx];
            return {
                bookName: displayName,
                shortCode,
                chapterNumber: chNum,
                art: getChapArt(dbChap, isP119, proChapNum),
                rawArtDisplay: getRawArtDisplay(dbChap, proChapNum),
                verseCount: isP119 && (!dbChap?.verse_count || dbChap.verse_count < 100) ? 176 : (dbChap?.verse_count || 0),
                isPsalm119: isP119
            };
        });

        return {
            name: displayName,
            shortCode,
            headerName: displayName.toUpperCase(),
            code: matchedCode || displayName.toUpperCase(),
            chapters
        };
    };

    const distributeRegularBookAcrossRows = (bookInfos, totalRows) => {
        if (!bookInfos || bookInfos.length === 0 || totalRows <= 0) {
            return Array.from({ length: totalRows }, () => []);
        }

        const allChaps = bookInfos.flatMap(b => b.chapters);
        const M = allChaps.length;
        if (M === 0) {
            return Array.from({ length: totalRows }, () => []);
        }

        // Fewer chapters than totalRows (e.g. PRO has 31 chapters for 50 days -> loops 1 chapter/day)
        if (M < totalRows) {
            return Array.from({ length: totalRows }, (_, r) => [
                r < M ? allChaps[r] : { ...allChaps[r % M], isRepeatedCycle: true }
            ]);
        }

        // M >= totalRows (e.g. PSA has 150 chapters for 50 days -> distribute weighted by ART across all rows)
        const prefixArt = new Array(M + 1).fill(0);
        for (let i = 0; i < M; i++) {
            prefixArt[i + 1] = prefixArt[i] + (allChaps[i].art || 0);
        }

        const rowsOut = [];
        let currIdx = 0;

        for (let r = 0; r < totalRows; r++) {
            const remRows = totalRows - r;
            if (r === totalRows - 1) {
                rowsOut.push(allChaps.slice(currIdx, M));
                currIdx = M;
                continue;
            }

            const remChaps = M - currIdx;
            const remArt = prefixArt[M] - prefixArt[currIdx];
            const rowTarget = remArt / remRows;
            const maxEndIdx = remChaps >= remRows ? (M - (remRows - 1) - 1) : (M - 1);

            let bestEndIdx = currIdx;
            let minDiff = Math.abs((allChaps[currIdx].art || 0) - rowTarget);

            for (let i = currIdx + 1; i <= maxEndIdx; i++) {
                const segArt = prefixArt[i + 1] - prefixArt[currIdx];
                const diff = Math.abs(segArt - rowTarget);
                if (diff <= minDiff) {
                    minDiff = diff;
                    bestEndIdx = i;
                } else if (segArt > rowTarget) {
                    break;
                }
            }

            rowsOut.push(allChaps.slice(currIdx, bestEndIdx + 1));
            currIdx = bestEndIdx + 1;
        }

        return rowsOut;
    };

    const splitChaptersByArtAndDuration = (allChaps, totalRows, targetDurationMins, assignedPerRow = []) => {
        const morningPerRow = Array.from({ length: totalRows }, () => []);
        const eveningPerRow = Array.from({ length: totalRows }, () => []);
        if (!allChaps || allChaps.length === 0 || totalRows <= 0) {
            return { morningPerRow, eveningPerRow };
        }

        const totalSlots = totalRows * 2;
        const M = allChaps.length;
        const totalArt = allChaps.reduce((sum, c) => sum + (c.art || 0), 0);

        // Prefix sums of ART for fast range ART lookup
        const prefixArt = new Array(M + 1).fill(0);
        for (let i = 0; i < M; i++) {
            prefixArt[i + 1] = prefixArt[i] + (allChaps[i].art || 0);
        }

        const hasDuration = targetDurationMins > 0;
        const halfDuration = hasDuration ? (targetDurationMins / 2) : (totalArt / totalSlots);
        const dailyBuffer = 5; // Buffer of up to +5 minutes per day, added ONLY when needed

        const coverAllInSinglePass = M >= totalSlots || !hasDuration || (totalArt >= totalRows * Math.max(2, targetDurationMins - dailyBuffer));

        let currIdx = 0;

        for (let s = 0; s < totalSlots; s++) {
            const rowIdx = Math.floor(s / 2);
            const isMorning = (s % 2 === 0);
            const remSlots = totalSlots - s;

            // Calculate how much of the 5-minute daily buffer is still available for this slot
            const prevMorningArt = !isMorning
                ? (morningPerRow[rowIdx] || []).reduce((sum, c) => sum + (c.art || 0), 0)
                : 0;
            const morningBufferUsed = !isMorning && hasDuration
                ? Math.max(0, prevMorningArt - halfDuration)
                : 0;
            const availBuffer = hasDuration ? Math.max(0, dailyBuffer - morningBufferUsed) : 0;

            if (coverAllInSinglePass) {
                if (currIdx >= M) {
                    currIdx = 0;
                }

                // Final slot takes all remaining chapters to guarantee 100% coverage of all selected books & chapters
                if (s === totalSlots - 1) {
                    const slice = allChaps.slice(currIdx, M);
                    if (isMorning) morningPerRow[rowIdx] = slice;
                    else eveningPerRow[rowIdx] = slice;
                    currIdx = M;
                    continue;
                }

                const remChaps = M - currIdx;
                const remArt = prefixArt[M] - prefixArt[currIdx];

                let slotTarget = remArt / remSlots;
                if (assignedPerRow[rowIdx] && assignedPerRow[rowIdx].length > 0) {
                    const assignedArt = assignedPerRow[rowIdx].reduce((sum, c) => sum + (c.art || 0), 0);
                    const halfRemTarget = remArt / remSlots;
                    if (isMorning && assignedArt > 0 && assignedArt < halfRemTarget * 0.5) {
                        slotTarget = Math.max(1, halfRemTarget - (assignedArt * 0.5));
                    }
                }

                // Leave at least 1 chapter for each remaining slot
                const maxEndIdx = remChaps >= remSlots ? (M - (remSlots - 1) - 1) : (M - 1);

                // Step 1: Fit chapters within the base duration (without buffer)
                const baseCap = hasDuration ? Math.max(halfDuration, slotTarget) : slotTarget;
                let bestEndIdx = currIdx;
                let minDiff = Math.abs((allChaps[currIdx].art || 0) - slotTarget);

                for (let i = currIdx + 1; i <= maxEndIdx; i++) {
                    const segArt = prefixArt[i + 1] - prefixArt[currIdx];
                    if (hasDuration && segArt > baseCap) {
                        break;
                    }
                    const diff = Math.abs(segArt - slotTarget);
                    if (diff <= minDiff) {
                        minDiff = diff;
                        bestEndIdx = i;
                    } else if (segArt > slotTarget) {
                        break;
                    }
                }

                // Step 2: Add buffer (up to +5 mins on the day) ONLY if needed:
                // (a) To finish the remaining chapters of the current book when base duration is not sufficient, OR
                // (b) When one more chapter is required to meet slotTarget and fits within base + buffer
                if (hasDuration && availBuffer > 0 && bestEndIdx < maxEndIdx) {
                    const curBookCode = allChaps[bestEndIdx].shortCode || allChaps[bestEndIdx].bookName;
                    let bookEndIdx = bestEndIdx;
                    while (
                        bookEndIdx + 1 <= maxEndIdx &&
                        (allChaps[bookEndIdx + 1].shortCode || allChaps[bookEndIdx + 1].bookName) === curBookCode
                    ) {
                        bookEndIdx++;
                    }

                    const artToBookEnd = prefixArt[bookEndIdx + 1] - prefixArt[currIdx];
                    if (
                        bookEndIdx > bestEndIdx &&
                        artToBookEnd > halfDuration &&
                        artToBookEnd <= halfDuration + availBuffer
                    ) {
                        // Base duration wasn't sufficient to complete the book's chapters, but +5m buffer completes it
                        bestEndIdx = bookEndIdx;
                    } else {
                        const nextIdx = bestEndIdx + 1;
                        const nextArt = prefixArt[nextIdx + 1] - prefixArt[currIdx];
                        const nextDiff = Math.abs(nextArt - slotTarget);
                        if (nextDiff < minDiff && nextArt <= halfDuration + Math.min(2.5, availBuffer)) {
                            bestEndIdx = nextIdx;
                        }
                    }
                }

                const slice = allChaps.slice(currIdx, bestEndIdx + 1);
                if (isMorning) morningPerRow[rowIdx] = slice;
                else eveningPerRow[rowIdx] = slice;
                currIdx = bestEndIdx + 1;
            } else {
                // Fewer chapters than slots: allocate strictly within halfDuration,
                // and add up to +5m buffer ONLY if needed to complete the remaining chapters of the book/selection
                if (currIdx >= M) {
                    currIdx = 0;
                }

                const slotChaps = [];
                let accArt = 0;

                while (slotChaps.length < M) {
                    const ch = allChaps[currIdx];
                    const chArt = ch.art || 0;

                    if (slotChaps.length === 0) {
                        slotChaps.push(ch);
                        accArt += chArt;
                        currIdx = (currIdx + 1) % M;
                        if (accArt >= halfDuration || currIdx === 0) break;
                        continue;
                    }

                    const nextArt = accArt + chArt;

                    // Standard check: fits within base halfDuration without any buffer
                    if (nextArt <= halfDuration) {
                        slotChaps.push(ch);
                        accArt = nextArt;
                        currIdx = (currIdx + 1) % M;
                        if (currIdx === 0 || accArt >= halfDuration) break;
                        continue;
                    }

                    // Buffer check: ONLY add buffer (up to +5 mins) if base duration is not sufficient
                    // to complete the remaining chapter(s) of the current book / chapter range
                    const curBookCode = ch.shortCode || ch.bookName;
                    let remBookArt = 0;
                    let remBookCount = 0;
                    let tempIdx = currIdx;
                    while (
                        tempIdx < M &&
                        (allChaps[tempIdx].shortCode || allChaps[tempIdx].bookName) === curBookCode
                    ) {
                        remBookArt += (allChaps[tempIdx].art || 0);
                        remBookCount++;
                        tempIdx++;
                    }

                    if (remBookCount > 0 && (accArt + remBookArt) <= (halfDuration + availBuffer)) {
                        for (let k = 0; k < remBookCount && slotChaps.length < M; k++) {
                            const remCh = allChaps[currIdx];
                            slotChaps.push(remCh);
                            accArt += (remCh.art || 0);
                            currIdx = (currIdx + 1) % M;
                        }
                    }
                    break;
                }

                if (isMorning) morningPerRow[rowIdx] = slotChaps;
                else eveningPerRow[rowIdx] = slotChaps;
            }
        }

        return { morningPerRow, eveningPerRow };
    };

    const handleSubmit = () => {
        setDayValidationError('');
        setBookValidationError('');

        if (selectedBooks.length === 0 && assignedBooks.length === 0) {
            setBookValidationError('Please select at least one book.');
            return;
        }

        const rawDays = parseInt(enteredDays);
        const rawPersons = parseInt(enteredPersons);
        const targetDurationMins = (durationHours * 60) + durationMinutes;

        if ((!rawDays || rawDays <= 0) && (!rawPersons || rawPersons <= 0) && targetDurationMins <= 0) {
            setDayValidationError('Please enter Number of Days, Number of Person, or Duration.');
            return;
        }

        // Resolve selected main books (sorted in canonical Bible order) and assigned books (in selection order)
        let mainBookObjs = selectedBooks
            .map(id => booksDB.find(b => b.id === id))
            .filter(Boolean)
            .sort((a, b) => getCanonicalOrderIndex(a) - getCanonicalOrderIndex(b));

        let assignedBookObjs = assignedBooks
            .map(id => booksDB.find(b => b.id === id))
            .filter(Boolean);

        // Smartly determine the two Regular Books vs Other Books across all selection workflows:
        // 1. If user picked 1-2 books in main grid and >2 books in Other Books modal, swap them
        if (mainBookObjs.length > 0 && mainBookObjs.length <= 2 && assignedBookObjs.length > 2) {
            const temp = mainBookObjs;
            mainBookObjs = assignedBookObjs.sort((a, b) => getCanonicalOrderIndex(a) - getCanonicalOrderIndex(b));
            assignedBookObjs = temp;
        } else if (mainBookObjs.length === 0 && assignedBookObjs.length > 2) {
            // 2. If user selected everything inside Frequently Assigned / Other Books modals without touching top grid
            const proIdx = assignedBookObjs.findIndex(b => isBookMatch('PRO', b));
            // Prefer canonical 150-chapter Psalms ('PSA') if present, otherwise fallback to Psalm subset
            const fullPsaIdx = assignedBookObjs.findIndex(b => isBookMatch('PSA', b));
            const subPsaIdx = assignedBookObjs.findIndex(b => (b.name || '').toUpperCase().includes('PSALM') || (b.name || '').toUpperCase().includes('DAVID') || (b.name || '').includes('119'));
            const psaIdx = fullPsaIdx !== -1 ? fullPsaIdx : subPsaIdx;
            if (proIdx !== -1 && psaIdx !== -1 && proIdx !== psaIdx) {
                const reg1 = assignedBookObjs[proIdx];
                const reg2 = assignedBookObjs[psaIdx];
                mainBookObjs = assignedBookObjs
                    .filter(b => b.id !== reg1.id && b.id !== reg2.id && !(fullPsaIdx !== -1 && ((b.name || '').includes('119') || (b.name || '').toUpperCase().includes('DAVID'))))
                    .sort((a, b) => getCanonicalOrderIndex(a) - getCanonicalOrderIndex(b));
                assignedBookObjs = [reg1, reg2];
            } else {
                const reg = assignedBookObjs.slice(0, 2);
                const regIds = new Set(reg.map(b => b.id));
                mainBookObjs = assignedBookObjs
                    .filter(b => !regIds.has(b.id))
                    .sort((a, b) => getCanonicalOrderIndex(a) - getCanonicalOrderIndex(b));
                assignedBookObjs = reg;
            }
        } else if (assignedBookObjs.length === 0 && mainBookObjs.length > 4) {
            // 3. If user selected many/all books in main grid and didn't pick separate regular books,
            // automatically extract PRO and PSA if present as the 2 regular books
            const proBook = mainBookObjs.find(b => isBookMatch('PRO', b));
            const psaBook = mainBookObjs.find(b => isBookMatch('PSA', b));
            if (proBook && psaBook) {
                assignedBookObjs = [proBook, psaBook];
            }
        }

        // If full 150-chapter Psalms is in mainBookObjs while a subset Psalm (119 / David) was picked in assignedBookObjs,
        // upgrade the regular book to full 150-chapter Psalms so all 150 chapters of Psalms are covered across the plan
        const fullPsaInMain = mainBookObjs.find(b => isBookMatch('PSA', b));
        if (fullPsaInMain && assignedBookObjs.length > 0) {
            const hasFullPsaAssigned = assignedBookObjs.some(b => isBookMatch('PSA', b));
            const subsetIdx = assignedBookObjs.findIndex(b =>
                !isBookMatch('PSA', b) &&
                ((b.name || '').toUpperCase().includes('PSALM') || (b.name || '').toUpperCase().includes('DAVID') || (b.name || '').includes('119'))
            );
            if (!hasFullPsaAssigned && subsetIdx !== -1) {
                assignedBookObjs[subsetIdx] = fullPsaInMain;
            }
        }

        // Remove chosen Regular Books from Other Books (Morning/Evening) so they are not duplicated
        if (assignedBookObjs.length > 0 && mainBookObjs.length > 0) {
            const assignedIdSet = new Set(assignedBookObjs.map(b => b.id));
            const hasFullPsa = assignedBookObjs.some(b => isBookMatch('PSA', b));
            const hasPro = assignedBookObjs.some(b => isBookMatch('PRO', b));

            const filteredMain = mainBookObjs.filter(b => {
                if (assignedIdSet.has(b.id)) return false;
                if (hasPro && isBookMatch('PRO', b)) return false;
                if (hasFullPsa && (isBookMatch('PSA', b) || (b.name || '').includes('119') || (b.name || '').toUpperCase().includes('DAVID'))) return false;
                return true;
            });
            if (filteredMain.length > 0) {
                mainBookObjs = filteredMain;
            }
        }

        // Order Regular Books so that if PRO and PSA are both selected, PRO is Regular Book 1 and PSA is Regular Book 2 (matching PDF)
        let orderedAssignedObjs = [...assignedBookObjs];
        if (orderedAssignedObjs.length >= 2) {
            const proIdx = orderedAssignedObjs.findIndex(b => isBookMatch('PRO', b));
            if (proIdx === 1) {
                orderedAssignedObjs = [orderedAssignedObjs[1], orderedAssignedObjs[0], ...orderedAssignedObjs.slice(2)];
            }
        }

        const mainInfos = mainBookObjs.map(getBookDisplayInfo);
        const assignedInfos = orderedAssignedObjs.map(getBookDisplayInfo);

        const regBook1Infos = assignedInfos.length >= 1 ? [assignedInfos[0]] : [];
        const regBook2Infos = assignedInfos.length >= 2 ? assignedInfos.slice(1) : [];

        const mainAllChaps = mainInfos.flatMap(info => info.chapters);
        const assignedAllChaps = assignedInfos.flatMap(info => info.chapters);

        const mainTotalArt = mainAllChaps.reduce((s, c) => s + (c.art || 0), 0);
        const assignedTotalArt = assignedAllChaps.reduce((s, c) => s + (c.art || 0), 0);

        // Calculate total rows (5 days per week)
        let numDays = rawDays > 0 ? rawDays : 1;
        let numPersons = rawPersons > 0 ? rawPersons : 1;

        if ((!rawDays || rawDays <= 0) && (!rawPersons || rawPersons <= 0) && targetDurationMins > 0) {
            const combinedArt = mainTotalArt + assignedTotalArt;
            const baseDays = Math.max(1, Math.floor(combinedArt / targetDurationMins));
            // Only add an extra day if the remaining reading time exceeds the +5 minute daily buffer
            numDays = combinedArt <= baseDays * (targetDurationMins + 5)
                ? baseDays
                : Math.max(1, Math.ceil(combinedArt / targetDurationMins));
            numPersons = 1;
        }

        const totalRows = rawDays > 0 && (!rawPersons || rawPersons <= 1)
            ? numDays
            : (numDays * numPersons);

        // Distribute Regular Book 1 and Regular Book 2 across totalRows
        const reg1PerRow = distributeRegularBookAcrossRows(regBook1Infos, totalRows);
        const reg2PerRow = distributeRegularBookAcrossRows(regBook2Infos, totalRows);

        const combinedAssignedPerRow = Array.from({ length: totalRows }, (_, r) => [
            ...(reg1PerRow[r] || []),
            ...(reg2PerRow[r] || [])
        ]);

        // Segregate Other Books across Morning & Evening based on selected Duration and Chapter ART (+5 min buffer only when needed)
        const { morningPerRow, eveningPerRow } = splitChaptersByArtAndDuration(
            mainAllChaps,
            totalRows,
            targetDurationMins,
            combinedAssignedPerRow
        );

        const reg1TotalChaps = regBook1Infos.reduce((s, b) => s + b.chapters.length, 0);

        const allDayItems = [];
        for (let r = 0; r < totalRows; r++) {
            const r1Chaps = reg1PerRow[r] || [];
            const r2Chaps = reg2PerRow[r] || [];
            const mChaps = morningPerRow[r] || [];
            const eChaps = eveningPerRow[r] || [];

            const m1b = formatChapterRangeList(r1Chaps, true);
            const r1Art = r1Chaps.reduce((s, c) => s + (c.art || 0), 0);
            const m1t = r1Chaps.length > 0
                ? (r1Chaps.length === 1 && reg1TotalChaps <= totalRows
                    ? (r1Chaps[0].rawArtDisplay || r1Art.toFixed(2))
                    : `${Math.max(1, Math.round(r1Art))}m`)
                : '';

            const m2b = formatChapterRangeList(r2Chaps, true);
            const r2Art = r2Chaps.reduce((s, c) => s + (c.art || 0), 0);
            const r2MinsRound = r2Chaps.length > 0 ? Math.max(1, Math.round(r2Art)) : 0;
            const m2t = r2Chaps.length > 0 ? `${r2MinsRound}m` : '';

            const m3b_morning = formatChapterRangeList(mChaps, true);
            const m3b_evening = formatChapterRangeList(eChaps, true);

            const rawMorningArt = mChaps.reduce((s, c) => s + (c.art || 0), 0);
            const morningMin = mChaps.length > 0 ? Math.max(1, Math.round(rawMorningArt + r1Art)) : 0;

            const rawEveningArt = eChaps.reduce((s, c) => s + (c.art || 0), 0);
            const eveningMin = eChaps.length > 0 ? Math.max(1, Math.round(rawEveningArt + r2Art)) : 0;

            const m3t_morning = mChaps.length > 0 ? `${morningMin}m` : '';
            const m3t_evening = eChaps.length > 0 ? `${eveningMin}m` : '';

            const dayChaps = r1Chaps.length + r2Chaps.length + mChaps.length + eChaps.length;
            const dayVerses = [...r1Chaps, ...r2Chaps, ...mChaps, ...eChaps].reduce((s, c) => s + (c.verseCount || 0), 0);

            const otherDayMins = morningMin + eveningMin;
            const dayArtMins = otherDayMins > 0 ? otherDayMins : Math.round(r1Art + r2MinsRound);
            const dayArtStr = formatChartTime(dayArtMins, 'Hm');

            const baseStartDate = selectedDate instanceof Date && !isNaN(selectedDate) ? selectedDate : new Date();
            const rowDate = new Date(baseStartDate.getFullYear(), baseStartDate.getMonth(), baseStartDate.getDate() + r);
            const dateNum = rowDate.getDate();
            const weekdayInitials = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
            const dateInit = weekdayInitials[rowDate.getDay()];
            const dateLabel = `${dateNum}-${dateInit}`;

            allDayItems.push({
                id: r + 1,
                dayIndex: r + 1,
                dateLabel,
                m1b,
                m1t,
                m1Mins: r1Art,
                m2b,
                m2t,
                m2Mins: r2MinsRound,
                m3b_morning,
                m3b_evening,
                m3t_morning,
                m3t_evening,
                m3Mins: otherDayMins,
                chap: dayChaps,
                verse: dayVerses,
                artMins: dayArtMins,
                art: dayArtStr
            });
        }

        // Group into weeks of 5 days per week (TEAM / WEEK - 1 .. N)
        const numWeeks = Math.ceil(totalRows / 5);
        const chunks = [];
        for (let w = 0; w < numWeeks; w++) {
            const weekDays = allDayItems.slice(w * 5, (w + 1) * 5);
            const m1TotalMins = Math.round(weekDays.reduce((s, d) => s + (d.m1Mins || 0), 0));
            const m2TotalMins = Math.round(weekDays.reduce((s, d) => s + (d.m2Mins || 0), 0));
            const m3TotalMins = Math.round(weekDays.reduce((s, d) => s + (d.m3Mins || 0), 0));
            const chapTotal = weekDays.reduce((s, d) => s + (d.chap || 0), 0);
            const verseTotal = weekDays.reduce((s, d) => s + (d.verse || 0), 0);
            const artTotalMins = Math.round(weekDays.reduce((s, d) => s + (d.artMins || 0), 0));

            const promiseText = w < DEFAULT_WEEK_PROMISES.length
                ? DEFAULT_WEEK_PROMISES[w]
                : DEFAULT_WEEK_PROMISES[0];
            const borderColor = PROMISE_BORDER_COLORS[w % PROMISE_BORDER_COLORS.length];

            const resolvedMdl = Number(mdl) || 5;
            const resolvedFct = availableFacets.includes(Number(fct)) ? Number(fct) : 2;
            const resolvedPhs = Number(phs) || 1;

            chunks.push({
                id: `week_${w + 1}`,
                weekNumber: w + 1,
                teamPrefix: 'TEAM / WEEK - ',
                promises: "GOD'S PROMISES :",
                promiseInput: promiseText,
                borderColor,
                colorBoxText: '',
                colorBoxTextColor: '#000000',
                phaseSideLabel: `MDL ${resolvedMdl}: FCT ${resolvedFct}: PHS - ${resolvedPhs}`,
                days: weekDays,
                m1TotalStr: m1TotalMins > 0 ? formatChartTime(m1TotalMins, 'Hm') : '',
                m2TotalStr: m2TotalMins > 0 ? formatChartTime(m2TotalMins, 'Hm') : '',
                m3TotalStr: m3TotalMins > 0 ? formatChartTime(m3TotalMins, 'Hm') : '',
                chapTotal,
                verseTotal,
                artTotalMins,
                artTotalStr: formatChartTime(artTotalMins, 'Hm')
            });
        }

        // Calculate Grand Totals matching the PDF footer
        const uniqueAllInfos = [...assignedInfos, ...mainInfos];
        const uniqueTotalChapters = uniqueAllInfos.reduce((s, info) => s + info.chapters.length, 0);
        const uniqueTotalVerses = uniqueAllInfos.reduce(
            (s, info) => s + info.chapters.reduce((cs, c) => cs + (c.verseCount || 0), 0),
            0
        );
        const grandTotalArtMins = chunks.reduce((s, ch) => s + ch.artTotalMins, 0);

        const bkArStats = extractBooksAndAuthors(
            uniqueAllInfos.map(info => info.code || info.name)
        );
        const resolvedBkArArt = bkArStats.bks === '6 6' ? '4 0 +' : bkArStats.art;

        const maxPhasesCount = availablePhases.length > 0 ? Math.max(...availablePhases) : 153;
        const resolvedPlanDays = rawDays > 0 ? rawDays : totalRows;
        const resolvedBanner = `MAIN CHART - ${resolvedPlanDays} DAYS`;
        setBannerText(resolvedBanner);

        const resolvedMdl = Number(mdl) || 5;
        const resolvedFct = availableFacets.includes(Number(fct)) ? Number(fct) : 2;
        const resolvedPhs = Number(phs) || 1;

        const newGeneratedPlan = {
            numDays: resolvedPlanDays,
            numPersons: rawPersons > 0 ? rawPersons : null,
            durationText: formattedDuration || null,
            selectedDateText: formattedSelectedDate,
            selectedTimeText: formattedSelectedTime,
            mdl: resolvedMdl,
            fct: resolvedFct,
            phs: resolvedPhs,
            maxPhases: maxPhasesCount,
            headerSubtitle: `MODULE${resolvedMdl}:FACET${resolvedFct}:PHASE-${resolvedPhs}/${maxPhasesCount}`,
            footerPhaseText: `MODULE ${resolvedMdl} - FACET ${resolvedFct}: PHASE - ${resolvedPhs}/${maxPhasesCount}`,
            bkArBks: bkArStats.bks,
            bkArArt: resolvedBkArArt,
            chunks,
            rows: allDayItems,
            grandTotalChapters: uniqueTotalChapters,
            grandTotalVerses: uniqueTotalVerses,
            grandTotalArtMins,
            grandTotalArtHrMins: formatChartTime(grandTotalArtMins, 'HrMins'),
            grandTotalArtCompact: formatChartTime(grandTotalArtMins, 'hm_compact')
        };

        setGeneratedPlan(newGeneratedPlan);
        sessionStorage.setItem('latest_reading_plan', JSON.stringify(newGeneratedPlan));
        sessionStorage.setItem('latest_reading_plan_banner', resolvedBanner);

        const baseRoute = userRole === 'student' ? '/dashboard/student' : '/admin';
        navigate(`${baseRoute}/reading-plan/view`, {
            state: {
                generatedPlan: newGeneratedPlan,
                bannerText: resolvedBanner,
                tLabel
            }
        });
    };

    const saveReadingPlanChart = async (planToSave = generatedPlan, customBanner = bannerText, silent = false) => {
        if (!planToSave) return;
        setIsSavingChart(true);
        try {
            const formData = new FormData();
            formData.append('module', String(planToSave.mdl || mdl));
            formData.append('facet', String(planToSave.fct || fct));
            formData.append('phase', String(planToSave.phs || phs));
            formData.append('banner_text', customBanner || bannerText || '');
            formData.append('t_label', tLabel || 'T');

            const now = new Date();
            const currentCreatedDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
            const rawHours = now.getHours();
            const h12 = rawHours % 12 === 0 ? 12 : rawHours % 12;
            const currentCreatedTime = `${String(h12).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${rawHours >= 12 ? 'PM' : 'AM'}`;

            const dateStr = (planToSave.selectedDateText || formattedSelectedDate).replace(/\//g, '-');
            const timeStr = planToSave.selectedTimeText || formattedSelectedTime;
            formData.append('date', currentCreatedDate);
            formData.append('time', currentCreatedTime);
            if (userId) formData.append('user_id', String(userId));
            if (userLocation) formData.append('location', userLocation);

            const payloadToSync = {
                _isWrapped: true,
                readingPlan: true,
                chartName: customBanner || bannerText || `MAIN CHART - ${planToSave.numDays} DAYS`,
                createdDate: currentCreatedDate,
                createdTime: currentCreatedTime,
                bkArBks: planToSave.bkArBks,
                bkArArt: planToSave.bkArArt,
                numDays: planToSave.numDays,
                numPersons: planToSave.numPersons,
                durationText: planToSave.durationText,
                selectedDateText: dateStr,
                selectedTimeText: timeStr,
                maxPhases: planToSave.maxPhases,
                headerSubtitle: planToSave.headerSubtitle,
                footerPhaseText: planToSave.footerPhaseText,
                grandTotalChapters: planToSave.grandTotalChapters,
                grandTotalVerses: planToSave.grandTotalVerses,
                grandTotalArtMins: planToSave.grandTotalArtMins,
                grandTotalArtHrMins: planToSave.grandTotalArtHrMins,
                grandTotalArtCompact: planToSave.grandTotalArtCompact,
                fullPlan: planToSave,
                payload: planToSave.chunks
            };
            formData.append('state_payload', JSON.stringify(payloadToSync));

            if (logo1 instanceof File) formData.append('logo1', logo1);
            if (logo2 instanceof File) formData.append('logo2', logo2);
            if (logo3 instanceof File) formData.append('logo3', logo3);

            await axios.post('http://' + window.location.hostname + ':8000/api/charts/sync', formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (!silent) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Chart Saved',
                    detail: `Saved chart (Mod ${planToSave.mdl || mdl} • Fct ${planToSave.fct || fct} • Ph ${planToSave.phs || phs}) with user, location, date (${dateStr}), and time (${timeStr}).`,
                    life: 3000
                });
            }
        } catch (err) {
            console.error('Error saving reading plan chart:', err);
            if (!silent) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Save Failed',
                    detail: 'Could not save chart to database.',
                    life: 3000
                });
            }
        } finally {
            setIsSavingChart(false);
        }
    };

    const handlePrintReadingPlan = () => {
        if (!generatedPlan) return;
        const chartEl = document.getElementById('reading-plan-printable-area');
        if (!chartEl) {
            window.print();
            return;
        }

        // Ensure current input values (e.g. T label, Banner text) are reflected in HTML attributes for outerHTML
        chartEl.querySelectorAll('input').forEach(inp => {
            if (inp.type !== 'file') {
                inp.setAttribute('value', inp.value);
            }
        });

        const printWindow = window.open('', '_blank', 'width=1250,height=850');
        if (!printWindow) {
            window.print();
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>RLLT Reading Plan - ${generatedPlan.headerSubtitle}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 3mm;
                    }
                    * {
                        box-sizing: border-box;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background: #ffffff;
                        font-family: "Arial Narrow", Arial, sans-serif;
                    }
                    .rllt-condensed {
                        font-family: "Arial Narrow", Arial, sans-serif !important;
                    }
                    .rllt-pdf-table, .rllt-pdf-table td, .rllt-pdf-table th {
                        border: var(--cell-border, 1px solid #000) !important;
                        border-collapse: collapse !important;
                        position: relative !important;
                        box-sizing: border-box !important;
                    }
                    .rllt-pdf-table {
                        table-layout: fixed !important;
                        width: 100% !important;
                    }
                    @media print {
                        #reading-plan-printable-area {
                            font-size: 7.5pt !important;
                        }
                        .print-hide-empty-camera, .color-box-popup {
                            display: none !important;
                        }
                        .promise-color-box {
                            min-height: 11px !important;
                            height: 100% !important;
                        }
                        .rllt-pdf-table tr {
                            height: 11.8px !important;
                            line-height: 1.02 !important;
                        }
                        .rllt-pdf-table td, .rllt-pdf-table th {
                            padding-top: 0px !important;
                            padding-bottom: 0px !important;
                            font-size: 6.8pt !important;
                        }
                    }
                    tbody {
                        page-break-inside: avoid;
                    }
                </style>
            </head>
            <body>
                ${chartEl.outerHTML}
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.focus();
                            window.print();
                        }, 450);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const renderBooks = (startIndex, endIndex, isAssignedMode = false) => {
        return STANDARD_BOOKS.slice(startIndex, endIndex).map((bookCode, idx) => {
            const actualIndex = startIndex + idx;
            const colors = getBookColorConfig(actualIndex);

            // Find the matching book in booksDB using the robust matcher
            const book = booksDB.find(b => isBookMatch(bookCode, b));

            const activeList = isAssignedMode ? assignedBooks : selectedBooks;
            const toggleFn = isAssignedMode ? toggleAssignedBook : toggleBook;
            const isSelected = book ? activeList.includes(book.id) : false;
            const tooltipText = getBookTooltip(book, bookCode);

            return (
                <div
                    key={`${isAssignedMode ? 'assigned' : 'main'}_${bookCode}`}
                    className={`book-tooltip-item border border-[#d3c09b] rounded-[5px] flex items-center justify-center py-2 text-center text-xs sm:text-sm font-bold font-serif tracking-widest cursor-pointer shadow-md transition-all w-[calc(25%-0.5rem)] sm:w-[calc(20%-0.5rem)] ${isSelected ? `${colors.bg} ${colors.activeText} shadow-inner` : `bg-[#fbf6ec] hover:bg-[#f0e4cd] ${colors.text}`}`}
                    onClick={() => book && toggleFn(book.id)}
                    data-pr-tooltip={tooltipText}
                    title={tooltipText}
                >
                    {bookCode}
                </div>
            );
        });
    };

    return (
        <div className="min-h-screen bg-white p-2 sm:p-8 flex flex-col items-center justify-start font-sans">
            <Toast ref={toast} />
            <Tooltip
                key={`tooltip_${booksDB.length}_${chaptersDB.length}_${showCalendarModal}_${showFreqBooks}`}
                target=".book-tooltip-item"
                position="top"
            />
            <div className="bg-[#fcf8ef] rounded-[20px] w-full max-w-[650px] pt-4 px-4 pb-2 sm:pt-8 sm:px-8 sm:pb-3 gold-3d-border relative mt-4 sm:mt-0 mb-8 sm:mb-0">
                {/* Decorative dots in corners */}
                <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-[#d3c09b]"></div>
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#d3c09b]"></div>
                <div className="absolute bottom-1.5 left-2 w-1.5 h-1.5 rounded-full bg-[#d3c09b]"></div>
                <div className="absolute bottom-1.5 right-2 w-1.5 h-1.5 rounded-full bg-[#d3c09b]"></div>

                {/* Header Section */}
                <div className="text-center mb-4">
                    <div className="flex justify-center items-center gap-1 mb-1">
                        <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                        <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                        <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    </div>
                    <p className="text-[#8c7355] italic text-sm font-bold font-serif [text-shadow:1px_1px_0_#e6d5b8,2px_2px_0_#d3c09b]">Unlocking Transformation Through</p>
                    <div className="flex items-center justify-center gap-2 my-2">
                        <div className="h-[2px] bg-[#d3c09b] w-12 shadow-[1px_1px_0_#e6d5b8]"></div>
                        <span className="text-[11px] text-[#555] font-black tracking-[0.2em] [text-shadow:1px_1px_0_#ccc,2px_2px_0_#aaa]">THE WORD</span>
                        <div className="h-[2px] bg-[#d3c09b] w-12 shadow-[1px_1px_0_#e6d5b8]"></div>
                    </div>
                    <h1 className="text-5xl text-[#0B2149]  tracking-wider mt-1 mb-2 [text-shadow:1px_1px_0_#ccc,2px_2px_0_#aaa,3px_3px_0_#888,4px_4px_0_#666]" style={{ fontFamily: "'Algerian', serif" }}>READING PLAN</h1>
                    <div className="flex items-center justify-center">
                        <span className="text-[#d3c09b] text-lg leading-none">✧</span>
                    </div>
                </div>

                <div className="px-1">
                    {/* Stats Section */}
                    <div className="flex flex-col sm:flex-row justify-between calc-border-4 rounded-lg mb-4 bg-[#fdfbf6] overflow-hidden py-1">
                        <StatItem title="BKS" icon="pi pi-book" value={displayStats.bks} color="text-[#1976d2]" />
                        <div className="w-full h-[2px] sm:w-[2px] sm:h-auto border-t border-t-[#c7a96b] border-b border-b-white sm:border-t-0 sm:border-b-0 sm:border-l sm:border-l-[#c7a96b] sm:border-r sm:border-r-white my-0 sm:my-1"></div>
                        <StatItem title="CHP" icon="pi pi-file" value={displayStats.chp} color="text-[#388e3c]" />
                        <div className="w-full h-[2px] sm:w-[2px] sm:h-auto border-t border-t-[#c7a96b] border-b border-b-white sm:border-t-0 sm:border-b-0 sm:border-l sm:border-l-[#c7a96b] sm:border-r sm:border-r-white my-0 sm:my-1"></div>
                        <StatItem title="VRS" icon="pi pi-crown" value={displayStats.vrs} color="text-[#f57c00]" />
                        <div className="w-full h-[2px] sm:w-[2px] sm:h-auto border-t border-t-[#c7a96b] border-b border-b-white sm:border-t-0 sm:border-b-0 sm:border-l sm:border-l-[#c7a96b] sm:border-r sm:border-r-white my-0 sm:my-1"></div>
                        <StatItem title="ART" icon="pi pi-clock" value={displayStats.art} color="text-[#7b1fa2]" />
                    </div>

                    <style>{`
                        .scrollbar-hide::-webkit-scrollbar { display: none; }
                        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                        .calc-border-4 {
                            border: 2px solid #e8dcb9;
                            box-shadow: 
                                inset 1px 1px 0px 1px #ffffff,
                                inset -1px -1px 0px 1px #c7a96b,
                                0 0 0 1px #69512a,
                                1px 1px 0px 1px #4a381c;
                        }
                        .gold-3d-border {
                            border: 3px solid #ffeba1;
                            box-shadow: 
                                inset 0 0 10px rgba(0,0,0,0.1),
                                0 0 0 2px #c0952b,
                                0 0 0 5px #fcedb0,
                                0 0 0 8px #9c7316,
                                0 0 0 11px #e2c158,
                                0 0 0 12px #594006,
                                12px 12px 30px rgba(0,0,0,0.4);
                        }
                    `}</style>

                    {/* Books Grid */}
                    {(() => {
                        const otBookIds = STANDARD_BOOKS.slice(0, 39)
                            .map(code => booksDB.find(b => isBookMatch(code, b)))
                            .filter(Boolean)
                            .map(b => b.id);
                        const ntBookIds = STANDARD_BOOKS.slice(39, 66)
                            .map(code => booksDB.find(b => isBookMatch(code, b)))
                            .filter(Boolean)
                            .map(b => b.id);
                        const allBookIds = [...otBookIds, ...ntBookIds];

                        const isAllOtSelected = otBookIds.length > 0 && otBookIds.every(id => selectedBooks.includes(id));
                        const isAllNtSelected = ntBookIds.length > 0 && ntBookIds.every(id => selectedBooks.includes(id));
                        const isAllBooksSelected = allBookIds.length > 0 && allBookIds.every(id => selectedBooks.includes(id));

                        const toggleAllBooks = () => {
                            if (isAllBooksSelected) {
                                setSelectedBooks(selectedBooks.filter(id => !allBookIds.includes(id)));
                            } else {
                                setSelectedBooks([...new Set([...selectedBooks, ...allBookIds])]);
                            }
                            setChartStats(null);
                            setBookValidationError('');
                        };

                        const toggleOtBooks = () => {
                            if (isAllOtSelected) {
                                setSelectedBooks(selectedBooks.filter(id => !otBookIds.includes(id)));
                            } else {
                                setSelectedBooks([...new Set([...selectedBooks, ...otBookIds])]);
                            }
                            setChartStats(null);
                            setBookValidationError('');
                        };

                        const toggleNtBooks = () => {
                            if (isAllNtSelected) {
                                setSelectedBooks(selectedBooks.filter(id => !ntBookIds.includes(id)));
                            } else {
                                setSelectedBooks([...new Set([...selectedBooks, ...ntBookIds])]);
                            }
                            setChartStats(null);
                            setBookValidationError('');
                        };

                        return (
                            <div className="calc-border-4 rounded-lg overflow-hidden flex flex-col mb-4">
                                {/* All the Books Top Checkbox Bar */}
                                <div
                                    onClick={toggleAllBooks}
                                    className="bg-[#f7eedc] hover:bg-[#efe0c4] cursor-pointer px-3 py-1.5 flex items-center justify-between border-b-2 border-[#c7a96b] transition-colors select-none"
                                >
                                    <label
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-black text-[#0B2149] tracking-wider uppercase"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isAllBooksSelected}
                                            onChange={toggleAllBooks}
                                            className="w-4 h-4 accent-[#0B2149] rounded cursor-pointer"
                                        />
                                        <span>All the Books</span>
                                    </label>
                                    <span className="text-[11px] font-bold text-[#69512a]">
                                        {selectedBooks.filter(id => allBookIds.includes(id)).length} / {allBookIds.length || 66} Selected
                                    </span>
                                </div>

                                <div className="overflow-y-auto max-h-[225px] scrollbar-hide bg-[#fcf8ef]">
                                    {/* Old Testament Section */}
                                    <div>
                                        <div
                                            onClick={toggleOtBooks}
                                            title="Click to select/deselect all Old Testament books"
                                            className="sticky top-0 bg-[#0B2149] hover:bg-[#132f63] cursor-pointer text-white py-1.5 flex items-center justify-center relative border-b-[3px] border-[#c7a96b] z-10 transition-colors select-none"
                                        >
                                            <div className="absolute left-3 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isAllOtSelected}
                                                    onChange={toggleOtBooks}
                                                    title="Select all Old Testament books"
                                                    className="w-3.5 h-3.5 accent-[#d3c09b] rounded cursor-pointer"
                                                />
                                            </div>
                                            <div className="h-px bg-[#d3c09b] w-8 mx-2"></div>
                                            <div className="text-sm tracking-widest text-[#fdfbf6] [text-shadow:1px_1px_0_#000,2px_2px_0_#000,3px_3px_0_#000,4px_4px_3px_rgba(0,0,0,0.5)]" style={{ fontFamily: "'Algerian', serif" }}>OLD TESTAMENT</div>
                                            <div className="h-px bg-[#d3c09b] w-8 mx-2"></div>
                                            <div className="absolute right-3 text-[#d3c09b] text-[10px]">❖</div>
                                        </div>
                                        <div className="p-3 flex flex-wrap justify-center gap-2">
                                            {renderBooks(0, 39, false)}
                                        </div>
                                    </div>

                                    {/* New Testament Section */}
                                    <div>
                                        <div
                                            onClick={toggleNtBooks}
                                            title="Click to select/deselect all New Testament books"
                                            className="sticky top-0 bg-[#0B2149] hover:bg-[#132f63] cursor-pointer text-white py-1.5 flex items-center justify-center relative border-y-[3px] border-[#c7a96b] z-10 transition-colors select-none"
                                        >
                                            <div className="absolute left-3 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isAllNtSelected}
                                                    onChange={toggleNtBooks}
                                                    title="Select all New Testament books"
                                                    className="w-3.5 h-3.5 accent-[#d3c09b] rounded cursor-pointer"
                                                />
                                            </div>
                                            <div className="h-px bg-[#d3c09b] w-6 mx-2"></div>
                                            <div className="text-xs tracking-widest text-[#fdfbf6] [text-shadow:1px_1px_0_#000,2px_2px_0_#000,3px_3px_0_#000,4px_4px_3px_rgba(0,0,0,0.5)]" style={{ fontFamily: "'Algerian', serif" }}>NEW TESTAMENT</div>
                                            <div className="h-px bg-[#d3c09b] w-6 mx-2"></div>
                                            <div className="absolute right-3 text-[#d3c09b] text-[10px]">❖</div>
                                        </div>
                                        <div className="p-3 flex flex-wrap justify-center gap-2">
                                            {renderBooks(39, 66, false)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Middle Input Section */}
                    <div className="calc-border-4 rounded-lg p-2 bg-[#fdfbf6] mb-4">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 min-h-[4.5rem]">
                            {(() => {
                                const p119Book = booksDB.find(b => b.name.includes('119') || (b.short_form && b.short_form.includes('119')));
                                const p75Book = booksDB.find(b => b.name.toUpperCase().includes('DAVID') || b.name.includes('75'));
                                const psaBook = booksDB.find(b => isBookMatch('PSA', b));
                                const proBook = booksDB.find(b => isBookMatch('PRO', b));
                                const freqBookIds = [p119Book?.id, p75Book?.id, psaBook?.id, proBook?.id].filter(Boolean);

                                const freqSelectedCount = assignedBooks.filter(id => freqBookIds.includes(id)).length;

                                return (
                                    <>
                                        <div
                                            className={`flex-1 rounded-[4px] flex sm:flex-col items-center justify-center gap-1 sm:gap-0.5 text-center py-2 sm:py-1 px-1.5 text-[11px] sm:text-xs font-black uppercase cursor-pointer transition-all leading-tight ${
                                                freqSelectedCount > 0
                                                    ? 'bg-[#007020] text-white border-transparent shadow-[inset_3px_3px_5px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.2)]'
                                                    : 'bg-[#f0f7f0] text-[#2e4d2e] border border-[#557855] hover:bg-[#e2efe2] shadow-[inset_2px_2px_0px_#ffffff,inset_-2px_-2px_0px_#b5ccb5]'
                                            }`}
                                            onClick={() => setShowFreqBooks(true)}
                                        >
                                            <span>Frequently</span>
                                            <span>Assigned Books</span>
                                            {freqSelectedCount > 0 && (
                                                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-extrabold">
                                                    {freqSelectedCount} Selected
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-[1.8] border border-[#a48654] bg-[#fdfbf6] rounded-[4px] flex justify-evenly items-center px-1.5 py-2 sm:py-1.5 shadow-[inset_2px_2px_0_#ffffff,inset_-2px_-2px_0_#e8dcb9]">
                                            <button onClick={() => setCycle(3)} className="font-bold text-[10px] sm:text-xs transition-colors flex flex-col items-center justify-center text-center leading-tight px-1 flex-1">
                                                <span className={cycle === 3 ? 'text-[#0B2149] font-black [text-shadow:1px_1px_0_#ddd]' : 'text-[#888] font-bold hover:text-gray-600'}>Number of Days</span>
                                                {enteredDays && (
                                                    <span className="text-[#c00000] text-sm sm:text-base font-black mt-1 [text-shadow:1px_1px_0_#ffcccc]">{enteredDays}</span>
                                                )}
                                            </button>
                                            <div className="h-8 sm:h-10 w-[2px] shrink-0 border-l border-l-[#c7a96b] border-r border-r-white"></div>
                                            <button onClick={() => setCycle(5)} className="font-bold text-[10px] sm:text-xs transition-colors flex flex-col items-center justify-center text-center leading-tight px-1 flex-1">
                                                <span className={cycle === 5 ? 'text-[#0B2149] font-black [text-shadow:1px_1px_0_#ddd]' : 'text-[#888] font-bold hover:text-gray-600'}>Number of Person</span>
                                                {enteredPersons && (
                                                    <span className="text-[#c00000] text-sm sm:text-base font-black mt-1 [text-shadow:1px_1px_0_#ffcccc]">{enteredPersons}</span>
                                                )}
                                            </button>
                                            <div className="h-8 sm:h-10 w-[2px] shrink-0 border-l border-l-[#c7a96b] border-r border-r-white"></div>
                                            <button onClick={() => setCycle(7)} className="font-bold text-[10px] sm:text-xs transition-colors flex flex-col items-center justify-center text-center leading-tight px-1 flex-1">
                                                <span className={cycle === 7 ? 'text-[#0B2149] font-black [text-shadow:1px_1px_0_#ddd]' : 'text-[#888] font-bold hover:text-gray-600'}>Duration</span>
                                                {formattedDuration && (
                                                    <span className="text-[#c00000] text-xs sm:text-sm font-black mt-1 whitespace-nowrap [text-shadow:1px_1px_0_#ffcccc]">{formattedDuration}</span>
                                                )}
                                            </button>
                                        </div>
                                        <div
                                            className="flex-1 rounded-[4px] flex sm:flex-col items-center justify-center gap-1.5 sm:gap-0.5 text-center py-2 sm:py-1 px-1.5 text-[11px] sm:text-xs font-black uppercase cursor-pointer transition-all leading-tight bg-[#f0f7f0] text-[#2e4d2e] border border-[#557855] hover:bg-[#e2efe2] shadow-[inset_2px_2px_0px_#ffffff,inset_-2px_-2px_0px_#b5ccb5]"
                                            onClick={() => {
                                                setCalendarViewDate(selectedDate instanceof Date && !isNaN(selectedDate) ? new Date(selectedDate) : new Date());
                                                setShowCalendarModal(true);
                                            }}
                                            title="Click to select date and time"
                                        >
                                            <span className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] text-[#0B2149]">
                                                <i className="pi pi-calendar text-[10px] text-[#007020]"></i>
                                                <span>Date & Time</span>
                                            </span>
                                            <span className="text-[11px] sm:text-xs font-black text-[#c00000] tracking-wide whitespace-nowrap [text-shadow:1px_1px_0_#ffffff]">
                                                {formattedSelectedDate}
                                            </span>
                                            <span className="text-[10px] sm:text-[11px] font-extrabold text-[#0B2149] tracking-wide whitespace-nowrap [text-shadow:1px_1px_0_#ffffff]">
                                                {formattedSelectedTime}
                                            </span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Numbers / Duration Card */}
                    <div className="calc-border-4 rounded-lg p-3 bg-[#fdfbf6] shadow-sm mb-4 relative">
                        {dayValidationError && (
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-red-600 border border-red-500 font-bold px-2 py-1 rounded shadow-lg text-[10px] z-50 whitespace-nowrap animate-bounce flex items-center gap-1">
                                <span>{dayValidationError}</span>
                                <i className="pi pi-times ml-1 cursor-pointer" onClick={() => { setDayValidationError(''); setEnteredDays(''); setEnteredPersons(''); }}></i>
                            </div>
                        )}
                        {bookValidationError && (
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-red-600 border border-red-500 font-bold px-2 py-1 rounded shadow-lg text-[10px] z-50 whitespace-nowrap animate-bounce flex items-center gap-1">
                                <span>{bookValidationError}</span>
                                <i className="pi pi-times ml-1 cursor-pointer" onClick={() => setBookValidationError('')}></i>
                            </div>
                        )}

                        {/* Reset Options & Generate Chart Buttons */}
                        <div className="flex flex-col gap-2 mb-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEnteredDays('');
                                        setDayValidationError('');
                                    }}
                                    className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-[4px] border border-[#9c2929] text-[#9c2929] bg-white hover:bg-[#fff0f0] text-[10px] sm:text-[11px] font-black uppercase transition-all shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#e5b3b3] active:shadow-inner"
                                >
                                    <i className="pi pi-refresh text-[9px] font-bold"></i>
                                    <span>Reset Day</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEnteredPersons('');
                                        setDayValidationError('');
                                    }}
                                    className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-[4px] border border-[#9c2929] text-[#9c2929] bg-white hover:bg-[#fff0f0] text-[10px] sm:text-[11px] font-black uppercase transition-all shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#e5b3b3] active:shadow-inner"
                                >
                                    <i className="pi pi-refresh text-[9px] font-bold"></i>
                                    <span>Reset Person</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDurationHours(0);
                                        setDurationMinutes(0);
                                        setDayValidationError('');
                                    }}
                                    className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-[4px] border border-[#9c2929] text-[#9c2929] bg-white hover:bg-[#fff0f0] text-[10px] sm:text-[11px] font-black uppercase transition-all shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#e5b3b3] active:shadow-inner"
                                >
                                    <i className="pi pi-refresh text-[9px] font-bold"></i>
                                    <span>Reset Duration</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedBooks([]);
                                        setAssignedBooks([]);
                                        setChartStats(null);
                                        setGeneratedPlan(null);
                                        setBookValidationError('');
                                    }}
                                    className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-[4px] border border-[#9c2929] text-[#9c2929] bg-white hover:bg-[#fff0f0] text-[10px] sm:text-[11px] font-black uppercase transition-all shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#e5b3b3] active:shadow-inner"
                                >
                                    <i className="pi pi-refresh text-[9px] font-bold"></i>
                                    <span>Reset Books</span>
                                </button>
                            </div>
                        </div>

                        {cycle === 7 ? (
                            <div className="flex flex-col gap-2.5 bg-[#f7eedc] rounded px-3 py-3 calc-border-4">
                                <div className="flex items-center justify-center gap-4 sm:gap-6">
                                    {/* Hours Selector */}
                                    <div className="flex items-center gap-1.5 bg-[#fdfbf6] border border-[#a48654] rounded-md px-2.5 py-1.5 shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#e8dcb9]">
                                        <button
                                            type="button"
                                            onClick={() => setDurationHours(h => Math.max(0, h - 1))}
                                            className="w-6 h-6 rounded bg-[#f0e4cd] hover:bg-[#e5d2af] text-[#0B2149] font-black text-sm flex items-center justify-center transition-colors"
                                        >
                                            -
                                        </button>
                                        <div className="flex items-baseline gap-1 min-w-[3.5rem] justify-center">
                                            <span className="text-lg sm:text-xl font-black text-[#0B2149]">{durationHours}</span>
                                            <span className="text-[10px] sm:text-xs font-bold text-[#69512a] uppercase">Hr</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setDurationHours(h => Math.min(24, h + 1))}
                                            className="w-6 h-6 rounded bg-[#f0e4cd] hover:bg-[#e5d2af] text-[#0B2149] font-black text-sm flex items-center justify-center transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <span className="text-[#0B2149] font-black text-lg">:</span>

                                    {/* Minutes Selector */}
                                    <div className="flex items-center gap-1.5 bg-[#fdfbf6] border border-[#a48654] rounded-md px-2.5 py-1.5 shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#e8dcb9]">
                                        <button
                                            type="button"
                                            onClick={() => setDurationMinutes(m => (m - 5 < 0 ? 55 : m - 5))}
                                            className="w-6 h-6 rounded bg-[#f0e4cd] hover:bg-[#e5d2af] text-[#0B2149] font-black text-sm flex items-center justify-center transition-colors"
                                        >
                                            -
                                        </button>
                                        <div className="flex items-baseline gap-1 min-w-[4rem] justify-center">
                                            <span className="text-lg sm:text-xl font-black text-[#0B2149]">{String(durationMinutes).padStart(2, '0')}</span>
                                            <span className="text-[10px] sm:text-xs font-bold text-[#69512a] uppercase">Min</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setDurationMinutes(m => (m + 5 >= 60 ? 0 : m + 5))}
                                            className="w-6 h-6 rounded bg-[#f0e4cd] hover:bg-[#e5d2af] text-[#0B2149] font-black text-sm flex items-center justify-center transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Quick Duration Presets */}
                                <div className="flex flex-wrap justify-center gap-1.5 pt-1 border-t border-[#e2d2b5]">
                                    {[
                                        { label: '15 Min', h: 0, m: 15 },
                                        { label: '30 Min', h: 0, m: 30 },
                                        { label: '45 Min', h: 0, m: 45 },
                                        { label: '1 Hr', h: 1, m: 0 },
                                        { label: '1 Hr 30 Min', h: 1, m: 30 },
                                        { label: '2 Hr', h: 2, m: 0 }
                                    ].map(preset => {
                                        const isPresetActive = durationHours === preset.h && durationMinutes === preset.m;
                                        return (
                                            <button
                                                key={preset.label}
                                                type="button"
                                                onClick={() => {
                                                    setDurationHours(preset.h);
                                                    setDurationMinutes(preset.m);
                                                }}
                                                className={`px-2.5 py-1 rounded text-[11px] font-black transition-all border ${
                                                    isPresetActive
                                                        ? 'bg-[#0B2149] text-white border-[#0B2149] shadow-inner'
                                                        : 'bg-[#fdfbf6] text-[#0B2149] border-[#c7a96b] hover:bg-[#ebd8b7]'
                                                }`}
                                            >
                                                {preset.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap justify-center sm:justify-between items-center gap-2 sm:gap-0 bg-[#f7eedc] rounded px-2 py-3 sm:px-3 sm:py-3 calc-border-4">
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => handleNumberClick(num)}
                                        className="text-[#0B2149] font-bold text-xl sm:text-2xl w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-[#ebd8b7] rounded transition-colors"
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Lower Controls Section */}
                    <div className="calc-border-4 rounded-lg p-3 bg-[#fdfbf6] mb-4">
                        {/* MDL Section */}
                        <div className="flex items-center justify-between mb-3 gap-2">
                            <div className="flex-1 h-6 bg-white border border-[#a48654] rounded-[4px] shadow-[inset_2px_2px_0_#e8dcb9,inset_-2px_-2px_0_#ffffff]"></div>

                            <div className="border border-[#b38728] bg-[#f7eedc] px-6 py-1 rounded-[4px] flex flex-col items-center justify-center min-w-[70px] shadow-[inset_2px_2px_0_#ffffff,inset_-2px_-2px_0_#d4af37]">
                                <div className="text-[11px] font-black text-[#69512a] [text-shadow:1px_1px_0_#fff]">MDL.</div>
                                <div className="text-xl font-black text-[#8c7355] leading-none mt-0.5 [text-shadow:1px_1px_0_#fff]">{mdl}</div>
                            </div>

                            <div className="flex-1 h-6 bg-white border border-[#a48654] rounded-[4px] shadow-[inset_2px_2px_0_#e8dcb9,inset_-2px_-2px_0_#ffffff]"></div>
                        </div>

                        {/* PHS Stats Section */}
                        <div className="border border-[#557855] bg-[#f0f7f0] rounded-[4px] flex justify-between p-3 mb-3 text-center text-[#2e4d2e] shadow-[inset_2px_2px_0_#ffffff,inset_-2px_-2px_0_#b5ccb5]">
                            <div className="flex flex-col items-center flex-1">
                                <div className="text-xs font-black mb-1 [text-shadow:1px_1px_0_#fff]">FACES</div>
                                <div className="flex items-center gap-1 text-base font-black">
                                    <button onClick={handleFctDec} disabled={availableFacets.indexOf(fct) <= 0} className={availableFacets.indexOf(fct) > 0 ? 'hover:text-[#1c3a1c] [text-shadow:1px_1px_0_#fff]' : 'opacity-30'}><i className="pi pi-angle-left text-sm drop-shadow-[1px_1px_0_#fff]"></i></button>
                                    <span className="w-4 [text-shadow:1px_1px_0_#fff]">{fct || '-'}</span>
                                    <button onClick={handleFctInc} disabled={availableFacets.indexOf(fct) >= availableFacets.length - 1} className={availableFacets.indexOf(fct) < availableFacets.length - 1 ? 'hover:text-[#1c3a1c] [text-shadow:1px_1px_0_#fff]' : 'opacity-30'}><i className="pi pi-angle-right text-sm drop-shadow-[1px_1px_0_#fff]"></i></button>
                                </div>
                            </div>
                            <div className="w-[2px] border-l border-l-[#7a9e7a] border-r border-r-white my-1"></div>
                            <div className="flex flex-col items-center flex-1">
                                <div className="text-xs font-black mb-1 [text-shadow:1px_1px_0_#fff]">PHS.</div>
                                <div className="flex items-center gap-1 text-base font-black">
                                    <button onClick={handlePhsDec} disabled={availablePhases.indexOf(phs) <= 0} className={availablePhases.indexOf(phs) > 0 ? 'hover:text-[#1c3a1c] [text-shadow:1px_1px_0_#fff]' : 'opacity-30'}><i className="pi pi-angle-left text-sm drop-shadow-[1px_1px_0_#fff]"></i></button>
                                    <span className="w-4 [text-shadow:1px_1px_0_#fff]">{phs || '-'}</span>
                                    <button onClick={handlePhsInc} disabled={availablePhases.indexOf(phs) >= availablePhases.length - 1} className={availablePhases.indexOf(phs) < availablePhases.length - 1 ? 'hover:text-[#1c3a1c] [text-shadow:1px_1px_0_#fff]' : 'opacity-30'}><i className="pi pi-angle-right text-sm drop-shadow-[1px_1px_0_#fff]"></i></button>
                                </div>
                            </div>
                            <div className="w-[2px] border-l border-l-[#7a9e7a] border-r border-r-white my-1"></div>
                            <div className="flex flex-col items-center flex-[1.5]">
                                <div className="text-[10px] sm:text-xs font-black mb-1 leading-tight [text-shadow:1px_1px_0_#fff]">NUMBER OF DAYS FOR PHASE</div>
                                <div className="text-base font-black flex items-center h-5 [text-shadow:1px_1px_0_#fff]">{numberOfDaysForPhase ? `${numberOfDaysForPhase} DAYS` : '0 DAYS'}</div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => handleViewClick(true)}
                                className="flex items-center justify-center gap-1.5 border border-[#304156] text-[#304156] rounded-[4px] py-1.5 text-xs font-black bg-white hover:bg-[#f0f4f8] transition-all shadow-[inset_2px_2px_0_#ffffff,inset_-2px_-2px_0_#cbd5e1] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-1px_-1px_2px_rgba(255,255,255,0.2)] [text-shadow:1px_1px_0_#fff]"
                            >
                                <i className="pi pi-print text-sm drop-shadow-[1px_1px_0_rgba(200,200,200,1)]"></i> PRINT
                            </button>
                            <button
                                onClick={() => handleViewClick(false)}
                                disabled={isViewing}
                                className={`flex items-center justify-center gap-1.5 border border-[#1f3b1f] text-[#1f3b1f] rounded-[4px] py-1.5 text-xs font-black bg-white hover:bg-[#eaf4ea] transition-all shadow-[inset_2px_2px_0_#ffffff,inset_-2px_-2px_0_#b5ccb5] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-1px_-1px_2px_rgba(255,255,255,0.2)] [text-shadow:1px_1px_0_#fff] ${isViewing ? 'opacity-50' : ''}`}
                            >
                                <i className={`pi ${isViewing ? 'pi-spin pi-spinner' : 'pi-eye'} text-sm drop-shadow-[1px_1px_0_rgba(200,200,200,1)]`}></i> VIEW
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="flex items-center justify-center gap-1.5 border border-[#4a2459] text-[#4a2459] rounded-[4px] py-1.5 text-xs font-black bg-white hover:bg-[#f3eaf5] transition-all shadow-[inset_2px_2px_0_#ffffff,inset_-2px_-2px_0_#d8b8e0] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-1px_-1px_2px_rgba(255,255,255,0.2)] [text-shadow:1px_1px_0_#fff]"
                            >
                                <i className="pi pi-table text-sm drop-shadow-[1px_1px_0_rgba(200,200,200,1)]"></i> GENERATE CHART
                            </button>
                        </div>
                    </div>

                    {/* Footer Image Area */}
                    <div className="w-full flex justify-center pointer-events-none -mt-[15%] -mb-[25%]">
                        <img src="/footer-image.png" alt="Footer Illustration" className="w-[calc(100%+56px)] sm:w-[calc(100%+88px)] max-w-none h-auto block" />
                    </div>

                </div>
            </div>

            {/* Frequently Assigned Books Pop-up Modal */}
            {showFreqBooks && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-3 sm:p-6"
                    onClick={() => setShowFreqBooks(false)}
                >
                    <div
                        className="bg-[#fcf8ef] rounded-[16px] w-full max-w-[560px] gold-3d-border overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="bg-[#0B2149] text-white px-4 py-3 flex items-center justify-between border-b-[3px] border-[#c7a96b]">
                            <div className="flex items-center gap-2">
                                <span className="text-[#d3c09b] text-xs">❖</span>
                                <span className="text-sm sm:text-base tracking-widest text-[#fdfbf6]" style={{ fontFamily: "'Algerian', serif" }}>
                                    FREQUENTLY ASSIGNED BOOKS
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowFreqBooks(false)}
                                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
                            >
                                <i className="pi pi-times text-xs"></i>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#fcf8ef]">
                            {(() => {
                                const p119Book = booksDB.find(b => b.name.includes('119') || (b.short_form && b.short_form.includes('119')));
                                const p75Book = booksDB.find(b => b.name.toUpperCase().includes('DAVID') || b.name.includes('75'));
                                const psaBook = booksDB.find(b => isBookMatch('PSA', b));
                                const proBook = booksDB.find(b => isBookMatch('PRO', b));

                                const freqItems = [
                                    { label: 'PRO', book: proBook, code: 'PRO', fallbackTooltip: 'Proverbs - 31 Chapters' },
                                    { label: 'PSA', book: psaBook, code: 'PSA', fallbackTooltip: 'Psalms - 150 Chapters' },
                                    { label: 'PSALM 119', book: p119Book, code: '', fallbackTooltip: 'Psalms 119 - 1 Chapter' },
                                    { label: 'PSALM OF DAVID', book: p75Book, code: '', fallbackTooltip: 'Psalms of David - 75 Chapters' }
                                ];

                                return freqItems.map(item => {
                                    const isSelected = item.book ? assignedBooks.includes(item.book.id) : false;
                                    const tipText = item.book ? getBookTooltip(item.book, item.code) : item.fallbackTooltip;
                                    return (
                                        <div
                                            key={item.label}
                                            onClick={() => item.book && toggleAssignedBook(item.book.id)}
                                            data-pr-tooltip={tipText}
                                            title={tipText}
                                            className={`book-tooltip-item border rounded-[5px] flex items-center justify-center py-3 px-2 text-center text-xs sm:text-sm font-bold font-serif tracking-wider cursor-pointer shadow-md transition-all ${
                                                isSelected
                                                    ? 'bg-[#007020] text-white border-[#005015] shadow-inner'
                                                    : 'bg-[#fbf6ec] hover:bg-[#f0e4cd] text-[#007020] border-[#d3c09b]'
                                            }`}
                                        >
                                            {item.label}
                                        </div>
                                    );
                                });
                            })()}
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-[#f7eedc] border-t-2 border-[#c7a96b] px-4 py-2.5 flex items-center justify-between">
                            <span className="text-xs font-black text-[#0B2149]">
                                Assigned Books: <span className="text-[#c00000]">{assignedBooks.length}</span>
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAssignedBooks([])}
                                    className="px-3 py-1.5 rounded border border-[#9c2929] text-[#9c2929] bg-white hover:bg-[#fff0f0] text-xs font-black transition-colors"
                                >
                                    Clear
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowFreqBooks(false)}
                                    className="px-4 py-1.5 rounded bg-[#0B2149] hover:bg-[#16346b] text-white text-xs font-black transition-colors shadow"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Calendar Date & Time Picker Pop-up Modal */}
            {showCalendarModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-3 sm:p-6"
                    onClick={() => setShowCalendarModal(false)}
                >
                    <div
                        className="bg-[#fcf8ef] rounded-[16px] w-full max-w-[390px] gold-3d-border overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="bg-[#0B2149] text-white px-4 py-3 flex items-center justify-between border-b-[3px] border-[#c7a96b]">
                            <div className="flex items-center gap-2">
                                <span className="text-[#d3c09b] text-xs">❖</span>
                                <span className="text-sm sm:text-base tracking-widest text-[#fdfbf6]" style={{ fontFamily: "'Algerian', serif" }}>
                                    SELECT DATE & TIME
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCalendarModal(false)}
                                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
                            >
                                <i className="pi pi-times text-xs"></i>
                            </button>
                        </div>

                        {/* Calendar & Time Body */}
                        {(() => {
                            const viewDate = calendarViewDate instanceof Date && !isNaN(calendarViewDate) ? calendarViewDate : new Date();
                            const viewYear = viewDate.getFullYear();
                            const viewMonth = viewDate.getMonth();

                            const monthNames = [
                                'January', 'February', 'March', 'April', 'May', 'June',
                                'July', 'August', 'September', 'October', 'November', 'December'
                            ];
                            const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                            const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
                            const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
                            const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

                            const today = new Date();
                            const activeDate = selectedDate instanceof Date && !isNaN(selectedDate) ? selectedDate : today;

                            const isSameDay = (d1, d2) =>
                                d1.getFullYear() === d2.getFullYear() &&
                                d1.getMonth() === d2.getMonth() &&
                                d1.getDate() === d2.getDate();

                            const cells = [];
                            for (let i = firstDayOfWeek - 1; i >= 0; i--) {
                                const dayNum = daysInPrevMonth - i;
                                cells.push({
                                    date: new Date(viewYear, viewMonth - 1, dayNum),
                                    dayNum,
                                    isCurrentMonth: false
                                });
                            }
                            for (let d = 1; d <= daysInMonth; d++) {
                                cells.push({
                                    date: new Date(viewYear, viewMonth, d),
                                    dayNum: d,
                                    isCurrentMonth: true
                                });
                            }
                            const remaining = (7 - (cells.length % 7)) % 7;
                            for (let d = 1; d <= remaining; d++) {
                                cells.push({
                                    date: new Date(viewYear, viewMonth + 1, d),
                                    dayNum: d,
                                    isCurrentMonth: false
                                });
                            }

                            const yearOptions = Array.from({ length: 21 }, (_, idx) => today.getFullYear() - 10 + idx);

                            return (
                                <div className="p-3 sm:p-4 bg-[#fcf8ef] flex flex-col gap-3">
                                    {/* Month & Year Navigation */}
                                    <div className="flex items-center justify-between gap-2 bg-[#f7eedc] border border-[#c7a96b] rounded-md px-2 py-1.5 shadow-[inset_1px_1px_0_#ffffff]">
                                        <button
                                            type="button"
                                            onClick={() => setCalendarViewDate(new Date(viewYear, viewMonth - 1, 1))}
                                            className="w-7 h-7 rounded bg-[#fdfbf6] hover:bg-[#ebd8b7] border border-[#c7a96b] text-[#0B2149] flex items-center justify-center font-black transition-colors"
                                            title="Previous Month"
                                        >
                                            <i className="pi pi-angle-left text-sm"></i>
                                        </button>

                                        <div className="flex items-center gap-1.5">
                                            <select
                                                value={viewMonth}
                                                onChange={(e) => setCalendarViewDate(new Date(viewYear, Number(e.target.value), 1))}
                                                className="bg-[#fdfbf6] border border-[#a48654] rounded px-2 py-1 text-xs font-black text-[#0B2149] cursor-pointer focus:outline-none"
                                            >
                                                {monthNames.map((mName, mIdx) => (
                                                    <option key={mName} value={mIdx}>{mName}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={viewYear}
                                                onChange={(e) => setCalendarViewDate(new Date(Number(e.target.value), viewMonth, 1))}
                                                className="bg-[#fdfbf6] border border-[#a48654] rounded px-2 py-1 text-xs font-black text-[#0B2149] cursor-pointer focus:outline-none"
                                            >
                                                {yearOptions.map(yr => (
                                                    <option key={yr} value={yr}>{yr}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setCalendarViewDate(new Date(viewYear, viewMonth + 1, 1))}
                                            className="w-7 h-7 rounded bg-[#fdfbf6] hover:bg-[#ebd8b7] border border-[#c7a96b] text-[#0B2149] flex items-center justify-center font-black transition-colors"
                                            title="Next Month"
                                        >
                                            <i className="pi pi-angle-right text-sm"></i>
                                        </button>
                                    </div>

                                    {/* Weekday Headers */}
                                    <div className="grid grid-cols-7 gap-1 text-center">
                                        {weekDays.map((wd, idx) => (
                                            <div
                                                key={wd}
                                                className={`text-[11px] font-black uppercase py-1 ${
                                                    idx === 0 ? 'text-[#c00000]' : 'text-[#69512a]'
                                                }`}
                                            >
                                                {wd}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Days Grid */}
                                    <div className="grid grid-cols-7 gap-1">
                                        {cells.map((cell, idx) => {
                                            const isSelected = isSameDay(cell.date, activeDate);
                                            const isToday = isSameDay(cell.date, today);
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedDate(cell.date);
                                                        if (!cell.isCurrentMonth) {
                                                            setCalendarViewDate(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
                                                        }
                                                    }}
                                                    className={`h-8 sm:h-9 rounded-[6px] text-xs font-black flex items-center justify-center transition-all border ${
                                                        isSelected
                                                            ? 'bg-[#007020] text-white border-[#005015] shadow-inner scale-[1.03]'
                                                            : isToday
                                                                ? 'bg-[#f0f7f0] text-[#007020] border-[#007020] font-extrabold'
                                                                : cell.isCurrentMonth
                                                                    ? 'bg-[#fbf6ec] hover:bg-[#ebd8b7] text-[#0B2149] border-[#e2d2b5]'
                                                                    : 'bg-[#f7f2e7] hover:bg-[#ebd8b7] text-gray-400 border-transparent'
                                                    }`}
                                                >
                                                    {cell.dayNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Time Picker Section */}
                                    <div className="bg-[#f7eedc] border border-[#c7a96b] rounded-md px-3 py-2 shadow-[inset_1px_1px_0_#ffffff] flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1.5 text-[11px] font-black uppercase text-[#0B2149] tracking-wider">
                                                <i className="pi pi-clock text-xs text-[#007020]"></i>
                                                <span>Select Time</span>
                                            </span>
                                            <span className="text-xs font-black text-[#c00000]">
                                                {formattedSelectedTime}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-center gap-2 sm:gap-3">
                                            {/* Hour Selector */}
                                            <div className="flex items-center gap-1 bg-[#fdfbf6] border border-[#a48654] rounded px-1.5 py-1 shadow-inner">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedHour(h => (h <= 1 ? 12 : h - 1))}
                                                    className="w-6 h-6 rounded bg-[#f0e4cd] hover:bg-[#e5d2af] text-[#0B2149] font-black text-xs flex items-center justify-center transition-colors"
                                                >
                                                    -
                                                </button>
                                                <select
                                                    value={selectedHour}
                                                    onChange={(e) => setSelectedHour(Number(e.target.value))}
                                                    className="bg-transparent text-sm font-black text-[#0B2149] text-center cursor-pointer focus:outline-none px-0.5"
                                                >
                                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                                        <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedHour(h => (h >= 12 ? 1 : h + 1))}
                                                    className="w-6 h-6 rounded bg-[#f0e4cd] hover:bg-[#e5d2af] text-[#0B2149] font-black text-xs flex items-center justify-center transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <span className="text-[#0B2149] font-black text-base">:</span>

                                            {/* Minute Selector */}
                                            <div className="flex items-center gap-1 bg-[#fdfbf6] border border-[#a48654] rounded px-1.5 py-1 shadow-inner">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedMinute(m => (m <= 0 ? 59 : m - 1))}
                                                    className="w-6 h-6 rounded bg-[#f0e4cd] hover:bg-[#e5d2af] text-[#0B2149] font-black text-xs flex items-center justify-center transition-colors"
                                                >
                                                    -
                                                </button>
                                                <select
                                                    value={selectedMinute}
                                                    onChange={(e) => setSelectedMinute(Number(e.target.value))}
                                                    className="bg-transparent text-sm font-black text-[#0B2149] text-center cursor-pointer focus:outline-none px-0.5"
                                                >
                                                    {Array.from({ length: 60 }, (_, i) => i).map(m => (
                                                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedMinute(m => (m >= 59 ? 0 : m + 1))}
                                                    className="w-6 h-6 rounded bg-[#f0e4cd] hover:bg-[#e5d2af] text-[#0B2149] font-black text-xs flex items-center justify-center transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* AM / PM Toggle */}
                                            <div className="flex rounded border border-[#a48654] overflow-hidden bg-[#fdfbf6]">
                                                {['AM', 'PM'].map(period => (
                                                    <button
                                                        key={period}
                                                        type="button"
                                                        onClick={() => setSelectedPeriod(period)}
                                                        className={`px-2 py-1 text-xs font-black transition-colors ${
                                                            selectedPeriod === period
                                                                ? 'bg-[#0B2149] text-white'
                                                                : 'bg-[#fdfbf6] text-[#0B2149] hover:bg-[#ebd8b7]'
                                                        }`}
                                                    >
                                                        {period}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Modal Footer */}
                        <div className="bg-[#f7eedc] border-t-2 border-[#c7a96b] px-4 py-2.5 flex items-center justify-between">
                            <span className="text-[11px] sm:text-xs font-black text-[#0B2149]">
                                Selected: <span className="text-[#c00000]">{formattedSelectedDate} • {formattedSelectedTime}</span>
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const now = new Date();
                                        const h = now.getHours();
                                        setSelectedDate(now);
                                        setCalendarViewDate(now);
                                        setSelectedHour(h % 12 === 0 ? 12 : h % 12);
                                        setSelectedMinute(now.getMinutes());
                                        setSelectedPeriod(h >= 12 ? 'PM' : 'AM');
                                    }}
                                    className="px-2.5 py-1.5 rounded border border-[#007020] text-[#007020] bg-white hover:bg-[#f0f7f0] text-xs font-black transition-colors"
                                >
                                    Now
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCalendarModal(false)}
                                    className="px-4 py-1.5 rounded bg-[#0B2149] hover:bg-[#16346b] text-white text-xs font-black transition-colors shadow"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReadingPlan;
