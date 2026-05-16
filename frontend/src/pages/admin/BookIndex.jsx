import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import HTMLFlipBook from 'react-pageflip';
import { splitS3Data, splitS4Data } from '../../utils/chartDataSplitter';
import { StudentService } from '../../services/studentService';

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

const GlobalPDFPageOverrides = () => (
    <style>{`
        .bookindex-reader-bg {
            background-color: #e8d5a2;
            background-image: 
                linear-gradient(rgba(139, 69, 19, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(139, 69, 19, 0.03) 1px, transparent 1px);
            background-size: 20px 20px, 20px 20px;
            box-shadow: inset 0 0 45px rgba(101, 42, 14, 0.4), 0 25px 50px rgba(0,0,0,0.7);
            border-radius: 4px;
        }
        .smt-canvas-wrapper {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            z-index: 0;
            overflow: visible !important;
            transform: scale(0.96) !important;
        }
        .smt-canvas-wrapper canvas {
            width: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
        }
        .pdf-page-content {
            user-select: text !important;
            cursor: text !important;
            z-index: 50 !important;
            line-height: 1 !important;
        }
        .react-pdf__Page__textContent span {
            user-select: text !important;
        }
        .pdf-selectable-paragraph {
            display: inline;
            position: relative;
        }
        .tier1-scroll::-webkit-scrollbar {
            width: 6px;
        }
        .tier1-scroll::-webkit-scrollbar-track {
            background: #1f2937;
        }
        .tier1-scroll::-webkit-scrollbar-thumb {
            background: #4b5563;
            border-radius: 4px;
        }
        .tier2-scroll::-webkit-scrollbar {
            height: 6px;
        }
        .tier2-scroll::-webkit-scrollbar-track {
            background: transparent;
        }
        .tier2-scroll::-webkit-scrollbar-thumb {
            background: #9ca3af;
            border-radius: 4px;
        }
    `}</style>
);


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
                    <polygon points="50,0 0,100 100,100" fill="#f4d1a6" />
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
        <div className="bg-white flex-grow flex flex-col pt-2 pb-4 px-1 rounded-t-lg overflow-hidden border border-gray-400 w-full h-[400px]">
            {/* Pencils Row */}
            <div className="flex px-1 gap-1 h-[210px] pb-2 w-full justify-between items-stretch">
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

            {/* TRANSFORMATION bar */}
            <div className="w-full bg-black py-0 text-white flex justify-between items-center px-[12px] font-black text-[14px] sm:text-[16px] mx-0 drop-shadow-md z-10 shrink-0 mb-0">
                {"TRANSFORMATION".split('').map((char, i) => (
                    <span key={i}>{char}</span>
                ))}
            </div>

            {/* Content Area */}
            <div className="px-3 pt-2 pb-2 flex flex-col justify-between font-bold font-serif whitespace-nowrap bg-white overflow-hidden w-full h-[150px] shrink gap-0 relative">

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

const DraggableWrapper = ({ children, initialX = 0, initialY = 0, className = "" }) => {
    const [position, setPosition] = useState({ x: initialX, y: initialY });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef(null);
    const offset = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        if (e.target.closest('button, input, [data-nodrag="true"]')) return;
        setIsDragging(true);
        offset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - offset.current.x,
            y: e.clientY - offset.current.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div
            ref={dragRef}
            onMouseDown={handleMouseDown}
            style={{
                transform: `translateX(-50%) translate(${position.x}px, ${position.y}px)`,
                cursor: isDragging ? 'grabbing' : 'grab'
            }}
            className={className}
        >
            {children}
        </div>
    );
};

// Extracted globally resilient Canvas styling enforcing absolute compliance to wrapper edges.
const GlobalPDFPageOverridesSMT = () => (
    <style>{`
        .smt-canvas-wrapper {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            z-index: 0;
            overflow: visible !important;
            transform: scale(0.96) !important;
        }
        .smt-canvas-wrapper canvas {
            width: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
        }
        .react-pdf__Page__textContent {
            user-select: text !important;
            cursor: text !important;
            z-index: 50 !important;
            line-height: 1 !important;
        }
        .react-pdf__Page__textContent span {
            user-select: text !important;
        }
        .pdf-selectable-paragraph {
            display: inline;
            position: relative;
        }

        @keyframes unrollScroll {
            0% { max-height: 0; opacity: 0; transform: scaleY(0); }
            100% { max-height: 600px; opacity: 1; transform: scaleY(1); }
        }
        .ancient-scroll-bg {
            background-color: #e8d5a2;
            background-image: 
                linear-gradient(rgba(139, 69, 19, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(139, 69, 19, 0.03) 1px, transparent 1px),
                url('data:image/svg+xml;utf8,<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noise)" opacity="0.12"/></svg>');
            background-size: 20px 20px, 20px 20px, 100% 100%;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            box-shadow: inset 0 0 45px rgba(101, 42, 14, 0.4), 0 25px 50px rgba(0,0,0,0.7);
            border-radius: 4px;
            animation: unrollScroll 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards;
        }
    `}</style>
);

// Constants for PDF Highlighting Tool
const HIGHLIGHT_CATEGORIES = [
    { label: "Wisdom of God", color: "#DC2626" }, // Red-600
    { label: "Imagination", color: "#D97706" }, // Amber-600
    { label: "Scriptures to prayer", color: "#2563EB" }, // Blue-600
    { label: "Daily growing in Godliness", color: "#16A34A" }, // Green-600
    { label: "Obedience to God in action", color: "#EA580C" }, // Orange-600
    { label: "Meditating on God's Character", color: "#9333EA" }, // Purple-600
    { label: "TRANSFORMATION", color: "#DB2777" } // Pink-600
];

const SEVEN_MOUNTAIN_SPHERES = [
    { label: "Family", color: "#86c5f7" },
    { label: "Finance", color: "#38b948" },
    { label: "Government", color: "#4579d4" },
    { label: "Talent", color: "#8b2671" },
    { label: "Training", color: "#f17a41" },
    { label: "Spirituality", color: "#ebe244" },
    { label: "Service", color: "#e3242b" }
];

