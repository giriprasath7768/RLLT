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

const DividerBox = ({ letter, letterColor, num, onClick }) => {
    const hexColor = letterColor.match(/\[(.*?)\]/)[1];
    return (
        <div
            onClick={() => {
                if (onClick) onClick(hexColor);
            }}
            className="flex flex-col items-center justify-start min-w-0 border-[2px] bg-white shadow-sm pt-2 pb-2 cursor-pointer hover:bg-gray-100 transition-colors"
            style={{ flex: 1.0, borderColor: hexColor }}
        >
            <span className={`font-serif font-black text-xl leading-none drop-shadow-sm pb-2 ${letterColor}`}>
                {letter}
            </span>
            <span className={`font-black text-sm pt-2 pb-2 leading-none text-black`}>
                {num}
            </span>
        </div>
    );
};

const Pencil = ({ label, baseNum, bodyColorClass, tipColorClass, textColor, onClick }) => {
    return (
        <div
            onClick={() => {
                const hexMatch = bodyColorClass.match(/\[(.*?)\]/);
                if (hexMatch && onClick) onClick(hexMatch[1]);
            }}
            className="flex flex-col items-center min-w-0 bg-gray-500 border-[1px] border-black cursor-pointer hover:-translate-y-1 transition-transform relative h-full drop-shadow-md pb-0"
            style={{ flex: 1.0 }}
        >
            {/* Wooden Tip (Top 20%) */}
            <div className={`w-full h-[20%] relative flex justify-center items-end ${tipColorClass}`}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-[97%] h-full">
                    {/* Wood core */}
                    <polygon points="50,0 0,100 100,100" fill="#f4d1a6" />
                    {/* Painted pointer matching body color */}
                    <polygon points="50,0 25,50 75,50" fill="currentColor" />
                </svg>
            </div>

            {/* Hexagonal Color Body (Middle 60%) */}
            <div className={`w-[97%] h-[60%] flex relative ${bodyColorClass} overflow-hidden border-t-2 border-black/10`}>
                {/* Left face shadow */}
                <div className="w-[25%] h-full bg-black/20 border-r border-black/10"></div>

                {/* Center face Label */}
                <div className="w-[50%] h-full relative z-10">
                    <span
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 text-[13px] sm:text-[14px] font-black uppercase whitespace-nowrap"
                        style={{
                            color: textColor || '#ffffff',
                            textShadow: '-0.5px 0.5px 0px #a39b8c, -1px 1px 0px #8b8374, -2px 2px 0px #635b4c, -3px 3px 0px #4a4336, -4px 4px 4px rgba(0,0,0,0.8)',
                            letterSpacing: label.length > 8 ? '0px' : '2px'
                        }}
                    >
                        {label}
                    </span>
                </div>

                {/* Right face deep shadow */}
                <div className="w-[25%] h-full bg-black/40 border-l border-white/10"></div>
            </div>

            {/* Metal Ferrule Base (Bottom 8%) */}
            <div className="w-[100%] h-[8%] bg-gradient-to-r from-gray-500 via-gray-200 to-gray-600 flex flex-col justify-between py-[1px] sm:py-[2px] relative shadow-lg z-10 border-t-2 border-black/20 overflow-hidden">
                <div className="w-full h-[1px] bg-black/20 shadow-sm"></div>
                <div className="w-full h-[1px] bg-white/50"></div>
                <div className="w-full h-[1px] bg-black/20 shadow-sm"></div>
                <div className="w-full h-[1px] bg-white/50"></div>
            </div>

            {/* Colored Base Cap & Number (Bottom 12%) */}
            <div className={`w-[97%] h-[12%] flex items-center justify-center relative rounded-b-md shadow-md z-10 overflow-hidden ${bodyColorClass} border-t border-black/50`}>
                {/* Cylindrical shading to match 3D volume but not sharp hexagonal */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/30"></div>
                {/* The tracking digit */}
                <span className="font-extrabold text-[15px] sm:text-[18px] text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-10 relative">
                    {baseNum}
                </span>
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
    const [pencilTextColor, setPencilTextColor] = React.useState('#ffffff');
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isSliderMode, setIsSliderMode] = React.useState(false);
    const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);

    React.useEffect(() => {
        if (isSliderMode && activeSquare) {
            const idx = wisdomItems.findIndex(i => i.key === activeSquare);
            if (idx !== -1 && idx !== currentSlideIndex) {
                setCurrentSlideIndex(idx);
            }
        }
    }, [activeSquare, isSliderMode]);

    React.useEffect(() => {
        let interval;
        if (isSliderMode && !activeSquare) {
            interval = setInterval(() => {
                setCurrentSlideIndex((prev) => (prev < wisdomItems.length - 1 ? prev + 1 : 0));
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isSliderMode, activeSquare, currentSlideIndex]);

    const wisdomItems = [
        { letter: 'W', color: '#8e2b8c', key: 'W' },
        { letter: 'I', color: '#294291', key: 'I' },
        { letter: 'S', color: '#86c5f7', key: 'S' },
        { letter: 'D', color: '#38b948', key: 'D' },
        { letter: 'O', color: '#e3242b', key: 'O' },
        { letter: 'M', color: '#ed9b26', key: 'M' }
    ];

    return (
        <div className="bg-white flex-grow flex flex-col pt-0 pb-4 px-1 rounded-b-lg overflow-y-auto custom-scrollbar border-t-4 border-[#12182b] w-full h-full relative">
            {/* Pencils Row */}
            <div className="flex p-1 gap-1 h-[450px] sm:h-[450px] w-full justify-between items-stretch">
                <Pencil label="FAMILY" baseNum="1" bodyColorClass="bg-[#00c0ff]" tipColorClass="text-[#00c0ff]" textColor={pencilTextColor} onClick={onPencilClick} />
                <DividerBox letter="W" letterColor="text-[#8e2b8c]" num="1" onClick={(c) => { onLetterClick(c); setActiveSquare(prev => prev === 'W' ? null : 'W'); }} />

                <Pencil label="FINANCE" baseNum="2" bodyColorClass="bg-[#00a638]" tipColorClass="text-[#00a638]" textColor={pencilTextColor} onClick={onPencilClick} />
                <DividerBox letter="I" letterColor="text-[#294291]" num="2" onClick={(c) => { onLetterClick(c); setActiveSquare(prev => prev === 'I' ? null : 'I'); }} />

                <Pencil label="GOVERNMENT" baseNum="3" bodyColorClass="bg-[#3340cd]" tipColorClass="text-[#3340cd]" textColor={pencilTextColor} onClick={onPencilClick} />
                <DividerBox letter="S" letterColor="text-[#86c5f7]" num="3" onClick={(c) => { onLetterClick(c); setActiveSquare(prev => prev === 'S' ? null : 'S'); }} />

                <Pencil label="SPIRITUALITY" baseNum="4" bodyColorClass="bg-[#fafa33]" tipColorClass="text-[#fafa33]" textColor={pencilTextColor} onClick={onPencilClick} />
                <DividerBox letter="D" letterColor="text-[#38b948]" num="4" onClick={(c) => { onLetterClick(c); setActiveSquare(prev => prev === 'D' ? null : 'D'); }} />

                <Pencil label="TALENT" baseNum="5" bodyColorClass="bg-[#bb43b1]" tipColorClass="text-[#bb43b1]" textColor={pencilTextColor} onClick={onPencilClick} />
                <DividerBox letter="O" letterColor="text-[#e3242b]" num="5" onClick={(c) => { onLetterClick(c); setActiveSquare(prev => prev === 'O' ? null : 'O'); }} />

                <Pencil label="TRAINING" baseNum="6" bodyColorClass="bg-[#fe6d01]" tipColorClass="text-[#fe6d01]" textColor={pencilTextColor} onClick={onPencilClick} />
                <DividerBox letter="M" letterColor="text-[#ed9b26]" num="6" onClick={(c) => { onLetterClick(c); setActiveSquare(prev => prev === 'M' ? null : 'M'); }} />

                <Pencil label="SERVICE" baseNum="7" bodyColorClass="bg-[#fe0005]" tipColorClass="text-[#fe0005]" textColor={pencilTextColor} onClick={onPencilClick} />
            </div>

            {/* TRANSFORMATION Text Bar */}
            <div className="w-full bg-black py-0 text-white flex justify-between items-center px-[12px] font-black text-[14px] sm:text-[16px] mx-0 drop-shadow-md z-10 shrink-0 mb-0">
                {"TRANSFORMATION".split('').map((char, i) => (
                    <span key={i}>{char}</span>
                ))}
            </div>

            {/* Content Area */}
            <div className="px-3 pt-2 pb-2 flex flex-col justify-between font-bold font-serif whitespace-nowrap bg-white overflow-hidden w-full h-full shrink gap-0 relative">

                {/* List Header Options / Menu */}
                <div className="absolute top-1 right-2 z-30">
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center justify-center w-5 h-5 cursor-pointer focus:outline-none"
                            title="Menu"
                        >
                            <i className={`pi ${isMenuOpen ? 'pi-times' : 'pi-bars'} text-black hover:text-gray-700 transition-colors`} style={{ fontSize: '15px' }}></i>
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 top-6 bg-white border border-gray-200 shadow-xl rounded-md w-48 py-1 z-40 overflow-hidden transform origin-top-right transition-all">
                                <label className="w-full text-left px-3 py-2 text-[11px] font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer transition-colors relative mb-0">
                                    <i className="pi pi-palette" style={{ fontSize: '12px' }}></i>
                                    <span>Change Color</span>
                                    <input
                                        type="color"
                                        value={pencilTextColor}
                                        onChange={(e) => setPencilTextColor(e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                </label>
                                <button
                                    onClick={() => {
                                        setIsSliderMode(!isSliderMode);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-[11px] font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors border-t border-gray-100"
                                >
                                    <i className={isSliderMode ? "pi pi-list" : "pi pi-images"} style={{ fontSize: '12px' }}></i>
                                    <span>{isSliderMode ? "Change to List Mode" : "Change to Slider Mode"}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {!isSliderMode ? (
                    wisdomItems.map((item, idx) => (
                        <div
                            key={item.key}
                            className={`flex items-center gap-1 border-2 rounded py-0 px-1 transition-all`}
                            style={{ borderColor: activeSquare === item.key ? item.color : 'transparent' }}
                        >
                            <span style={{ color: item.color }} className="text-[12px] sm:text-[14px] font-black flex-shrink-0 leading-none">{idx + 1}.</span>
                            <span
                                onClick={() => { setActiveSquare(item.key); onLetterClick(item.color); }}
                                style={{ color: item.color }}
                                className="text-[13px] sm:text-[14px] font-black leading-none drop-shadow-sm cursor-pointer flex-shrink-0 px-1"
                            >
                                {item.letter}
                            </span>
                            <input
                                type="text"
                                value={texts[item.key]}
                                onChange={(e) => setTexts({ ...texts, [item.key]: e.target.value })}
                                className="text-black text-[10px] sm:text-[12px] font-black uppercase tracking-wider bg-transparent outline-none flex-grow min-w-0 leading-none"
                            />
                        </div>
                    ))
                ) : (
                    <div className="flex-grow flex items-center justify-center relative w-full h-full border-2 border-gray-100 rounded-lg overflow-hidden bg-white shadow-inner">
                        {/* Slide Container */}
                        <div className="w-full h-full relative" style={{ perspective: '1000px' }}>
                            {wisdomItems.map((item, idx) => (
                                <div
                                    key={item.key}
                                    className={`absolute inset-0 flex flex-col justify-center items-center transition-all duration-500 ease-in-out px-6`}
                                    style={{
                                        transform: `translateX(${(idx - currentSlideIndex) * 100}%)`,
                                        opacity: idx === currentSlideIndex ? 1 : 0,
                                        pointerEvents: idx === currentSlideIndex ? 'auto' : 'none'
                                    }}
                                >
                                    <div className="flex items-center justify-center w-full max-w-full">
                                        <div
                                            className="flex items-center justify-center w-max max-w-full border-2 rounded py-1 px-3 transition-colors duration-300"
                                            style={{ borderColor: activeSquare === item.key ? item.color : 'transparent' }}
                                        >
                                            <div
                                                className="text-[40px] sm:text-[50px] font-black drop-shadow-md cursor-pointer transition-transform hover:scale-105 leading-none pr-[2px]"
                                                style={{ color: item.color }}
                                                onClick={() => { onLetterClick(item.color); setActiveSquare(prev => prev === item.key ? null : item.key); }}
                                            >
                                                {item.letter}
                                            </div>
                                            <input
                                                type="text"
                                                value={texts[item.key]}
                                                onChange={(e) => setTexts({ ...texts, [item.key]: e.target.value })}
                                                className={`text-black font-black uppercase bg-transparent outline-none leading-tight text-left transition-all ${['M', 'D'].includes(item.key) ? 'text-[8.5px] sm:text-[10px] tracking-normal' : 'text-[12px] sm:text-[14px] tracking-widest'}`}
                                                style={{ width: `calc(${texts[item.key].length * 1.4}ch + 3rem)`, minWidth: '50px', maxWidth: '90%' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Dots Indicator */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                            {wisdomItems.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentSlideIndex(idx)}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 focus:outline-none ${idx === currentSlideIndex ? 'bg-gray-800 scale-125' : 'bg-gray-300 hover:bg-gray-400'}`}
                                ></button>
                            ))}
                        </div>
                    </div>
                )}
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
        let lookup = abbr.trim().toUpperCase();
        if (lookup === 'PRO') lookup = 'PROVERBS';

        if (!booksDB || !booksDB.length) return toTitleCase(lookup);
        const book = booksDB.find(b =>
            (b.short_form || '').trim().toUpperCase() === lookup ||
            (b.name || '').trim().toUpperCase() === lookup ||
            (b.short_form || '').trim().toUpperCase() === abbr.trim().toUpperCase() ||
            (b.name || '').trim().toUpperCase() === abbr.trim().toUpperCase()
        );
        return book ? toTitleCase(book.name.trim()) : toTitleCase(lookup);
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
            await axios.post('http://' + window.location.hostname + ':8000/api/logout', {}, { withCredentials: true });
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
    const [selectedDay, setSelectedDay] = useState(1);
    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);
    const [contentDB, setContentDB] = useState([]);
    const [userRole, setUserRole] = useState(null);

    const [playerBorderColor, setPlayerBorderColor] = useState('#000000'); // default black top border
    const [playerBgColor, setPlayerBgColor] = useState('rgb(81, 106, 135)');

    const [activeTrackName, setActiveTrackName] = useState('');
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);
    const [isVideoAutoPlay, setIsVideoAutoPlay] = useState(false);
    const [activeAudioIndex, setActiveAudioIndex] = useState(0);
    const [activeLanguage, setActiveLanguage] = useState('');
    const [showAudioSelector, setShowAudioSelector] = useState(false);
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

        let vUrl = content?.video_url || null;
        if (vUrl) {
            try {
                const trimmed = vUrl.trim();
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                    const parsed = JSON.parse(trimmed);
                    vUrl = parsed[activeVideoIndex] || parsed[0] || null;
                }
            } catch (e) {
                // If not JSON or fails to parse, leave it as is
            }
        }
        return vUrl ? `http://${window.location.hostname}:8000${vUrl}` : null;
    }, [activeTrackName, activeVideoIndex, contentDB]);

    const activeRefLink = React.useMemo(() => {
        if (!activeTrackName) return null;
        const parts = activeTrackName.trim().split(' ');
        const chapNum = parseInt(parts.pop());
        const bookName = parts.join(' ').toUpperCase();
        const content = contentDB.find(c => c.book_name.toUpperCase() === bookName && parseInt(c.chapter_number) === chapNum);
        return content?.ref_link || null;
    }, [activeTrackName, contentDB]);

    const activeTrackAudios = React.useMemo(() => {
        if (!activeTrackName) return [];
        const parts = activeTrackName.trim().split(' ');
        const chapNum = parseInt(parts.pop());
        const bookName = parts.join(' ').toUpperCase();

        const content = contentDB.find(c => c.book_name.toUpperCase() === bookName && parseInt(c.chapter_number) === chapNum);
        if (content && content.audio_url) {
            try {
                const parsed = JSON.parse(content.audio_url);
                if (Array.isArray(parsed)) return parsed;
                return [{ url: content.audio_url, language: content.audio_language || '' }];
            } catch (e) {
                return [{ url: content.audio_url, language: content.audio_language || '' }];
            }
        }
        return [];
    }, [activeTrackName, contentDB]);

    useEffect(() => {
        axios.get('http://' + window.location.hostname + ':8000/api/me', { withCredentials: true })
            .then(res => setUserRole(res.data.role))
            .catch(err => console.error("Could not fetch user role", err));

        axios.get('http://' + window.location.hostname + ':8000/api/books', { withCredentials: true })
            .then(res => setBooksDB(res.data))
            .catch(console.error);

        axios.get('http://' + window.location.hostname + ':8000/api/chapters', { withCredentials: true })
            .then(res => setChaptersDB(res.data))
            .catch(console.error);

        axios.get('http://' + window.location.hostname + ':8000/api/contents/list', { withCredentials: true })
            .then(res => setContentDB(res.data))
            .catch(err => console.error("Contents DB fetch error", err));

        // Audio Events
        const ad = audioRef.current;
        const updateTime = () => setAudioProgress(ad.currentTime);
        const updateDuration = () => setAudioDuration(ad.duration);
        const onEnd = () => {
            setIsPlaying(false);
            if (!playerStateRef.current) return;
            const { activeTrackName: currTrack, playlistBooks: currPlaylist, contentDB: currDB, activeLanguage: currLang } = playerStateRef.current;

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
                        let parsedAudios = [];
                        try {
                            parsedAudios = JSON.parse(content.audio_url);
                            if (!Array.isArray(parsedAudios)) {
                                parsedAudios = [{ url: content.audio_url, language: content.audio_language || '' }];
                            }
                        } catch (e) {
                            parsedAudios = [{ url: content.audio_url, language: content.audio_language || '' }];
                        }

                        if (parsedAudios.length > 0) {
                            let targetIdx = 0;
                            if (currLang) {
                                const matchIdx = parsedAudios.findIndex(a => a.language === currLang);
                                if (matchIdx !== -1) targetIdx = matchIdx;
                            }

                            ad.src = `http://${window.location.hostname}:8000${parsedAudios[targetIdx].url}`;
                            ad.play();
                            setActiveTrackName(nextTrackName);
                            setActiveAudioIndex(targetIdx);
                            setActiveLanguage(parsedAudios[targetIdx].language || '');
                            setActiveVideoIndex(0);
                            setIsPlaying(true);
                            break;
                        }
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

    const playTrack = (bookStr, trackIndex = 0) => {
        const parts = bookStr.trim().split(' ');
        const chapNum = parseInt(parts.pop());
        const bookName = parts.join(' ').toUpperCase();

        const content = contentDB.find(c => c.book_name.toUpperCase() === bookName && parseInt(c.chapter_number) === chapNum);
        if (content && content.audio_url) {
            let parsedAudios = [];
            try {
                parsedAudios = JSON.parse(content.audio_url);
                if (!Array.isArray(parsedAudios)) {
                    parsedAudios = [{ url: content.audio_url, language: content.audio_language || '' }];
                }
            } catch (e) {
                parsedAudios = [{ url: content.audio_url, language: content.audio_language || '' }];
            }

            if (parsedAudios.length > 0) {
                // If a track index isn't directly passed, try to match current language
                let targetIdx = trackIndex;
                if (targetIdx === 0 && playerStateRef.current?.activeLanguage && !showAudioSelector) {
                    const matchIdx = parsedAudios.findIndex(a => a.language === playerStateRef.current.activeLanguage);
                    if (matchIdx !== -1) targetIdx = matchIdx;
                }
                const track = parsedAudios[targetIdx] || parsedAudios[0];
                audioRef.current.src = `http://${window.location.hostname}:8000${track.url}`;
                audioRef.current.play();
                setActiveTrackName(bookStr);
                setActiveAudioIndex(targetIdx);
                setActiveLanguage(track.language || '');
                setActiveVideoIndex(0);
                setIsPlaying(true);
            }
            return;
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

        if (!audioRef.current.getAttribute('src')) {
            playTrack(activeTrackName);
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
            axios.get('http://' + window.location.hostname + ':8000/api/ttom_users/me/chart', { withCredentials: true })
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
        playerStateRef.current = { activeTrackName, playlistBooks, contentDB, activeLanguage };
    }, [activeTrackName, playlistBooks, contentDB, activeLanguage]);

    // Completed Days Logic
    const completedDays = React.useMemo(() => {
        const filter = location.state?.filter || 'main';
        const daysNodes = parsedPayload.flatMap(chunk => chunk.days || []);
        let completed = new Set();

        let is24x7 = false;
        try { is24x7 = JSON.stringify(parsedPayload).includes('"m4b"'); } catch (e) { }

        for (let i = 0; i < daysNodes.length; i++) {
            const dayObj = daysNodes[i];

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
                completed.add(dayObj.day);
            }
        }
        return completed;
    }, [parsedPayload, booksDB, completedBooks]);

    useEffect(() => {
        if (!activeTrackName && playlistBooks && playlistBooks.length > 0) {
            setActiveTrackName(playlistBooks[0].name);
        }
    }, [playlistBooks, activeTrackName]);

    // Placeholder image since we don't have the exact image
    const placeholderImg = "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=500&auto=format&fit=crop&q=60"; // A generic open book with light

    // Calculate Z translation for the Cube
    const tz = playerWidth / 2;

    return (
        <div className="h-[100dvh] bg-gray-100 flex items-center justify-center sm:px-4 sm:py-0 font-sans transition-colors duration-500 overflow-hidden">
            {/* The Player Container - Mobile Sized */}
            <div className="w-full max-w-[420px] h-full relative" style={{ perspective: '1500px' }} ref={playerRef}>
                <div
                    className="w-full h-full relative"
                >
                    {/* Front Face: Audio Player */}
                    <div
                        className="w-full h-full bg-[#37475a] border-[5px] border-[#1a2234] shadow-2xl rounded-none sm:rounded-lg flex flex-col overflow-hidden relative"
                        style={{
                            backfaceVisibility: 'hidden',
                            transformOrigin: `50% 50% -${tz}px`,
                            transform: showVideoPlayer ? 'rotateY(-90deg)' : 'rotateY(0deg)',
                            transition: 'transform 0.7s ease-in-out, background-color 0.3s, border-color 0.3s',
                            pointerEvents: showVideoPlayer ? 'none' : 'auto',
                            zIndex: showVideoPlayer ? 0 : 10
                        }}
                    >

                        {/* Header (Black) */}
                        <div className="bg-black text-white px-3 py-2 flex flex-col relative w-full">
                            <div className="flex justify-between items-center mb-1">
                                {userRole === 'ttom_user' ? (
                                    <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors p-0.5" title="Logout">
                                        <i className="pi pi-power-off text-xl"></i>
                                    </button>
                                ) : (
                                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors p-0.5" title="Back to Dashboard">
                                        <i className="pi pi-bars text-xl"></i>
                                    </button>
                                )}
                                <div className="flex-1 text-center font-black text-[18px] tracking-[0.2em] flex justify-center items-baseline px-2 leading-none">
                                    <span className="text-[#6195df]">T</span>
                                    <span className="text-[#e3242b] lowercase mx-1">t</span>
                                    <span className="text-[#6195df]">O M T</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowVideoPlayer(true);
                                        setIsVideoAutoPlay(false);
                                        if (audioRef.current) {
                                            audioRef.current.pause();
                                            setIsPlaying(false);
                                        }
                                    }}
                                    className="text-gray-400 hover:text-white transition-colors p-0.5 flex-shrink-0"
                                >
                                    <i className="pi pi-info-circle text-xl lg:text-2xl"></i>
                                </button>
                            </div>
                            <div className="text-center mt-1 flex justify-center items-center">
                                <span className="text-[#7292d3] tracking-[0.2em] font-black text-[18px] mr-2">R L L T</span>
                                <span className="text-white text-[12px] font-bold tracking-widest leading-none mt-1">- MODULE:{moduleVal} - FACET:{facetVal} - PHASE:{phaseVal}</span>
                            </div>
                        </div>

                        {/* Day Header */}
                        <div className="bg-[#37475a] px-3 py-1 flex justify-between items-center border-b border-[#1a2234]">
                            <span className="text-white font-black text-base tracking-wider">DAY {selectedDay.toString().padStart(2, '0')} :</span>
                            <span className="text-red-700 font-black text-xs tracking-wider">ART {activeDayNode?.art || "0"}</span>
                        </div>

                        {/* Playlist & Player Shared Wrapper */}
                        <div className="bg-[#37475a] w-full pt-0 pb-1 flex flex-col">
                            {/* Content Box (Two Columns) */}
                            <div className="flex h-[146px] sm:h-[152px] px-1 pb-1 gap-1">
                                {/* Left Column - List */}
                                <div className="w-1/2 bg-[#232f3e] relative rounded-sm p-2 sm:p-3 pt-2 text-white overflow-y-auto custom-scrollbar">
                                    {playlistBooks.map((bookObj, idx) => {
                                        const bookStr = bookObj.name;
                                        const type = bookObj.type;

                                        const parts = bookStr.trim().split(' ');
                                        const chapNum = parseInt(parts.pop());
                                        const bookName = parts.join(' ').toUpperCase();
                                        const content = contentDB.find(c => c.book_name.toUpperCase() === bookName && parseInt(c.chapter_number) === chapNum);
                                        const hasAudio = content && content.audio_url;

                                        let parsedAudios = [];
                                        if (hasAudio) {
                                            try {
                                                const parsed = JSON.parse(content.audio_url);
                                                if (Array.isArray(parsed)) parsedAudios = parsed;
                                                else parsedAudios = [{ url: content.audio_url, language: content.audio_language || '' }];
                                            } catch (e) {
                                                parsedAudios = [{ url: content.audio_url, language: content.audio_language || '' }];
                                            }
                                        }

                                        // Standard text coloring logic preventing "disabled" unreadable look when audio is missing!
                                        let textColor = hasAudio ? 'text-white hover:text-blue-200' : 'text-white/80';
                                        if (type === 'morning') textColor = hasAudio ? 'text-green-400 hover:text-green-200' : 'text-green-400';
                                        if (type === 'evening') textColor = hasAudio ? 'text-blue-400 hover:text-blue-200' : 'text-blue-400';

                                        const finalColor = activeTrackName === bookStr ? (type === 'morning' ? 'text-green-300' : type === 'evening' ? 'text-blue-300' : 'text-yellow-400') : textColor;

                                        return (
                                            <div key={idx} className="mb-1.5 flex flex-col">
                                                <div
                                                    onClick={() => hasAudio ? playTrack(bookStr) : null}
                                                    className={`flex items-center gap-2 px-2 py-1 rounded-sm transition-colors ${hasAudio ? 'cursor-pointer hover:bg-white/5' : ''} ${finalColor}`}
                                                    style={{ backgroundColor: activeTrackName === bookStr ? 'gray' : 'transparent' }}
                                                >
                                                    <i className={`pi ${hasAudio ? (activeTrackName === bookStr && isPlaying ? 'pi-pause-circle' : 'pi-play-circle') : 'pi-stop-circle'} text-[10px]`}></i>
                                                    <span className="text-[11px] font-bold uppercase tracking-wider leading-tight">{bookStr}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Right Column - Image */}
                                <div className="w-1/2 relative cursor-pointer group" onClick={() => setShowAudioSelector(!showAudioSelector)}>
                                    <img
                                        src={placeholderImg}
                                        alt="Proverbs Artwork"
                                        className={`w-full h-full object-cover rounded-sm border-2 border-black transition-opacity ${showAudioSelector ? 'opacity-20' : 'opacity-100 group-hover:opacity-80'}`}
                                    />
                                    {/* Headphones icon overlay */}
                                    <div className="absolute top-2 right-2 text-yellow-500 drop-shadow-md z-10 transition-transform group-hover:scale-110">
                                        <i className="pi pi-headphones text-4xl"></i>
                                    </div>

                                    {/* Audio Selector Overlay */}
                                    {showAudioSelector && (
                                        <div className="absolute inset-0 flex flex-col p-2 bg-black/70 rounded-sm overflow-y-auto custom-scrollbar z-20" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-between items-center mb-2 border-b border-white/20 pb-1">
                                                <h4 className="text-white text-[10px] font-bold">SELECT AUDIO TRACK</h4>
                                                <i className="pi pi-times text-white text-[10px] cursor-pointer hover:text-red-400" onClick={() => setShowAudioSelector(false)}></i>
                                            </div>
                                            {activeTrackAudios.length > 0 ? activeTrackAudios.map((aud, i) => (
                                                <button
                                                    key={i}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        playTrack(activeTrackName, i);
                                                        setShowAudioSelector(false);
                                                    }}
                                                    className={`text-left text-xs mb-1.5 p-1.5 rounded transition-colors border ${activeAudioIndex === i ? 'bg-blue-600/80 text-white font-bold border-blue-400' : 'bg-gray-800/80 text-gray-300 border-gray-600 hover:bg-gray-700'}`}
                                                >
                                                    {aud.language ? aud.language.toUpperCase() : `AUDIO TRACK ${i + 1}`}
                                                    {activeAudioIndex === i && <i className="pi pi-check ml-2 float-right text-[10px] mt-1"></i>}
                                                </button>
                                            )) : (
                                                <span className="text-gray-400 text-[10px] text-center mt-4">No Audios Available</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Audio Player Controls */}
                            <div
                                className={`px-3 mx-1 mb-1 mt-0 h-[39px] rounded-[4px] border-[5px] flex flex-col justify-center relative z-10 transition-colors duration-300 shadow-inner`}
                                style={{
                                    backgroundColor: playerBgColor,
                                    borderColor: playerBorderColor

                                }}
                            >
                                <div className="flex items-center justify-between gap-2">
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
                                            className="w-full cursor-pointer group py-0.5"
                                            onClick={(e) => {
                                                const bounds = e.currentTarget.getBoundingClientRect();
                                                const perc = (e.clientX - bounds.left) / bounds.width;
                                                if (audioDuration) audioRef.current.currentTime = perc * audioDuration;
                                            }}
                                        >
                                            <div className="w-full py-0">
                                                <div className="w-full h-1 bg-white/30 group-hover:h-1.5 transition-all duration-150 relative rounded-full">
                                                    <div className="h-full bg-[#fca5a5] relative transition-all duration-100 rounded-full" style={{ width: `${progressPercent}%` }}>
                                                        <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#fca5a5] rounded-full scale-0 group-hover:scale-100 transition-transform duration-150 shadow-md"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center w-full text-black font-bold text-[11px]">
                                            <span className="flex-shrink-0 font-black">{formatTrackTime(audioProgress)}</span>
                                            <span className="text-center font-bold uppercase tracking-widest text-[#1a2234] text-[12px] overflow-hidden whitespace-nowrap overflow-ellipsis leading-none px-2">
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
                        </div>

                        {/* Lower Area Stack */}
                        <div className={`relative w-full flex-1 min-h-0`} style={{ perspective: '1000px' }}>
                            {/* Front Face: Day Selection Grid */}
                            <div
                                className="absolute inset-0 flex flex-col rounded-none sm:rounded-b-lg"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    transform: showWisdom ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                    pointerEvents: showWisdom ? 'none' : 'auto',
                                    zIndex: showWisdom ? 0 : 10
                                }}
                            >
                                <div className="p-3 pb-4 bg-black w-full h-full overflow-y-auto custom-scrollbar rounded-none sm:rounded-b-lg">
                                    <div className={`grid grid-cols-5 ${trackingDays > 30 ? 'gap-y-[15px]' : 'gap-y-[30px]'} gap-x-2`}>
                                        {Array.from({ length: trackingDays }, (_, i) => i + 1).map((num) => {
                                            const isCompleted = completedDays.has(num);
                                            return (
                                                <div key={num} className="flex justify-center">
                                                    <div
                                                        onClick={() => {
                                                            setSelectedDay(num);
                                                        }}
                                                        className={`flex items-center justify-center font-black transition-all duration-300 select-none text-[13px] sm:text-[14px] rounded-lg ${trackingDays > 30 ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-7 h-7 sm:w-8 sm:h-8'} cursor-pointer opacity-100 ${selectedDay === num ? 'bg-blue-500 text-white scale-125 ring-2 ring-blue-300' : (isCompleted ? 'bg-blue-500 text-white opacity-90' : 'text-white hover:text-blue-200')}`}
                                                        title={`Day ${num}`}
                                                    >
                                                        {num}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Back Face: Wisdom Overlay */}
                            <div
                                className="absolute inset-0 flex flex-col rounded-none sm:rounded-b-lg"
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
                        className="absolute inset-0 w-full h-full bg-[#1a2234] border border-gray-800 shadow-2xl rounded-none sm:rounded-lg flex flex-col overflow-hidden"
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
                        <div className="bg-black text-white px-4 py-2 flex flex-col relative w-full">
                            <div className="flex justify-between items-center mb-1">
                                <div className="p-1 invisible">
                                    <i className="pi pi-times text-xl"></i>
                                </div>
                                <div className="flex-1 text-center font-black text-[18px] tracking-[0.2em] flex justify-center items-baseline px-2 leading-none">
                                    <span className="text-[#6195df]">T</span>
                                    <span className="text-[#e3242b] lowercase mx-1">t</span>
                                    <span className="text-[#6195df]">O M T</span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowVideoPlayer(false);
                                        const vp = document.getElementById('ttomt-video-player');
                                        if (vp) vp.pause();
                                    }}
                                    className="text-blue-400 hover:text-white transition-colors p-1 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)] relative z-[99] flex-shrink-0"
                                    style={{ pointerEvents: 'auto' }}
                                >
                                    <i className="pi pi-info-circle text-xl sm:text-2xl"></i>
                                </button>
                            </div>
                            <div className="text-center mt-1 flex justify-center items-center">
                                <span className="text-[#7292d3] tracking-[0.2em] font-black text-[18px] mr-2">R L L T</span>
                                <span className="text-white text-[11px] font-bold tracking-widest leading-none mt-1">- MODULE:{moduleVal} - FACET:{facetVal} - PHASE:{phaseVal}</span>
                            </div>
                        </div>

                        {/* Video Stream Container */}
                        <div className="flex-grow flex flex-col justify-start bg-black p-4 overflow-y-auto custom-scrollbar">
                            {/* Video section */}
                            <div className="w-full">
                                {activeVideoUrl ? (
                                    <video
                                        id="ttomt-video-player"
                                        key={activeVideoUrl}
                                        src={activeVideoUrl}
                                        controls
                                        autoPlay={isVideoAutoPlay}
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
                                <h3 className="text-gray-500 text-[10px] tracking-widest font-black uppercase mb-1 flex justify-between px-1">
                                    <span>Playlist Sequence:</span>
                                    <span className="font-normal opacity-70 normal-case tracking-normal">({playlistBooks.length} tracks)</span>
                                </h3>
                                <div
                                    className="flex overflow-x-auto gap-2 py-4 px-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] cursor-grab active:cursor-grabbing items-center"
                                    ref={playlistScrollRef}
                                    onMouseDown={handleMouseDown}
                                    onMouseLeave={handleMouseLeave}
                                    onMouseUp={handleMouseUp}
                                    onMouseMove={handleMouseMove}
                                >
                                    {React.useMemo(() => {
                                        let items = [];
                                        playlistBooks.forEach((bookObj) => {
                                            const bookStr = bookObj.name;
                                            const type = bookObj.type;

                                            const parts = bookStr.trim().split(' ');
                                            const chapNum = parseInt(parts.pop());
                                            const bookName = parts.join(' ').toUpperCase();
                                            const content = contentDB.find(c => c.book_name.toUpperCase() === bookName && parseInt(c.chapter_number) === chapNum);

                                            let videos = [];
                                            if (content && content.video_url) {
                                                try {
                                                    const trimmed = content.video_url.trim();
                                                    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                                                        const p = JSON.parse(trimmed);
                                                        if (Array.isArray(p)) videos = p.filter(v => !!v);
                                                    } else if (trimmed !== "") {
                                                        videos = [trimmed];
                                                    }
                                                } catch (e) {
                                                    // skip
                                                }
                                            }

                                            const hasRef = !!(content && content.ref_link);

                                            if (videos.length > 0) {
                                                videos.forEach((v, vIdx) => {
                                                    items.push({ bookStr, type, hasVideo: true, hasRef, vIdx, videoCount: videos.length });
                                                });
                                            } else {
                                                items.push({ bookStr, type, hasVideo: false, hasRef, vIdx: 0, videoCount: 0 });
                                            }
                                        });

                                        return items.map((item, idx) => {
                                            const { bookStr, type, hasVideo, hasRef, vIdx, videoCount } = item;
                                            const hasVisuals = hasVideo || hasRef;
                                            const isActive = activeTrackName === bookStr && activeVideoIndex === vIdx;

                                            let inactiveClass = 'opacity-60 scale-[0.9] hover:opacity-100 hover:scale-100';
                                            let activeClass = 'opacity-100 scale-110 z-10 shadow-2xl rounded-md ring-2 ring-white';
                                            let baseClass = `shrink-0 flex flex-col relative w-[160px] sm:w-[180px] h-[90px] sm:h-[100px] rounded transition-all duration-300 ease-out overflow-hidden cursor-pointer ${isActive ? activeClass : inactiveClass}`;

                                            const titleDisplay = videoCount > 1 ? `${bookStr} (Part ${vIdx + 1})` : bookStr;

                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!dragged.current) {
                                                            setActiveTrackName(bookStr);
                                                            setActiveVideoIndex(vIdx);
                                                            setIsVideoAutoPlay(true);
                                                        }
                                                    }}
                                                    className={baseClass}
                                                    style={{ pointerEvents: 'auto' }}
                                                >
                                                    {/* Background Image Placeholder */}
                                                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center pointer-events-none">
                                                        <img
                                                            src={placeholderImg}
                                                            alt={titleDisplay}
                                                            className="w-full h-full object-cover opacity-50 pointer-events-none select-none"
                                                            draggable={false}
                                                        />
                                                    </div>

                                                    {/* Overlay Gradient */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none"></div>

                                                    {/* Icons Overlay */}
                                                    {(isActive && hasVideo) && (
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                            <div className="w-10 h-10 rounded-full border-[2px] border-white flex items-center justify-center bg-black/40 backdrop-blur-sm shadow-lg">
                                                                <i className="pi pi-play text-white ml-1 text-sm"></i>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {(!hasVisuals) && (
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                            <i className="pi pi-video text-white/50 text-2xl"></i>
                                                            <div className="absolute w-[2px] h-[40px] bg-red-600/80 -rotate-45 shadow-sm"></div>
                                                        </div>
                                                    )}

                                                    {/* Specific Type Indicator */}
                                                    {type === 'morning' && <div className="absolute top-0 right-0 w-[4px] h-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] pointer-events-none"></div>}
                                                    {type === 'evening' && <div className="absolute top-0 right-0 w-[4px] h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] pointer-events-none"></div>}

                                                    {/* Track Title */}
                                                    <span className="absolute bottom-2 left-3 text-[12px] sm:text-[13px] font-bold tracking-wider text-white truncate max-w-[90%] drop-shadow-[0_2px_4px_rgba(0,0,0,1)] pointer-events-none">
                                                        {titleDisplay}
                                                    </span>
                                                </div>
                                            );
                                        });
                                    }, [playlistBooks, contentDB, activeTrackName, activeVideoIndex])}
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
