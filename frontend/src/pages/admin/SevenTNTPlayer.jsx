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

const SevenTNTPlayer = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [currentTime, setCurrentTime] = useState(formatDateTime(new Date()));
    const [selectedDay, setSelectedDay] = useState(1);
    const [showWisdom, setShowWisdom] = useState(false);
    const [playerBorderColor, setPlayerBorderColor] = useState('#000000');
    const [playerBgColor, setPlayerBgColor] = useState('#516a87');
    const [editableTitle, setEditableTitle] = useState(location.state?.chartName || "7 TNT MAIN CHART");
    const [chunks, setChunks] = useState([]);
    const trackingDays = chunks && chunks.length > 0 ? chunks.length * 5 : 30; // dynamic duration
    const placeholderImg = "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=500&auto=format&fit=crop&q=60";

    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(new Audio());
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioProgress, setAudioProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(formatDateTime(new Date()));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        axios.get('http://localhost:8000/api/seven_tnt_charts/list', { withCredentials: true })
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

        // Fetch a default audio from our DB to make the player functional
        axios.get('http://localhost:8000/api/contents/list', { withCredentials: true })
            .then(res => {
                if (res.data && res.data.length > 0) {
                    const contentWithAudio = res.data.find(c => c.audio_url);
                    if (contentWithAudio) {
                        audioRef.current.src = `http://localhost:8000${contentWithAudio.audio_url}`;
                    }
                }
            })
            .catch(err => console.error("Could not load default contents audio", err));
    }, []);

    useEffect(() => {
        const ad = audioRef.current;
        const updateTime = () => setAudioProgress(ad.currentTime);
        const updateDuration = () => setAudioDuration(ad.duration);
        const onEnd = () => setIsPlaying(false);

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
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans sm:p-6 duration-500 overflow-hidden">
            <div className="w-full max-w-[420px] bg-[#12182b] flex flex-col shadow-2xl relative border-2 border-transparent">

                {/* Header Section */}
                <div className="w-full bg-black flex flex-col items-center py-2 relative">
                    {/* Go Back button */}
                    <button onClick={() => navigate(-1)} className="absolute left-2 top-2 text-white/50 hover:text-white transition-colors">
                        <i className="pi pi-arrow-left"></i>
                    </button>
                    <input
                        type="text"
                        value={editableTitle}
                        onChange={(e) => setEditableTitle(e.target.value)}
                        className="bg-transparent text-white font-black tracking-wider text-lg uppercase text-center border-none outline-none focus:ring-1 focus:ring-blue-500 w-full"
                        style={{ fontFamily: 'Impact, sans-serif' }}
                    />
                    {(() => {
                        const chunkIdx = Math.floor((selectedDay - 1) / 5);
                        const currentChunk = chunks[chunkIdx];
                        const bookName = currentChunk?.bookNameHeader || "CONFORMED TO HIS IMAGE";
                        return (
                            <h2 className="text-white font-bold text-xs tracking-widest uppercase mt-1">
                                WITH {bookName}
                            </h2>
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
                <div className="bg-[#243144] px-4 py-6 flex gap-4 min-h-[140px]">
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="flex gap-2 items-start mb-4">
                            <div className="flex-shrink-0 mt-0.5">
                                <input type="radio" readOnly checked className="accent-black w-4 h-4" />
                            </div>
                            <div className="text-white text-[16px] font-bold leading-tight flex-1 flex flex-col gap-1.5 -mt-1">
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
                                                <span>Text: {parts[1].trim()}</span>
                                            </>
                                        );
                                    }
                                    return <span>{contentStr}</span>;
                                })()}
                            </div>
                        </div>
                    </div>
                    <div className="w-[120px] sm:w-[140px] flex-shrink-0 relative flex items-center">
                        <img src={placeholderImg} alt="Book Cover" className="w-full shadow-lg rounded object-cover min-h-[140px]" />
                    </div>
                </div>

                {/* Audio Player Bar */}
                <div
                    className="px-3 py-2 flex items-center justify-between border-[3px] mx-px transition-colors duration-300"
                    style={{ backgroundColor: playerBgColor, borderColor: playerBorderColor }}
                >
                    <button onClick={togglePlay} className="hover:scale-110 transition-transform cursor-pointer text-black">
                        {isPlaying ? (
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[30px] h-[30px]">
                                <rect x="6" y="4" width="4" height="16" rx="0.5" />
                                <rect x="14" y="4" width="4" height="16" rx="0.5" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[30px] h-[30px] ml-1">
                                <path d="M6 4l14 8-14 8z" />
                            </svg>
                        )}
                    </button>

                    <div className="flex-1 px-4 flex flex-col items-center">
                        {/* Optional progress bar click tracking */}
                        <div className="w-full bg-black/20 h-1.5 rounded-full mb-2 cursor-pointer relative"
                            onClick={(e) => {
                                const bounds = e.currentTarget.getBoundingClientRect();
                                const perc = (e.clientX - bounds.left) / bounds.width;
                                if (audioDuration) audioRef.current.currentTime = perc * audioDuration;
                            }}>
                            <div className="bg-[#8e2b8c] h-full rounded-full transition-all duration-100" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <div className="flex justify-between w-full items-center">
                            <span className="text-black font-black text-[12px]">{formatTrackTime(audioProgress)}</span>
                            <span className="text-black font-black tracking-widest text-[12px]">FACET 2: CHAPTER 1</span>
                            <span className="text-black font-black text-[12px]">{formatTrackTime(audioDuration) === '0:00' ? '18:11' : formatTrackTime(audioDuration)}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowWisdom(!showWisdom)}
                        className={`transition-all duration-300 flex-shrink-0 text-black ${showWisdom ? 'text-white rotate-90 scale-110 drop-shadow-lg' : 'hover:rotate-90 hover:scale-110'}`}
                    >
                        <i className="pi pi-cog text-xl"></i>
                    </button>
                </div>

                {/* Lower Area Stack */}
                <div className={`relative w-full h-[450px] sm:h-[480px]`} style={{ perspective: '1000px' }}>
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
                        <div className="bg-[#12182b] p-6 pb-12 w-full h-full overflow-y-auto custom-scrollbar rounded-b-lg">
                            <div className="grid grid-cols-5 gap-y-6">
                                {Array.from({ length: trackingDays }, (_, i) => i + 1).map((num) => (
                                    <div
                                        key={num}
                                        onClick={() => setSelectedDay(num)}
                                        className={`text-center font-black cursor-pointer transition-all duration-300 ${selectedDay === num ? 'text-white scale-125' : 'text-white/90 hover:text-white'}`}
                                        style={{ fontSize: '18px' }}
                                    >
                                        {num}
                                    </div>
                                ))}
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
        </div>
    );
};

export default SevenTNTPlayer;
