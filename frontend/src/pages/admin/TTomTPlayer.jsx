import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { splitS3Data, splitS4Data } from '../../utils/chartDataSplitter';

const formatDateTime = (date) => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    const day = days[date.getDay()];
    const dateNum = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${day} ${dateNum} ${month} ${year} ${hours}:${minutes} ${ampm}`;
};

const DividerBox = ({ letter, letterColor, onClick }) => (
    <div
        onClick={() => {
            const hexMatch = letterColor.match(/\[(.*?)\]/);
            if (hexMatch && onClick) onClick(hexMatch[1]);
        }}
        className="flex flex-col items-center justify-between min-w-0 border-[1.5px] border-gray-400 bg-white shadow-sm pt-2 pb-2 cursor-pointer hover:bg-gray-100 transition-colors"
        style={{ flex: 1.0 }}
    >
        <span className={`font-serif font-black text-xl leading-none drop-shadow-sm ${letterColor}`}>
            {letter}
        </span>
    </div>
);

const Pencil = ({ label, baseNum, bodyColorClass, tipColorClass, textColor, onClick }) => {
    return (
        <div
            onClick={() => {
                const hexMatch = bodyColorClass.match(/\[(.*?)\]/);
                if (hexMatch && onClick) onClick(hexMatch[1]);
            }}
            className="flex flex-col items-center min-w-0 bg-white shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
            style={{
                flex: 1.0,
                clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 8px))',
                WebkitClipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 8px))'
            }}
        >
            <div className={`w-full h-12 sm:h-14 flex justify-center ${tipColorClass}`}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full drop-shadow-sm">
                    <polygon points="50,0 0,100 100,100" fill="#f4d1a6" />
                    <polygon points="50,0 25,50 75,50" fill="currentColor" />
                </svg>
            </div>

            <div className={`w-full flex-grow ${bodyColorClass} bg-gradient-to-r from-black/10 via-transparent to-black/20 border-t border-black/20 flex flex-col justify-center items-center py-2 relative overflow-hidden min-h-[50px] h-14 sm:h-18`}>
                <span className="transform -rotate-90 text-[0.55rem] sm:text-[0.65rem] font-black text-black tracking-tight uppercase origin-center whitespace-nowrap z-10">
                    {label}
                </span>
            </div>

            <div className={`w-full h-10 sm:h-12 ${bodyColorClass} bg-gradient-to-r from-black/20 via-transparent to-black/30 border-t border-black/30 flex items-center justify-center`}>
                <span className={`font-black text-sm sm:text-base ${textColor}`}>{baseNum}</span>
            </div>
        </div>
    );
};

const WisdomOverlay = ({ onPencilClick, onLetterClick }) => {
    const [texts, setTexts] = React.useState({
        W: "ISDOM OF GOD",
        I: "MAGINATION",
        S: "CRIPTURES TO PRAYER",
        D: "AILY GROWING IN GODLINESS",
        O: "BEDIENCE TO GOD'S WILL",
        M: "EDITATING ON GOD'S CHARACTER"
    });
    const [activeSquare, setActiveSquare] = React.useState(null);

    const wisdomItems = [
        { letter: 'W', color: '#8e2b8c', key: 'W' },
        { letter: 'I', color: '#294291', key: 'I' },
        { letter: 'S', color: '#86c5f7', key: 'S' },
        { letter: 'D', color: '#38b948', key: 'D' },
        { letter: 'O', color: '#e3242b', key: 'O' },
        { letter: 'M', color: '#ed9b26', key: 'M' }
    ];

    return (
        <div className="bg-white flex-grow flex flex-col pt-4 pb-2 px-1 rounded-b-lg overflow-hidden border-t-4 border-[#12182b] w-full h-full">
            {/* Pencils Row */}
            <div className="flex px-1 gap-px h-[190px] sm:h-[210px] pb-2 w-full justify-between items-stretch">
                <Pencil label="FAMILY" baseNum="1" bodyColorClass="bg-[#86c5f7]" tipColorClass="text-[#86c5f7]" textColor="text-black" onClick={onPencilClick} />
                <DividerBox letter="W" letterColor="text-[#8e2b8c]" num="1" onClick={(c) => { onLetterClick(c); setActiveSquare('W'); }} />

                <Pencil label="FINANCE" baseNum="2" bodyColorClass="bg-[#38b948]" tipColorClass="text-[#38b948]" textColor="text-black" onClick={onPencilClick} />
                <DividerBox letter="I" letterColor="text-[#294291]" num="2" onClick={(c) => { onLetterClick(c); setActiveSquare('I'); }} />

                <Pencil label="GOVERNMENT" baseNum="3" bodyColorClass="bg-[#4579d4]" tipColorClass="text-[#4579d4]" textColor="text-black" onClick={onPencilClick} />
                <DividerBox letter="S" letterColor="text-[#86c5f7]" num="3" onClick={(c) => { onLetterClick(c); setActiveSquare('S'); }} />

                <Pencil label="SPIRITUALITY" baseNum="4" bodyColorClass="bg-[#ebe244]" tipColorClass="text-[#ebe244]" textColor="text-black" onClick={onPencilClick} />
                <DividerBox letter="D" letterColor="text-[#38b948]" num="4" onClick={(c) => { onLetterClick(c); setActiveSquare('D'); }} />

                <Pencil label="TALENT" baseNum="5" bodyColorClass="bg-[#8b2671]" tipColorClass="text-[#8b2671]" textColor="text-black" onClick={onPencilClick} />
                <DividerBox letter="O" letterColor="text-[#e3242b]" num="5" onClick={(c) => { onLetterClick(c); setActiveSquare('O'); }} />

                <Pencil label="TRAINING" baseNum="6" bodyColorClass="bg-[#f17a41]" tipColorClass="text-[#f17a41]" textColor="text-black" onClick={onPencilClick} />
                <DividerBox letter="M" letterColor="text-[#ed9b26]" num="6" onClick={(c) => { onLetterClick(c); setActiveSquare('M'); }} />

                <Pencil label="SERVICE" baseNum="7" bodyColorClass="bg-[#e3242b]" tipColorClass="text-[#e3242b]" textColor="text-black" onClick={onPencilClick} />
            </div>

            {/* TRANSFORMATION bar */}
            <div className="bg-[#181a1f] text-white font-black text-center tracking-[0.4em] py-1.5 text-[0.75rem] border-[3px] border-gray-400 mt-1 uppercase w-full">
                T R A N S F O R M A T I O N
            </div>

            {/* List */}
            <div className="px-3 py-2 flex flex-col gap-1 font-bold font-serif whitespace-nowrap bg-white overflow-hidden w-full">
                {wisdomItems.map((item, idx) => (
                    <div
                        key={item.key}
                        className={`flex items-center gap-2 border-[2px] rounded p-1 transition-all`}
                        style={{ borderColor: activeSquare === item.key ? item.color : 'transparent' }}
                    >
                        <span style={{ color: item.color }} className="text-sm flex-shrink-0">{idx + 1}.</span>
                        <span
                            onClick={() => { setActiveSquare(item.key); onLetterClick(item.color); }}
                            style={{ color: item.color }}
                            className="text-xl font-black leading-none drop-shadow-sm cursor-pointer flex-shrink-0 px-1"
                        >
                            {item.letter}
                        </span>
                        <input
                            type="text"
                            value={texts[item.key]}
                            onChange={(e) => setTexts({ ...texts, [item.key]: e.target.value })}
                            className="text-black text-xs font-black uppercase tracking-wider bg-transparent outline-none flex-grow min-w-0"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

const explodeBookString = (str, booksDB) => {
    if (!str) return [];

    const parts = str.split(',').map(s => s.trim());
    const exploded = [];

    const toTitleCase = (str) => {
        const spaced = str.replace(/^(\d+)([a-zA-Z]+)/, '$1 $2');
        return spaced.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    };

    const getFullName = (abbr) => {
        if (!booksDB || !booksDB.length) return toTitleCase(abbr);
        const book = booksDB.find(b =>
            (b.short_form || '').trim().toUpperCase() === abbr.trim().toUpperCase() ||
            (b.name || '').trim().toUpperCase() === abbr.trim().toUpperCase()
        );
        return book ? toTitleCase(book.name.trim()) : toTitleCase(abbr);
    };

    parts.forEach(part => {
        const rangeMatch = part.match(/^(.+?)\s+(\d+)\s*-\s*(\d+)$/);
        const singleMatch = part.match(/^(.+?)\s+(\d+)$/);

        if (rangeMatch) {
            const bookName = getFullName(rangeMatch[1].trim());
            const from = parseInt(rangeMatch[2]);
            const to = parseInt(rangeMatch[3]);
            for (let i = from; i <= to; i++) {
                exploded.push(`${bookName} ${i}`);
            }
        } else if (singleMatch) {
            const bookName = getFullName(singleMatch[1].trim());
            exploded.push(`${bookName} ${singleMatch[2]}`);
        } else {
            exploded.push(getFullName(part));
        }
    });

    return exploded;
};

const TTomTPlayer = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:8000/api/logout', {}, { withCredentials: true });
        } catch (error) {
            console.error("Logout error", error);
        }
        navigate('/');
    };

    // Parse the ?days= parameter, defaulting to 30 if not provided
    const searchParams = new URLSearchParams(location.search);
    const trackingDays = parseInt(searchParams.get('days')) || 30;

    const [fetchedPayload, setFetchedPayload] = useState([]);
    const [fetchedFilter, setFetchedFilter] = useState('main');
    const [fetchedModule, setFetchedModule] = useState(null);
    const [fetchedFacet, setFetchedFacet] = useState(null);
    const [fetchedPhase, setFetchedPhase] = useState(null);

    const moduleVal = location.state?.module || fetchedModule || 1;
    const facetVal = location.state?.facet || fetchedFacet || 1;
    const phaseVal = location.state?.phase || fetchedPhase || 1;

    const [isPlaying, setIsPlaying] = useState(false);
    const [showWisdom, setShowWisdom] = useState(false);
    const [showVideoPlayer, setShowVideoPlayer] = useState(false);
    const [currentTime, setCurrentTime] = useState(formatDateTime(new Date()));
    const [selectedDay, setSelectedDay] = useState(1);
    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);
    const [contentDB, setContentDB] = useState([]);

    const [playerBorderColor, setPlayerBorderColor] = useState('#000000'); // default black top border
    const [playerBgColor, setPlayerBgColor] = useState('rgb(81, 106, 135)');

    const [activeTrackName, setActiveTrackName] = useState('');
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioProgress, setAudioProgress] = useState(0);
    const audioRef = useRef(new Audio());
    const playerStateRef = useRef(null);

    // Local Completion Tracking to Unlock Days
    const [completedBooks, setCompletedBooks] = useState(() => {
        try {
            return new Set(JSON.parse(localStorage.getItem('completed_books') || '[]'));
        } catch {
            return new Set();
        }
    });

    useEffect(() => {
        localStorage.setItem('completed_books', JSON.stringify([...completedBooks]));
    }, [completedBooks]);

    useEffect(() => {
        if (activeTrackName && activeTrackName !== '') {
            setCompletedBooks(prev => {
                const newSet = new Set(prev);
                newSet.add(activeTrackName);
                return newSet;
            });
        }
    }, [activeTrackName]);

    // Core Refs for Cube Math
    const playerRef = useRef(null);
    const [playerWidth, setPlayerWidth] = useState(420);

    // Horizontal Scroll Drag Logic for Desktop Compatibility
    const playlistScrollRef = useRef(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const dragged = useRef(false);

    const handleMouseDown = (e) => {
        isDragging.current = true;
        dragged.current = false;
        startX.current = e.pageX - playlistScrollRef.current.offsetLeft;
        scrollLeft.current = playlistScrollRef.current.scrollLeft;
    };
    const handleMouseLeave = () => { isDragging.current = false; };
    const handleMouseUp = () => { isDragging.current = false; };
    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        e.preventDefault();
        const x = e.pageX - playlistScrollRef.current.offsetLeft;
        const walk = (x - startX.current) * 2;
        if (Math.abs(walk) > 5) dragged.current = true;
        playlistScrollRef.current.scrollLeft = scrollLeft.current - walk;
    };

    const activeVideoUrl = React.useMemo(() => {
        if (!activeTrackName) return null;
        const parts = activeTrackName.trim().split(' ');
        const chapNum = parseInt(parts.pop());
        const bookName = parts.join(' ').toUpperCase();
        const content = contentDB.find(c => c.book_name.toUpperCase() === bookName && parseInt(c.chapter_number) === chapNum);
        return content?.video_url ? `http://localhost:8000${content.video_url}` : null;
    }, [activeTrackName, contentDB]);

    const activeRefLink = React.useMemo(() => {
        if (!activeTrackName) return null;
        const parts = activeTrackName.trim().split(' ');
        const chapNum = parseInt(parts.pop());
        const bookName = parts.join(' ').toUpperCase();
        const content = contentDB.find(c => c.book_name.toUpperCase() === bookName && parseInt(c.chapter_number) === chapNum);
        return content?.ref_link || null;
    }, [activeTrackName, contentDB]);

    useEffect(() => {
        axios.get('http://localhost:8000/api/books', { withCredentials: true })
            .then(res => setBooksDB(res.data))
            .catch(console.error);

        axios.get('http://localhost:8000/api/chapters', { withCredentials: true })
            .then(res => setChaptersDB(res.data))
            .catch(console.error);

        axios.get('http://localhost:8000/api/contents/list', { withCredentials: true })
            .then(res => setContentDB(res.data))
            .catch(err => console.error("Contents DB fetch error", err));

        // Audio Events
        const ad = audioRef.current;
        const updateTime = () => setAudioProgress(ad.currentTime);
        const updateDuration = () => setAudioDuration(ad.duration);
        const onEnd = () => {
            setIsPlaying(false);
            if (!playerStateRef.current) return;
            const { activeTrackName: currTrack, playlistBooks: currPlaylist, contentDB: currDB } = playerStateRef.current;

            if (!currTrack || !currPlaylist) return;

            const currentIndex = currPlaylist.findIndex(b => b.name === currTrack);
            if (currentIndex !== -1 && currentIndex < currPlaylist.length - 1) {
                // Find next valid track with audio
                for (let i = currentIndex + 1; i < currPlaylist.length; i++) {
                    const nextTrackName = currPlaylist[i].name;
                    const parts = nextTrackName.trim().split(' ');
                    const chapNum = parseInt(parts.pop());
                    const bookName = parts.join(' ').toUpperCase();

                    const content = currDB.find(c => c.book_name.toUpperCase() === bookName && parseInt(c.chapter_number) === chapNum);
                    if (content && content.audio_url) {
                        ad.src = `http://localhost:8000${content.audio_url}`;
                        ad.play();
                        setActiveTrackName(nextTrackName);
                        setIsPlaying(true);
                        break;
                    }
                }
            }
        };

        ad.addEventListener('timeupdate', updateTime);
        ad.addEventListener('loadedmetadata', updateDuration);
        ad.addEventListener('ended', onEnd);

        // Resize tracking for perfect Cube proportions
        if (playerRef.current) setPlayerWidth(playerRef.current.offsetWidth);
        const handleResize = () => {
            if (playerRef.current) setPlayerWidth(playerRef.current.offsetWidth);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            ad.removeEventListener('timeupdate', updateTime);
            ad.removeEventListener('loadedmetadata', updateDuration);
            ad.removeEventListener('ended', onEnd);
            ad.pause();
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const playTrack = (bookStr) => {
        const parts = bookStr.trim().split(' ');
        const chapNum = parseInt(parts.pop());
        const bookName = parts.join(' ').toUpperCase();

        const content = contentDB.find(c => c.book_name.toUpperCase() === bookName && parseInt(c.chapter_number) === chapNum);
        if (content && content.audio_url) {
            audioRef.current.src = `http://localhost:8000${content.audio_url}`;
            audioRef.current.play();
            setActiveTrackName(bookStr);
            setIsPlaying(true);
        } else {
            console.log("No audio found for:", bookStr);
        }
    };

    const togglePlay = () => {
        if (!activeTrackName) {
            // Pick first playable track from the playlist
            for (const bookObj of playlistBooks) {
                const bookStr = bookObj.name;
                const parts = bookStr.trim().split(' ');
                const chapNum = parseInt(parts.pop());
                const bookName = parts.join(' ').toUpperCase();

                const content = contentDB.find(c => c.book_name.toUpperCase() === bookName && parseInt(c.chapter_number) === chapNum);
                if (content && content.audio_url) {
                    playTrack(bookStr);
                    return;
                }
            }
            return;
        }

        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const formatTrackTime = (time) => {
        if (!time || isNaN(time)) return '0:00';
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const progressPercent = audioDuration ? (audioProgress / audioDuration) * 100 : 0;

    useEffect(() => {
        if (!location.state?.payload) {
            axios.get('http://localhost:8000/api/ttom_users/me/chart', { withCredentials: true })
                .then(res => {
                    setFetchedPayload(typeof res.data.payload === 'string' ? JSON.parse(res.data.payload) : res.data.payload);
                    setFetchedFilter(res.data.filter);
                    setFetchedModule(res.data.module);
                    setFetchedFacet(res.data.facet);
                    setFetchedPhase(res.data.phase);
                })
                .catch(err => console.error("Assigned chart fetch error:", err));
        }
    }, [location.state]);

    const parsedPayload = React.useMemo(() => {
        const filter = location.state?.filter || fetchedFilter || 'main';
        let p = [];
        const payloadString = location.state?.payload;
        if (payloadString) {
            try {
                p = typeof payloadString === 'string' ? JSON.parse(payloadString) : payloadString;
            } catch (e) { }
        } else if (fetchedPayload && fetchedPayload.length > 0) {
            p = fetchedPayload;
        }

        if (filter === 'morning_evening' && p && p.length > 0 && booksDB.length > 0 && chaptersDB.length > 0) {
            // Apply standard S3 Split logic converting native chart to M/E schema safely!
            const is24x7 = JSON.stringify(p).includes('"m4b"');
            if (is24x7) {
                const { morningEveningChunks } = splitS4Data(p, booksDB, chaptersDB);
                p = morningEveningChunks;
            } else {
                const { morningEveningChunks } = splitS3Data(p, booksDB, chaptersDB);
                p = morningEveningChunks;
            }
        }

        return p;
    }, [location.state?.payload, location.state?.filter, booksDB, chaptersDB]);

    const activeDayNode = React.useMemo(() => {
        let dayNode = null;
        for (const chunk of parsedPayload) {
            if (chunk.days) {
                const match = chunk.days.find(d => d.day === selectedDay);
                if (match) {
                    dayNode = match;
                    break;
                }
            }
        }
        return dayNode;
    }, [selectedDay, parsedPayload]);

    const playlistBooks = React.useMemo(() => {
        if (!activeDayNode) return [{ name: "PROVERBS 1", type: "default" }];
        const dayNode = activeDayNode;
        const filter = location.state?.filter || 'main'; // default standard

        let fullList = [];

        let is24x7 = false;
        try { is24x7 = JSON.stringify(parsedPayload).includes('"m4b"'); } catch (e) { }

        if (filter === 'morning_evening') {
            if (is24x7) {
                // 24x7 Morning
                const morningRaw = [dayNode.m1b, dayNode.m2b, dayNode.m3b, dayNode.m4b_morning].filter(Boolean);
                morningRaw.forEach(str => explodeBookString(str, booksDB).forEach(b => fullList.push({ name: b, type: 'morning' })));

                // 24x7 Evening
                const eveningRaw = [dayNode.m4b_evening].filter(Boolean);
                eveningRaw.forEach(str => explodeBookString(str, booksDB).forEach(b => fullList.push({ name: b, type: 'evening' })));
            } else {
                // Standard Morning
                const morningRaw = [dayNode.m1b, dayNode.m2b, dayNode.m3b_morning].filter(Boolean);
                morningRaw.forEach(str => explodeBookString(str, booksDB).forEach(b => fullList.push({ name: b, type: 'morning' })));

                // Standard Evening
                const eveningRaw = [dayNode.m3b_evening].filter(Boolean);
                eveningRaw.forEach(str => explodeBookString(str, booksDB).forEach(b => fullList.push({ name: b, type: 'evening' })));
            }
        } else {
            // Default Main
            const defaultRaw = [dayNode.m1b, dayNode.m2b, dayNode.m3b, dayNode.m4b].filter(Boolean);
            defaultRaw.forEach(str => explodeBookString(str, booksDB).forEach(b => fullList.push({ name: b, type: 'default' })));
        }

        return fullList.length ? fullList : [{ name: "PROVERBS 1", type: "default" }];
    }, [activeDayNode, booksDB, location.state?.filter]);

    useEffect(() => {
        playerStateRef.current = { activeTrackName, playlistBooks, contentDB };
    }, [activeTrackName, playlistBooks, contentDB]);

    // Sequential Unlock Logic!
    const unlockedDays = React.useMemo(() => {
        const filter = location.state?.filter || 'main';
        const daysNodes = parsedPayload.flatMap(chunk => chunk.days || []);
        let unlocked = new Set([1]); // Day 1 is always accessible!

        // Sort just in case the backend payload JSON isn't natively sequential
        const sortedDays = [...daysNodes].sort((a, b) => a.day - b.day);

        let is24x7 = false;
        try { is24x7 = JSON.stringify(parsedPayload).includes('"m4b"'); } catch (e) { }

        for (let i = 0; i < sortedDays.length; i++) {
            const dayObj = sortedDays[i];

            let raw = [];
            if (filter === 'morning_evening') {
                if (is24x7) {
                    raw = [
                        dayObj.m1b, dayObj.m2b, dayObj.m3b, dayObj.m4b_morning,
                        dayObj.m4b_evening
                    ].filter(Boolean);
                } else {
                    raw = [
                        dayObj.m1b, dayObj.m2b, dayObj.m3b_morning,
                        dayObj.m3b_evening
                    ].filter(Boolean);
                }
            } else {
                raw = [
                    dayObj.m1b, dayObj.m2b, dayObj.m3b, dayObj.m4b
                ].filter(Boolean);
            }

            let dayLinks = [];
            raw.forEach(str => {
                dayLinks = dayLinks.concat(explodeBookString(str, booksDB));
            });

            // Is everyday link tracked?
            const isFinished = dayLinks.length > 0 && dayLinks.every(b => completedBooks.has(b));
            if (isFinished) {
                // If it is, we unlock the next numerical day dynamically!
                unlocked.add(dayObj.day + 1);
            } else {
                // Strict chronological stop!
                break;
            }
        }
        return unlocked;
    }, [parsedPayload, booksDB, completedBooks]);

    useEffect(() => {
        if (!activeTrackName && playlistBooks && playlistBooks.length > 0) {
            setActiveTrackName(playlistBooks[0].name);
        }
    }, [playlistBooks, activeTrackName]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(formatDateTime(new Date()));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Placeholder image since we don't have the exact image
    const placeholderImg = "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=500&auto=format&fit=crop&q=60"; // A generic open book with light

    // Calculate Z translation for the Cube
    const tz = playerWidth / 2;

    return (
        <div className="min-h-[calc(100vh-80px)] bg-gray-100 flex items-center justify-center p-2 sm:p-6 font-sans transition-colors duration-500 overflow-hidden">
            {/* The Player Container - Mobile Sized */}
            <div className="w-full max-w-[420px] relative" style={{ perspective: '1500px' }} ref={playerRef}>
                <div
                    className="w-full relative"
                >
                    {/* Front Face: Audio Player */}
                    <div
                        className="w-full bg-[#1a2234] border border-gray-800 shadow-2xl rounded-lg flex flex-col overflow-hidden relative"
                        style={{
                            backfaceVisibility: 'hidden',
                            transformOrigin: `50% 50% -${tz}px`,
                            transform: showVideoPlayer ? 'rotateY(-90deg)' : 'rotateY(0deg)',
                            transition: 'transform 0.7s ease-in-out',
                            pointerEvents: showVideoPlayer ? 'none' : 'auto',
                            zIndex: showVideoPlayer ? 0 : 10
                        }}
                    >

                        {/* Header (Black) */}
                        <div className="bg-black text-white px-4 py-3 flex flex-col relative">
                            <div className="flex justify-between items-start">
                                <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors p-1" title="Logout">
                                    <i className="pi pi-power-off text-xl"></i>
                                </button>
                                <div className="text-center flex flex-col items-center">
                                    <span className="text-[13px] text-gray-400 tracking-wider font-bold mb-0.5">{currentTime}</span>
                                    <h1 className="text-blue-400 font-bold text-[21px] tracking-widest mt-0.5" style={{ lineHeight: '1.2' }}>R L L T - TtomT</h1>
                                </div>
                                <button onClick={() => setShowVideoPlayer(true)} className="text-gray-400 hover:text-white transition-colors p-1">
                                    <i className="pi pi-info-circle text-xl sm:text-2xl"></i>
                                </button>
                            </div>
                            <div className="text-center mt-2">
                                <span className="text-white text-[14px] font-bold tracking-widest">MODULE:{moduleVal} - FACET:{facetVal} - PHASE:{phaseVal}</span>
                            </div>
                        </div>

                        {/* Day Header */}
                        <div className="bg-[#37475a] px-4 py-2 flex justify-between items-center border-b border-[#1a2234]">
                            <span className="text-white font-black text-lg tracking-wider">DAY {selectedDay.toString().padStart(2, '0')} :</span>
                            <span className="text-red-500 font-bold text-sm tracking-wider">ART {activeDayNode?.art || "0"}</span>
                        </div>

                        {/* Content Box (Two Columns) */}
                        <div className="bg-[#37475a] flex h-48 sm:h-56 p-2 gap-2">
                            {/* Left Column - List */}
                            <div className="w-1/2 bg-[#232f3e] relative rounded-sm p-4 text-white overflow-y-auto custom-scrollbar">
                                {playlistBooks.map((bookObj, idx) => {
                                    const bookStr = bookObj.name;
                                    const type = bookObj.type;

                                    const parts = bookStr.trim().split(' ');
                                    const chapNum = parseInt(parts.pop());
                                    const bookName = parts.join(' ').toUpperCase();
                                    const content = contentDB.find(c => c.book_name.toUpperCase() === bookName && parseInt(c.chapter_number) === chapNum);
                                    const hasAudio = content && content.audio_url;

                                    // Standard text coloring logic preventing "disabled" unreadable look when audio is missing!
                                    let textColor = hasAudio ? 'text-white hover:text-blue-200' : 'text-white/80';
                                    if (type === 'morning') textColor = hasAudio ? 'text-green-400 hover:text-green-200' : 'text-green-400';
                                    if (type === 'evening') textColor = hasAudio ? 'text-blue-400 hover:text-blue-200' : 'text-blue-400';

                                    const finalColor = activeTrackName === bookStr ? (type === 'morning' ? 'text-green-300' : type === 'evening' ? 'text-blue-300' : 'text-yellow-400') : textColor;

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => hasAudio ? playTrack(bookStr) : null}
                                            className={`flex items-center gap-2 mb-1 px-2 py-1 rounded-md transition-colors ${hasAudio ? 'cursor-pointer hover:bg-white/5' : ''} ${finalColor}`}
                                            style={{ backgroundColor: activeTrackName === bookStr ? 'gray' : 'transparent' }}
                                        >
                                            <i className={`pi ${hasAudio ? (activeTrackName === bookStr && isPlaying ? 'pi-pause-circle' : 'pi-play-circle') : 'pi-stop-circle'} text-[10px]`}></i>
                                            <span className="text-sm font-bold tracking-wider">{bookStr}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Right Column - Image */}
                            <div className="w-1/2 relative">
                                <img
                                    src={placeholderImg}
                                    alt="Proverbs Artwork"
                                    className="w-full h-full object-cover rounded-sm border-2 border-black"
                                />
                                {/* Headphones icon overlay */}
                                <div className="absolute top-2 right-2 text-yellow-500 drop-shadow-md">
                                    <i className="pi pi-headphones text-4xl"></i>
                                </div>
                            </div>
                        </div>

                        {/* Audio Player Controls */}
                        <div
                            className={`px-4 py-1 pb-0.5 mt-0.5 mx-2 rounded-sm shadow-inner flex flex-col justify-center relative z-10 transition-colors duration-300 border-2`}
                            style={{
                                backgroundColor: playerBgColor,
                                borderColor: playerBorderColor
                            }}
                        >
                            <div className="flex items-center justify-between gap-2 mt-0.5 mb-0.5">
                                <button
                                    onClick={togglePlay}
                                    className="hover:scale-110 transition-transform flex-shrink-0 cursor-pointer text-black"
                                >
                                    {isPlaying ? (
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-[20px] h-[20px]">
                                            <rect x="6" y="4" width="4" height="16" rx="0.5" />
                                            <rect x="14" y="4" width="4" height="16" rx="0.5" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-[20px] h-[20px]">
                                            <path d="M6 4l14 8-14 8z" />
                                        </svg>
                                    )}
                                </button>

                                <div className="flex-grow flex flex-col justify-center overflow-hidden w-full">
                                    <div
                                        className="w-full cursor-pointer group pb-1 pt-0.5"
                                        onClick={(e) => {
                                            const bounds = e.currentTarget.getBoundingClientRect();
                                            const perc = (e.clientX - bounds.left) / bounds.width;
                                            if (audioDuration) audioRef.current.currentTime = perc * audioDuration;
                                        }}
                                    >
                                        <div className="w-full py-0.5">
                                            <div className="w-full h-1 bg-white/30 group-hover:h-1.5 transition-all duration-150 relative rounded-full">
                                                <div className="h-full bg-[#fca5a5] relative transition-all duration-100 rounded-full" style={{ width: `${progressPercent}%` }}>
                                                    <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#fca5a5] rounded-full scale-0 group-hover:scale-100 transition-transform duration-150 shadow-md"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center w-full text-black font-bold text-[11px]">
                                        <span className="flex-shrink-0 font-black">{formatTrackTime(audioProgress)}</span>
                                        <span className="text-center font-black tracking-widest text-[#1a2234] text-[11px] overflow-hidden whitespace-nowrap overflow-ellipsis leading-none px-2">
                                            {activeTrackName || (playlistBooks[0] && playlistBooks[0].name) || 'PROVERBS 1'}
                                        </span>
                                        <span className="flex-shrink-0 font-black">{formatTrackTime(audioDuration)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowWisdom(!showWisdom)}
                                    className={`transition-all duration-300 flex-shrink-0 text-black ${showWisdom ? 'text-white rotate-90 scale-110 drop-shadow-lg' : 'hover:rotate-90 hover:scale-110'}`}
                                >
                                    <i className="pi pi-cog text-lg"></i>
                                </button>
                            </div>
                        </div>

                        {/* Lower Area Stack */}
                        <div className={`relative w-full ${trackingDays > 30 ? 'h-[460px] sm:h-[480px]' : 'h-[450px] sm:h-[480px]'}`} style={{ perspective: '1000px' }}>
                            {/* Front Face: Day Selection Grid */}
                            <div
                                className="absolute inset-0 flex flex-col rounded-b-lg"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    transform: showWisdom ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                    pointerEvents: showWisdom ? 'none' : 'auto',
                                    zIndex: showWisdom ? 0 : 10
                                }}
                            >
                                <div className="p-6 bg-[#131b2e] w-full h-full overflow-y-auto custom-scrollbar rounded-b-lg">
                                    <div className={`grid grid-cols-5 ${trackingDays > 30 ? 'gap-y-2 sm:gap-y-4' : 'gap-y-4'} gap-x-2`}>
                                        {Array.from({ length: trackingDays }, (_, i) => i + 1).map((num) => {
                                            const isUnlocked = unlockedDays.has(num);
                                            return (
                                                <div
                                                    key={num}
                                                    onClick={() => {
                                                        if (isUnlocked) setSelectedDay(num);
                                                    }}
                                                    className={`text-center font-bold transition-all duration-300 select-none ${trackingDays > 30 ? 'text-base sm:text-lg' : 'text-lg'} ${isUnlocked ? 'cursor-pointer hover:text-blue-400 opacity-100 text-white' : 'cursor-not-allowed opacity-20 text-gray-500'} ${selectedDay === num ? 'text-blue-400 scale-125' : ''}`}
                                                    title={!isUnlocked ? 'Complete previous day tracks first!' : `Day ${num}`}
                                                >
                                                    {num}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Back Face: Wisdom Overlay */}
                            <div
                                className="absolute inset-0 flex flex-col rounded-b-lg"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    transform: showWisdom ? 'rotateY(0deg)' : 'rotateY(-180deg)',
                                    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                    pointerEvents: showWisdom ? 'auto' : 'none',
                                    zIndex: showWisdom ? 10 : 0
                                }}
                            >
                                <WisdomOverlay
                                    onPencilClick={(colorHex) => setPlayerBorderColor(colorHex)}
                                    onLetterClick={(colorHex) => setPlayerBgColor(colorHex)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Back Face: Video Player */}
                    <div
                        className="absolute inset-0 w-full h-full bg-[#1a2234] border border-gray-800 shadow-2xl rounded-lg flex flex-col overflow-hidden"
                        style={{
                            backfaceVisibility: 'hidden',
                            transformOrigin: `50% 50% -${tz}px`,
                            transform: showVideoPlayer ? 'rotateY(0deg)' : 'rotateY(90deg)',
                            transition: 'transform 0.7s ease-in-out',
                            pointerEvents: showVideoPlayer ? 'auto' : 'none',
                            zIndex: showVideoPlayer ? 10 : 0
                        }}
                    >
                        {/* Header (Black) */}
                        <div className="bg-black text-white px-4 py-3 flex flex-col relative w-full">
                            <div className="flex justify-between items-start">
                                <div className="p-1 invisible">
                                    <i className="pi pi-times text-xl"></i>
                                </div>
                                <div className="text-center flex flex-col items-center">
                                    <span className="text-[10px] text-gray-400 tracking-wider font-bold mb-0.5">{currentTime}</span>
                                    <h1 className="text-blue-400 font-bold text-lg tracking-widest mt-0.5">R L L T - TtomT</h1>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowVideoPlayer(false); }}
                                    className="text-blue-400 hover:text-white transition-colors p-1 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)] relative z-[99]"
                                    style={{ pointerEvents: 'auto' }}
                                >
                                    <i className="pi pi-info-circle text-xl sm:text-2xl"></i>
                                </button>
                            </div>
                            <div className="text-center mt-2">
                                <span className="text-white text-[11px] font-bold tracking-widest">MODULE:{moduleVal} - FACET:{facetVal} - PHASE:{phaseVal}</span>
                            </div>
                        </div>

                        {/* Video Stream Container */}
                        <div className="flex-grow flex flex-col justify-start bg-black p-4 overflow-y-auto custom-scrollbar">
                            {/* Video section */}
                            <div className="w-full">
                                {activeVideoUrl ? (
                                    <video
                                        src={activeVideoUrl}
                                        controls
                                        className="w-full border border-gray-600 rounded bg-gray-900 shadow-md"
                                    />
                                ) : (
                                    <div className="text-gray-500 font-bold flex flex-col items-center justify-center border border-gray-800 rounded p-6 bg-[#131b2e] gap-3">
                                        <i className="pi pi-video text-4xl opacity-50"></i>
                                        <span className="tracking-wider">No Video Available</span>
                                        <span className="text-xs font-normal opacity-70">({activeTrackName || 'Select a Track on the Front'})</span>
                                    </div>
                                )}
                            </div>

                            {/* Horizontal Floating Playlist for Videos */}
                            <div className="w-full mt-4 mb-2 select-none relative">
                                <h3 className="text-gray-500 text-[10px] tracking-widest font-black uppercase mb-3 flex justify-between px-1">
                                    <span>Playlist Sequence:</span>
                                    <span className="font-normal opacity-70 normal-case tracking-normal">({playlistBooks.length} tracks)</span>
                                </h3>
                                <div
                                    className="flex overflow-x-auto gap-3 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] cursor-grab active:cursor-grabbing"
                                    ref={playlistScrollRef}
                                    onMouseDown={handleMouseDown}
                                    onMouseLeave={handleMouseLeave}
                                    onMouseUp={handleMouseUp}
                                    onMouseMove={handleMouseMove}
                                >
                                    {playlistBooks.map((bookObj, idx) => {
                                        const bookStr = bookObj.name;
                                        const type = bookObj.type;

                                        const parts = bookStr.trim().split(' ');
                                        const chapNum = parseInt(parts.pop());
                                        const bookName = parts.join(' ').toUpperCase();
                                        const content = contentDB.find(c => c.book_name.toUpperCase() === bookName && parseInt(c.chapter_number) === chapNum);
                                        const hasVideo = content && content.video_url;
                                        const hasRef = content && content.ref_link;
                                        const hasVisuals = hasVideo || hasRef;
                                        const isActive = activeTrackName === bookStr;

                                        let inactiveClass = 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800 shadow-sm';
                                        let activeClass = 'bg-black border-gray-600 text-white shadow-xl scale-105';
                                        let symbolColor = hasVisuals ? 'text-gray-700' : 'text-gray-400';
                                        let activeSymbol = 'text-white';

                                        if (type === 'morning') {
                                            inactiveClass = 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100 shadow-sm';
                                            activeClass = 'bg-green-600 border-green-800 text-white shadow-[0_0_12px_rgba(34,197,94,0.4)] scale-105';
                                            symbolColor = hasVisuals ? 'text-green-700' : 'text-green-400/60';
                                        } else if (type === 'evening') {
                                            inactiveClass = 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100 shadow-sm';
                                            activeClass = 'bg-blue-600 border-blue-800 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)] scale-105';
                                            symbolColor = hasVisuals ? 'text-blue-700' : 'text-blue-400/60';
                                        }

                                        return (
                                            <div
                                                key={idx}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!dragged.current) {
                                                        setActiveTrackName(bookStr);
                                                    }
                                                }}
                                                className={`shrink-0 flex flex-col items-center justify-center p-2 w-[80px] sm:w-[86px] h-[80px] sm:h-[86px] rounded-2xl transition-all border ${isActive ? activeClass : inactiveClass}`}
                                                style={{ pointerEvents: 'auto' }}
                                            >
                                                <div className="relative inline-flex items-center justify-center h-[28px] w-[28px] mb-1">
                                                    <i className={`pi ${hasVideo ? 'pi-video' : (hasRef ? 'pi-link' : 'pi-video')} text-xl sm:text-2xl ${isActive ? activeSymbol : symbolColor}`}></i>
                                                    {!hasVisuals && <i className="pi pi-times absolute inset-0 flex items-center justify-center text-red-500 font-black text-[14px]"></i>}
                                                </div>
                                                <span className={`text-[9px] font-black tracking-wider text-center w-full truncate px-1 mt-1 ${isActive ? activeSymbol : (type === 'morning' ? 'text-green-700' : type === 'evening' ? 'text-blue-700' : 'text-gray-600')}`}>
                                                    {bookStr.toUpperCase()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Spacer */}
                            <div className="my-2"></div>

                            {/* Reference Links list */}
                            {activeRefLink && (
                                <div className="w-full flex-grow flex flex-col gap-2 pb-6">
                                    <h3 className="text-gray-400 text-[11px] tracking-widest font-black uppercase mb-1 px-1">Attached References:</h3>
                                    {(() => {
                                        let parsedLinks = [];
                                        try {
                                            const trimmed = activeRefLink.trim();
                                            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                                                parsedLinks = JSON.parse(trimmed);
                                            } else {
                                                parsedLinks = activeRefLink.split(',');
                                            }
                                        } catch (e) {
                                            parsedLinks = activeRefLink.split(',');
                                        }

                                        return parsedLinks.map((link, i) => {
                                            const cleanLink = link.trim();
                                            const safeHref = cleanLink.match(/^(https?:\/\/)/i) ? cleanLink : `https://${cleanLink}`;
                                            return (
                                                <a
                                                    key={i}
                                                    href={safeHref}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full text-left bg-[#131b2e] hover:bg-[#1a2234] border border-gray-800 hover:border-blue-500 text-blue-400 font-bold py-3 px-4 rounded shadow-md transition-all flex items-center justify-between"
                                                    style={{ pointerEvents: 'auto' }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <i className="pi pi-link text-lg text-gray-500"></i>
                                                        <span className="text-xs truncate max-w-[250px]">{cleanLink}</span>
                                                    </div>
                                                    <i className="pi pi-external-link text-xs text-gray-400"></i>
                                                </a>
                                            );
                                        });
                                    })()}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 0px;
                    background: transparent;
                }
            `}</style>
        </div >
    );
};

export default TTomTPlayer;
