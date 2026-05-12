import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

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
        <div className="bg-white flex-grow flex flex-col pt-2 pb-4 px-1 rounded-b-lg overflow-y-auto custom-scrollbar border-t-4 border-[#12182b] w-full h-full relative">
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

const SevenTNTPlayer = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [currentTime, setCurrentTime] = useState(formatDateTime(new Date()));
    const [selectedDay, setSelectedDay] = useState(1);
    const [showWisdom, setShowWisdom] = useState(false);
    const [showVideoPlayer, setShowVideoPlayer] = useState(false);
    const [isVideoAutoPlay, setIsVideoAutoPlay] = useState(false);
    const [playerBorderColor, setPlayerBorderColor] = useState('#000000');
    const [playerBgColor, setPlayerBgColor] = useState('#516a87');
    const [editableTitle, setEditableTitle] = useState(location.state?.chartName || "7 TNT MAIN CHART");
    const [chunks, setChunks] = useState([]);
    const [sevenTntContents, setSevenTntContents] = useState([]);
    const searchParams = new URLSearchParams(location.search);
    const trackingDays = parseInt(searchParams.get('days')) || 30;
    const placeholderImg = "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=500&auto=format&fit=crop&q=60";

    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(new Audio());
    const playerStateRef = useRef(null);
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioProgress, setAudioProgress] = useState(0);
    const [videoUrls, setVideoUrls] = useState([]);
    const [fullPlaylist, setFullPlaylist] = useState([]);
    const [currentRefLink, setCurrentRefLink] = useState(null);

    // Drag-to-scroll state
    const playlistRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [dragDistance, setDragDistance] = useState(0);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragDistance(0);
        setStartX(e.pageX - playlistRef.current.offsetLeft);
        setScrollLeft(playlistRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - playlistRef.current.offsetLeft;
        const walk = (x - startX) * 1.5;
        playlistRef.current.scrollLeft = scrollLeft - walk;
        setDragDistance(prev => prev + Math.abs(x - startX));
    };

    const [finishedDays, setFinishedDays] = useState(() => {
        try {
            return new Set(JSON.parse(localStorage.getItem('finished_days_seven') || '[]'));
        } catch {
            return new Set();
        }
    });

    useEffect(() => {
        localStorage.setItem('finished_days_seven', JSON.stringify([...finishedDays]));
    }, [finishedDays]);

    useEffect(() => {
        playerStateRef.current = { selectedDay };
    }, [selectedDay]);

    const handleDaySelect = (num) => {
        setSelectedDay(num);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(formatDateTime(new Date()));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        axios.get('http://' + window.location.hostname + ':8000/api/seven_tnt_charts/list', { withCredentials: true })
            .then(res => {
                if (res.data && res.data.length > 0) {
                    // Try to find a chart with a payload
                    const validChart = res.data.find(c => c.state_payload);
                    if (validChart) {
                        try {
                            const parsed = JSON.parse(validChart.state_payload);
                            setChunks(parsed);
                        } catch (e) { }
                    }
                }
            })
            .catch(err => console.error("Could not load charts", err));

        // Fetch 7 TNT contents mapping for audio/video
        axios.get('http://' + window.location.hostname + ':8000/api/seven-tnt-contents/list', { withCredentials: true })
            .then(res => {
                if (res.data) {
                    setSevenTntContents(res.data);
                }
            })
            .catch(err => console.error("Could not load 7 TNT contents", err));
    }, []);

    useEffect(() => {
        if (!chunks.length || !sevenTntContents.length) return;

        // Build global playlist mapping
        const newPlaylist = [];
        for (let i = 1; i <= trackingDays; i++) {
            const chunkIdx = Math.floor((i - 1) / 5);
            if (chunks[chunkIdx]) {
                const dayObj = chunks[chunkIdx].days.find(d => d.day === i);
                if (dayObj) {
                    let contentStr = dayObj.content || "";
                    let verseStr = contentStr;
                    if (contentStr.includes('Text:')) verseStr = contentStr.split('Text:')[0].trim();
                    
                    const cleanDbVerse = (v) => v ? v.trim().toLowerCase().replace(/\s+/g, ' ') : '';
                    const targetVerse = cleanDbVerse(verseStr);
                    const targetBook = cleanDbVerse(chunks[chunkIdx].bookNameHeader || "");

                    const matchedContent = sevenTntContents.find(c => {
                        const dbVerse = cleanDbVerse(c.verses);
                        const dbBook = cleanDbVerse(c.book_name);
                        const verseMatch = dbVerse === targetVerse || targetVerse.includes(dbVerse) || dbVerse.includes(targetVerse);
                        const bookMatch = dbBook === targetBook || targetBook.includes(dbBook) || dbBook.includes(targetBook);
                        return verseMatch && (targetBook ? bookMatch : true);
                    }) || sevenTntContents.find(c => {
                        const dbVerse = cleanDbVerse(c.verses);
                        const fullTarget = cleanDbVerse(contentStr);
                        return dbVerse && fullTarget.includes(dbVerse);
                    });

                    if (matchedContent) {
                        let videos = [];
                        if (matchedContent.video_url) {
                            try {
                                const parsed = JSON.parse(matchedContent.video_url);
                                if (Array.isArray(parsed)) videos = parsed.map(v => `http://${window.location.hostname}:8000${v}`);
                                else if (typeof parsed === 'string') videos = [`http://${window.location.hostname}:8000${parsed}`];
                            } catch (e) {}
                        }
                        
                        if (videos.length > 0 || matchedContent.ref_link) {
                            newPlaylist.push({
                                day: i,
                                title: verseStr || `Day ${i}`,
                                videos,
                                refLink: matchedContent.ref_link || null
                            });
                        }
                    }
                }
            }
        }
        setFullPlaylist(newPlaylist);

        // Process active day
        const chunkIdx = Math.floor((selectedDay - 1) / 5);
        if (chunks[chunkIdx]) {
            const dayObj = chunks[chunkIdx].days.find(d => d.day === selectedDay);
            let contentStr = dayObj?.content || "";
            let verseStr = contentStr;
            if (contentStr.includes('Text:')) {
                verseStr = contentStr.split('Text:')[0].trim();
            }

            const cleanDbVerse = (v) => v ? v.trim().toLowerCase().replace(/\s+/g, ' ') : '';
            const targetVerse = cleanDbVerse(verseStr);
            const targetBook = cleanDbVerse(chunks[chunkIdx].bookNameHeader || "");

            // Try to match book name and verse fuzzy
            const matchedContent = sevenTntContents.find(c => {
                const dbVerse = cleanDbVerse(c.verses);
                const dbBook = cleanDbVerse(c.book_name);
                const verseMatch = dbVerse === targetVerse || targetVerse.includes(dbVerse) || dbVerse.includes(targetVerse);
                const bookMatch = dbBook === targetBook || targetBook.includes(dbBook) || dbBook.includes(targetBook);
                return verseMatch && (targetBook ? bookMatch : true);
            }) || sevenTntContents.find(c => {
                const dbVerse = cleanDbVerse(c.verses);
                const fullTarget = cleanDbVerse(contentStr);
                return dbVerse && fullTarget.includes(dbVerse);
            });

            if (matchedContent) {
                // Audio mapping
                if (matchedContent.audio_url) {
                    try {
                        const audios = JSON.parse(matchedContent.audio_url);
                        let audioToPlay = null;
                        if (Array.isArray(audios) && audios.length > 0) audioToPlay = audios[0].url;
                        else if (typeof audios === 'string') audioToPlay = audios;

                        if (audioToPlay) {
                            const newSrc = `http://${window.location.hostname}:8000${audioToPlay}`;
                            if (audioRef.current.src !== newSrc) {
                                audioRef.current.src = newSrc;
                                audioRef.current.load();
                                if (isPlaying) {
                                    audioRef.current.play().catch(e => console.error("Auto-play failed", e));
                                }
                            }
                        } else {
                            audioRef.current.src = '';
                        }
                    } catch (e) {
                        audioRef.current.src = '';
                    }
                } else {
                    audioRef.current.src = '';
                }

                // Video mapping
                if (matchedContent.video_url) {
                    try {
                        const videos = JSON.parse(matchedContent.video_url);
                        if (Array.isArray(videos)) {
                            setVideoUrls(videos.map(v => `http://${window.location.hostname}:8000${v}`));
                        } else if (typeof videos === 'string') {
                            setVideoUrls([`http://${window.location.hostname}:8000${videos}`]);
                        } else {
                            setVideoUrls([]);
                        }
                    } catch (e) {
                        setVideoUrls([]);
                    }
                } else {
                    setVideoUrls([]);
                }
                
                // Reference Link mapping
                setCurrentRefLink(matchedContent.ref_link || null);
                
            } else {
                audioRef.current.src = '';
                setVideoUrls([]);
                setCurrentRefLink(null);

                if (isPlaying) {
                    setIsPlaying(false);
                    audioRef.current.pause();
                }
            }
        }
    }, [selectedDay, chunks, sevenTntContents]);

    useEffect(() => {
        const ad = audioRef.current;
        const updateTime = () => setAudioProgress(ad.currentTime);
        const updateDuration = () => setAudioDuration(ad.duration);
        const onEnd = () => {
            setIsPlaying(false);
            if (playerStateRef.current) {
                const { selectedDay } = playerStateRef.current;
                setFinishedDays(prev => new Set(prev).add(selectedDay));
            }
        };

        ad.addEventListener('timeupdate', updateTime);
        ad.addEventListener('loadedmetadata', updateDuration);
        ad.addEventListener('ended', onEnd);

        return () => {
            ad.removeEventListener('timeupdate', updateTime);
            ad.removeEventListener('loadedmetadata', updateDuration);
            ad.removeEventListener('ended', onEnd);
            ad.pause();
        };
    }, []);

    const togglePlay = () => {
        if (audioRef.current.paused) {
            if (audioRef.current.src) {
                audioRef.current.play().catch(e => console.error("Playback failed", e));
            }
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

    return (
        <div className="h-[100dvh] bg-gray-100 flex items-center justify-center sm:px-4 sm:py-0 font-sans transition-colors duration-500 overflow-hidden">
            <div className="w-full max-w-[420px] h-full relative" style={{ perspective: '1500px' }}>
                
                {/* Front Face: Main Player */}
                <div
                    className="w-full h-full bg-[#12182b] flex flex-col shadow-2xl relative border-[5px] border-[#1a2234] rounded-none sm:rounded-lg overflow-hidden"
                    style={{
                        backfaceVisibility: 'hidden',
                        transformOrigin: `50% 50% -210px`,
                        transform: showVideoPlayer ? 'rotateY(-90deg)' : 'rotateY(0deg)',
                        transition: 'transform 0.7s ease-in-out',
                        pointerEvents: showVideoPlayer ? 'none' : 'auto',
                        zIndex: showVideoPlayer ? 0 : 10
                    }}
                >
                    {/* Header Section */}
                    <div className="w-full bg-black flex flex-col items-center py-2 relative px-3">
                        <div className="flex justify-between items-center w-full mb-1">
                            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors p-0.5" title="Menu">
                                <i className="pi pi-bars text-xl"></i>
                            </button>
                            <div className="flex-1 flex justify-center items-center pointer-events-auto px-2">
                                <input
                                    type="text"
                                    value={editableTitle}
                                    onChange={(e) => setEditableTitle(e.target.value)}
                                    className="bg-transparent text-white font-black tracking-wider text-lg uppercase text-center border-none outline-none focus:ring-1 focus:ring-blue-500 w-full"
                                    style={{ fontFamily: 'Impact, sans-serif' }}
                                />
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
                        {(() => {
                            const chunkIdx = Math.floor((selectedDay - 1) / 5);
                            const currentChunk = chunks[chunkIdx];
                            const bookName = currentChunk?.bookNameHeader || "CONFORMED TO HIS IMAGE";
                            return (
                                <div className="text-center w-full">
                                    <h2 className="text-white font-bold text-xs tracking-widest uppercase mt-0">
                                        WITH {bookName}
                                    </h2>
                                </div>
                            );
                        })()}
                    </div>

                {/* Day / Time Bar */}
                <div className="bg-[#445b73] py-1.5 flex justify-center items-center">
                    <span className="text-white font-bold tracking-wider text-[13px] uppercase">DAY 0{selectedDay} : {currentTime}</span>
                </div>

                {/* Facet Banner */}
                <div className="bg-[#8b9ba8] px-4 py-1.5">
                    <span className="text-white font-bold drop-shadow-sm text-sm">Facet {selectedDay}: Paradigm Spirituality</span>
                </div>

                {/* Content Area */}
                <div className="bg-[#243144] px-4 py-2 flex gap-3 min-h-[80px] items-center">
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="flex gap-2 items-start mb-0">
                            <div className="flex-shrink-0 mt-0.5">
                                <input type="radio" readOnly checked className="accent-black w-4 h-4" />
                            </div>
                            <div className="text-white text-[14px] font-bold leading-tight flex-1 flex flex-col gap-1 -mt-0.5">
                                {(() => {
                                    const chunkIdx = Math.floor((selectedDay - 1) / 5);
                                    let contentStr = `Content for Day ${selectedDay}`;
                                    if (chunks && chunks[chunkIdx]) {
                                        const dayObj = chunks[chunkIdx].days.find(d => d.day === selectedDay);
                                        if (dayObj?.content) contentStr = dayObj.content;
                                    }

                                    if (contentStr.includes('Text:')) {
                                        const parts = contentStr.split('Text:');
                                        return (
                                            <>
                                                <span>{parts[0].trim()}</span>
                                                <span className="text-[13px] font-normal">Text: {parts[1].trim()}</span>
                                            </>
                                        );
                                    }
                                    return <span className="text-[13px] font-normal">{contentStr}</span>;
                                })()}
                            </div>
                        </div>
                    </div>
                    <div className="w-[80px] sm:w-[90px] flex-shrink-0 relative flex items-center">
                        <img src={placeholderImg} alt="Book Cover" className="w-full shadow-lg rounded object-cover h-[80px] sm:h-[90px]" />
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
                                    if (audioDuration) {
                                        audioRef.current.currentTime = perc * audioDuration;
                                    }
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
                                    FACET 2: CHAPTER 1
                                </span>
                                <span className="flex-shrink-0 font-black">{formatTrackTime(audioDuration) === '0:00' ? '18:11' : formatTrackTime(audioDuration)}</span>
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
                <div className={`relative w-full flex-1 min-h-0`} style={{ perspective: '1000px' }}>
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
                        <div className="p-3 pb-4 bg-black w-full h-full overflow-y-auto custom-scrollbar rounded-none sm:rounded-b-lg">
                            <div className={`grid grid-cols-5 ${trackingDays > 30 ? 'gap-y-[15px]' : 'gap-y-[30px]'} gap-x-2`}>
                                {Array.from({ length: trackingDays }, (_, i) => i + 1).map((num) => {
                                    const isCompleted = finishedDays.has(num);
                                    return (
                                        <div key={num} className="flex justify-center">
                                            <div
                                                onClick={() => handleDaySelect(num)}
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
                    className="absolute inset-0 w-full h-full bg-[#1a2234] border border-gray-800 shadow-2xl rounded-none sm:rounded-lg flex flex-col overflow-hidden"
                    style={{
                        backfaceVisibility: 'hidden',
                        transformOrigin: `50% 50% -210px`,
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
                                <span className="text-[#6195df]">7</span>
                                <span className="text-[#e3242b] mx-1">T N T</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowVideoPlayer(false);
                                }}
                                className="text-blue-400 hover:text-white transition-colors p-1 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)] relative z-[99] flex-shrink-0"
                                style={{ pointerEvents: 'auto' }}
                            >
                                <i className="pi pi-info-circle text-xl sm:text-2xl"></i>
                            </button>
                        </div>
                    </div>

                    {/* Video Stream Container */}
                    <div className="flex-grow flex flex-col justify-start bg-black p-4 overflow-y-auto custom-scrollbar">
                        <div className="w-full flex flex-col gap-4">
                            {/* Main Video */}
                            {videoUrls.length > 0 ? (
                                <div className="w-full border-2 border-gray-700 rounded-lg overflow-hidden shadow-lg bg-black">
                                    <video 
                                        src={videoUrls[0]} 
                                        controls 
                                        className="w-full"
                                        autoPlay={isVideoAutoPlay}
                                    />
                                </div>
                            ) : (
                                <div className="text-gray-500 font-bold flex flex-col items-center justify-center border border-gray-800 rounded p-6 bg-[#131b2e] gap-3">
                                    <i className="pi pi-video text-4xl opacity-50"></i>
                                    <span className="tracking-wider">No Video Available</span>
                                    <span className="text-xs font-normal opacity-70">(7 TNT Content)</span>
                                </div>
                            )}

                            {/* Playlist Sequence */}
                            {fullPlaylist.length > 0 && (
                                <div className="w-full mt-2">
                                    <div className="flex justify-between items-end mb-2">
                                        <h3 className="text-gray-400 font-black text-[10px] tracking-widest m-0 uppercase">Playlist Sequence:</h3>
                                        <span className="text-gray-500 text-[10px]">({fullPlaylist.length} tracks)</span>
                                    </div>
                                    
                                    <div 
                                        ref={playlistRef}
                                        onMouseDown={handleMouseDown}
                                        onMouseLeave={handleMouseLeave}
                                        onMouseUp={handleMouseUp}
                                        onMouseMove={handleMouseMove}
                                        className="flex gap-3 overflow-x-auto custom-scrollbar pb-3 pt-1 px-1 cursor-grab active:cursor-grabbing select-none"
                                    >
                                        {fullPlaylist.map((item, idx) => (
                                            <div 
                                                key={idx} 
                                                onClick={(e) => {
                                                    if (dragDistance > 10) {
                                                        e.stopPropagation();
                                                        return;
                                                    }
                                                    handleDaySelect(item.day);
                                                }}
                                                className={`min-w-[140px] max-w-[140px] h-[80px] rounded-lg border flex-shrink-0 overflow-hidden relative group transition-all duration-300 ${selectedDay === item.day ? 'border-white ring-2 ring-white/30 scale-105 z-10 shadow-lg' : 'border-gray-800 opacity-60 hover:opacity-100 hover:border-gray-500'}`}
                                            >
                                                <div className="absolute inset-0 bg-[#0f1522] flex items-center justify-center group-hover:bg-[#161f30] transition-colors">
                                                    <i className="pi pi-video text-gray-700 text-2xl group-hover:scale-110 transition-transform duration-300"></i>
                                                </div>
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                                                
                                                {selectedDay === item.day && (
                                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center bg-black/60 z-10 shadow-md">
                                                        <i className="pi pi-play text-white text-xs ml-0.5"></i>
                                                    </div>
                                                )}
                                                
                                                <div className="absolute bottom-2 left-2 right-2">
                                                    <span className="text-white font-bold text-[11px] truncate block drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                                        {item.title}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Attached References */}
                            {currentRefLink && (
                                <div className="w-full mt-2">
                                    <h3 className="text-gray-400 font-black text-[10px] tracking-widest mb-2 uppercase">Attached References:</h3>
                                    <a 
                                        href={currentRefLink.startsWith('http') ? currentRefLink : `https://${currentRefLink}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="w-full bg-[#162032] border border-[#23314a] rounded-lg p-3 flex items-center justify-between hover:bg-[#1c283f] hover:border-gray-600 transition-all duration-300 group shadow-sm"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden w-[90%]">
                                            <div className="w-8 h-8 rounded-full bg-[#0a101d] flex items-center justify-center flex-shrink-0 border border-gray-800">
                                                <i className="pi pi-link text-gray-400 group-hover:text-blue-400 transition-colors"></i>
                                            </div>
                                            <span className="text-blue-400 text-[13px] font-semibold truncate group-hover:text-blue-300 transition-colors w-full">
                                                {currentRefLink}
                                            </span>
                                        </div>
                                        <i className="pi pi-external-link text-gray-500 group-hover:text-blue-400 ml-2 flex-shrink-0 text-sm transition-colors"></i>
                                    </a>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

            </div>
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 0px;
                    height: 5px;
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #374151;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #4b5563;
                }
            `}</style>
        </div>
    );
};

export default SevenTNTPlayer;
