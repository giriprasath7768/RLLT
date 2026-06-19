import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from 'primereact/tooltip';
import axios from 'axios';

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

const TtoMT357Player = () => {
    const [activeTrack, setActiveTrack] = useState('PROVERBS 1');
    const [selectedDay, setSelectedDay] = useState(3);
    const [facet, setFacet] = useState(2);
    const [phase, setPhase] = useState(1);
    const [otPage, setOtPage] = useState(0);
    const [ntPage, setNtPage] = useState(0);
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [selectedWeek, setSelectedWeek] = useState(null);
    const [daysPage, setDaysPage] = useState(0);
    const [selectedPreviewDay, setSelectedPreviewDay] = useState(1);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isFlipped, setIsFlipped] = useState(false);
    const [showBookTypePopup, setShowBookTypePopup] = useState(false);
    const [bookTypeMode, setBookTypeMode] = useState('book');
    const [selectedChapters, setSelectedChapters] = useState({});
    const [activeChapterPopupBook, setActiveChapterPopupBook] = useState(null);
    const [activeVersePopup, setActiveVersePopup] = useState(null);
    const [selectedVerses, setSelectedVerses] = useState({});
    const [activeBookOrChapterPopup, setActiveBookOrChapterPopup] = useState(null);

    const [selectionOrder, setSelectionOrder] = useState([]);

    useEffect(() => {
        const currentSelectedCodes = new Set([
            ...selectedBooks,
            ...Object.keys(selectedChapters).filter(k => selectedChapters[k] && selectedChapters[k].length > 0),
            ...Object.keys(selectedVerses).filter(k => selectedVerses[k] && selectedVerses[k].length > 0).map(k => k.split('-')[0])
        ]);

        setSelectionOrder(prev => {
            const next = prev.filter(code => currentSelectedCodes.has(code));
            currentSelectedCodes.forEach(code => {
                if (!next.includes(code)) {
                    next.push(code);
                }
            });
            return next;
        });
    }, [selectedBooks, selectedChapters, selectedVerses]);

    const BOOK_CHAPTERS_COUNT = {
        "GEN": 50, "EXO": 40, "LEV": 27, "NUM": 36, "DEU": 34, "JOS": 24, "JDG": 21, "RUT": 4, "1SA": 31, "2SA": 24,
        "1KI": 22, "2KI": 25, "1CH": 29, "2CH": 36, "EZR": 10, "NEH": 13, "EST": 10, "JOB": 42, "PSA": 150, "PRO": 31,
        "ECC": 12, "SOS": 8, "ISA": 66, "JER": 52, "LAM": 5, "EZE": 48, "DAN": 12, "HOS": 14, "JOE": 3, "AMO": 9,
        "OBA": 1, "JON": 4, "MIC": 7, "NAH": 3, "HAB": 3, "ZEP": 3, "HAG": 2, "ZEC": 14, "MAL": 4,
        "MAT": 28, "MAR": 16, "LUK": 24, "JOH": 21, "ACT": 28, "ROM": 16, "1CO": 16, "2CO": 13, "GAL": 6, "EPH": 6,
        "PHP": 4, "COL": 4, "1TH": 5, "2TH": 3, "1TI": 6, "2TI": 4, "TIT": 3, "PHM": 1, "HEB": 13, "JAM": 5,
        "1PE": 5, "2PE": 3, "1JN": 5, "2JN": 1, "3JN": 1, "JUD": 1, "REV": 22
    };

    const playlistRef = useRef(null);
    const [isPlaylistScrollActive, setIsPlaylistScrollActive] = useState(false);

    useEffect(() => {
        if (isPlaylistScrollActive) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isPlaylistScrollActive]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (playlistRef.current && !playlistRef.current.contains(event.target)) {
                setIsPlaylistScrollActive(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const el = playlistRef.current;
        if (!el) return;

        const handleWheel = (e) => {
            if (isPlaylistScrollActive) {
                const maxScrollTop = el.scrollHeight - el.clientHeight;
                if (maxScrollTop > 0) {
                    el.scrollTop += e.deltaY;
                    e.preventDefault();
                }
            }
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [isPlaylistScrollActive]);

    const [showSettings, setShowSettings] = useState(false);
    const [themeColor, setThemeColor] = useState(() => {
        return localStorage.getItem('playerThemeColor') || '#00C0FF';
    });
    const [activeThemeColor, setActiveThemeColor] = useState(() => {
        return localStorage.getItem('playerThemeColor') || null;
    });

    useEffect(() => {
        if (activeThemeColor) {
            localStorage.setItem('playerThemeColor', activeThemeColor);
        } else {
            localStorage.removeItem('playerThemeColor');
        }
    }, [activeThemeColor]);

    const transformationColors = [
        '#00C0FF', '#00A638', '#3340CD', '#FAFA33',
        '#BB43B1', '#FE6D01', '#FE0005'
    ];

    const [sliderImageIndex, setSliderImageIndex] = useState(0);
    const sliderImages = ['/lighthouse.jpeg', '/lighthouse.jpg'];

    useEffect(() => {
        const interval = setInterval(() => {
            setSliderImageIndex((prev) => (prev + 1) % sliderImages.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const getOrdinalNum = (n) => n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');

    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);
    const [rlltDB, setRlltDB] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [savedChartData, setSavedChartData] = useState(null);
    const [contentsDB, setContentsDB] = useState([]);
    const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTimeDisplay, setCurrentTimeDisplay] = useState('0:00');
    const [durationDisplay, setDurationDisplay] = useState('0:00');
    const audioRef = useRef(null);
    const navigate = useNavigate();

    // Progress bar state and drag logic
    const [progress, setProgress] = useState(0);
    const progressBarRef = useRef(null);
    const isDragging = useRef(false);

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleProgressChange = (e) => {
        if (progressBarRef.current) {
            const rect = progressBarRef.current.getBoundingClientRect();
            let newProgress = ((e.clientX - rect.left) / rect.width) * 100;
            newProgress = Math.max(0, Math.min(100, newProgress));
            setProgress(newProgress);
            if (audioRef.current && audioRef.current.duration) {
                audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
            }
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current && !isDragging.current) {
            const current = audioRef.current.currentTime;
            const duration = audioRef.current.duration || 1;
            setProgress((current / duration) * 100);
            setCurrentTimeDisplay(formatTime(current));
            setDurationDisplay(formatTime(audioRef.current.duration));
        }
    };

    const handleEnded = () => {
        setProgress(0);
        setCurrentTimeDisplay('0:00');

        const currentIndex = tracks.findIndex(t => t === activeTrack);
        if (currentIndex !== -1 && currentIndex < tracks.length - 1) {
            setActiveTrack(tracks[currentIndex + 1]);
            setIsPlaying(true);
        } else {
            setIsPlaying(false);
        }
    };

    const togglePlay = () => {
        if (audioRef.current && currentAudioUrl) {
            if (!audioRef.current.paused) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log(e));
            }
        }
    };

    const handleMouseDown = (e) => {
        isDragging.current = true;
        handleProgressChange(e);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging.current) {
                handleProgressChange(e);
            }
        };

        const handleMouseUp = () => {
            isDragging.current = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

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
                setRlltDB(res.data);
            })
            .catch(err => console.error(err));

        axios.get('http://' + window.location.hostname + ':8000/api/contents/list', { withCredentials: true })
            .then(res => setContentsDB(res.data))
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        axios.get(`http://${window.location.hostname}:8000/api/charts/sync/5/${facet}/${phase}`, { withCredentials: true })
            .then(res => {
                if (res.data && res.data.state_payload) {
                    try {
                        const parsed = JSON.parse(res.data.state_payload);
                        setSavedChartData(parsed);
                    } catch (e) {
                        setSavedChartData(null);
                    }
                } else {
                    setSavedChartData(null);
                }
            })
            .catch(err => {
                setSavedChartData(null);
            });
    }, [facet, phase]);

    useEffect(() => {
        if (!activeTrack || !contentsDB || contentsDB.length === 0 || !booksDB || booksDB.length === 0) {
            setCurrentAudioUrl(null);
            return;
        }

        const parts = activeTrack.split(' ');
        if (parts.length < 2) {
            setCurrentAudioUrl(null);
            return;
        }
        const bookStr = parts[0].toUpperCase();
        let chapterStr = parts[1];
        if (chapterStr.includes('-')) {
            chapterStr = chapterStr.split('-')[0];
        }
        const chapterNum = parseInt(chapterStr);

        let targetBook = null;
        if (bookStr === 'PROVERBS') targetBook = booksDB.find(b => b.short_form === 'PRO');
        else if (bookStr === 'PSALMS' || bookStr === 'DAVID') targetBook = booksDB.find(b => b.short_form === 'PSA');
        else {
            targetBook = booksDB.find(b => {
                if (b.short_form && b.short_form.trim().toUpperCase() === bookStr) return true;
                const nameStr = b.name.toUpperCase().replace(/\s+/g, '');
                if (bookStr === "JDG" && (nameStr.startsWith("JUDG") || nameStr.startsWith("JDG"))) return true;
                if (bookStr === "SOS" && (nameStr.startsWith("SONG") || nameStr.startsWith("CANTICLES") || nameStr.startsWith("SOS"))) return true;
                if (bookStr === "PHP" && (nameStr.startsWith("PHILIP") || nameStr.startsWith("PHP"))) return true;
                if (bookStr === "PHM" && (nameStr.startsWith("PHILEM") || nameStr.startsWith("PHM"))) return true;
                if (bookStr === "1JN" && (nameStr.startsWith("1JO") || nameStr.startsWith("1STJO") || nameStr.startsWith("IJO") || nameStr.startsWith("1JN"))) return true;
                if (bookStr === "2JN" && (nameStr.startsWith("2JO") || nameStr.startsWith("2NDJO") || nameStr.startsWith("IIJO") || nameStr.startsWith("2JN"))) return true;
                if (bookStr === "3JN" && (nameStr.startsWith("3JO") || nameStr.startsWith("3RDJO") || nameStr.startsWith("IIIJO") || nameStr.startsWith("3JN"))) return true;
                if (bookStr === "1KI" && nameStr.startsWith("1KI")) return true;
                if (bookStr === "2KI" && nameStr.startsWith("2KI")) return true;
                if (bookStr === "1SA" && nameStr.startsWith("1SA")) return true;
                if (bookStr === "2SA" && nameStr.startsWith("2SA")) return true;
                if (bookStr === "1CH" && nameStr.startsWith("1CH")) return true;
                if (bookStr === "2CH" && nameStr.startsWith("2CH")) return true;
                if (bookStr === "1CO" && nameStr.startsWith("1CO")) return true;
                if (bookStr === "2CO" && nameStr.startsWith("2CO")) return true;
                if (bookStr === "1TH" && nameStr.startsWith("1TH")) return true;
                if (bookStr === "2TH" && nameStr.startsWith("2TH")) return true;
                if (bookStr === "1TI" && nameStr.startsWith("1TI")) return true;
                if (bookStr === "2TI" && nameStr.startsWith("2TI")) return true;
                if (bookStr === "1PE" && nameStr.startsWith("1PE")) return true;
                if (bookStr === "2PE" && nameStr.startsWith("2PE")) return true;
                return nameStr.startsWith(bookStr.replace(/[^A-Z0-9]/g, ''));
            });
        }

        if (targetBook) {
            const content = contentsDB.find(c => c.book_id === targetBook.id && c.chapter_number === chapterNum);
            if (content && content.audio_url) {
                try {
                    const parsed = JSON.parse(content.audio_url);
                    if (parsed && parsed.length > 0 && parsed[0].url) {
                        setCurrentAudioUrl('http://' + window.location.hostname + ':8000' + parsed[0].url);
                        return;
                    }
                } catch (e) {
                    if (typeof content.audio_url === 'string' && content.audio_url.startsWith('/')) {
                        setCurrentAudioUrl('http://' + window.location.hostname + ':8000' + content.audio_url);
                        return;
                    }
                }
            }
        }
        setCurrentAudioUrl(null);
    }, [activeTrack, contentsDB, booksDB]);

    useEffect(() => {
        if (audioRef.current && currentAudioUrl) {
            audioRef.current.load();
            if (isPlaying) {
                audioRef.current.play().catch(e => console.log('Audio auto-play failed', e));
            }
        }
    }, [currentAudioUrl]);

    const toggleSpecialBook = (bookId) => {
        toggleBook(bookId);
    };

    const toggleBook = (bookCode) => {
        if (bookTypeMode === 'book') {
            if (selectedBooks.includes(bookCode)) {
                setSelectedBooks(selectedBooks.filter(b => b !== bookCode));
            } else {
                setSelectedBooks([...selectedBooks, bookCode]);
            }
        } else if (bookTypeMode === 'book_chapter') {
            setActiveBookOrChapterPopup(bookCode);
        } else {
            setActiveChapterPopupBook(bookCode);
        }
    };

    const toggleChapter = (book, chapterNum) => {
        const currentChapters = selectedChapters[book] || [];
        if (currentChapters.includes(chapterNum)) {
            setSelectedChapters({
                ...selectedChapters,
                [book]: currentChapters.filter(c => c !== chapterNum)
            });
        } else {
            setSelectedChapters({
                ...selectedChapters,
                [book]: [...currentChapters, chapterNum]
            });
        }
    };

    const getVerseCount = (bookCode, chapterNum) => {
        let targetBook = null;
        if (bookCode === 'PROVERBS') targetBook = booksDB.find(b => b.short_form === 'PRO');
        else if (bookCode === 'PSALMS' || bookCode === 'DAVID') targetBook = booksDB.find(b => b.short_form === 'PSA');
        else {
            targetBook = booksDB.find(b => isBookMatch(bookCode, b));
        }
        if (!targetBook) return 0;
        const chapterObj = chaptersDB.find(c => c.book_id === targetBook.id && c.chapter_number === chapterNum);
        return chapterObj ? (chapterObj.verse_count || 0) : 0;
    };

    const toggleVerse = (book, chapterNum, verseNum) => {
        const key = `${book}-${chapterNum}`;
        const currentVerses = selectedVerses[key] || [];
        if (currentVerses.includes(verseNum)) {
            setSelectedVerses({
                ...selectedVerses,
                [key]: currentVerses.filter(v => v !== verseNum)
            });
        } else {
            setSelectedVerses({
                ...selectedVerses,
                [key]: [...currentVerses, verseNum]
            });
        }
    };

    const getBookColorConfig = (index) => {
        if (index >= 0 && index <= 4) return { text: 'text-[#c00000]', bg: 'bg-[#c00000]', activeText: 'text-white' };
        if (index >= 5 && index <= 16) return { text: 'text-[#a67c00]', bg: 'bg-[#a67c00]', activeText: 'text-white' };
        if (index >= 17 && index <= 21) return { text: 'text-[#007020]', bg: 'bg-[#007020]', activeText: 'text-white' };
        if (index >= 22 && index <= 26) return { text: 'text-[#0055a4]', bg: 'bg-[#0055a4]', activeText: 'text-white' };
        if (index >= 27 && index <= 38) return { text: 'text-[#4b0082]', bg: 'bg-[#4b0082]', activeText: 'text-white' };
        if (index >= 39 && index <= 42) return { text: 'text-[#c00000]', bg: 'bg-[#c00000]', activeText: 'text-white' };
        if (index === 43) return { text: 'text-[#a67c00]', bg: 'bg-[#a67c00]', activeText: 'text-white' };
        if (index >= 44 && index <= 55) return { text: 'text-[#007020]', bg: 'bg-[#007020]', activeText: 'text-white' };
        if (index >= 56 && index <= 63) return { text: 'text-[#0055a4]', bg: 'bg-[#0055a4]', activeText: 'text-white' };
        if (index >= 64 && index <= 66) return { text: 'text-[#4b0082]', bg: 'bg-[#4b0082]', activeText: 'text-white' };
        return { text: 'text-[#2b4c7e]', bg: 'bg-[#2b4c7e]', activeText: 'text-white' };
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

    const oldTestament = STANDARD_BOOKS.slice(0, 39);
    const newTestament = STANDARD_BOOKS.slice(39, 66);

    const otTotalPages = Math.ceil(oldTestament.length / 10);
    const ntTotalPages = Math.ceil(newTestament.length / 10);

    const otDisplay = oldTestament.slice(otPage * 10, (otPage + 1) * 10);
    const ntDisplay = newTestament.slice(ntPage * 10, (ntPage + 1) * 10);

    const BOOK_READING_TIMES = {
        "GEN": 210, "EXO": 180, "LEV": 120, "NUM": 180, "DEU": 150, "JOS": 105, "JDG": 105, "RUT": 15, "1SA": 135, "2SA": 120,
        "1KI": 135, "2KI": 135, "1CH": 120, "2CH": 135, "EZR": 40, "NEH": 60, "EST": 30, "JOB": 150, "PSA": 300, "PRO": 90,
        "ECC": 30, "SOS": 20, "ISA": 225, "JER": 240, "LAM": 20, "EZE": 225, "DAN": 75, "HOS": 30, "JOE": 12, "AMO": 25,
        "OBA": 4, "JON": 8, "MIC": 18, "NAH": 8, "HAB": 9, "ZEP": 10, "HAG": 7, "ZEC": 40, "MAL": 11,
        "MAT": 150, "MAR": 90, "LUK": 150, "JOH": 120, "ACT": 135, "ROM": 60, "1CO": 60, "2CO": 40, "GAL": 20, "EPH": 20,
        "PHP": 14, "COL": 13, "1TH": 12, "2TH": 7, "1TI": 16, "2TI": 11, "TIT": 7, "PHM": 3, "HEB": 45, "JAM": 16,
        "1PE": 16, "2PE": 10, "1JN": 16, "2JN": 2, "3JN": 2, "JUD": 4, "REV": 75
    };

    const getFullTrackName = (track) => {
        if (!track) return "";
        const parts = track.split(" ");
        if (parts.length < 2) return track;
        const code = parts[0].toUpperCase();

        let matchedBook = null;
        if (code === 'PRO') matchedBook = booksDB.find(b => b.short_form === 'PRO');
        else if (code === 'PSA') matchedBook = booksDB.find(b => b.short_form === 'PSA');
        else {
            matchedBook = booksDB.find(b => {
                if (b.short_form && b.short_form.trim().toUpperCase() === code) return true;
                return isBookMatch(code, b);
            });
        }

        if (matchedBook) {
            return matchedBook.name.toUpperCase() + " " + parts.slice(1).join(" ");
        }
        return track;
    };

    const isBookMatch = (bookCode, book) => {
        if (book.short_form && book.short_form.trim().toUpperCase() === bookCode) return true;

        const nameStr = book.name.toUpperCase().replace(/\s+/g, '');
        const code = bookCode.toUpperCase();

        if (code === "JDG" && (nameStr.startsWith("JUDG") || nameStr.startsWith("JDG"))) return true;
        if (code === "SOS" && (nameStr.startsWith("SONG") || nameStr.startsWith("CANTICLES") || nameStr.startsWith("SOS"))) return true;
        if (code === "PHP" && (nameStr.startsWith("PHILIP") || nameStr.startsWith("PHP"))) return true;
        if (code === "PHM" && (nameStr.startsWith("PHILEM") || nameStr.startsWith("PHM"))) return true;

        if (code === "1JN" && (nameStr.startsWith("1JO") || nameStr.startsWith("1STJO") || nameStr.startsWith("IJO") || nameStr.startsWith("1JN"))) return true;
        if (code === "2JN" && (nameStr.startsWith("2JO") || nameStr.startsWith("2NDJO") || nameStr.startsWith("IIJO") || nameStr.startsWith("2JN"))) return true;
        if (code === "3JN" && (nameStr.startsWith("3JO") || nameStr.startsWith("3RDJO") || nameStr.startsWith("IIIJO") || nameStr.startsWith("3JN"))) return true;

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

        const standardIndex = STANDARD_BOOKS.indexOf(code) + 1;
        if (book.id === standardIndex) return true;

        return nameStr.startsWith(code.replace(/[^A-Z0-9]/g, ''));
    };

    const getBookTooltip = (code) => {
        if (code === 'psa119') {
            return 'PSALM 119';
        } else if (code === 'psa75') {
            return 'PSALM of David - 75 Chapters';
        }

        let matchedBook = booksDB.find(b => isBookMatch(code, b));

        if (!matchedBook) return '';
        const chaps = chaptersDB.filter(c => c.book_id === matchedBook.id);
        const bookName = matchedBook.name === 'JUDGUS' ? 'JUDGES' : matchedBook.name;
        return `${bookName} - ${chaps.length} Chapters`;
    };

    const activeRllt = React.useMemo(() => {
        return rlltDB.find(r => r.module === 5 && r.facet === facet && r.phase === phase);
    }, [rlltDB, facet, phase]);

    const tracks = React.useMemo(() => {
        if (selectedBooks && selectedBooks.length > 0) {
            const list = [];
            selectedBooks.forEach(code => {
                if (code === 'psa119') list.push('PSALMS 119');
                else if (code === 'psa75') list.push('PSALMS of David 75');
                else {
                    const match = booksDB.find(b => isBookMatch(code, b));
                    list.push(match ? match.name.toUpperCase() : code.toUpperCase());
                }
            });
            return list;
        }

        if (savedChartData && savedChartData.length > 0) {
            let targetDayObj = null;
            for (const chunk of savedChartData) {
                if (chunk.days) {
                    const d = chunk.days.find(x => x.day === selectedPreviewDay);
                    if (d) {
                        targetDayObj = d;
                        break;
                    }
                }
            }
            if (targetDayObj) {
                const dayTracks = [];
                const addExpanded = (val) => {
                    if (!val) return;
                    const match = val.trim().match(/^([0-9A-Za-z]+)\s+(\d+)\s*-\s*(\d+)$/);
                    if (match) {
                        const book = match[1];
                        const start = parseInt(match[2], 10);
                        const end = parseInt(match[3], 10);
                        for (let i = start; i <= end; i++) {
                            dayTracks.push(`${book} ${i}`);
                        }
                    } else {
                        dayTracks.push(val);
                    }
                };
                addExpanded(targetDayObj.m1b);
                addExpanded(targetDayObj.m2b);
                addExpanded(targetDayObj.m3b);
                addExpanded(targetDayObj.m4b);
                addExpanded(targetDayObj.m5b);
                return dayTracks;
            }
        }

        let proCount = activeRllt ? (parseInt(activeRllt.pro) || 0) : 3;
        let psaCount = activeRllt ? (parseInt(activeRllt.psa) || 0) : 5;

        if (proCount === 0 && psaCount === 0) return ['PROVERBS 1', 'PSALMS 1', 'PSALMS 2', 'PSALMS 3', 'PSALMS 4'];

        const newTracks = [];
        for (let i = 1; i <= proCount; i++) {
            newTracks.push(`PROVERBS ${i}`);
        }
        for (let i = 1; i <= psaCount; i++) {
            newTracks.push(`PSALMS ${i}`);
        }

        return newTracks.length > 0 ? newTracks : ['PROVERBS 1', 'PSALMS 1', 'PSALMS 2', 'PSALMS 3', 'PSALMS 4'];
    }, [selectedBooks, activeRllt, booksDB, facet, phase, savedChartData, selectedPreviewDay]);

    useEffect(() => {
        if (tracks && tracks.length > 0) {
            setActiveTrack(tracks[0]);
        }
    }, [tracks]);

    const displayDays = React.useMemo(() => {
        if (selectedWeek && selectedDay) {
            const chartLength = parseInt(selectedWeek) * selectedDay;
            if (chartLength > 0) {
                return Array.from({ length: chartLength }, (_, i) => i + 1);
            }
        }

        const daysCount = activeRllt ? (parseInt(activeRllt.scheduled_value_days) || 30) : 30;
        return Array.from({ length: daysCount }, (_, i) => i + 1);
    }, [selectedWeek, selectedDay, activeRllt]);

    React.useEffect(() => {
        setDaysPage(0);
    }, [displayDays.length]);



    const totalMinutes = selectedBooks.reduce((total, code) => {
        let matchedBook = null;
        if (code === 'psa119') {
            matchedBook = booksDB.find(b => (b.name + " " + (b.short_form || "")).toUpperCase().includes("119"));
        } else if (code === 'psa75') {
            matchedBook = booksDB.find(b => (b.name + " " + (b.short_form || "")).toUpperCase().includes("DAVID"));
        } else {
            matchedBook = booksDB.find(b => isBookMatch(code, b));
        }

        if (matchedBook && matchedBook.total_art !== undefined && matchedBook.total_art !== null) {
            const parsed = typeof matchedBook.total_art === 'number' ? matchedBook.total_art : parseTime(matchedBook.total_art);
            return total + parsed;
        }

        return total + (BOOK_READING_TIMES[code] || 0);
    }, 0);

    const artHours = Math.floor(totalMinutes / 60);
    const artMins = Math.floor(totalMinutes % 60);

    const handleViewChart = async (autoPrint = false) => {
        try {
            const listRes = await axios.get(`http://${window.location.hostname}:8000/api/charts/list`, { withCredentials: true });
            const exists = listRes.data.find(c => Number(c.module) === 5 && Number(c.facet) === Number(facet) && Number(c.phase) === Number(phase));

            if (exists) {
                const isMainChart = exists.chart_type === 'Main Chart' || (exists.banner_text && exists.banner_text.toLowerCase().includes('main chart'));
                const is24x7 = exists.chart_type === '24x7 Chart' || (exists.banner_text && (exists.banner_text.toLowerCase().includes('24/7') || exists.banner_text.toLowerCase().includes('24x7')));

                let chartRoute = '357-chart';
                if (is24x7) {
                    chartRoute = 'twenty-four-seven-chart';
                } else if (isMainChart) {
                    chartRoute = 'main-chart';
                }

                const baseRoute = userRole === 'student' ? '/dashboard/student' : '/admin';
                navigate(`${baseRoute}/chart-listing/${chartRoute}`, {
                    state: {
                        preselect: {
                            module: 5,
                            facet: facet,
                            phase: phase
                        },
                        autoPrint: autoPrint === true
                    }
                });
            } else {
                alert(`No saved chart found for Module 5, Facet ${facet}, Phase ${phase}. Please create it first.`);
            }
        } catch (err) {
            console.error(err);
            alert('Could not verify chart existence.');
        }
    };

    const handleSubmit = async () => {
        if (!selectedWeek || !selectedDay) {
            alert('Please select both Week and Day first.');
            return;
        }

        const chartLength = parseInt(selectedWeek) * selectedDay;

        const allSelectedBooks = [];

        const allCodesSet = new Set(selectedBooks);
        Object.keys(selectedChapters).forEach(k => { if (selectedChapters[k]?.length > 0) allCodesSet.add(k); });
        Object.keys(selectedVerses).forEach(k => { if (selectedVerses[k]?.length > 0) allCodesSet.add(k.split('-')[0]); });

        for (const code of allCodesSet) {
            let b = null;
            if (code === 'psa119') {
                b = booksDB.find(bk => (bk.name + " " + (bk.short_form || "")).toUpperCase().includes("119"));
            } else if (code === 'psa75') {
                b = booksDB.find(bk => (bk.name + " " + (bk.short_form || "")).toUpperCase().includes("DAVID"));
            } else {
                b = booksDB.find(bk => isBookMatch(code, bk));
            }

            if (b) {
                allSelectedBooks.push({
                    ...b,
                    _selectedCode: code,
                    _isFullBook: selectedBooks.includes(code),
                    _selectedChapters: selectedChapters[code] || [],
                    _selectedVerses: Object.keys(selectedVerses).filter(k => k.startsWith(`${code}-`) && selectedVerses[k].length > 0).reduce((acc, k) => {
                        acc[parseInt(k.split('-')[1])] = selectedVerses[k].map(v => parseInt(v));
                        return acc;
                    }, {})
                });
            }
        }

        allSelectedBooks.sort((a, b) => {
            const indexA = selectionOrder.indexOf(a._selectedCode);
            const indexB = selectionOrder.indexOf(b._selectedCode);
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });

        if (allSelectedBooks.length === 0) {
            alert('Please select at least one book or chapter.');
            return;
        }

        const is24x7Format = true;
        const use5Segments = is24x7Format;
        const daysPerChunk = selectedDay; // User selected 3, 5, or 7

        let targetMdl = 5; // TtoMT357 is Module 5
        let targetFct = facet;
        let targetPhs = phase;

        const bannerText = is24x7Format ? `24X7 CHART - ${chartLength} DAYS` : `MAIN CHART - ${chartLength} DAYS`;

        const distributeBooks = (booksArr, daysOutCount) => {
            if (!booksArr || !booksArr.length) return Array.from({ length: daysOutCount }, () => null);
            let allChaps = [];
            for (let b of booksArr) {
                let bChaps = chaptersDB.filter(c => c.book_id === b.id).sort((a, b) => a.chapter_number - b.chapter_number);
                if (!b._isFullBook) {
                    bChaps = bChaps.filter(c => {
                        const hasChapter = b._selectedChapters.includes(c.chapter_number) || b._selectedChapters.includes(String(c.chapter_number));
                        const hasVerses = b._selectedVerses && b._selectedVerses[c.chapter_number] && b._selectedVerses[c.chapter_number].length > 0;
                        return hasChapter || hasVerses;
                    });
                    bChaps = bChaps.map(c => {
                        let newC = { ...c };
                        if (b._selectedVerses && b._selectedVerses[c.chapter_number] && b._selectedVerses[c.chapter_number].length > 0) {
                            const selVerses = b._selectedVerses[c.chapter_number].length;
                            const totVerses = c.verse_count || 1;
                            newC.verse_count = selVerses;
                            const originalArt = typeof c.art === 'number' ? c.art : parseTime(c.art);
                            newC.art = (originalArt * selVerses) / totVerses;
                        }
                        return newC;
                    });
                }
                bChaps.forEach(c => c._bookAbbr = b.short_form || b.name);
                allChaps = allChaps.concat(bChaps);
            }
            if (!allChaps.length) return Array.from({ length: daysOutCount }, () => null);

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

        let seg1Books = [], seg2Books = [], seg3Books = [], seg4Books = [], seg5Books = [];

        seg1Books = allSelectedBooks.slice(0, 1);
        seg2Books = allSelectedBooks.slice(1, 2);
        seg3Books = use5Segments ? allSelectedBooks.slice(2, 3) : allSelectedBooks.slice(2);

        if (use5Segments) {
            seg4Books = allSelectedBooks.slice(3, 4);
            seg5Books = allSelectedBooks.slice(4);
        }

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
                const phaseStr = `MDL ${targetMdl}: FCT ${targetFct}: PHS - ${targetPhs}`;

                const chunkObj = {
                    id: `chunk_${c + 1}`,
                    team: `TEAM -${c + 1}`,
                    phase: phaseStr,
                    promiseLabel: "GOD'S PROMISES :",
                    promises: "ENTER GOD'S PROMISSES HERE",
                    promiseInput: "",
                    h1: chunkDays[0]?.m1b ? chunkDays[0].m1b.replace(/[0-9\-].*/, '').trim() : "",
                    h2: chunkDays[0]?.m2b ? chunkDays[0].m2b.replace(/[0-9\-].*/, '').trim() : "",
                    h3: chunkDays[0]?.m3b ? chunkDays[0].m3b.replace(/[0-9\-].*/, '').trim() : "",
                    days: chunkDays
                };

                if (use5Segments) {
                    chunkObj.h4 = chunkDays[0]?.m4b ? chunkDays[0].m4b.replace(/[0-9\-].*/, '').trim() : "";
                    chunkObj.h5 = chunkDays[0]?.m5b ? chunkDays[0].m5b.replace(/[0-9\-].*/, '').trim() : "";
                }

                newChunks.push(chunkObj);
            }
        }

        const formData = new FormData();
        formData.append("module", targetMdl);
        formData.append("facet", targetFct);
        formData.append("phase", targetPhs);
        formData.append("banner_text", bannerText);
        formData.append("chart_type", is24x7Format ? "24x7 Chart" : "Main Chart");
        formData.append("t_label", "T");
        formData.append("state_payload", JSON.stringify(newChunks));

        try {
            // First check if this chart already exists
            try {
                const checkRes = await axios.get(`http://${window.location.hostname}:8000/api/charts/sync/${targetMdl}/${targetFct}/${targetPhs}`, {
                    withCredentials: true
                });
                if (checkRes.status === 200) {
                    const confirmReplace = window.confirm(`A chart for Module ${targetMdl}, Facet ${targetFct}, Phase ${targetPhs} already exists. Do you want to replace it?`);
                    if (!confirmReplace) {
                        return; // user cancelled
                    }
                }
            } catch (checkErr) {
                // 404 means it doesn't exist yet, which is fine.
                // If it's another error, we'll just proceed and let the save catch it if it fails.
            }

            await axios.post(`http://${window.location.hostname}:8000/api/charts/sync`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });

            if (is24x7Format) {
                navigate(`/admin/twenty-four-seven-chart?editMod=${targetMdl}&editFct=${targetFct}&editPhs=${targetPhs}`);
            } else {
                navigate(`/admin/charts?editMod=${targetMdl}&editFct=${targetFct}&editPhs=${targetPhs}`);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to generate chart!");
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-start py-2 font-['Times_New_Roman',_Times,_serif] text-black">
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .custom-book-tooltip .p-tooltip-text {
                    background-color: #6195df !important;
                    color: #ffffff !important;
                    font-weight: bold;
                }
                .custom-book-tooltip.p-tooltip-top .p-tooltip-arrow, 
                .custom-book-tooltip.p-tooltip-bottom .p-tooltip-arrow, 
                .custom-book-tooltip.p-tooltip-left .p-tooltip-arrow, 
                .custom-book-tooltip.p-tooltip-right .p-tooltip-arrow {
                    border-top-color: #6195df !important;
                    border-bottom-color: #6195df !important;
                    border-left-color: #6195df !important;
                    border-right-color: #6195df !important;
                }
                .p-tooltip.custom-book-tooltip .p-tooltip-arrow {
                    border-top-color: #6195df !important;
                }
                @media (max-width: 380px) {
                    .mobile-compact {
                        width: 600px !important;
                        max-width: 600px !important;
                        zoom: 0.6;
                    }
                }
                @media (min-width: 381px) and (max-width: 450px) {
                    .mobile-compact {
                        width: 600px !important;
                        max-width: 600px !important;
                        zoom: 0.65;
                    }
                }
                @media (min-width: 451px) and (max-width: 639px) {
                    .mobile-compact {
                        width: 600px !important;
                        max-width: 600px !important;
                        zoom: 0.75;
                    }
                }
                @media (min-width: 640px) and (max-width: 767px) {
                    .mobile-compact {
                        width: 600px !important;
                        max-width: 600px !important;
                        zoom: 0.85;
                    }
                }
            `}</style>

            {/* Main Player Container Wrapper for 3D Flip */}
            <div className="w-full max-w-[600px] [perspective:1500px] mobile-compact">
                <div className={`w-full relative transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'}`}>

                    {/* Front Side */}
                    <div className={`w-full [backface-visibility:hidden] bg-[url('/357playerBG.png')] bg-[length:100%_100%] bg-no-repeat border-[3px] border-[#9a7638] rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_0_2px_10px_rgba(255,255,255,0.7),inset_0_-2px_10px_rgba(0,0,0,0.3)] flex flex-col relative overflow-hidden ring-4 ring-[#e5cf9f] ring-opacity-50 ${isFlipped ? 'pointer-events-none' : ''}`}>




                        {/* Header */}
                        <div className="flex px-[21px] pt-[21px] pb-[8px] items-center w-full">
                            {/* Left */}
                            <div className="flex-1 flex items-center justify-start gap-[21px] relative z-10">
                                <button
                                    onClick={() => {
                                        let dashboardRoute = '/dashboard';
                                        if (userRole === 'student') dashboardRoute = '/dashboard/student';
                                        else if (userRole === 'super_admin') dashboardRoute = '/dashboard/super-admin';
                                        else if (userRole === 'admin') dashboardRoute = '/dashboard/admin';
                                        else if (userRole === 'leader') dashboardRoute = '/dashboard/leader';
                                        navigate(dashboardRoute);
                                    }}
                                    className="text-[26px] w-[42px] h-[42px] shrink-0 flex items-center justify-center border border-[#4a2e1d] rounded-xl bg-gradient-to-b from-[#c28e71] via-[#9c6343] to-[#59341f] shadow-[0_4px_6px_rgba(0,0,0,0.6),inset_0_2px_2px_rgba(255,200,160,0.4),inset_0_-1px_3px_rgba(0,0,0,0.4)] focus:outline-none active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] active:translate-y-px transition-all text-[#2b170c] drop-shadow-[0_1px_0_rgba(255,255,255,0.2)] hover:from-[#d19c7f] hover:to-[#6b4027]">
                                    <i className="pi pi-bars font-bold"></i>
                                </button>
                                <div className="flex items-center gap-[8px] text-[13px] font-black leading-tight">
                                    <i className="pi pi-calendar text-[26px] bg-clip-text text-transparent bg-gradient-to-b from-[#edbe9f] via-[#c47b52] to-[#753b1e]"></i>
                                    <div className="flex flex-col items-start bg-clip-text text-transparent bg-gradient-to-b from-[#edbe9f] via-[#c47b52] to-[#753b1e] leading-[1.2]">
                                        <span className="whitespace-nowrap">{`${getOrdinalNum(currentTime.getDate())} ${fullDays[currentTime.getDay()]} ${months[currentTime.getMonth()]}`}</span>
                                        <span className="whitespace-nowrap">{`${currentTime.getHours() % 12 || 12}:${currentTime.getMinutes().toString().padStart(2, '0')} ${currentTime.getHours() >= 12 ? 'PM' : 'AM'}`}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center ml-auto">
                                    <div className="flex items-center text-[26px] font-black tracking-widest">
                                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#edbe9f] via-[#c47b52] to-[#753b1e]">T</span>
                                        <span className="text-[#FF0000]">t</span>
                                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#edbe9f] via-[#c47b52] to-[#753b1e]">o</span>
                                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#edbe9f] via-[#c47b52] to-[#753b1e]">m</span>
                                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#edbe9f] via-[#c47b52] to-[#753b1e]">T</span>
                                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#edbe9f] via-[#c47b52] to-[#753b1e] ml-[8px]">3</span>
                                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#edbe9f] via-[#c47b52] to-[#753b1e] mx-[4px]">5</span>
                                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#edbe9f] via-[#c47b52] to-[#753b1e]">7</span>
                                    </div>

                                </div>
                            </div>

                            {/* Right */}
                            <div className="flex-1 flex items-center relative z-10 pl-[10px]">
                                <div className="flex-1 flex justify-center pr-[10px]">
                                    <div
                                        className="text-white font-Arial font-black text-[18px] tracking-wider uppercase px-[12px] py-[6px] rounded-full overflow-hidden flex items-center justify-center cursor-pointer transition-all active:scale-95"
                                        style={{
                                            backgroundImage: "url('/ARTBG.png')",
                                            backgroundSize: '100% 100%',
                                            backgroundPosition: 'center',
                                            backgroundRepeat: 'no-repeat'
                                        }}
                                    >
                                        <span className="whitespace-nowrap">ART: {artHours}:{artMins.toString().padStart(2, '0')}</span>
                                    </div>
                                </div>
                                <button onClick={() => setIsFlipped(true)} className="w-[42px] h-[42px] shrink-0 rounded-full border border-[#4a2e1d] bg-gradient-to-b from-[#c28e71] via-[#9c6343] to-[#59341f] shadow-[0_4px_6px_rgba(0,0,0,0.6),inset_0_2px_2px_rgba(255,200,160,0.4),inset_0_-1px_3px_rgba(0,0,0,0.4)] flex items-center justify-center font-bold font-serif text-[21px] text-[#2b170c] drop-shadow-[0_1px_0_rgba(255,255,255,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] active:translate-y-px transition-all hover:from-[#d19c7f] hover:to-[#6b4027]">
                                    i
                                </button>
                            </div>
                        </div>

                        {/* Interactive Subtitle */}
                        <div className="flex items-center justify-center py-[8px] text-[16px] font-black tracking-widest uppercase gap-[13px] px-[21px] mb-[8px]">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#edbe9f] via-[#c47b52] to-[#753b1e]">R L L T</span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#8f583b] to-[#452717]">|</span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#edbe9f] via-[#c47b52] to-[#753b1e]">MODULE 5</span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#8f583b] to-[#452717]">|</span>
                            <div className="flex items-center gap-[8px]">
                                <button onClick={() => setFacet(f => Math.max(2, f - 1))} className="w-[26px] h-[26px] flex items-center justify-center bg-gradient-to-b from-[#c28e71] via-[#9c6343] to-[#59341f] border border-[#4a2e1d] rounded-md shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,200,160,0.4)] text-[#2b170c] drop-shadow-[0_1px_0_rgba(255,255,255,0.2)] hover:from-[#d19c7f] hover:to-[#6b4027] active:translate-y-px active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.6)] transition-all"><i className="pi pi-minus font-bold" style={{ fontSize: '10px' }}></i></button>
                                <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#edbe9f] via-[#c47b52] to-[#753b1e]">FCT {facet}</span>
                                <button onClick={() => setFacet(f => Math.min(5, f + 1))} className="w-[26px] h-[26px] flex items-center justify-center bg-gradient-to-b from-[#c28e71] via-[#9c6343] to-[#59341f] border border-[#4a2e1d] rounded-md shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,200,160,0.4)] text-[#2b170c] drop-shadow-[0_1px_0_rgba(255,255,255,0.2)] hover:from-[#d19c7f] hover:to-[#6b4027] active:translate-y-px active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.6)] transition-all"><i className="pi pi-plus font-bold" style={{ fontSize: '10px' }}></i></button>
                            </div>
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#8f583b] to-[#452717]">|</span>
                            <div className="flex items-center gap-[8px]">
                                <button onClick={() => setPhase(p => Math.max(1, p - 1))} className="w-[26px] h-[26px] flex items-center justify-center bg-gradient-to-b from-[#c28e71] via-[#9c6343] to-[#59341f] border border-[#4a2e1d] rounded-md shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,200,160,0.4)] text-[#2b170c] drop-shadow-[0_1px_0_rgba(255,255,255,0.2)] hover:from-[#d19c7f] hover:to-[#6b4027] active:translate-y-px active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.6)] transition-all"><i className="pi pi-minus font-bold" style={{ fontSize: '10px' }}></i></button>
                                <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#edbe9f] via-[#c47b52] to-[#753b1e]">PHS {phase}</span>
                                <button onClick={() => setPhase(p => Math.min(5, p + 1))} className="w-[26px] h-[26px] flex items-center justify-center bg-gradient-to-b from-[#c28e71] via-[#9c6343] to-[#59341f] border border-[#4a2e1d] rounded-md shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,200,160,0.4)] text-[#2b170c] drop-shadow-[0_1px_0_rgba(255,255,255,0.2)] hover:from-[#d19c7f] hover:to-[#6b4027] active:translate-y-px active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.6)] transition-all"><i className="pi pi-plus font-bold" style={{ fontSize: '10px' }}></i></button>
                            </div>
                        </div>

                        {/* Tracklist & Image Panel */}
                        <div className="flex flex-col sm:flex-row px-[10px] sm:px-[21px] gap-[2px] mb-[2px] h-auto sm:h-[220px]">
                            {/* Tracks Area */}
                            <div className="w-full sm:w-[38%] h-[200px] sm:h-full shrink-0 flex flex-col border-[2px] border-[#3b1a0b] bg-[url('/357playlist.png')] bg-[length:195%_145%] bg-center bg-no-repeat rounded-xl overflow-hidden shadow-[inset_0_2px_4px_rgba(255,180,140,0.2),0_4px_8px_rgba(0,0,0,0.8)] p-[8px] relative">
                                <h2 className="text-[20px] font-black mb-[8px] text-[#1c0d06] drop-shadow-[0_1px_0_rgba(255,255,255,0.15)]" style={{ WebkitTextStroke: '0.5px #1c0d06' }}>DAY {selectedPreviewDay < 10 ? `0${selectedPreviewDay}` : selectedPreviewDay}/{displayDays.length < 10 ? `0${displayDays.length}` : displayDays.length}</h2>
                                <div
                                    ref={playlistRef}
                                    onClick={() => setIsPlaylistScrollActive(true)}
                                    className={`flex-1 min-h-0 pr-1 no-scrollbar pb-2 ${isPlaylistScrollActive ? 'overflow-y-auto' : 'overflow-hidden'}`}
                                >
                                    <div className="flex flex-col gap-0">
                                        {tracks.map((track, idx) => {
                                            const isActive = track === activeTrack;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        setActiveTrack(track);
                                                        setIsPlaying(true);
                                                    }}
                                                    className={`w-full flex items-center gap-[8px] py-[4px] px-[8px] rounded-lg border transition-all ${isActive
                                                        ? 'bg-gradient-to-b from-[#331508] to-[#1c0b04] border-[#1a0a03] shadow-[inset_0_3px_5px_rgba(0,0,0,0.9),0_1px_1px_rgba(255,255,255,0.1)]'
                                                        : 'bg-transparent border-transparent shadow-none hover:bg-[#4a200e]/40'
                                                        }`}
                                                >
                                                    <div className="w-[21px] h-[21px] shrink-0 flex items-center justify-center drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">
                                                        <img src="/pointbutton.png" alt="Play" className="w-full h-full object-contain pointer-events-none" />
                                                    </div>
                                                    <span className={`font-bold tracking-wide text-[13px] 2xl:text-[15px] text-[#fadfc3] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] whitespace-nowrap text-left w-full`}>
                                                        {getFullTrackName(track)}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Image Area */}
                            <div className="w-full sm:flex-1 h-[220px] sm:h-full rounded-xl overflow-hidden border-[3px] border-[#9a7638] shadow-[inset_0_0_20px_rgba(0,0,0,0.8),0_4px_8px_rgba(0,0,0,0.2)] bg-black relative">
                                {sliderImages.map((src, index) => (
                                    <img
                                        key={index}
                                        src={src}
                                        alt="Reading"
                                        className={`absolute top-0 left-0 w-full h-full object-fill transition-opacity duration-1000 ${index === sliderImageIndex ? 'opacity-90 z-10' : 'opacity-0 z-0'}`}
                                    />
                                ))}
                                {/* Empty top-left corner */}
                            </div>
                        </div>

                        {/* Player Bar */}
                        <div
                            className="mx-[16px] flex items-center pl-[16px] pr-[24px] py-[20px] mb-[-8px] relative bg-no-repeat z-10"
                            style={{
                                backgroundImage: "url('/playerbg.png')",
                                backgroundSize: '100% 300%',
                                backgroundPosition: 'center'
                            }}
                        >
                            <div className="flex w-full h-full items-center justify-between">
                                <audio
                                    ref={audioRef}
                                    onTimeUpdate={handleTimeUpdate}
                                    onEnded={handleEnded}
                                    onLoadedMetadata={() => setDurationDisplay(formatTime(audioRef.current.duration))}
                                    className="hidden"
                                >
                                    {currentAudioUrl && <source src={currentAudioUrl} type="audio/mpeg" />}
                                </audio>

                                {/* Play Button */}
                                <button onClick={togglePlay} className="relative w-[75px] h-[75px] mb-[12px] shrink-0 flex items-center justify-center transition-all active:scale-95 group hover:brightness-110 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
                                    <img src={isPlaying ? "/pointbutton.png" : "/playbutton.png"} alt="Play" className="w-full h-full object-contain scale-[1.1]" />
                                    {isPlaying && <div className="absolute inset-0 flex items-center justify-center text-[#2b170c] font-black text-2xl drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">||</div>}
                                </button>

                                {/* Center Column: Stacked Progress and Info */}
                                <div className="flex-1 flex flex-col justify-center ml-[21px] mr-[24px] pt-[2px]">
                                    {/* Progress Track */}
                                    <div className="w-full relative">
                                        <div
                                            ref={progressBarRef}
                                            onMouseDown={handleMouseDown}
                                            className="w-full h-[12px] bg-[#8A6241] shadow-[inset_0_4px_6px_rgba(0,0,0,0.9)] rounded-full relative overflow-visible border-[1px] border-[#382312] cursor-pointer mb-[6px]"
                                        >
                                            <div className={`absolute top-[1px] left-[1px] bottom-[1px] shadow-[0_2px_2px_rgba(0,0,0,0.5)] rounded-full ${!activeThemeColor ? 'bg-gradient-to-b from-[#f0f4f8] via-[#a0a5ab] to-[#5b6066]' : ''}`} style={{ width: `calc(${progress}% - 2px)`, ...(activeThemeColor ? { backgroundColor: activeThemeColor } : {}) }}></div>
                                            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[32px] h-[32px] flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 transition-transform drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ left: `${progress}%` }}>
                                                <img src="/pointbutton.png" alt="Thumb" className="w-full h-full object-contain pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Track Info */}
                                    <div className="flex justify-between items-center w-full px-[4px]">
                                        <span className="text-[#e3b586] text-[18px] font-['Times_New_Roman',_Times,_serif] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-wider">{currentTimeDisplay}</span>
                                        <span className="text-[#e3b586] text-[15px] font-['Times_New_Roman',_Times,_serif] font-black tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.8), 0px 2px 4px rgba(0,0,0,0.6)' }}>{getFullTrackName(activeTrack)}</span>
                                        <span className="text-[#e3b586] text-[18px] font-['Times_New_Roman',_Times,_serif] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-wider">{durationDisplay}</span>
                                    </div>
                                </div>

                                {/* Settings Gear */}
                                <button onClick={() => setShowSettings(true)} className="w-[32px] h-[32px] mb-[12px] shrink-0 flex items-center justify-center hover:brightness-125 transition-all active:translate-y-[2px] drop-shadow-[0_3px_4px_rgba(0,0,0,0.9)]">
                                    <i className="pi pi-cog font-bold text-[24px] text-transparent bg-clip-text bg-gradient-to-b from-[#e3b586] via-[#a36338] to-[#47220d]"></i>
                                </button>
                            </div>
                        </div>

                        {/* Pagination */}
                        <div className="mx-[8px] sm:mx-[16px] mb-[13px] flex items-center justify-center pl-[10px] pr-[10px] sm:pl-[54px] sm:pr-[37px]">
                            <div className="w-full flex items-center justify-between border-[2px] border-[#2e1d0d] bg-gradient-to-b from-[#c09d6b] via-[#a37d4c] to-[#644222] shadow-[0_4px_8px_rgba(0,0,0,0.8),inset_0_2px_3px_rgba(255,255,255,0.3)] py-[10px] px-[4px] sm:px-[8px] rounded-[13px]">
                                <button
                                    onClick={() => setDaysPage(prev => Math.max(0, prev - 1))}
                                    disabled={daysPage === 0}
                                    className={`cursor-pointer w-[32px] h-[32px] shrink-0 flex items-center justify-center rounded-[6px] bg-gradient-to-b from-[#b48663] via-[#8c5f3e] to-[#54301c] border border-[#2e190d] shadow-[0_3px_5px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.4)] transition-transform text-[#efd9c5] ${daysPage === 0 ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 hover:brightness-110'}`}
                                >
                                    <i className="pi pi-angle-left text-[18px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] font-bold"></i>
                                </button>
                                <div className="flex-1 min-w-0 flex flex-wrap justify-center gap-[6px] gap-y-[6px] font-['Times_New_Roman',_Times,_serif] font-bold text-[16px] px-[4px]">
                                    {displayDays.slice(daysPage * 10, (daysPage + 1) * 10).map(n => (
                                        <div key={n}
                                            onClick={() => setSelectedPreviewDay(n)}
                                            className={`w-[32px] h-[32px] shrink-0 flex items-center justify-center cursor-pointer transition-colors ${n === selectedPreviewDay
                                                ? 'rounded-[6px] bg-gradient-to-b from-[#967041] via-[#7a572c] to-[#473016] border border-[#3b2512] shadow-[0_1px_1px_rgba(255,255,255,0.2)] p-[2px]'
                                                : 'rounded-[6px] bg-gradient-to-b from-[#f3e5d0] via-[#deccb1] to-[#bda380] border border-[#5a422d] shadow-[0_3px_4px_rgba(0,0,0,0.6),inset_0_2px_3px_rgba(255,255,255,0.9)] hover:brightness-105'
                                                }`}>
                                            {n === selectedPreviewDay ? (
                                                <div className="w-full h-full rounded-[4px] bg-gradient-to-b from-[#1a0a03] to-[#3a1d0d] shadow-[inset_0_4px_6px_rgba(0,0,0,0.9)] flex items-center justify-center text-[#fdf0d5]">
                                                    <span className="drop-shadow-[0_2px_2px_rgba(0,0,0,1)] text-[15px] font-black tracking-widest">{n}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[#331c0a] drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)] text-[16px]">{n}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setDaysPage(prev => Math.min(Math.ceil(displayDays.length / 10) - 1, prev + 1))}
                                    disabled={daysPage >= Math.ceil(displayDays.length / 10) - 1}
                                    className={`cursor-pointer w-[32px] h-[32px] shrink-0 flex items-center justify-center rounded-[6px] bg-gradient-to-b from-[#b48663] via-[#8c5f3e] to-[#54301c] border border-[#2e190d] shadow-[0_3px_5px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.4)] transition-transform text-[#efd9c5] ${daysPage >= Math.ceil(displayDays.length / 10) - 1 ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 hover:brightness-110'}`}
                                >
                                    <i className="pi pi-angle-right text-[18px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] font-bold"></i>
                                </button>
                            </div>
                        </div>

                        {/* Combined Bible Books */}
                        <div className="mx-[0] mb-[10px] relative">
                            <Tooltip target=".book-tooltip" position="top" className="custom-book-tooltip" showDelay={0} hideDelay={0} />
                            <div className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] bg-[url('/bookbg.png')] bg-[length:100%_100%] bg-center bg-no-repeat relative">

                                <div className="w-full relative z-10 flex flex-col gap-[12px] pt-[56px] pb-[32px] px-[16px]">

                                    {/* Old Testament Section */}
                                    <div className="w-full relative flex flex-col items-center px-[13px]">
                                        {/* Top Header Bar */}
                                        <div className="flex items-center justify-between w-full relative mb-[2px] px-[24px]">
                                            <i className={`pi pi-angle-left text-[26px] font-bold text-[#c9a679] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] cursor-pointer ${otPage > 0 ? 'hover:text-white hover:scale-110 transition-transform' : 'opacity-40'}`} onClick={() => setOtPage(p => Math.max(0, p - 1))}></i>

                                            <div className="flex flex-col items-center flex-1 relative">
                                                <div className="flex items-center justify-center gap-[8px] text-[#e3c598] font-['Arial'] font-bold text-[18px] tracking-widest text-center" style={{ textShadow: '0px 1px 0px #5c3a21, 0px 2px 0px #452717, 0px 3px 0px #2a150b, 0px 4px 4px rgba(0,0,0,0.8)' }}>
                                                    <i className="pi pi-file text-[21px]"></i>
                                                    <span>OLD TESTAMENT</span>
                                                </div>
                                                {/* Decorative underline */}
                                                <div className="flex items-center justify-center gap-1 mt-1 opacity-80">
                                                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#c9a679]"></div>
                                                    <i className="pi pi-sun text-[10px] text-[#c9a679]"></i>
                                                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#c9a679]"></div>
                                                </div>

                                                <button 
                                                    onClick={() => setShowBookTypePopup(true)}
                                                    className="absolute right-[30px] sm:right-[50px] md:right-[70px] top-0 text-[#c9a679] hover:text-white transition-colors"
                                                    title="Book Type"
                                                >
                                                    <i className="pi pi-book text-[20px]"></i>
                                                </button>
                                            </div>

                                            <i className={`pi pi-angle-right text-[26px] font-bold text-[#c9a679] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] cursor-pointer ${otPage < otTotalPages - 1 ? 'hover:text-white hover:scale-110 transition-transform' : 'opacity-40'}`} onClick={() => setOtPage(p => Math.min(otTotalPages - 1, p + 1))}></i>
                                        </div>

                                        {/* Content Buttons Grid */}
                                        <div className="w-full px-[10px] sm:px-[24px] grid grid-cols-4 sm:grid-cols-5 gap-x-[8px] sm:gap-x-[12px] gap-y-[6px] mb-[4px]">
                                            {otDisplay.map((book, i) => {
                                                const isSelected = selectedBooks.includes(book) || (selectedChapters[book]?.length > 0) || Object.keys(selectedVerses).some(k => k.startsWith(`${book}-`) && selectedVerses[k].length > 0);
                                                const isGold = (i === 0 || i === 2);
                                                const isCopper = (i === 4 || i === 6 || i === 8);
                                                return (
                                                    <div
                                                        key={i}
                                                        onClick={() => toggleBook(book)}
                                                        data-pr-tooltip={getBookTooltip(book)}
                                                        style={{
                                                            backgroundImage: isSelected ? undefined : (isGold ? "url('/glodenbuttonbg.png')" : (isCopper ? "url('/copperbuttonbg.png')" : "url('/woodenbuttonbg.png')")),
                                                            backgroundSize: isGold ? '108% 195%' : (isCopper ? '110% 170%' : '112% 172%'),
                                                            backgroundPosition: 'center',
                                                            backgroundRepeat: 'no-repeat'
                                                        }}
                                                        className={`book-tooltip text-center py-[6px] rounded-[8px] text-[13px] font-['Arial'] font-black tracking-wider uppercase flex items-center justify-center cursor-pointer transition-all active:scale-95 border ${isSelected
                                                            ? 'bg-gradient-to-b from-[#f2cd79] to-[#b38029] text-[#2b1212] border-[#2b1212] shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),0_2px_4px_rgba(0,0,0,0.8)] scale-[0.98]'
                                                            : isGold
                                                                ? "border-[#45260f] text-[#3d1f08] shadow-[inset_0_2px_2px_rgba(255,255,255,0.6),inset_0_-2px_2px_rgba(0,0,0,0.4),inset_0_0_0_2px_rgba(230,180,80,0.5),0_4px_6px_rgba(0,0,0,0.7)] hover:brightness-110"
                                                                : isCopper
                                                                    ? "border-[#45260f] text-[#c9a679] shadow-[inset_0_2px_2px_rgba(255,255,255,0.6),inset_0_-2px_2px_rgba(0,0,0,0.4),inset_0_0_0_2px_rgba(230,180,80,0.5),0_4px_6px_rgba(0,0,0,0.7)] hover:brightness-110"
                                                                    : "border-[#140a05] text-[#c9a679] shadow-[inset_0_2px_2px_rgba(255,255,255,0.15),inset_0_-2px_2px_rgba(0,0,0,0.5),inset_0_0_0_2px_rgba(90,55,35,0.4),0_4px_6px_rgba(0,0,0,0.7)] hover:brightness-125"
                                                            }`}
                                                    >
                                                        <span className={isSelected ? 'drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]' : (isGold ? 'drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]' : 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]')}>{book}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Pagination Dots */}
                                        <div className="flex justify-center gap-[8px] shrink-0 pb-[2px]">
                                            {Array.from({ length: otTotalPages }).map((_, i) => (
                                                <div key={i} className={`w-[13px] h-[13px] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.2)] border border-[#2b1212] ${i === otPage ? '' : 'bg-gradient-to-b from-[#f2cd79] to-[#b38029]'}`} style={i === otPage ? { backgroundColor: activeThemeColor || '#FE6D01' } : {}}></div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* New Testament Section */}
                                    <div className="w-full relative flex flex-col items-center px-[13px] mt-[0]">
                                        {/* Top Header Bar */}
                                        <div className="flex items-center justify-between w-full relative mb-[2px] px-[24px]">
                                            <i className={`pi pi-angle-left text-[26px] font-bold text-[#c9a679] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] cursor-pointer ${ntPage > 0 ? 'hover:text-white hover:scale-110 transition-transform' : 'opacity-40'}`} onClick={() => setNtPage(p => Math.max(0, p - 1))}></i>

                                            <div className="flex flex-col items-center flex-1">
                                                <div className="flex items-center justify-center gap-[8px] text-[#e3c598] font-['Arial'] font-bold text-[18px] tracking-widest text-center" style={{ textShadow: '0px 1px 0px #5c3a21, 0px 2px 0px #452717, 0px 3px 0px #2a150b, 0px 4px 4px rgba(0,0,0,0.8)' }}>
                                                    <i className="pi pi-file text-[21px]"></i>
                                                    <span>NEW TESTAMENT</span>
                                                </div>
                                                {/* Decorative underline */}
                                                <div className="flex items-center justify-center gap-1 mt-1 opacity-80">
                                                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#c9a679]"></div>
                                                    <i className="pi pi-sun text-[10px] text-[#c9a679]"></i>
                                                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#c9a679]"></div>
                                                </div>
                                            </div>

                                            <i className={`pi pi-angle-right text-[26px] font-bold text-[#c9a679] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] cursor-pointer ${ntPage < ntTotalPages - 1 ? 'hover:text-white hover:scale-110 transition-transform' : 'opacity-40'}`} onClick={() => setNtPage(p => Math.min(ntTotalPages - 1, p + 1))}></i>
                                        </div>

                                        {/* Content Buttons Grid */}
                                        <div className="w-full px-[10px] sm:px-[24px] grid grid-cols-4 sm:grid-cols-5 gap-x-[8px] sm:gap-x-[12px] gap-y-[6px] mb-[4px]">
                                            {ntDisplay.map((book, i) => {
                                                const isSelected = selectedBooks.includes(book) || (selectedChapters[book]?.length > 0) || Object.keys(selectedVerses).some(k => k.startsWith(`${book}-`) && selectedVerses[k].length > 0);
                                                const isGold = (i === 0 || i === 2);
                                                const isCopper = (i === 4 || i === 6 || i === 8);
                                                return (
                                                    <div
                                                        key={i}
                                                        onClick={() => toggleBook(book)}
                                                        data-pr-tooltip={getBookTooltip(book)}
                                                        style={{
                                                            backgroundImage: isSelected ? undefined : (isGold ? "url('/glodenbuttonbg.png')" : (isCopper ? "url('/copperbuttonbg.png')" : "url('/woodenbuttonbg.png')")),
                                                            backgroundSize: isGold ? '108% 195%' : (isCopper ? '110% 170%' : '112% 172%'),
                                                            backgroundPosition: 'center',
                                                            backgroundRepeat: 'no-repeat'
                                                        }}
                                                        className={`book-tooltip text-center py-[6px] rounded-[8px] text-[13px] font-['Arial'] font-black tracking-wider uppercase flex items-center justify-center cursor-pointer transition-all active:scale-95 border ${isSelected
                                                            ? 'bg-gradient-to-b from-[#f2cd79] to-[#b38029] text-[#2b1212] border-[#2b1212] shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),0_2px_4px_rgba(0,0,0,0.8)] scale-[0.98]'
                                                            : isGold
                                                                ? "border-[#45260f] text-[#3d1f08] shadow-[inset_0_2px_2px_rgba(255,255,255,0.6),inset_0_-2px_2px_rgba(0,0,0,0.4),inset_0_0_0_2px_rgba(230,180,80,0.5),0_4px_6px_rgba(0,0,0,0.7)] hover:brightness-110"
                                                                : isCopper
                                                                    ? "border-[#45260f] text-[#c9a679] shadow-[inset_0_2px_2px_rgba(255,255,255,0.6),inset_0_-2px_2px_rgba(0,0,0,0.4),inset_0_0_0_2px_rgba(230,180,80,0.5),0_4px_6px_rgba(0,0,0,0.7)] hover:brightness-110"
                                                                    : "border-[#140a05] text-[#c9a679] shadow-[inset_0_2px_2px_rgba(255,255,255,0.15),inset_0_-2px_2px_rgba(0,0,0,0.5),inset_0_0_0_2px_rgba(90,55,35,0.4),0_4px_6px_rgba(0,0,0,0.7)] hover:brightness-125"
                                                            }`}
                                                    >
                                                        <span className={isSelected ? 'drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]' : (isGold ? 'drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]' : 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]')}>{book}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Pagination Dots */}
                                        <div className="flex justify-center gap-[8px] shrink-0 pb-[2px]">
                                            {Array.from({ length: ntTotalPages }).map((_, i) => (
                                                <div key={i} className={`w-[13px] h-[13px] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.2)] border border-[#2b1212] ${i === ntPage ? '' : 'bg-gradient-to-b from-[#f2cd79] to-[#b38029]'}`} style={i === ntPage ? { backgroundColor: activeThemeColor || '#FE6D01' } : {}}></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Controls */}
                        <div className="px-[16px] mb-[13px] flex flex-col gap-[8px]">
                            {/* Top Row: PSA 119 | Week Selection | PSA 75 */}
                            <div className="flex items-stretch gap-[8px] h-[55px]">

                                {/* PSA 119 Button (Left) */}
                                <div
                                    onClick={() => toggleSpecialBook('psa119')}
                                    data-pr-tooltip={getBookTooltip('psa119')}
                                    style={{
                                        backgroundImage: "url('/PSA119.png')",
                                        backgroundSize: '170% 240%',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat'
                                    }}
                                    className={`book-tooltip w-[28%] shrink-0 rounded-[13px] cursor-pointer transition-all active:scale-95 border flex items-center justify-start pl-[12px] p-[4px] gap-[8px] ${(selectedBooks.includes('psa119') || (selectedChapters['psa119']?.length > 0) || Object.keys(selectedVerses).some(k => k.startsWith('psa119-') && selectedVerses[k].length > 0))
                                        ? "border-[#45260f] shadow-[inset_0_4px_8px_rgba(0,0,0,0.6),inset_0_0_0_2px_rgba(180,130,40,0.4)] opacity-80 scale-[0.98]"
                                        : "border-[#45260f] shadow-[inset_0_2px_2px_rgba(255,255,255,0.6),inset_0_-2px_2px_rgba(0,0,0,0.4),inset_0_0_0_2px_rgba(230,180,80,0.5),0_4px_6px_rgba(0,0,0,0.7)] hover:brightness-110"
                                        }`}
                                >
                                    <img
                                        src="/bookicon.png"
                                        alt="Book"
                                        className="w-[36px] h-[36px] object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]"
                                    />
                                    <div className="flex flex-col items-center">
                                        <span className="text-black font-['Arial'] text-[14px] font-black tracking-widest leading-[1.1] text-center" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.8)' }}>PSALMS</span>
                                        <span className="text-black font-['Arial'] text-[13.5px] font-black tracking-widest leading-[1.1] text-center" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.8)' }}>CHP 119</span>
                                    </div>
                                </div>

                                {/* Week Selection Area (Center) */}
                                <div
                                    className="flex-1 border-2 border-[#a67c38] rounded-[13px] py-[4px] px-[13px] flex items-center justify-center shadow-[inset_0_3px_6px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.2)] relative overflow-hidden"
                                    style={{
                                        backgroundImage: "url('/357weekbg.png')",
                                        backgroundSize: '185% 290%',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat'
                                    }}
                                >
                                    <div className="flex flex-col items-center justify-center pr-[13px] relative z-10 w-full">
                                        <div className="flex justify-center gap-[13px] font-black mb-0 w-full font-['Arial']">
                                            <span
                                                className="cursor-pointer flex items-baseline gap-1 active:scale-95 transition-transform"
                                                style={{ textShadow: '2px 2px 2px rgba(0,0,0,0.5)' }}
                                                onClick={() => setSelectedDay(3)}
                                            >
                                                <span className={`text-[21px] ${selectedDay === 3 ? 'text-red-600' : 'text-black'}`}>3</span> <span className="text-[13px] text-black">DAY</span>
                                            </span>
                                            <span
                                                className="cursor-pointer flex items-baseline gap-1 active:scale-95 transition-transform"
                                                style={{ textShadow: '2px 2px 2px rgba(0,0,0,0.5)' }}
                                                onClick={() => setSelectedDay(5)}
                                            >
                                                <span className={`text-[21px] ${selectedDay === 5 ? 'text-red-600' : 'text-black'}`}>5</span> <span className="text-[13px] text-black">DAY</span>
                                            </span>
                                            <span
                                                className="cursor-pointer flex items-baseline gap-1 active:scale-95 transition-transform"
                                                style={{ textShadow: '2px 2px 2px rgba(0,0,0,0.5)' }}
                                                onClick={() => setSelectedDay(7)}
                                            >
                                                <span className={`text-[21px] ${selectedDay === 7 ? 'text-red-600' : 'text-black'}`}>7</span> <span className="text-[13px] text-black">DAY</span>
                                            </span>
                                        </div>
                                        <div className="text-[#006400] font-['Arial'] drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)] flex items-baseline justify-center gap-[4px]">
                                            {selectedWeek !== null ? (
                                                <>
                                                    <span className="text-[21px] font-black">{parseInt(selectedWeek) * selectedDay}</span>
                                                    <span className="text-[21px] font-black">DAYS</span>
                                                </>
                                            ) : (
                                                <span className="text-[21px] font-black">DAYS</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center pl-[8px] relative z-10 shrink-0">
                                        <span
                                            className="text-black font-['Arial'] text-[14px] font-black tracking-widest"
                                            style={{
                                                writingMode: 'vertical-rl',
                                                transform: 'rotate(180deg)'
                                            }}
                                        >
                                            TEAM
                                        </span>
                                    </div>
                                </div>

                                {/* PSA 75 Button (Right) */}
                                <div
                                    onClick={() => toggleSpecialBook('psa75')}
                                    data-pr-tooltip={getBookTooltip('psa75')}
                                    style={{
                                        backgroundImage: "url('/Davidpsa.png')",
                                        backgroundSize: '110% 200%',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat'
                                    }}
                                    className={`book-tooltip w-[28%] shrink-0 rounded-[13px] cursor-pointer transition-all active:scale-95 border flex items-center justify-start pl-[4px] pr-[6px] py-[4px] gap-[4px] ${(selectedBooks.includes('psa75') || (selectedChapters['psa75']?.length > 0) || Object.keys(selectedVerses).some(k => k.startsWith('psa75-') && selectedVerses[k].length > 0))
                                        ? "border-[#45260f] shadow-[inset_0_4px_8px_rgba(0,0,0,0.6),inset_0_0_0_2px_rgba(180,130,40,0.4)] opacity-80 scale-[0.98]"
                                        : "border-[#45260f] shadow-[inset_0_2px_2px_rgba(255,255,255,0.6),inset_0_-2px_2px_rgba(0,0,0,0.4),inset_0_0_0_2px_rgba(230,180,80,0.5),0_4px_6px_rgba(0,0,0,0.7)] hover:brightness-110"
                                        }`}
                                >
                                    <img
                                        src="/bookicon2.png"
                                        alt="Book"
                                        className="w-[36px] h-[36px] object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]"
                                    />
                                    <div className="flex flex-col items-center">
                                        <span className="text-black font-['Arial'] text-[14px] font-black tracking-wider leading-[1.1] text-center whitespace-nowrap" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.8)' }}>PSA of David</span>
                                        <span className="text-black font-['Arial'] text-[13.5px] font-black tracking-widest leading-[1.1] text-center whitespace-nowrap" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.8)' }}>73/75 CHP</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Row: Keypad with Refresh and Confirm */}
                            <div
                                className="w-full flex items-center justify-between border-2 border-[#a67c38] py-[6px] px-[8px] rounded-[13px] shadow-[inset_0_3px_6px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.2)]"
                                style={{
                                    backgroundImage: "url('/weeknumbg.png')",
                                    backgroundSize: '285% 470%',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat'
                                }}
                            >
                                {/* Refresh Button */}
                                <button
                                    onClick={() => setSelectedWeek(null)}
                                    className="w-[42px] h-[42px] shrink-0 rounded-full transition-all active:scale-95 hover:brightness-110 drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]"
                                    style={{
                                        backgroundImage: "url('/Resetbutton.png')",
                                        backgroundSize: 'auto 160%',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat'
                                    }}>
                                </button>

                                <div className="flex items-center gap-[4px] ml-[8px]">
                                    <span
                                        className="text-[14px] uppercase font-black tracking-widest text-black font-['Arial']"
                                        style={{
                                            writingMode: 'vertical-rl',
                                            transform: 'rotate(180deg)'
                                        }}
                                    >
                                        WEEK
                                    </span>
                                </div>

                                <div className="flex-1 flex flex-wrap items-center justify-evenly px-[4px] gap-y-[4px] font-bold text-[22px] text-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)] font-['Arial']">
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setSelectedWeek(prev => {
                                                    if (prev === null) return String(n);
                                                    if (prev.length >= 3) return prev;
                                                    return prev + String(n);
                                                });
                                            }}
                                            className={`cursor-pointer w-[24px] h-[24px] sm:w-[28px] sm:h-[28px] flex items-center justify-center rounded-full hover:bg-[#e4c995] transition-all duration-200 font-bold font-['Arial'] text-[18px] sm:text-[22px] ${selectedWeek !== null && selectedWeek.includes(String(n)) ? 'scale-110 z-10 relative shadow-[inset_0_2px_3px_rgba(255,255,255,0.7),inset_0_-2px_4px_rgba(0,0,0,0.6),0_5px_5px_rgba(0,0,0,0.8)]' : ''}`}
                                            style={selectedWeek !== null && selectedWeek.includes(String(n)) ? {
                                                WebkitTextStroke: '0.3px currentColor',
                                                backgroundImage: "url('/highlight.png')",
                                                backgroundSize: 'auto 133%',
                                                backgroundPosition: 'center',
                                                backgroundRepeat: 'no-repeat'
                                            } : { WebkitTextStroke: '0.3px currentColor' }}>
                                            {n}
                                        </button>
                                    ))}
                                </div>

                                {/* Confirm Button */}
                                <button
                                    onClick={handleSubmit}
                                    className="w-[42px] h-[42px] shrink-0 rounded-full transition-all active:scale-95 hover:brightness-110 drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]"
                                    style={{
                                        backgroundImage: "url('/submitbutton.png')",
                                        backgroundSize: 'auto 160%',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat'
                                    }}>
                                </button>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-[21px] mb-[21px] pb-[13px]">
                            <div className="flex gap-[13px]">
                                <button
                                    onClick={() => handleViewChart(true)}
                                    className="flex-[0.350] h-[44px] rounded-[8px] flex items-center justify-center gap-[6px] border border-[#45260f] text-black [text-shadow:0_1px_1px_rgba(255,255,255,0.6)] font-black text-[16px] tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-[inset_0_2px_2px_rgba(255,255,255,0.6),inset_0_-2px_2px_rgba(0,0,0,0.4),inset_0_0_0_2px_rgba(230,180,80,0.5),0_4px_6px_rgba(0,0,0,0.7)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                                    style={{ backgroundImage: "url('/copperbuttonbg.png')", backgroundSize: '200% 200%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', WebkitTextStroke: '0.4px currentColor' }}
                                >
                                    <i className="pi pi-print text-[14px] font-black"></i> PRINT
                                </button>
                                <button
                                    onClick={handleViewChart}
                                    className="flex-[0.350] h-[44px] rounded-[8px] flex items-center justify-center gap-[6px] border border-[#45260f] text-black [text-shadow:0_1px_1px_rgba(255,255,255,0.6)] font-black text-[16px] tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-[inset_0_2px_2px_rgba(255,255,255,0.6),inset_0_-2px_2px_rgba(0,0,0,0.4),inset_0_0_0_2px_rgba(230,180,80,0.5),0_4px_6px_rgba(0,0,0,0.7)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                                    style={{ backgroundImage: "url('/copperbuttonbg.png')", backgroundSize: '200% 200%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', WebkitTextStroke: '0.4px currentColor' }}
                                >
                                    <i className="pi pi-eye text-[14px] font-black"></i> VIEW
                                </button>
                                <button
                                    className="flex-[0.350] h-[44px] rounded-[8px] flex items-center justify-center gap-[6px] border border-[#45260f] text-black [text-shadow:0_1px_1px_rgba(255,255,255,0.6)] font-black text-[16px] tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-[inset_0_2px_2px_rgba(255,255,255,0.6),inset_0_-2px_2px_rgba(0,0,0,0.4),inset_0_0_0_2px_rgba(230,180,80,0.5),0_4px_6px_rgba(0,0,0,0.7)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                                    style={{ backgroundImage: "url('/copperbuttonbg.png')", backgroundSize: '200% 200%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', WebkitTextStroke: '0.4px currentColor' }}
                                >
                                    <i className="pi pi-send text-[14px] font-black"></i> SEND
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Back Side */}
                    <div className={`absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[url('/357playerBG.png')] bg-[length:100%_100%] bg-no-repeat border-[3px] border-[#9a7638] rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_0_2px_10px_rgba(255,255,255,0.7),inset_0_-2px_10px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden ring-4 ring-[#e5cf9f] ring-opacity-50 p-[20px] ${!isFlipped ? 'pointer-events-none' : ''}`}>

                        {/* Header / Back Button */}
                        <div className="flex justify-between items-center mb-[20px] pb-[10px] border-b border-[#5a3618]">

                            <button
                                onClick={() => setIsFlipped(false)}
                                className="px-[16px] py-[6px] flex items-center justify-center gap-[6px] border border-[#45260f] rounded-[8px] text-[#2b170c] font-black tracking-widest shadow-[inset_0_2px_2px_rgba(255,255,255,0.6),0_4px_6px_rgba(0,0,0,0.6)] active:scale-95 transition-transform"
                                style={{ backgroundImage: "url('/copperbuttonbg.png')", backgroundSize: '200% 200%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
                            >
                                <i className="pi pi-arrow-left"></i> BACK
                            </button>
                        </div>

                        <div className="flex flex-col gap-[16px] flex-1 overflow-y-auto no-scrollbar">
                            {/* Video Player */}
                            <div className="bg-[#1c0d06] rounded-[12px] p-[8px] border-[2px] border-[#3b1a0b] shadow-[inset_0_2px_4px_rgba(255,180,140,0.1),0_4px_8px_rgba(0,0,0,0.8)]">
                                <h3 className="text-[#c9a679] font-bold text-[14px] mb-[8px] px-[4px]">Related Video</h3>
                                <div className="w-full aspect-video bg-black rounded-[8px] overflow-hidden relative">
                                    <video controls className="w-full h-full object-cover">
                                        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                                        Your browser does not support HTML video.
                                    </video>
                                </div>
                            </div>

                            {/* Audio Player */}
                            <div className="bg-[#1c0d06] rounded-[12px] p-[12px] border-[2px] border-[#3b1a0b] shadow-[inset_0_2px_4px_rgba(255,180,140,0.1),0_4px_8px_rgba(0,0,0,0.8)]">
                                <h3 className="text-[#c9a679] font-bold text-[14px] mb-[8px]">Supplemental Audio</h3>
                                <audio controls className="w-full h-[40px]">
                                    <source src="https://upload.wikimedia.org/wikipedia/commons/4/4b/River_stream_water_flowing_sound.ogg" type="audio/ogg" />
                                    Your browser does not support the audio element.
                                </audio>
                            </div>

                            {/* Reference Links */}
                            <div className="bg-[url('/357playlist.png')] bg-[length:195%_145%] bg-center bg-no-repeat rounded-[12px] p-[12px] border-[2px] border-[#3b1a0b] shadow-[inset_0_2px_4px_rgba(255,180,140,0.2),0_4px_8px_rgba(0,0,0,0.8)] flex-1">
                                <h3 className="text-[#1c0d06] font-black text-[16px] mb-[12px] drop-shadow-[0_1px_0_rgba(255,255,255,0.15)]">IMPORTANT LINKS</h3>
                                <ul className="flex flex-col gap-[8px]">
                                    {['Biblical Commentary Notes', 'Historical Context Map', 'Sermon Transcript'].map((link, idx) => (
                                        <li key={idx} className="flex items-center gap-[8px] text-[#3d1f08] font-bold bg-[#f2cd79]/20 p-[8px] rounded-[6px] hover:bg-[#f2cd79]/40 cursor-pointer transition-colors border border-[#8f583b]/30">
                                            <i className="pi pi-link text-[12px]"></i>
                                            <a href="#" className="underline">{link}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Book or Chapter Selection Modal */}
            {activeBookOrChapterPopup && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#2a1208] border-[3px] border-[#9a7638] rounded-xl p-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-col gap-[20px] min-w-[320px] relative mx-[20px]">
                        <div className="flex justify-between items-center border-b border-[#5a3618] pb-[10px]">
                            <h3 className="text-[#e3b586] font-bold text-[18px] tracking-wide font-['Times_New_Roman',_Times,_serif]">Select Option for {activeBookOrChapterPopup}</h3>
                            <button onClick={() => setActiveBookOrChapterPopup(null)} className="text-[#e3b586] hover:text-white transition-colors">
                                <i className="pi pi-times text-[18px]"></i>
                            </button>
                        </div>
                        
                        <div className="flex flex-col gap-4 mt-2">
                            <button
                                onClick={() => {
                                    const bookCode = activeBookOrChapterPopup;
                                    if (selectedBooks.includes(bookCode)) {
                                        setSelectedBooks(selectedBooks.filter(b => b !== bookCode));
                                    } else {
                                        setSelectedBooks([...selectedBooks, bookCode]);
                                    }
                                    setActiveBookOrChapterPopup(null);
                                }}
                                className={`w-full py-[12px] px-[20px] border rounded-[8px] font-bold text-[16px] transition-all ${
                                    selectedBooks.includes(activeBookOrChapterPopup)
                                        ? 'bg-gradient-to-b from-[#e3b586] via-[#a36338] to-[#47220d] text-[#ffffff] border-[#f3d5b6] shadow-[0_4px_6px_rgba(0,0,0,0.5)] scale-105'
                                        : 'bg-[#3b2512] text-[#fadfc3] border-[#5a3618] hover:bg-[#5a3618] hover:scale-105 shadow-[0_2px_4px_rgba(0,0,0,0.4)]'
                                }`}
                            >
                                {selectedBooks.includes(activeBookOrChapterPopup) ? "Deselect Full Book" : "Select Full Book"}
                            </button>
                            <button
                                onClick={() => {
                                    setActiveChapterPopupBook(activeBookOrChapterPopup);
                                    setActiveBookOrChapterPopup(null);
                                }}
                                className="w-full py-[12px] px-[20px] bg-[#3b2512] text-[#fadfc3] border border-[#5a3618] hover:bg-[#5a3618] hover:scale-105 shadow-[0_2px_4px_rgba(0,0,0,0.4)] rounded-[8px] font-bold text-[16px] transition-all"
                            >
                                Select Chapters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chapter Selection Modal */}
            {activeChapterPopupBook && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#2a1208] border-[3px] border-[#9a7638] rounded-xl p-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-col gap-[20px] w-full max-w-[450px] relative mx-[20px]">
                        <div className="flex justify-between items-center border-b border-[#5a3618] pb-[10px]">
                            <h3 className="text-[#e3b586] font-bold text-[18px] tracking-wide font-['Times_New_Roman',_Times,_serif]">Select Chapters for {activeChapterPopupBook}</h3>
                            <button onClick={() => setActiveChapterPopupBook(null)} className="text-[#e3b586] hover:text-white transition-colors">
                                <i className="pi pi-times text-[18px]"></i>
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-5 sm:grid-cols-6 gap-[8px] max-h-[300px] overflow-y-auto pr-[5px] custom-scrollbar">
                            {Array.from({ length: BOOK_CHAPTERS_COUNT[activeChapterPopupBook] || 0 }).map((_, i) => {
                                const chapterNum = i + 1;
                                const isChapterSelected = bookTypeMode === 'verses'
                                    ? (selectedVerses[`${activeChapterPopupBook}-${chapterNum}`]?.length > 0)
                                    : selectedChapters[activeChapterPopupBook]?.includes(chapterNum);
                                return (
                                    <button 
                                        key={chapterNum}
                                        onClick={() => {
                                            if (bookTypeMode === 'verses') {
                                                setActiveVersePopup({ book: activeChapterPopupBook, chapter: chapterNum });
                                            } else {
                                                toggleChapter(activeChapterPopupBook, chapterNum);
                                            }
                                        }}
                                        className={`py-[8px] px-[4px] rounded-[6px] font-bold text-center border transition-all text-[14px] ${
                                            isChapterSelected 
                                                ? 'bg-gradient-to-b from-[#e3b586] via-[#a36338] to-[#47220d] text-[#ffffff] border-[#f3d5b6] shadow-[0_4px_6px_rgba(0,0,0,0.5)] scale-105' 
                                                : 'bg-[#3b2512] text-[#fadfc3] border-[#5a3618] hover:bg-[#5a3618] hover:scale-105 shadow-[0_2px_4px_rgba(0,0,0,0.4)]'
                                        }`}
                                    >
                                        {chapterNum}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <div className="flex justify-end pt-[10px] mt-[5px]">
                            <button
                                onClick={() => setActiveChapterPopupBook(null)}
                                className="px-[20px] py-[8px] bg-gradient-to-b from-[#e3b586] via-[#a36338] to-[#47220d] border border-[#f3d5b6] shadow-[0_4px_6px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.4)] text-[#ffffff] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] rounded-[8px] font-['Times_New_Roman',_Times,_serif] font-bold text-[16px] tracking-wide hover:brightness-110 active:scale-95 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Verse Selection Modal */}
            {activeVersePopup && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#2a1208] border-[3px] border-[#9a7638] rounded-xl p-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-col gap-[20px] w-full max-w-[450px] relative mx-[20px]">
                        <div className="flex justify-between items-center border-b border-[#5a3618] pb-[10px]">
                            <h3 className="text-[#e3b586] font-bold text-[18px] tracking-wide font-['Times_New_Roman',_Times,_serif]">Select Verses for {activeVersePopup.book} {activeVersePopup.chapter}</h3>
                            <button onClick={() => setActiveVersePopup(null)} className="text-[#e3b586] hover:text-white transition-colors">
                                <i className="pi pi-times text-[18px]"></i>
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-5 sm:grid-cols-6 gap-[8px] max-h-[300px] overflow-y-auto pr-[5px] custom-scrollbar">
                            {Array.from({ length: getVerseCount(activeVersePopup.book, activeVersePopup.chapter) }).map((_, i) => {
                                const verseNum = i + 1;
                                const key = `${activeVersePopup.book}-${activeVersePopup.chapter}`;
                                const isVerseSelected = selectedVerses[key]?.includes(verseNum);
                                return (
                                    <button 
                                        key={verseNum}
                                        onClick={() => toggleVerse(activeVersePopup.book, activeVersePopup.chapter, verseNum)}
                                        className={`py-[8px] px-[4px] rounded-[6px] font-bold text-center border transition-all text-[14px] ${
                                            isVerseSelected 
                                                ? 'bg-gradient-to-b from-[#e3b586] via-[#a36338] to-[#47220d] text-[#ffffff] border-[#f3d5b6] shadow-[0_4px_6px_rgba(0,0,0,0.5)] scale-105' 
                                                : 'bg-[#3b2512] text-[#fadfc3] border-[#5a3618] hover:bg-[#5a3618] hover:scale-105 shadow-[0_2px_4px_rgba(0,0,0,0.4)]'
                                        }`}
                                    >
                                        {verseNum}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <div className="flex justify-end pt-[10px] mt-[5px]">
                            <button
                                onClick={() => setActiveVersePopup(null)}
                                className="px-[20px] py-[8px] bg-gradient-to-b from-[#e3b586] via-[#a36338] to-[#47220d] border border-[#f3d5b6] shadow-[0_4px_6px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.4)] text-[#ffffff] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] rounded-[8px] font-['Times_New_Roman',_Times,_serif] font-bold text-[16px] tracking-wide hover:brightness-110 active:scale-95 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Book Type Modal */}
            {showBookTypePopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#2a1208] border-[3px] border-[#9a7638] rounded-xl p-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-col gap-[20px] min-w-[320px] relative mx-[20px]">
                        <div className="flex justify-between items-center border-b border-[#5a3618] pb-[10px]">
                            <h3 className="text-[#e3b586] font-bold text-[18px] tracking-wide font-['Times_New_Roman',_Times,_serif]">Select Chart Type</h3>
                            <button onClick={() => setShowBookTypePopup(false)} className="text-[#e3b586] hover:text-white transition-colors">
                                <i className="pi pi-times text-[18px]"></i>
                            </button>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-[#5a3618]/50 rounded-md transition-colors">
                                <input type="radio" name="bookType" checked={bookTypeMode === 'book'} onChange={() => setBookTypeMode('book')} className="accent-[#c9a679] w-4 h-4"/>
                                <span className="text-[#fadfc3] text-base font-sans font-semibold">Create chart by book</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-[#5a3618]/50 rounded-md transition-colors">
                                <input type="radio" name="bookType" checked={bookTypeMode === 'book_chapter'} onChange={() => setBookTypeMode('book_chapter')} className="accent-[#c9a679] w-4 h-4"/>
                                <span className="text-[#fadfc3] text-base font-sans font-semibold">Create chart by book and chapter</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-[#5a3618]/50 rounded-md transition-colors">
                                <input type="radio" name="bookType" checked={bookTypeMode === 'chapter'} onChange={() => setBookTypeMode('chapter')} className="accent-[#c9a679] w-4 h-4"/>
                                <span className="text-[#fadfc3] text-base font-sans font-semibold">Create chart by chapter</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-[#5a3618]/50 rounded-md transition-colors">
                                <input type="radio" name="bookType" checked={bookTypeMode === 'verses'} onChange={() => setBookTypeMode('verses')} className="accent-[#c9a679] w-4 h-4"/>
                                <span className="text-[#fadfc3] text-base font-sans font-semibold">Create chart by verses</span>
                            </label>
                        </div>
                        
                        <div className="flex justify-end pt-[10px] mt-[5px]">
                            <button
                                onClick={() => setShowBookTypePopup(false)}
                                className="px-[20px] py-[8px] bg-gradient-to-b from-[#e3b586] via-[#a36338] to-[#47220d] border border-[#f3d5b6] shadow-[0_4px_6px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.4)] text-[#ffffff] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] rounded-[8px] font-['Times_New_Roman',_Times,_serif] font-bold text-[16px] tracking-wide hover:brightness-110 active:scale-95 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#2a1208] border-[3px] border-[#9a7638] rounded-xl p-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-col gap-[20px] min-w-[320px] relative">
                        <div className="flex justify-between items-center border-b border-[#5a3618] pb-[10px]">
                            <h3 className="text-[#e3b586] font-bold text-[18px] tracking-wide font-['Times_New_Roman',_Times,_serif]">Select Theme Color</h3>
                            <button onClick={() => setShowSettings(false)} className="text-[#e3b586] hover:text-white transition-colors">
                                <i className="pi pi-times text-[18px]"></i>
                            </button>
                        </div>

                        <div>
                            <p className="text-[#fadfc3] text-[14px] mb-[10px] font-bold">Transformation Colors</p>
                            <div className="flex flex-wrap gap-[12px] justify-start">
                                {transformationColors.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setThemeColor(color)}
                                        className={`w-[40px] h-[40px] rounded-full border-[3px] transition-all hover:scale-110 ${themeColor === color ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.6)]' : 'border-[#5a3618] shadow-md'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-[15px] pt-[15px] border-t border-[#5a3618]">
                            <p className="text-[#fadfc3] text-[14px] font-bold m-0 flex-1">Custom Color</p>
                            <input
                                type="color"
                                value={themeColor}
                                onChange={(e) => setThemeColor(e.target.value)}
                                className="w-[44px] h-[44px] rounded cursor-pointer border-2 border-[#5a3618] p-0 bg-transparent"
                            />
                        </div>

                        <div className="flex justify-end pt-[10px] mt-[5px]">
                            <button
                                onClick={() => {
                                    setActiveThemeColor(themeColor);
                                    setShowSettings(false);
                                }}
                                className="px-[24px] py-[8px] bg-gradient-to-b from-[#e3b586] to-[#a36338] hover:brightness-110 active:scale-95 transition-all rounded-[6px] border border-[#5a3618] text-[#2a1208] font-bold text-[16px] shadow-[0_4px_6px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                            >
                                APPLY
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TtoMT357Player;