const ScrollMenuPopup = ({ position, onSelect, onClose, activeContent, onRemove }) => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [flipMode, setFlipMode] = useState('format'); // 'format' or 'info'

    useEffect(() => {
        setIsFlipped(false);
        setFlipMode('format');
        setSelectedCategory(null);
    }, [position]);

    // Dynamic collision detection to ensure the entire popup is always perfectly visible
    const assumedMenuHeight = 500;
    const spaceBelow = window.innerHeight - position.y;
    const isUpward = spaceBelow < assumedMenuHeight;

    const topPos = isUpward ? Math.max(10, position.y - assumedMenuHeight) : position.y + 10;
    const leftPos = Math.min(position.x + 10, window.innerWidth - 350);

    const refLinks = React.useMemo(() => {
        if (!activeContent?.ref_link) return [];
        try { const arr = JSON.parse(activeContent.ref_link); return Array.isArray(arr) ? arr : [activeContent.ref_link]; }
        catch (e) { return [activeContent.ref_link]; }
    }, [activeContent]);

    const refVideos = React.useMemo(() => {
        if (!activeContent?.video_url) return [];
        try { const arr = JSON.parse(activeContent.video_url); return Array.isArray(arr) ? arr : [activeContent.video_url]; }
        catch (e) { return [activeContent.video_url]; }
    }, [activeContent]);

    const handleCategoryClick = (e, cat) => {
        if (e) e.stopPropagation();
        
        // Always apply directly with default styles, bypassing the format flip
        if (onSelect) onSelect(cat, null, null);
        if (onClose) onClose();
    };

    const handleFormatClick = (format, styleOption = null) => {
        if (onSelect) onSelect(selectedCategory, format, styleOption);
        if (onClose) onClose();
    };

    return (
        <div
            className="fixed z-[9999] pointer-events-auto ancient-scroll-bg"
            style={{
                top: topPos,
                left: leftPos,
                width: '350px',
                height: '500px',
                perspective: '1500px',
                transformOrigin: isUpward ? 'bottom center' : 'top center'
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div
                className="relative w-full h-full flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
                style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
                {/* FRONT FACE */}
                <div
                    className={`absolute inset-0 flex flex-col items-center justify-start overflow-hidden transition-opacity duration-300 ${isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
                >
                    {/* Info toggle instead of Close button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setFlipMode('info'); setIsFlipped(true); }}
                        className="absolute top-[20px] right-[20px] text-[#8b5a2b] hover:text-red-700 hover:scale-110 transition-all z-[101]"
                        title="Reference Info"
                    >
                        <i className="pi pi-info-circle text-[22px] font-bold"></i>
                    </button>
                    
                    <div className="w-[108%] h-5 bg-gradient-to-b from-[#4e2f18] via-[#754a28] to-[#2d1b0e] rounded-full mx-[-4%] shadow-[0_8px_15px_rgba(0,0,0,0.6)] mb-1 relative z-10 border border-[#1f1209] shrink-0" />

                    <div className="relative z-10 px-6 py-3 flex flex-col gap-[7px] items-center text-[#2d1a11] font-serif w-full h-full justify-start">
                        <h2 className="text-[15px] font-black uppercase tracking-widest text-[#2d1a11] drop-shadow-sm mb-1 text-center leading-tight w-full flex flex-col gap-[2px] border-b-[1.5px] border-[#8b5a2b]/40 pb-2">
                            <button onClick={(e) => handleCategoryClick(e, { label: "The Power of God", color: "#D97706" })} className="hover:text-[#8b5a2b] hover:scale-105 transition-all transform cursor-pointer w-full">
                                The Power of God &
                            </button>
                            <button onClick={(e) => handleCategoryClick(e, { label: "The Wisdom of God", color: "#DC2626" })} className="hover:text-[#8b5a2b] hover:scale-105 transition-all transform cursor-pointer w-full">
                                The Wisdom of God
                            </button>
                        </h2>

                        <div className="flex flex-col w-full items-center gap-[5px] mt-2">
                            {HIGHLIGHT_CATEGORIES.filter(cat => cat.label !== "Wisdom of God").map(cat => (
                                <button
                                    key={cat.label}
                                    onClick={(e) => handleCategoryClick(e, cat)}
                                    className="text-[16px] font-extrabold w-[85%] text-center transform drop-shadow-sm transition-all hover:text-[#8b5a2b] hover:scale-105 cursor-pointer leading-tight"
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        <div className="w-[90%] flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-[16px] font-black font-serif leading-tight">
                            {SEVEN_MOUNTAIN_SPHERES.map(cat => (
                                <button
                                    key={cat.label}
                                    onClick={(e) => handleCategoryClick(e, cat)}
                                    className="hover:text-[#8b5a2b] transition-colors relative group hover:scale-110 transform drop-shadow-sm"
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        <div className="mt-3 flex flex-col items-center text-center text-[10px] leading-tight font-bold tracking-wider opacity-75 uppercase pointer-events-none text-[#1f1209]">
                            <span>I am here to do God's will and do what is</span>
                            <span>written about me in this scroll</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3 items-center justify-center">
                            <button
                                onClick={(e) => { e.stopPropagation(); if (onSelect) onSelect({ label: 'Underline', color: '#8b5a2b' }, 'underline', 'line-2px'); if (onClose) onClose(); }}
                                className="text-[11px] font-black tracking-widest uppercase text-[#8b5a2b] hover:text-[#5c3a21] transition-colors drop-shadow-sm flex items-center gap-1 border border-[#8b5a2b]/30 bg-[#8b5a2b]/10 px-3 py-1 rounded-full hover:bg-[#8b5a2b]/20 cursor-pointer pointer-events-auto"
                            >
                                <i className="pi pi-pencil text-[10px]"></i> Underline
                            </button>
                            
                            {onRemove && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                                    className="text-[11px] font-black tracking-widest uppercase text-red-700 hover:text-red-900 transition-colors drop-shadow-sm flex items-center gap-1 border border-red-800/30 bg-red-100/50 px-3 py-1 rounded-full hover:bg-red-200/60 cursor-pointer pointer-events-auto"
                                >
                                    <i className="pi pi-trash text-[10px]"></i> Remove
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="w-[108%] h-5 bg-gradient-to-b from-[#4e2f18] via-[#754a28] to-[#2d1b0e] rounded-full mx-[-4%] shadow-[0_8px_15px_rgba(0,0,0,0.6)] mt-auto relative z-10 border border-[#1f1209] shrink-0" />
                </div>

                {/* BACK FACE */}
                <div
                    className={`absolute inset-0 flex flex-col items-center justify-start transition-opacity duration-300 ${isFlipped ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                    style={{
                        transform: 'rotateY(180deg)'
                    }}
                >
                    <div className="w-[108%] h-5 bg-gradient-to-b from-[#4e2f18] via-[#754a28] to-[#2d1b0e] rounded-full mx-[-4%] shadow-[0_8px_15px_rgba(0,0,0,0.6)] mb-1 relative z-10 border border-[#1f1209] shrink-0" />

                    {/* Top action row */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
                        className="absolute top-[20px] right-[20px] text-[#8b5a2b] hover:text-red-700 hover:scale-110 transition-all z-[101]"
                        title="Flip Back"
                    >
                        {flipMode === 'info' ? (
                            <i className="pi pi-info-circle text-[22px] font-bold"></i>
                        ) : (
                            <i className="pi pi-arrow-left text-[18px] font-bold"></i>
                        )}
                    </button>

                    <div className="px-6 py-6 flex flex-col items-center w-full h-full overflow-y-auto no-scrollbar relative z-10">

                        {flipMode === 'format' && (
                            <>
                                <span className="font-serif font-black text-[14px] text-[#2d1a11] tracking-wider uppercase drop-shadow-sm text-center leading-tight w-full break-words mb-4 border-b pb-2 border-[#8b5a2b]/30">{selectedCategory?.label || ''}</span>

                                <div className="flex flex-col gap-2 w-[95%] flex-shrink-0">
                                    {['Underline', 'Oval', 'Square', 'Highlight'].map(fmt => {
                                        let formatOptions = [];
                                        if (fmt === 'Square' || fmt === 'Oval') {
                                            formatOptions = [
                                                { id: 'solid-1px', bWidth: '2px', bStyle: 'solid' },
                                                { id: 'solid-3px', bWidth: '3.5px', bStyle: 'solid' },
                                                { id: 'double-3px', bWidth: '3.5px', bStyle: 'double' },
                                                { id: 'inner-shadow', bWidth: '0px', bStyle: 'none' },
                                                { id: 'outer-shadow', bWidth: '0px', bStyle: 'none' }
                                            ];
                                        } else if (fmt === 'Underline') {
                                            formatOptions = [
                                                { id: 'line-1px', bWidth: '1px', bStyle: 'solid' },
                                                { id: 'line-2px', bWidth: '2px', bStyle: 'solid' },
                                                { id: 'line-3px', bWidth: '3px', bStyle: 'solid' },
                                                { id: 'line-4px', bWidth: '4px', bStyle: 'solid' },
                                                { id: 'line-5px', bWidth: '5px', bStyle: 'solid' }
                                            ];
                                        } else if (fmt === 'Highlight') {
                                            formatOptions = [
                                                { id: 'hl-1', bWidth: '0px', bStyle: 'none' },
                                                { id: 'hl-2', bWidth: '0px', bStyle: 'none' },
                                                { id: 'hl-3', bWidth: '0px', bStyle: 'none' },
                                                { id: 'hl-4', bWidth: '0px', bStyle: 'none' },
                                                { id: 'hl-5', bWidth: '0px', bStyle: 'none' }
                                            ];
                                        }

                                        return (
                                            <div key={fmt} className="relative group w-full flex flex-col items-center z-10 bg-white/50 border border-[#8b5a2b]/30 shadow-sm rounded-lg overflow-hidden">
                                                <div className="w-full px-3 py-1 bg-[#8b5a2b]/10 font-bold font-serif text-[12px] text-[#2d1a11] text-center border-b border-[#8b5a2b]/20">
                                                    {fmt}
                                                </div>
                                                <div className="grid grid-cols-5 gap-1 p-1.5 w-full bg-transparent">
                                                    {formatOptions.map(opt => {
                                                        let renderPreview;
                                                        const activeColor = selectedCategory?.color || '#8b5a2b';
                                                        const bProps = { borderStyle: opt.bStyle, borderWidth: opt.bWidth, borderColor: activeColor };

                                                        if (fmt === 'Underline') {
                                                            renderPreview = <div className="w-[90%]" style={{ borderBottomStyle: opt.bStyle, borderBottomWidth: opt.bWidth, borderBottomColor: activeColor }} />;
                                                        } else if (fmt === 'Oval') {
                                                            const isInner = opt.id === 'inner-shadow';
                                                            const isOuter = opt.id === 'outer-shadow';
                                                            const shadowStyle = isInner ? { boxShadow: `inset 0 0 4px ${activeColor}` } : isOuter ? { boxShadow: `0 0 6px ${activeColor}` } : bProps;
                                                            renderPreview = <div className="w-[20px] h-[12px] rounded-full flex-shrink-0" style={shadowStyle} />;
                                                        } else if (fmt === 'Square') {
                                                            const isInner = opt.id === 'inner-shadow';
                                                            const isOuter = opt.id === 'outer-shadow';
                                                            const shadowStyle = isInner ? { boxShadow: `inset 0 0 4px ${activeColor}` } : isOuter ? { boxShadow: `0 0 6px ${activeColor}` } : bProps;
                                                            renderPreview = <div className="w-[14px] h-[14px] rounded-[2px] flex-shrink-0" style={shadowStyle} />;
                                                        } else {
                                                            const hlLvl = parseInt(opt.id.split('-')[1]);
                                                            renderPreview = <div className="w-[90%] rounded-[2px]" style={{ height: `${hlLvl * 2}px`, backgroundColor: activeColor, opacity: 0.35, alignSelf: 'flex-end', marginBottom: '2px' }} />;
                                                        }

                                                        return (
                                                            <button
                                                                key={opt.id}
                                                                onClick={(e) => { e.stopPropagation(); handleFormatClick(fmt.toLowerCase(), opt.id); }}
                                                                className="w-full h-6 flex items-end justify-center hover:bg-[#8b5a2b]/30 rounded transition-colors pb-1"
                                                                title={opt.id}
                                                            >
                                                                {renderPreview}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {flipMode === 'info' && (
                            <div className="w-full flex-shrink-0 flex flex-col">
                                <h4 className="font-serif font-black text-[15px] text-[#2d1a11] mb-4 text-center uppercase tracking-widest border-b border-[#8b5a2b]/30 pb-2 w-[90%] mx-auto drop-shadow-sm">Reference Media</h4>

                                {refLinks.length === 0 && refVideos.length === 0 ? (
                                    <div className="text-center text-gray-700 italic mt-10 text-sm">No references configured for this chapter.</div>
                                ) : (
                                    <div className="flex flex-col gap-3 w-full px-2">
                                        {refVideos.map((v, i) => (
                                            <a key={`v-${i}`} href={`http://${window.location.hostname}:8000${v}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50/80 hover:bg-red-100/90 border border-red-300 rounded-md transition-all text-red-900 font-sans font-bold text-[12px] drop-shadow-sm w-full text-center hover:scale-105">
                                                <i className="pi pi-video text-red-600 text-[14px]"></i>
                                                <span className="truncate">Chapter Video {i + 1}</span>
                                            </a>
                                        ))}
                                        {refLinks.map((l, i) => (
                                            <a key={`l-${i}`} href={l} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50/80 hover:bg-blue-100/90 border border-blue-300 rounded-md transition-all text-blue-900 font-sans font-bold text-[12px] drop-shadow-sm w-full text-center hover:scale-105">
                                                <i className="pi pi-external-link text-blue-600 text-[14px]"></i>
                                                <span className="truncate max-w-[180px]">{l.replace(/^https?:\/\//, '')}</span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                    
                    <div className="w-[108%] h-5 bg-gradient-to-b from-[#4e2f18] via-[#754a28] to-[#2d1b0e] rounded-full mx-[-4%] shadow-[0_8px_15px_rgba(0,0,0,0.6)] mt-auto relative z-10 border border-[#1f1209] shrink-0" />
                </div>
            </div>
        </div>
    );
};


const HighlightOverlay = ({ h }) => {
    const format = (h.format || 'highlight').toLowerCase();
    const opt = h.styleOption || 'hl-5';
    const color = h.color;

    const renderHighlight = () => {
        if (format === 'square' || format === 'circle' || format === 'oval') {
            let minTop = 100, minLeft = 100, maxBottom = 0, maxRight = 0;
            h.rects.forEach(r => {
                if (r.top < minTop) minTop = r.top;
                if (r.left < minLeft) minLeft = r.left;
                if (r.top + r.height > maxBottom) maxBottom = r.top + r.height;
                if (r.left + r.width > maxRight) maxRight = r.left + r.width;
            });

            const isOval = format === 'circle' || format === 'oval';
            
            // Expand by exactly 5px vertically, and 3.8px horizontally (or 8px for oval to accommodate curve)
            const paddingY = 5;
            const paddingX = isOval ? 8 : 3.8;

            let style = {
                position: 'absolute',
                top: `calc(${minTop}% - ${paddingY}px)`,
                left: `calc(${minLeft}% - ${paddingX}px)`,
                width: `calc(${maxRight - minLeft}% + ${paddingX * 2}px)`,
                height: `calc(${maxBottom - minTop}% + ${paddingY * 2}px)`,
                zIndex: 45,
                pointerEvents: 'none',
                boxSizing: 'border-box'
            };

            if (isOval) {
                style.borderRadius = '9999px';
            } else {
                style.borderRadius = '3px';
            }

            if (opt === 'inner-shadow') {
                style.boxShadow = `inset 0 0 6px ${color}`;
            } else if (opt === 'outer-shadow') {
                style.boxShadow = `0 0 8px ${color}`;
            } else {
                const parts = opt.split('-');
                const bStyle = parts[0] || 'solid';
                const bWidth = parts[0] === 'solid' && parts[1] === '1px' ? '1.5px' : '3.5px';
                style.border = `${bWidth} ${bStyle} ${color}`;
            }

            return <div style={style} />;
        }

        // For highlight and underline
        return (
            <React.Fragment>
                {h.rects.map((rect, i) => {
                    const expandTop = 0.7;
                    const expandBottom = 0.3;
                    const expandX = 0.1;
                    
                    let style = {
                        position: 'absolute',
                        top: `${Math.max(0, rect.top - expandTop)}%`,
                        left: `${Math.max(0, rect.left - expandX)}%`,
                        width: `${rect.width + (expandX * 2)}%`,
                        height: `${rect.height + expandTop + expandBottom}%`,
                        zIndex: 45,
                        pointerEvents: 'none'
                    };

                    if (format === 'underline') {
                        const px = opt.split('-')[1] || '2px';
                        style.borderBottom = `${px} solid ${color}`;
                    } else {
                        const hlLvl = parseInt(opt.split('-')[1] || '5');
                        style.backgroundColor = color;
                        style.opacity = 0.35;
                        style.mixBlendMode = 'multiply';
                        
                        const pct = (hlLvl / 5) * 100;
                        const baseHeight = rect.height + expandTop + expandBottom;
                        style.height = `${(baseHeight * pct) / 100}%`;
                        style.top = `${Math.max(0, rect.top - expandTop) + (baseHeight * (100 - pct) / 100)}%`;
                    }

                    return <div key={`${h.id}_${i}`} style={style} />;
                })}
            </React.Fragment>
        );
    };

    return renderHighlight();
};

const PDFPageRender = React.forwardRef((props, ref) => {
    const isRightPage = props.pageNumber % 2 !== 0;

    const rightSpineObj = { background: 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(255,255,255,0.2) 3%, rgba(0,0,0,0.05) 8%, rgba(0,0,0,0) 25%)' };
    const leftSpineObj = { background: 'linear-gradient(to left, rgba(0,0,0,0.4) 0%, rgba(255,255,255,0.2) 3%, rgba(0,0,0,0.05) 8%, rgba(0,0,0,0) 25%)' };
    const rightEdgeObj = { background: 'linear-gradient(to left, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 5%)' };
    const leftEdgeObj = { background: 'linear-gradient(to right, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 5%)' };
    const lightingObj = { background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.06) 100%)' };

    return (
        <div className={`page bg-[#e5e7eb] shadow-2xl`} ref={ref} data-density="soft">
            <div className={`page-content w-full h-full bg-[#ffffff] flex flex-col justify-center items-center relative overflow-hidden`}>
                <div className="pdf-page-content absolute inset-0 p-[8%] pt-[10%] flex flex-col z-50 text-left" style={{ gap: `${props.width * 0.016}px` }} data-page-number={props.pageNumber}>
                    {props.pageData && props.pageData.paragraphs.map((para, i) => (
                        <span key={i} className="pdf-selectable-paragraph leading-relaxed font-serif text-[#1a1a1a]" style={{ fontSize: `${Math.max(12, props.width * 0.0185)}px` }} id={`para-${props.pageNumber}-${i}`}>
                            {para}
                        </span>
                    ))}
                </div>

                {/* Render Highlight Overlays */}
                {props.pageHighlights && props.pageHighlights.map(h => (
                    <HighlightOverlay key={h.id} h={h} />
                ))}
                
                <div className="absolute inset-y-0 inset-x-0 pointer-events-none z-10" style={lightingObj} />
                <div className="absolute inset-y-0 inset-x-0 pointer-events-none z-20" style={isRightPage ? rightSpineObj : leftSpineObj} />
                <div className="absolute inset-y-0 inset-x-0 pointer-events-none z-30" style={isRightPage ? rightEdgeObj : leftEdgeObj} />

                {/* Explicit Corner Hover Zones - reduced size to prevent blocking text selection */}
                <div className="absolute top-0 left-0 w-[5%] h-[5%] cursor-pointer z-[60]" />
                <div className="absolute top-0 right-0 w-[5%] h-[5%] cursor-pointer z-[60]" />
                <div className="absolute bottom-0 left-0 w-[5%] h-[5%] cursor-pointer z-[60]" />
                <div className="absolute bottom-0 right-0 w-[5%] h-[5%] cursor-pointer z-[60]" />
            </div>
        </div>
    );
});

const BIBLICAL_ORDER = {
    "GENESIS": 1, "EXODUS": 2, "LEVITICUS": 3, "NUMBERS": 4, "DEUTERONOMY": 5,
    "JOSHUA": 6, "JUDGES": 7, "RUTH": 8, "1SAMUEL": 9, "2SAMUEL": 10,
    "1KINGS": 11, "2KINGS": 12, "1CHRONICLES": 13, "2CHRONICLES": 14, "EZRA": 15,
    "NEHEMIAH": 16, "ESTHER": 17, "JOB": 18, "PSALMS": 19, "PSALM": 19, "PROVERBS": 20, "PROVERB": 20,
    "ECCLESIASTES": 21, "SONGOFSOLOMON": 22, "SONGOFSONGS": 22, "SONG": 22, "ISAIAH": 23, "JEREMIAH": 24, "LAMENTATIONS": 25,
    "EZEKIEL": 26, "DANIEL": 27, "HOSEA": 28, "JOEL": 29, "AMOS": 30,
    "OBADIAH": 31, "JONAH": 32, "MICAH": 33, "NAHUM": 34, "HABAKKUK": 35,
    "ZEPHANIAH": 36, "HAGGAI": 37, "ZECHARIAH": 38, "MALACHI": 39,
    "MATTHEW": 40, "MARK": 41, "LUKE": 42, "JOHN": 43, "ACTS": 44,
    "ROMANS": 45, "1CORINTHIANS": 46, "2CORINTHIANS": 47, "GALATIANS": 48, "EPHESIANS": 49,
    "PHILIPPIANS": 50, "COLOSSIANS": 51, "1THESSALONIANS": 52, "2THESSALONIANS": 53, "1TIMOTHY": 54,
    "2TIMOTHY": 55, "TITUS": 56, "PHILEMON": 57, "HEBREWS": 58, "JAMES": 59,
    "1PETER": 60, "2PETER": 61, "1JOHN": 62, "2JOHN": 63, "3JOHN": 64,
    "JUDE": 65, "REVELATION": 66
};

const getBiblicalOrder = (bookName) => {
    if (!bookName) return 999;
    const clean = bookName.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return BIBLICAL_ORDER[clean] || 999;
};

const BookIndex = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);
    const [contentDB, setContentDB] = useState([]);

    const [selectedBook, setSelectedBook] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [expandedBookId, setExpandedBookId] = useState(null);
    const [numPages, setNumPages] = useState(null);

    // FlipBook States
    const [currentPage, setCurrentPage] = useState(0);
    const [playerDimensions, setPlayerDimensions] = useState({ width: 400, height: 600 });
    const [aspectRatio, setAspectRatio] = useState(1.4142);
    const [aspectReady, setAspectReady] = useState(false);

    const flipBookRef = useRef(null);
    const bookContainerRef = useRef(null);

    // Group books by type

    // Highlighting State Memory
    const [highlights, setHighlights] = useState([]);
    const [selectionMenu, setSelectionMenu] = useState(null);
    const [showToolMenu, setShowToolMenu] = useState(false);

    // Audio Player State
    const audioRef = useRef(new Audio());
    const pageFlipAudioRef = useRef(new Audio('/page-flip.mp3.mp3'));
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioProgress, setAudioProgress] = useState(0);
    const [showAudioPlayer, setShowAudioPlayer] = useState(false);
    const [audioLoadedTrackName, setAudioLoadedTrackName] = useState(null);
    const [showWisdomOverlay, setShowWisdomOverlay] = useState(false);
    const [playerBgColor, setPlayerBgColor] = useState('#547395');
    const [playerBorderColor, setPlayerBorderColor] = useState('#080b12');
    const [searchQuery, setSearchQuery] = useState('');

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
        if (!selectedBook || !selectedChapter) return;
        const trackIdentifier = `${selectedBook.name} ${selectedChapter.chapter_number}`;

        if (audioLoadedTrackName !== trackIdentifier) {
            const content = contentDB.find(c => c.book_id === selectedBook.id && c.chapter_id === selectedChapter.id);
            const mediaUrlStr = content?.audio_url || content?.video_url;
            
            if (mediaUrlStr) {
                let parsedAudioUrl = '';
                
                let rawAudios = [];
                if (Array.isArray(mediaUrlStr)) {
                    rawAudios = mediaUrlStr;
                } else if (typeof mediaUrlStr === 'string') {
                    try {
                        const parsed = JSON.parse(mediaUrlStr);
                        if (Array.isArray(parsed)) rawAudios = parsed;
                        else rawAudios = [parsed];
                    } catch (e) {
                        parsedAudioUrl = mediaUrlStr;
                    }
                }
                
                if (!parsedAudioUrl && rawAudios.length > 0) {
                    const firstAudio = rawAudios[0];
                    if (typeof firstAudio === 'string') {
                        parsedAudioUrl = firstAudio;
                    } else if (typeof firstAudio === 'object' && firstAudio !== null) {
                        parsedAudioUrl = firstAudio.url || firstAudio.path || '';
                    }
                }
                
                if (typeof parsedAudioUrl !== 'string' || !parsedAudioUrl) {
                    console.error("Invalid media URL format:", mediaUrlStr);
                    return;
                }
                
                const formattedUrl = parsedAudioUrl.startsWith('/') ? parsedAudioUrl : '/' + parsedAudioUrl;
                audioRef.current.src = `http://${window.location.hostname}:8000${formattedUrl}`;
                setAudioLoadedTrackName(trackIdentifier);
                audioRef.current.play().catch(e => console.error(e));
                setIsPlaying(true);
            } else {
                console.log("No audio found for:", trackIdentifier);
                return;
            }
        } else {
            if (audioRef.current.paused) {
                audioRef.current.play().catch(e => console.error(e));
                setIsPlaying(true);
            } else {
                audioRef.current.pause();
                setIsPlaying(false);
            }
        }
    };


    const formatTrackTime = (time) => {
        if (!time || isNaN(time)) return '0:00';
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioRef.current.currentTime = percent * audioDuration;
        setAudioProgress(percent * audioDuration);
    };

    useEffect(() => {
        let isSelecting = false;
        let lastValidRange = null;

        const handleStopPropagation = (e) => {
            if (e.target.closest('.pdf-page-content')) {
                e.stopPropagation();
            }
        };

        const handleTextSelectionComplete = (e) => {
            if (e.target.closest('.ancient-scroll-bg')) return;
            const textContentNode = e.target.closest('.pdf-page-content');
            if (!textContentNode) {
                setSelectionMenu(null);
                return;
            }

            const selection = window.getSelection();
            if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
                const range = selection.getRangeAt(0);
                const rects = Array.from(range.getClientRects());
                const pageNode = textContentNode;

                const pageRect = pageNode.getBoundingClientRect();
                const pageNumberStr = pageNode.getAttribute('data-page-number');
                const pageNumber = pageNumberStr ? parseInt(pageNumberStr) : 1;

                const mappedRects = rects.map(r => ({
                    top: ((r.top - pageRect.top) / pageRect.height) * 100,
                    left: ((r.left - pageRect.left) / pageRect.width) * 100,
                    width: (r.width / pageRect.width) * 100,
                    height: (r.height / pageRect.height) * 100,
                }));

                setSelectionMenu({
                    x: e.clientX,
                    y: e.clientY,
                    rects: mappedRects,
                    pageNumber: pageNumber,
                    text: selection.toString().trim()
                });
            } else {
                setSelectionMenu(null);
            }
        };

        const handleMouseDown = (e) => {
            if (e.target.closest('.pdf-page-content')) {
                isSelecting = true;
                lastValidRange = null;
            }
        };

        const handleMouseMove = (e) => {
            if (!isSelecting) return;

            const selection = window.getSelection();

            if (!selection || selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);

            const elementUnderCursor = document.elementFromPoint(
                e.clientX,
                e.clientY
            );

            const isText =
                elementUnderCursor &&
                elementUnderCursor.closest('.pdf-page-content');

            // Save last valid text selection
            if (isText) {
                lastValidRange = range.cloneRange();
            } else {
                // User dragged into blank space
                if (lastValidRange) {
                    selection.removeAllRanges();
                    selection.addRange(lastValidRange);
                }
            }
        };

        const handleMouseUp = () => {
            isSelecting = false;
        };

        document.addEventListener('mousedown', handleStopPropagation, true);
        document.addEventListener('touchstart', handleStopPropagation, true);
        document.addEventListener('pointerdown', handleStopPropagation, true);
        document.addEventListener('mouseup', handleTextSelectionComplete);

        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousedown', handleStopPropagation, true);
            document.removeEventListener('touchstart', handleStopPropagation, true);
            document.removeEventListener('pointerdown', handleStopPropagation, true);
            document.removeEventListener('mouseup', handleTextSelectionComplete);

            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const undoHighlight = () => {
        setHighlights(prev => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            if (last.id && typeof last.id === 'string' && last.id.length > 15) { // Assuming backend UUID is > 15 chars
                axios.delete(`http://${window.location.hostname}:8000/api/highlights/${last.id}`, { withCredentials: true })
                    .catch(err => console.error("Failed to delete highlight:", err));
            }
            return prev.slice(0, -1);
        });
    };

    const deleteHighlight = (id) => {
        setHighlights(prev => prev.filter(h => h.id !== id));
        if (id && typeof id === 'string' && id.length > 15) {
            axios.delete(`http://${window.location.hostname}:8000/api/highlights/${id}`, { withCredentials: true })
                .catch(err => console.error("Failed to delete highlight:", err));
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                undoHighlight();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const captureHighlight = (categoryObj, format, styleOption) => {
        if (!selectionMenu) return;
        
        // Ensure format and styleOption are set, with fallbacks for legacy/direct calls
        const isMountain = SEVEN_MOUNTAIN_SPHERES.some(m => m.label === categoryObj.label);
        const finalFormat = format ? format : (isMountain ? 'square' : 'highlight');
        const finalStyleOption = styleOption ? styleOption : (isMountain ? 'solid-3px' : 'hl-5');

        const newHighlight = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            color: categoryObj.color,
            label: categoryObj.label,
            format: finalFormat,
            styleOption: finalStyleOption,
            rects: selectionMenu.rects,
            pageNumber: selectionMenu.pageNumber,
            isSquare: finalFormat === 'square' || finalFormat === 'circle',
            text: selectionMenu.text
        };

        // Save to backend
        axios.post('http://' + window.location.hostname + ':8000/api/highlights', {
            book_id: selectedBook.id,
            chapter_id: selectedChapter.id,
            page_number: newHighlight.pageNumber,
            selected_text: newHighlight.text,
            color: newHighlight.color,
            label: newHighlight.label,
            format: newHighlight.format,
            style_option: newHighlight.styleOption,
            rects: newHighlight.rects
        }, { withCredentials: true }).then(res => {
            newHighlight.id = res.data.id; // update with DB id
            setHighlights(prev => [...prev, newHighlight]);
        }).catch(err => {
            console.error("Failed to save highlight:", err);
            // Revert or show error (optimistic update optional, here we just don't add if failed)
        });
        
        // Touch count for transformation (pencil used)
        StudentService.updateMyTouchCounts({ transformation: 1, team_transformation: 0, klt_reading_plan: 0 })
            .catch(err => console.log('Touch count update skipped:', err?.response?.status));

        // Selection menu is closed by the onClose callback of ScrollMenuPopup,
        // but we ensure the text selection is cleared here.
        setTimeout(() => window.getSelection().removeAllRanges(), 0);
    };

    const groupedBooks = React.useMemo(() => {
        const groups = {};
        const query = searchQuery.toLowerCase().trim();
        booksDB.forEach(book => {
            if (query && !book.name.toLowerCase().includes(query)) return;
            const type = book.book_type || 'Uncategorized';
            if (!groups[type]) groups[type] = [];
            groups[type].push(book);
        });
        return groups;
    }, [booksDB, searchQuery]);

    const location = useLocation();
    const payloadStr = location.state?.payload;
    const filter = location.state?.filter || 'main';

    const parsedPayload = React.useMemo(() => {
        let p = [];
        if (payloadStr) {
            try {
                p = typeof payloadStr === 'string' ? JSON.parse(payloadStr) : payloadStr;
            } catch (e) { }
        }
        if (filter === 'morning_evening' && p && p.length > 0 && booksDB.length > 0 && chaptersDB.length > 0) {
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
    }, [payloadStr, filter, booksDB, chaptersDB]);

    const expandedBookChapters = React.useMemo(() => {
        if (!expandedBookId) return [];
        return chaptersDB
            .filter(c => c.book_id === expandedBookId)
            .sort((a, b) => a.chapter_number - b.chapter_number);
    }, [expandedBookId, chaptersDB]);

    // Cleanup: When the user opens the accordion, no chapter should be selected automatically.

    useEffect(() => {
        axios.get('http://' + window.location.hostname + ':8000/api/books', { withCredentials: true })
            .then(res => {
                const sorted = res.data.sort((a, b) => {
                    const orderA = getBiblicalOrder(a.name);
                    const orderB = getBiblicalOrder(b.name);
                    if (orderA !== orderB) return orderA - orderB;
                    return a.name.localeCompare(b.name);
                });
                setBooksDB(sorted);
            })
            .catch(console.error);

        axios.get('http://' + window.location.hostname + ':8000/api/chapters', { withCredentials: true })
            .then(res => setChaptersDB(res.data))
            .catch(console.error);

        axios.get('http://' + window.location.hostname + ':8000/api/contents/list', { withCredentials: true })
            .then(res => setContentDB(res.data))
            .catch(console.error);
    }, []);

    const activePdfUrl = React.useMemo(() => {
        if (!selectedBook || !selectedChapter) return null;
        const content = contentDB.find(c =>
            c.book_id === selectedBook.id && c.chapter_id === selectedChapter.id
        );
        if (content && content.pdf_url) {
            try {
                const pdfs = JSON.parse(content.pdf_url);
                if (Array.isArray(pdfs) && pdfs.length > 0) return `http://${window.location.hostname}:8000${pdfs[0]}`;
                if (typeof pdfs === 'string') return `http://${window.location.hostname}:8000${pdfs}`;
            } catch (e) {
                return `http://${window.location.hostname}:8000${content.pdf_url}`;
            }
        }
        return null;
    }, [selectedBook, selectedChapter, contentDB]);

    const activeJsonUrl = React.useMemo(() => {
        if (!activePdfUrl) return null;
        return activePdfUrl.replace('.pdf', '.json');
    }, [activePdfUrl]);

    const activeContentDBItem = React.useMemo(() => {
        if (!selectedBook || !selectedChapter) return null;
        return contentDB.find(c => c.book_id === selectedBook.id && c.chapter_id === selectedChapter.id);
    }, [selectedBook, selectedChapter, contentDB]);

    const [bookData, setBookData] = useState(null);

    useEffect(() => {
        if (activeJsonUrl) {
            setAspectReady(false);
            axios.get(activeJsonUrl, { withCredentials: true })
                .then(res => {
                    setBookData(res.data);
                    setNumPages(res.data.pages.length);
                    setAspectRatio(1.4142);
                    setAspectReady(true);
                })
                .catch(err => {
                    console.error("Failed to load JSON scroll:", err);
                    setBookData(null);
                    setNumPages(null);
                });
                
            // Fetch highlights for this book and chapter
            if (selectedBook && selectedChapter) {
                axios.get(`http://${window.location.hostname}:8000/api/highlights?book_id=${selectedBook.id}&chapter_id=${selectedChapter.id}&t=${Date.now()}`, { 
                    withCredentials: true,
                    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
                })
                    .then(res => setHighlights(res.data))
                    .catch(err => console.error("Failed to fetch highlights:", err));
            }
        } else {
            setBookData(null);
            setNumPages(null);
            setHighlights([]);
        }
    }, [activeJsonUrl, selectedBook, selectedChapter]);

    const incrementKltTouch = () => {
        StudentService.updateMyTouchCounts({ transformation: 0, team_transformation: 0, klt_reading_plan: 1 })
            .catch(err => console.log('Touch count update skipped:', err?.response?.status));
    };

    const incrementTransformationTouch = () => {
        StudentService.updateMyTouchCounts({ transformation: 1, team_transformation: 0, klt_reading_plan: 0 })
            .catch(err => console.log('Touch count update skipped:', err?.response?.status));
    };

    const onDocumentLoadSuccess = (pdf) => {
        setNumPages(pdf.numPages);
        setCurrentPage(0);

        const targetPagePromise = pdf.numPages > 1 ? pdf.getPage(2) : pdf.getPage(1);
        targetPagePromise.then(page => {
            const viewport = page.getViewport({ scale: 1 });
            const ratio = (viewport.height && viewport.width) ? (viewport.height / viewport.width) : 1.4142;
            setAspectRatio(ratio);
            setAspectReady(true);
        }).catch(err => {
            console.error("Aspect ratio parse fail:", err);
            setAspectReady(true);
        });
    };

    const onPageFlip = (e) => {
        setCurrentPage(e.data);
        if (pageFlipAudioRef.current) {
            pageFlipAudioRef.current.currentTime = 0;
            pageFlipAudioRef.current.play().catch(e => console.log("Audio play blocked by browser:", e));
        }
    };

    useEffect(() => {
        const updateDimensions = () => {
            if (bookContainerRef.current) {
                const containerWidth = bookContainerRef.current.offsetWidth;
                const windowHeight = bookContainerRef.current.offsetHeight;

                // Allow the book width to span the majority of the screen width securely
                const maxAvailableWidth = containerWidth; // Size of book to 100%
                let singlePageWidth = maxAvailableWidth / 2;
                let singlePageHeight = singlePageWidth * aspectRatio;

                // Vertical limits are removed to allow full native scrolling, enabling max legibility.

                setPlayerDimensions({
                    width: Math.max(250, Math.floor(singlePageWidth)),
                    height: Math.max(350, Math.floor(singlePageHeight))
                });
            }
        };

        if (aspectReady) {
            updateDimensions();
            setTimeout(updateDimensions, 200);
        }

        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [aspectRatio, aspectReady]);

    const totalPagesToRender = numPages ? (numPages % 2 !== 0 ? numPages + 1 : numPages) : 0;
    const baseWidth = Math.floor(playerDimensions.width);
    const baseHeight = Math.floor(playerDimensions.height);

    const overlappingHighlight = React.useMemo(() => {
        if (!selectionMenu) return null;
        return highlights.find(h => 
            h.pageNumber === selectionMenu.pageNumber && 
            h.text && selectionMenu.text && 
            (h.text.includes(selectionMenu.text) || selectionMenu.text.includes(h.text))
        );
    }, [selectionMenu, highlights]);

    return (
        <div className="fixed inset-0 z-[100] bg-[#0b0f19] flex flex-col font-sans overflow-x-hidden overflow-y-auto">
            <GlobalPDFPageOverrides />
            <GlobalPDFPageOverridesSMT />

            {/* Static SMT-Style Top Navigation Bar */}
            <div className="w-full shrink-0 h-[68px] bg-[#0b0f19] border-b border-gray-800 flex items-center px-4 justify-between z-50 shadow-[0_15px_30px_rgba(0,0,0,0.6)] relative pointer-events-auto">
                {/* Left Controls */}
                <div className="flex items-center gap-4 w-1/3 justify-start">
                    <button onClick={() => navigate(-1)} className="bg-gray-800 hover:bg-gray-700 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all border border-gray-600 shrink-0">
                        <i className="pi pi-arrow-left text-lg"></i>
                    </button>
                    <button onClick={() => { setIsSidebarOpen(true); incrementKltTouch(); }} className="bg-blue-600 hover:bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all border border-blue-400 shrink-0">
                        <i className="pi pi-bars text-lg"></i>
                    </button>
                </div>

                {/* Center Flipping & Tracking Controls */}
                <div className="flex items-center justify-center w-1/3">
                    {numPages && (
                        <div className="flex justify-center items-center flex-1 w-full max-w-4xl min-w-[300px]">
                            <button onClick={() => flipBookRef.current?.pageFlip().flipPrev()} className="bg-[#1a2234] hover:bg-blue-600 text-white w-10 h-10 flex items-center justify-center rounded-full shadow-2xl border border-gray-600 transition-all shrink-0">
                                <i className="pi pi-angle-left text-lg font-bold -ml-1"></i>
                            </button>
                            <div className="bg-[#1a2234] border border-gray-600 px-4 py-2 rounded-full flex items-center justify-between shadow-2xl shrink-0 flex-1 mx-2 h-10 min-w-[280px]">
                                {(() => {
                                    // Local Chapter navigation logic
                                    const currentBookChapters = selectedBook ? chaptersDB.filter(c => c.book_id === selectedBook.id).sort((a, b) => a.chapter_number - b.chapter_number) : [];
                                    const chapterIndex = currentBookChapters.findIndex(c => c.id === selectedChapter?.id);
                                    const isFirstChapter = chapterIndex <= 0;
                                    const isLastChapter = chapterIndex === -1 || chapterIndex >= currentBookChapters.length - 1;

                                    return (
                                        <>
                                            <button
                                                onClick={() => { if (!isFirstChapter) setSelectedChapter(currentBookChapters[chapterIndex - 1]); }}
                                                disabled={isFirstChapter}
                                                className={`flex items-center justify-center shrink-0 w-6 h-6 rounded-full transition-colors ${isFirstChapter ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-700 hover:text-white text-blue-400'}`}
                                                title="Previous Chapter"
                                            >
                                                <i className="pi pi-step-backward text-[10px]"></i>
                                            </button>

                                            <div className="flex-1 flex justify-between items-center mx-2 px-2 overflow-hidden">
                                                <span className="text-white font-black tracking-[0.15em] text-[13px] uppercase text-center truncate mx-2 leading-none flex-1">
                                                    {selectedBook ? `${selectedBook.name.toUpperCase()} ${selectedChapter?.chapter_number || ''}` : 'Select a Book'}
                                                </span>
                                                <span className="text-gray-400 font-bold tracking-widest text-[10px] uppercase whitespace-nowrap pb-[1px] hidden md:inline-block">{numPages} TOTAL PAGES</span>
                                            </div>

                                            <button
                                                onClick={() => { if (!isLastChapter) setSelectedChapter(currentBookChapters[chapterIndex + 1]); }}
                                                disabled={isLastChapter}
                                                className={`flex items-center justify-center shrink-0 w-6 h-6 rounded-full transition-colors ${isLastChapter ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-700 hover:text-white text-blue-400'}`}
                                                title="Next Chapter"
                                            >
                                                <i className="pi pi-step-forward text-[10px]"></i>
                                            </button>
                                        </>
                                    );
                                })()}
                            </div>
                            <button onClick={() => flipBookRef.current?.pageFlip().flipNext()} className="bg-[#1a2234] hover:bg-blue-600 text-white w-10 h-10 flex items-center justify-center rounded-full shadow-2xl border border-gray-600 transition-all shrink-0">
                                <i className="pi pi-angle-right text-lg font-bold -mr-1"></i>
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Placeholder to balance flex w-1/3 */}
                <div className="flex w-1/3 justify-end items-center relative gap-2 pr-2">
                    {/* The Player slides horizontally leftward out from behind the Wrench icon when it focuses! */}
                    <div className={`absolute right-12 flex items-center pr-2 gap-2 transition-all duration-300 ${showToolMenu ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'}`}>
                        <button
                            onClick={undoHighlight}
                            className="bg-gray-800 hover:bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 border border-gray-600 shadow-xl transition-colors whitespace-nowrap"
                            title="Undo Last Highlight"
                        >
                            <i className="pi pi-undo text-lg"></i>
                            <span className="text-[11px] font-black tracking-widest uppercase">UNDO</span>
                        </button>
                        <button
                            onClick={() => {
                                setShowAudioPlayer(!showAudioPlayer);
                                setShowToolMenu(false);
                                incrementTransformationTouch();
                            }}
                            className="bg-gray-800 hover:bg-blue-600 text-white px-5 py-2 rounded-full flex items-center gap-2 border border-gray-600 shadow-xl transition-colors whitespace-nowrap"
                        >
                            <i className="pi pi-play-circle text-lg"></i>
                            <span className="text-[11px] font-black tracking-widest uppercase">PLAYER</span>
                        </button>
                    </div>
                    <button
                        onClick={() => setShowToolMenu(!showToolMenu)}
                        className={`bg-gray-800 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all border border-gray-600 shrink-0 shadow-lg relative z-10 ${showToolMenu ? 'bg-blue-600 border-blue-400 text-white' : 'hover:bg-gray-700'}`}>
                        <i className="pi pi-wrench text-lg"></i>
                    </button>
                </div>
            </div>

            {/* Sidebar Overlay */}
            <div
                className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsSidebarOpen(false)}
            ></div>

            {/* TIER 1: Book List (Sidebar) Drawer */}
            <div className={`fixed top-0 left-0 h-full w-64 sm:w-72 md:w-80 bg-[#1e2433] text-gray-300 shadow-2xl z-[60] flex flex-col overflow-hidden transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="px-6 py-5 border-b border-[#2a3045] bg-[#151a26] flex flex-col justify-start">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-3">
                                <i className="pi pi-book text-[#c8a165]"></i>
                                Book Index
                            </h2>
                            <p className="text-xs text-gray-400 mt-2 tracking-wider">Navigate Scriptures</p>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white p-1">
                            <i className="pi pi-times text-xl"></i>
                        </button>
                    </div>
                    <div className="relative">
                        <i className="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
                        <input
                            type="text"
                            placeholder="Search books..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#1e2433] text-white text-sm rounded-md py-2 pl-9 pr-3 border border-gray-600 focus:outline-none focus:border-[#3b82f6] transition-colors placeholder-gray-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto tier1-scroll px-3 py-4">
                    {parsedPayload.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            {/* Tracks List (Now ABOVE the Day Grid) */}
                            {(() => {
                                if (!expandedBookId || !expandedBookId.startsWith('day-')) return null;
                                const selectedDayNum = parseInt(expandedBookId.split('-')[1]);
                                let selectedDayObj = null;
                                parsedPayload.forEach(chunk => {
                                    if (chunk.days) {
                                        const match = chunk.days.find(d => d.day === selectedDayNum);
                                        if (match) selectedDayObj = match;
                                    }
                                });

                                if (!selectedDayObj) return null;

                                return (
                                    <div className="bg-[#1a2234] rounded-lg p-3 border border-[#2a3045]">
                                        <div className="flex justify-between items-center border-b border-[#2a3045] mb-3 pb-2">
                                            <h3 className="text-sm font-black text-white tracking-wide">DAY {selectedDayNum} TRACKS</h3>
                                            <button 
                                                onClick={() => setExpandedBookId(null)}
                                                className="text-gray-400 hover:text-red-400 transition-colors"
                                                title="Close Tracks"
                                            >
                                                <i className="pi pi-times"></i>
                                            </button>
                                        </div>
                                        <ul className="space-y-1 max-h-60 overflow-y-auto tier1-scroll pr-1">
                                            {(() => {
                                                const dayNode = selectedDayObj;
                                                let fullList = [];
                                                
                                                let is24x7 = false;
                                                try { is24x7 = JSON.stringify(parsedPayload).includes('"m4b"'); } catch (e) { }

                                                if (filter === 'morning_evening') {
                                                    if (is24x7) {
                                                        const morningRaw = [dayNode.m1b, dayNode.m2b, dayNode.m3b, dayNode.m4b_morning].filter(Boolean);
                                                        morningRaw.forEach(str => explodeBookString(str, booksDB).forEach(b => fullList.push({ name: b, type: 'morning' })));
                                                        const eveningRaw = [dayNode.m4b_evening].filter(Boolean);
                                                        eveningRaw.forEach(str => explodeBookString(str, booksDB).forEach(b => fullList.push({ name: b, type: 'evening' })));
                                                    } else {
                                                        const morningRaw = [dayNode.m1b, dayNode.m2b, dayNode.m3b_morning].filter(Boolean);
                                                        morningRaw.forEach(str => explodeBookString(str, booksDB).forEach(b => fullList.push({ name: b, type: 'morning' })));
                                                        const eveningRaw = [dayNode.m3b_evening].filter(Boolean);
                                                        eveningRaw.forEach(str => explodeBookString(str, booksDB).forEach(b => fullList.push({ name: b, type: 'evening' })));
                                                    }
                                                } else {
                                                    const defaultRaw = [dayNode.m1b, dayNode.m2b, dayNode.m3b, dayNode.m4b].filter(Boolean);
                                                    defaultRaw.forEach(str => explodeBookString(str, booksDB).forEach(b => fullList.push({ name: b, type: 'default' })));
                                                }

                                                if (fullList.length === 0) fullList.push({ name: "PROVERBS 1", type: "default" });

                                                return fullList.map((bookObj, bIdx) => {
                                                    const bookStr = bookObj.name;
                                                    const parts = bookStr.trim().split(' ');
                                                    const chapNum = parseInt(parts.pop());
                                                    const bookName = parts.join(' ').toUpperCase();
                                                    
                                                    const dbBook = booksDB.find(b => b.name.toUpperCase() === bookName);
                                                    const dbChapter = dbBook ? chaptersDB.find(c => c.book_id === dbBook.id && c.chapter_number == chapNum) : null;
                                                    
                                                    const isSelected = selectedChapter?.id === dbChapter?.id;
                                                    
                                                    let textColorClass = 'text-gray-400 hover:bg-[#2d3748] hover:text-white';
                                                    if (isSelected) {
                                                        textColorClass = 'bg-[#3b82f6] text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]';
                                                    } else if (bookObj.type === 'morning') {
                                                        textColorClass = 'text-green-400 hover:bg-[#2d3748] hover:text-green-300';
                                                    } else if (bookObj.type === 'evening') {
                                                        textColorClass = 'text-blue-400 hover:bg-[#2d3748] hover:text-blue-300';
                                                    }
                                                    
                                                    return (
                                                        <li key={bIdx}>
                                                            <button
                                                                onClick={() => {
                                                                    if (dbBook && dbChapter) {
                                                                        setSelectedBook(dbBook);
                                                                        setSelectedChapter(dbChapter);
                                                                        setIsSidebarOpen(false);
                                                                    }
                                                                }}
                                                                className={`w-full text-left px-3 py-2 text-xs font-bold rounded transition-colors ${textColorClass}`}
                                                            >
                                                                {bookStr}
                                                            </button>
                                                        </li>
                                                    );
                                                });
                                            })()}
                                        </ul>
                                    </div>
                                );
                            })()}

                            <div className="bg-[#151a26] p-3 rounded-xl border border-[#2a3045]">
                                <div className={`grid grid-cols-5 gap-y-[15px] gap-x-2`}>
                                    {(() => {
                                        const allDays = [];
                                        parsedPayload.forEach(chunk => {
                                            if (chunk.days) {
                                                chunk.days.forEach(d => allDays.push(d));
                                            }
                                        });
                                        const trackingDays = allDays.length;
                                        return allDays.map((dayObj) => {
                                            const num = dayObj.day;
                                            const isExpanded = expandedBookId === `day-${num}`;
                                            return (
                                                <div key={num} className="flex justify-center">
                                                    <div
                                                        onClick={() => { setExpandedBookId(isExpanded ? null : `day-${num}`); incrementKltTouch(); }}
                                                        className={`flex items-center justify-center font-black transition-all duration-300 select-none text-[13px] sm:text-[14px] rounded-lg ${trackingDays > 30 ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-7 h-7 sm:w-8 sm:h-8'} cursor-pointer ${isExpanded ? 'bg-blue-500 text-white scale-125 ring-2 ring-blue-300' : 'text-white hover:text-blue-200 bg-[#2a3045] hover:bg-[#3b4460]'}`}
                                                        title={`Day ${num}`}
                                                    >
                                                        {num}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        </div>
                    ) : (
                        Object.keys(groupedBooks).map(type => (
                            <div key={type} className="mb-6">
                                <h3 className="text-xs font-black text-[#8b9bb4] uppercase tracking-widest pl-3 mb-2">{type}</h3>
                                <ul className="space-y-1">
                                    {groupedBooks[type].map(book => (
                                        <li key={book.id}>
                                            <button
                                                onClick={() => {
                                                    setExpandedBookId(prev => prev === book.id ? null : book.id);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 rounded-md transition-all duration-200 text-sm font-semibold tracking-wide flex justify-between items-center ${expandedBookId === book.id
                                                    ? 'bg-[#547395] text-white shadow-md border-l-4 border-[#c8a165]'
                                                    : 'hover:bg-[#2a3045] text-gray-400 hover:text-white border-l-4 border-transparent'
                                                    }`}
                                            >
                                                <span className="truncate pr-2">{book.name}</span>
                                                <span className="text-[10px] opacity-60 bg-black/20 px-2 py-0.5 rounded-full">
                                                    {book.total_chapters || 0} Ch
                                                </span>
                                            </button>
    
                                            {/* Expandable Chapter Grid */}
                                            {expandedBookId === book.id && (
                                                <div className="grid grid-cols-5 gap-1.5 mt-2 p-1.5 bg-[#0f131c] rounded-md shadow-inner mb-2 mx-2">
                                                    {expandedBookChapters.length > 0 ? (
                                                        expandedBookChapters.map(chapter => (
                                                            <button
                                                                key={chapter.id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedBook(book);
                                                                    setSelectedChapter(chapter);
                                                                    setIsSidebarOpen(false); // Close sidebar for immersive reading
                                                                    incrementKltTouch();
                                                                }}
                                                                className={`flex items-center justify-center w-full aspect-square rounded font-bold text-sm transition-all duration-200 ${selectedChapter?.id === chapter.id
                                                                    ? 'bg-[#3b82f6] text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                                                                    : 'bg-[#1e2433] text-gray-400 hover:bg-[#2d3748] hover:text-white'
                                                                    }`}
                                                            >
                                                                {chapter.chapter_number}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <span className="col-span-5 text-[#8b9bb4] text-xs text-center italic py-2">No chapters</span>
                                                    )}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-100 relative custom-scrollbar">

                {/* TIER 3: Reading Interface (Reader Canvas) */}
                <div className="flex-1 relative bookindex-reader-bg w-full min-h-max pb-24" ref={bookContainerRef}>

                    <div className="relative z-10 w-full flex justify-center items-start">
                        {activePdfUrl ? (
                            <div className="w-full h-full flex justify-center items-center">
                                    {numPages && aspectReady && (
                                        <div
                                            className="relative mx-auto flex items-center justify-center"
                                            style={{
                                                width: `${baseWidth * 2}px`,
                                                height: `${baseHeight}px`,
                                            }}
                                        >
                                            <div
                                                style={{ width: `${baseWidth * 2}px`, height: `${baseHeight}px` }}
                                                className="shadow-[0_45px_100px_rgba(0,0,0,0.8)] ring-1 ring-[#5c3a21]/50 flex flex-col justify-center items-center bg-[#ffffff] mt-0"
                                            >
                                                <HTMLFlipBook
                                                    width={1000}
                                                    height={Math.floor(1000 * aspectRatio)}
                                                    size="stretch"
                                                    minWidth={100}
                                                    maxWidth={9000}
                                                    minHeight={100}
                                                    maxHeight={9000}
                                                    drawShadow={true}
                                                    maxShadowOpacity={0.8}
                                                    showCover={false}
                                                    mobileScrollSupport={true}
                                                    disableFlipByClick={true}
                                                    showPageCorners={false}
                                                    className="mx-auto"
                                                    flippingTime={900}
                                                    usePortrait={false}
                                                    onFlip={onPageFlip}
                                                    ref={flipBookRef}
                                                >
                                                    {Array.from(new Array(totalPagesToRender), (_, index) => {
                                                        const isRightPage = index % 2 !== 0;

                                                        let pageToRender = null;
                                                        let isBlank = false;

                                                        if (numPages % 2 !== 0) {
                                                            if (index < numPages - 1) {
                                                                pageToRender = index + 1;
                                                            } else if (index === numPages - 1) {
                                                                isBlank = true;
                                                            } else if (index === numPages) {
                                                                pageToRender = numPages;
                                                            } else {
                                                                isBlank = true;
                                                            }
                                                        } else {
                                                            if (index < numPages) {
                                                                pageToRender = index + 1;
                                                            } else {
                                                                isBlank = true;
                                                            }
                                                        }

                                                        if (!isBlank && pageToRender !== null) {
                                                            return (
                                                                <PDFPageRender
                                                                    key={index}
                                                                    pageNumber={pageToRender}
                                                                    width={baseWidth}
                                                                    pageHighlights={highlights.filter(h => h.pageNumber === pageToRender)}
                                                                    pageData={bookData ? bookData.pages[pageToRender - 1] : null}
                                                                    onDeleteHighlight={deleteHighlight}
                                                                />
                                                            );
                                                        } else {
                                                            const rightSpineObj = { background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(255,255,255,0.4) 3%, rgba(0,0,0,0.1) 8%, rgba(0,0,0,0) 25%)' };
                                                            const leftSpineObj = { background: 'linear-gradient(to left, rgba(0,0,0,0.5) 0%, rgba(255,255,255,0.4) 3%, rgba(0,0,0,0.1) 8%, rgba(0,0,0,0) 25%)' };
                                                            const lightingObj = { background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.06) 100%)' };

                                                            return (
                                                                <div key={index} className={`page bg-[#ffffff] shadow-2xl`} data-density="soft">
                                                                    <div className={`page-content w-full h-full bg-[#e5e7eb] flex flex-col justify-center items-center relative`}>
                                                                        <i className="pi pi-book text-8xl text-gray-400 opacity-20"></i>
                                                                        <div className="absolute inset-y-0 inset-x-0 pointer-events-none z-10" style={lightingObj} />
                                                                        <div className="absolute inset-y-0 inset-x-0 pointer-events-none z-20" style={isRightPage ? rightSpineObj : leftSpineObj} />
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    })}
                                                </HTMLFlipBook>
                                            </div>
                                        </div>
                                    )}
                                        </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-[#5c3a21] bg-[#e8d5a2]/60 p-12 rounded-2xl shadow-sm border border-[#5c3a21]/20 w-full max-w-2xl text-center backdrop-blur-sm">
                                <i className="pi pi-book text-6xl opacity-30 mb-6 drop-shadow-sm"></i>
                                <h3 className="text-2xl font-bold font-serif mb-2">No Scroll Selected</h3>
                                <p className="font-sans opacity-80">Navigate to the top-left menu to open the Book list and select a chapter to begin reading.</p>
                            </div>
                        )}
                    </div>
                </div>


                {/* Ancient Scroll Overlay Rendering! */}
                {selectionMenu && (
                    <ScrollMenuPopup
                        position={selectionMenu}
                        onSelect={captureHighlight}
                        onClose={() => setSelectionMenu(null)}
                        activeContent={activeContentDBItem}
                        onRemove={overlappingHighlight ? () => {
                            deleteHighlight(overlappingHighlight.id);
                            setSelectionMenu(null);
                            setTimeout(() => window.getSelection().removeAllRanges(), 0);
                        } : null}
                    />
                )}

                {/* Custom Bottom Audio Player Wrapped in Draggable */}
                {showAudioPlayer && (
                    <DraggableWrapper
                        initialX={0}
                        initialY={0}
                        className="fixed bottom-[15vh] left-1/2 w-[90%] max-w-[450px] z-[200]"
                    >
                        {/* Wrapper for children to inherit drag position correctly */}
                        <div className="flex flex-col items-center gap-1.5 w-full relative group">

                            {/* Player UI */}
                            <div
                                className="w-full h-[60px] border-[3px] shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex items-center px-4 transition-all duration-300 rounded-[2px]"
                                style={{ backgroundColor: playerBgColor, borderColor: playerBorderColor }}
                            >
                                {/* Left Side: Play Button */}
                                <button onClick={() => { togglePlay(); incrementKltTouch(); }} className="text-black hover:scale-110 active:scale-95 transition-all outline-none mr-3">
                                    <i className={`pi ${isPlaying ? 'pi-pause' : 'pi-play'} text-[32px]`}></i>
                                </button>

                                {/* Center Column: Scrubber & Text Row */}
                                <div className="flex-1 flex flex-col justify-center gap-1 mx-2 relative top-0.5">
                                    <div
                                        className="w-[96%] mx-auto h-[5px] bg-[#e4baaf]/50 cursor-pointer rounded-full relative hover:h-[6px] transition-all"
                                        onClick={handleSeek}
                                        data-nodrag="true"
                                    >
                                        <div
                                            className="absolute top-0 left-0 h-full bg-[#fe8b80] rounded-full drop-shadow-sm transition-all pointer-events-none"
                                            style={{ width: `${audioDuration ? (audioProgress / audioDuration) * 100 : 0}%` }}
                                        />
                                    </div>

                                    {/* Text row */}
                                    <div className="flex justify-between items-center w-full text-black font-black text-[12px] tracking-wide mt-1 select-none pointer-events-none">
                                        <span>{formatTrackTime(audioProgress)}</span>
                                        <span className="text-[14px] uppercase tracking-widest leading-none drop-shadow-sm">{selectedBook ? `${selectedBook.name} ${selectedChapter.chapter_number}` : 'Audio'}</span>
                                        <span>{formatTrackTime(audioDuration)}</span>
                                    </div>
                                </div>

                                {/* Right Side: Cog Icon & Close */}
                                <div className="flex items-center gap-1 ml-4" data-nodrag="true">
                                    <button
                                        onClick={() => setShowWisdomOverlay(!showWisdomOverlay)}
                                        className="text-black hover:rotate-90 transition-all duration-300 outline-none w-8 h-8 flex items-center justify-center relative top-[1px]"
                                    >
                                        <i className="pi pi-cog text-[24px]"></i>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (audioRef.current && !audioRef.current.paused) {
                                                audioRef.current.pause();
                                            }
                                            setShowAudioPlayer(false);
                                            setIsPlaying(false);
                                            setShowWisdomOverlay(false);
                                        }}
                                        className="text-black hover:text-red-500 hover:scale-110 active:scale-95 transition-all duration-300 outline-none w-8 h-8 flex items-center justify-center ml-1"
                                    >
                                        <i className="pi pi-times-circle text-[22px]"></i>
                                    </button>
                                </div>
                            </div>

                            {/* Wisdom Overlay Popup rendered directly below the player inside wrapper */}
                            {showWisdomOverlay && (
                                <div
                                    className="absolute bottom-[calc(100%+8px)] w-full shadow-[0_-10px_30px_rgba(0,0,0,0.5)] rounded-[4px] overflow-hidden animate-slide-up-fade"
                                    data-nodrag="true"
                                >
                                    <WisdomOverlay
                                        onPencilClick={(color) => {
                                            setPlayerBgColor(color);
                                            incrementTransformationTouch();
                                        }}
                                        onLetterClick={(color) => {
                                            setPlayerBorderColor(color);
                                            incrementTransformationTouch();
                                        }}
                                    />
                                </div>
                            )}

                        </div>
                    </DraggableWrapper>
                )}
            </div>
        </div>
    );
};

export default BookIndex;

