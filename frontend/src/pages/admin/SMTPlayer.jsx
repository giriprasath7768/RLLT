import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import HTMLFlipBook from 'react-pageflip';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { splitS3Data, splitS4Data } from '../../utils/chartDataSplitter';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

const pdfOptions = {
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
    cMapPacked: true,
};

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

const WisdomOverlay = ({ onPencilClick, onLetterClick, activePoint }) => {
    return (
        <div className="bg-white flex-grow flex flex-col pt-4 pb-2 px-1 rounded-t-lg overflow-hidden border border-gray-400 w-full h-full">
            {/* Pencils Row */}
            <div className="flex px-1 gap-px h-[190px] sm:h-[210px] pb-2 w-full justify-between items-stretch">
                <Pencil label="FAMILY" baseNum="1" bodyColorClass="bg-[#86c5f7]" tipColorClass="text-[#86c5f7]" textColor="text-black" onClick={onPencilClick} />
                <DividerBox letter="W" letterColor="text-[#8e2b8c]" num="1" onClick={onLetterClick} />

                <Pencil label="FINANCE" baseNum="2" bodyColorClass="bg-[#38b948]" tipColorClass="text-[#38b948]" textColor="text-black" onClick={onPencilClick} />
                <DividerBox letter="I" letterColor="text-[#294291]" num="2" onClick={onLetterClick} />

                <Pencil label="GOVERNMENT" baseNum="3" bodyColorClass="bg-[#4579d4]" tipColorClass="text-[#4579d4]" textColor="text-black" onClick={onPencilClick} />
                <DividerBox letter="S" letterColor="text-[#86c5f7]" num="3" onClick={onLetterClick} />

                <Pencil label="SPIRITUALITY" baseNum="4" bodyColorClass="bg-[#ebe244]" tipColorClass="text-[#ebe244]" textColor="text-black" onClick={onPencilClick} />
                <DividerBox letter="D" letterColor="text-[#38b948]" num="4" onClick={onLetterClick} />

                <Pencil label="TALENT" baseNum="5" bodyColorClass="bg-[#8b2671]" tipColorClass="text-[#8b2671]" textColor="text-black" onClick={onPencilClick} />
                <DividerBox letter="O" letterColor="text-[#e3242b]" num="5" onClick={onLetterClick} />

                <Pencil label="TRAINING" baseNum="6" bodyColorClass="bg-[#f17a41]" tipColorClass="text-[#f17a41]" textColor="text-black" onClick={onPencilClick} />
                <DividerBox letter="M" letterColor="text-[#ed9b26]" num="6" onClick={onLetterClick} />

                <Pencil label="SERVICE" baseNum="7" bodyColorClass="bg-[#e3242b]" tipColorClass="text-[#e3242b]" textColor="text-black" onClick={onPencilClick} />
            </div>

            {/* TRANSFORMATION bar */}
            <div className="bg-[#181a1f] text-white font-black text-center tracking-[0.4em] py-1.5 text-[0.75rem] border-[3px] border-gray-400 mt-1 uppercase w-full">
                T R A N S F O R M A T I O N
            </div>

            {/* List */}
            <div className="px-3 py-2 flex flex-col gap-1 font-bold font-serif whitespace-nowrap bg-white overflow-hidden w-full">
                <div className="flex items-center gap-2 border-[2px] rounded p-1 transition-all" style={{ borderColor: activePoint === 1 ? '#8e2b8c' : 'transparent', backgroundColor: activePoint === 1 ? 'rgba(142,43,140,0.05)' : 'transparent' }}>
                    <span className="text-[#8e2b8c] text-sm">1.</span>
                    <span className="text-[#8e2b8c] text-xl font-black leading-none drop-shadow-sm px-1">W</span>
                    <span className="text-black text-xs font-black uppercase tracking-wider">ISDOM OF GOD</span>
                </div>
                <div className="flex items-center gap-2 border-[2px] rounded p-1 transition-all" style={{ borderColor: activePoint === 2 ? '#294291' : 'transparent', backgroundColor: activePoint === 2 ? 'rgba(41,66,145,0.05)' : 'transparent' }}>
                    <span className="text-[#294291] text-sm">2.</span>
                    <span className="text-[#294291] text-xl font-black leading-none drop-shadow-sm px-1">I</span>
                    <span className="text-black text-xs font-black uppercase tracking-wider">MAGINATION</span>
                </div>
                <div className="flex items-center gap-2 border-[2px] rounded p-1 transition-all" style={{ borderColor: activePoint === 3 ? '#86c5f7' : 'transparent', backgroundColor: activePoint === 3 ? 'rgba(134,197,247,0.05)' : 'transparent' }}>
                    <span className="text-[#86c5f7] text-sm">3.</span>
                    <span className="text-[#86c5f7] text-xl font-black leading-none drop-shadow-sm px-1">S</span>
                    <span className="text-black text-xs font-black uppercase tracking-wider">CRIPTURES TO PRAYER</span>
                </div>
                <div className="flex items-center gap-2 border-[2px] rounded p-1 transition-all" style={{ borderColor: activePoint === 4 ? '#38b948' : 'transparent', backgroundColor: activePoint === 4 ? 'rgba(56,185,72,0.05)' : 'transparent' }}>
                    <span className="text-[#38b948] text-sm">4.</span>
                    <span className="text-[#38b948] text-xl font-black leading-none drop-shadow-sm px-1">D</span>
                    <span className="text-black text-xs font-black uppercase tracking-wider">AILY GROWING IN GODLINESS</span>
                </div>
                <div className="flex items-center gap-2 border-[2px] rounded p-1 transition-all" style={{ borderColor: activePoint === 5 ? '#e3242b' : 'transparent', backgroundColor: activePoint === 5 ? 'rgba(227,36,43,0.05)' : 'transparent' }}>
                    <span className="text-[#e3242b] text-sm">5.</span>
                    <span className="text-[#e3242b] text-xl font-black leading-none drop-shadow-sm px-1">O</span>
                    <span className="text-black text-xs font-black uppercase tracking-wider">BEDIENCE TO GOD'S WILL</span>
                </div>
                <div className="flex items-center gap-2 border-[2px] rounded p-1 transition-all" style={{ borderColor: activePoint === 6 ? '#ed9b26' : 'transparent', backgroundColor: activePoint === 6 ? 'rgba(237,155,38,0.05)' : 'transparent' }}>
                    <span className="text-[#ed9b26] text-sm">6.</span>
                    <span className="text-[#ed9b26] text-xl font-black leading-none drop-shadow-sm px-1">M</span>
                    <span className="text-black text-xs font-black uppercase tracking-wider">EDITATING ON GOD'S CHARACTER</span>
                </div>
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
const GlobalPDFPageOverrides = () => (
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
            overflow: hidden;
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
    { label: "Imagination", color: "#FCD34D" }, // Yellow
    { label: "Scriptures to prayer", color: "#93C5FD" }, // Blue
    { label: "Daily growing in Godliness", color: "#86EFAC" }, // Green
    { label: "Obedience to God in action", color: "#FDBA74" }, // Orange
    { label: "Meditating on God's Character", color: "#D8B4FE" }, // Purple
    { label: "TRANSFORMATION", color: "#F9A8D4" } // Pink
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

const AUDIO_TIMESTAMPS = {
    'PSALMS 1': [
        // Placeholder timings in seconds for PSALMS 1 (or P.SLAM S1)
        { point: 1, start: 5, end: 15 },
        { point: 2, start: 16, end: 25 },
        { point: 3, start: 26, end: 35 },
        { point: 4, start: 36, end: 45 },
        { point: 5, start: 46, end: 55 },
        { point: 6, start: 56, end: 65 }
    ],
    'P.SLAM S1': [
        { point: 1, start: 5, end: 15 },
        { point: 2, start: 16, end: 25 },
        { point: 3, start: 26, end: 35 },
        { point: 4, start: 36, end: 45 },
        { point: 5, start: 46, end: 55 },
        { point: 6, start: 56, end: 65 }
    ]
};

const ScrollMenuPopup = ({ position, onSelect }) => {
    // Dynamic collision detection to ensure the entire popup is always perfectly visible
    const assumedMenuHeight = 420;
    const spaceBelow = window.innerHeight - position.y;
    const isUpward = spaceBelow < assumedMenuHeight;

    const topPos = isUpward ? Math.max(10, position.y - assumedMenuHeight) : position.y + 10;
    const leftPos = Math.min(position.x + 10, window.innerWidth - 350);

    return (
        <div
            className="fixed z-[9999] flex flex-col items-center justify-start ancient-scroll-bg pointer-events-auto"
            style={{
                top: topPos,
                left: leftPos,
                width: '340px',
                minHeight: '380px',
                transformOrigin: isUpward ? 'bottom center' : 'top center'
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="w-[108%] h-6 bg-gradient-to-b from-[#4e2f18] via-[#754a28] to-[#2d1b0e] rounded-full mx-[-4%] shadow-[0_8px_15px_rgba(0,0,0,0.6)] mb-1 relative z-10 border border-[#1f1209]" />

            <div className="px-6 py-5 flex flex-col gap-[8px] items-center text-[#2d1a11] font-serif w-full">
                <h2 className="text-[15px] font-black text-center mb-1 uppercase tracking-widest border-b-[1.5px] border-[#8b5a2b]/40 pb-2 w-full text-[#1f1209] drop-shadow-sm">
                    The Power of God &<br />The Wisdom of God
                </h2>

                <div className="flex flex-col w-full items-center gap-[6px] mt-2">
                    {HIGHLIGHT_CATEGORIES.map(cat => (
                        <button
                            key={cat.label}
                            onClick={() => onSelect(cat)}
                            className="text-[16px] font-extrabold hover:text-[#8b5a2b] transition-all w-full text-center hover:scale-105 transform drop-shadow-sm"
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className="w-[85%] flex flex-wrap justify-center gap-x-4 gap-y-2 mt-5 text-[15px] font-black font-serif leading-tight">
                    {SEVEN_MOUNTAIN_SPHERES.map(cat => (
                        <button
                            key={cat.label}
                            onClick={() => onSelect(cat)}
                            className="hover:text-[#8b5a2b] transition-colors relative group hover:scale-110 transform drop-shadow-sm"
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className="text-[9px] text-center mt-6 font-bold uppercase tracking-widest opacity-80 px-2 leading-relaxed text-[#1f1209]">
                    I am here to do God's will and do what is<br />written about me in this scroll
                </div>
            </div>

            <div className="w-[108%] h-6 bg-gradient-to-b from-[#4e2f18] via-[#754a28] to-[#2d1b0e] rounded-full mx-[-4%] shadow-[0_8px_15px_rgba(0,0,0,0.6)] mt-auto relative z-10 border border-[#1f1209]" />
        </div>
    );
};

const PDFPageRender = React.forwardRef((props, ref) => {

    const isRightPage = props.pageNumber % 2 !== 0;

    const rightSpineObj = { background: 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(255,255,255,0.2) 3%, rgba(0,0,0,0.05) 8%, rgba(0,0,0,0) 25%)' };
    const leftSpineObj = { background: 'linear-gradient(to left, rgba(0,0,0,0.4) 0%, rgba(255,255,255,0.2) 3%, rgba(0,0,0,0.05) 8%, rgba(0,0,0,0) 25%)' };

    const rightEdgeObj = { background: 'linear-gradient(to left, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 5%)' };
    const leftEdgeObj = { background: 'linear-gradient(to right, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 5%)' };
    const lightingObj = { background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.06) 100%)' };

    return (
        <div className={`page ${props.isCover ? 'bg-[#1e2433]' : 'bg-[#e5e7eb]'} shadow-2xl`} ref={ref} data-density={props.isCover ? "hard" : "soft"}>
            <div className={`page-content w-full h-full ${props.isCover ? 'bg-[#2a3045] border-[3px] border-[#151a26] p-[8px]' : 'bg-[#ffffff]'} flex flex-col justify-center items-center relative`}>

                <Page
                    pageNumber={props.pageNumber}
                    width={props.width}
                    renderTextLayer={true}
                    renderAnnotationLayer={false}
                    devicePixelRatio={Math.max(window.devicePixelRatio || 1, 2.0)}
                    className="smt-canvas-wrapper"
                    loading={
                        <div className="flex items-center justify-center h-full w-full text-gray-400">
                            <i className="pi pi-spinner pi-spin text-4xl opacity-50"></i>
                        </div>
                    }
                >
                    {/* Render Highlight Overlays bound permanently to identical grid geometry */}
                    {props.pageHighlights && props.pageHighlights.map(h => (
                        <React.Fragment key={h.id}>
                            {h.rects.map((rect, i) => (
                                <div
                                    key={`${h.id}_${i}`}
                                    style={{
                                        position: 'absolute',
                                        top: `${rect.top}%`,
                                        left: `${rect.left}%`,
                                        width: `${rect.width}%`,
                                        height: `${rect.height}%`,
                                        backgroundColor: h.isSquare ? 'transparent' : h.color,
                                        border: h.isSquare ? `3px solid ${h.color}` : 'none',
                                        borderRadius: h.isSquare ? '4px' : '0px',
                                        opacity: h.isSquare ? 1 : 0.35,
                                        mixBlendMode: h.isSquare ? 'normal' : 'multiply',
                                        pointerEvents: 'none',
                                        zIndex: 45
                                    }}
                                />
                            ))}
                        </React.Fragment>
                    ))}
                </Page>

                <div className="absolute inset-y-0 inset-x-0 pointer-events-none z-10" style={lightingObj} />
                <div className="absolute inset-y-0 inset-x-0 pointer-events-none z-20" style={isRightPage ? rightSpineObj : leftSpineObj} />
                <div className="absolute inset-y-0 inset-x-0 pointer-events-none z-30" style={isRightPage ? rightEdgeObj : leftEdgeObj} />

                {/* Explicit Corner Hover Zones to guarantee visually-mapped 'hand pointer' grab mechanics where peeling is allowed without destroying center text-selection */}
                <div className="absolute top-0 left-0 w-[15%] h-[15%] cursor-pointer z-[60]" />
                <div className="absolute top-0 right-0 w-[15%] h-[15%] cursor-pointer z-[60]" />
                <div className="absolute bottom-0 left-0 w-[15%] h-[15%] cursor-pointer z-[60]" />
                <div className="absolute bottom-0 right-0 w-[15%] h-[15%] cursor-pointer z-[60]" />
            </div>
        </div>
    );
});


const SMTPlayer = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const trackingDays = parseInt(searchParams.get('days')) || 30;

    const moduleVal = location.state?.module || 1;
    const facetVal = location.state?.facet || 1;
    const phaseVal = location.state?.phase || 1;

    const [currentTime, setCurrentTime] = useState(formatDateTime(new Date()));
    const [selectedDay, setSelectedDay] = useState(1);

    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);
    const [contentDB, setContentDB] = useState([]);

    const [numPages, setNumPages] = useState(null);
    const [activeTrackName, setActiveTrackName] = useState('');

    const [showSidebar, setShowSidebar] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);

    const flipBookRef = useRef(null);
    const bookContainerRef = useRef(null);

    const [playerDimensions, setPlayerDimensions] = useState({ width: 400, height: 600 });
    const [viewerError, setViewerError] = useState(null);

    const [aspectRatio, setAspectRatio] = useState(1.4142);
    const [aspectReady, setAspectReady] = useState(false);

    // Highlighting State Memory
    const [highlights, setHighlights] = useState([]);
    const [selectionMenu, setSelectionMenu] = useState(null);
    const [showToolMenu, setShowToolMenu] = useState(false);

    // Audio Wisdom Highlighting
    const [activePoint, setActivePoint] = useState(null);

    // Audio Player State
    const audioRef = useRef(new Audio());
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioProgress, setAudioProgress] = useState(0);
    const [showAudioPlayer, setShowAudioPlayer] = useState(false);
    const [audioLoadedTrackName, setAudioLoadedTrackName] = useState(null);
    const [showWisdomOverlay, setShowWisdomOverlay] = useState(false);
    const [playerBgColor, setPlayerBgColor] = useState('#547395');
    const [playerBorderColor, setPlayerBorderColor] = useState('#080b12');

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

    useEffect(() => {
        if (!activeTrackName) {
            setActivePoint(null);
            return;
        }
        const mapping = AUDIO_TIMESTAMPS[activeTrackName];
        if (mapping && isPlaying) {
            const currentObj = mapping.find(m => audioProgress >= m.start && audioProgress <= m.end);
            setActivePoint(currentObj ? currentObj.point : null);
        } else {
            setActivePoint(null);
        }
    }, [audioProgress, activeTrackName, isPlaying]);

    const togglePlay = () => {
        if (!activeTrackName) return;

        if (audioLoadedTrackName !== activeTrackName) {
            const parts = activeTrackName.trim().split(' ');
            const chapNum = parseInt(parts.pop());
            const bookName = parts.join(' ').toUpperCase();

            const content = contentDB.find(c => c.book_name.toUpperCase() === bookName && parseInt(c.chapter_number) === chapNum);
            if (content && content.audio_url) {
                audioRef.current.src = `http://localhost:8000${content.audio_url}`;
                setAudioLoadedTrackName(activeTrackName);
                audioRef.current.play().catch(e => console.error(e));
                setIsPlaying(true);
            } else {
                console.log("No audio found for:", activeTrackName);
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
        document.body.style.overflow = 'hidden';

        const handleStopPropagation = (e) => {
            // Intercept mouse actions over the invisible PDF text-layer before the FlipBook registers them as "drags"
            if (e.target.closest('.react-pdf__Page__textContent')) {
                e.stopPropagation();
            }
        };

        const handleTextSelectionComplete = (e) => {
            if (e.target.closest('.ancient-scroll-bg')) return; // Ignore clicks inside the scroll menu itself

            const textContentNode = e.target.closest('.react-pdf__Page__textContent');
            if (!textContentNode) {
                // If clicking entirely outside selection bounds, natively close the menu
                setSelectionMenu(null);
                return;
            }

            const selection = window.getSelection();
            if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
                const range = selection.getRangeAt(0);
                const rects = Array.from(range.getClientRects());

                const pageNode = textContentNode.closest('.react-pdf__Page');
                if (!pageNode) return;

                const pageRect = pageNode.getBoundingClientRect();
                const pageNumberStr = pageNode.getAttribute('data-page-number');
                const pageNumber = pageNumberStr ? parseInt(pageNumberStr) : 1;

                // Map the browser physical viewport rects into safe percentage floats proportional to the exact React-PDF instance!
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

        // Capture phase listeners to block PageFlip engine & bind Selection detection
        document.addEventListener('mousedown', handleStopPropagation, true);
        document.addEventListener('touchstart', handleStopPropagation, true);
        document.addEventListener('pointerdown', handleStopPropagation, true);
        document.addEventListener('mouseup', handleTextSelectionComplete);

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('mousedown', handleStopPropagation, true);
            document.removeEventListener('touchstart', handleStopPropagation, true);
            document.removeEventListener('pointerdown', handleStopPropagation, true);
            document.removeEventListener('mouseup', handleTextSelectionComplete);
        };
    }, []);

    const captureHighlight = (categoryObj) => {
        if (!selectionMenu) return;

        const isMountain = SEVEN_MOUNTAIN_SPHERES.some(m => m.label === categoryObj.label);

        setHighlights(prev => [...prev, {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            color: categoryObj.color,
            label: categoryObj.label,
            rects: selectionMenu.rects,
            pageNumber: selectionMenu.pageNumber,
            isSquare: isMountain
        }]);

        setSelectionMenu(prev => {
            if (!prev) return null;
            const nextState = { ...prev };

            if (isMountain) {
                nextState.hasMountain = true;
            } else {
                nextState.hasCategory = true;
            }

            if (nextState.hasMountain && nextState.hasCategory) {
                setTimeout(() => window.getSelection().removeAllRanges(), 0);
                return null;
            }
            return nextState;
        });
    };

    useEffect(() => {
        const updateDimensions = () => {
            if (bookContainerRef.current) {
                const containerWidth = bookContainerRef.current.offsetWidth;
                const windowHeight = window.innerHeight;

                // Allow the book width to span the majority of the screen width for maximum text legibility
                const maxAvailableWidth = Math.max(containerWidth - 60, 600);

                // Derive the height purely from the maximum width to allow native browser vertical scrolling seamlessly!
                let singlePageWidth = Math.min((maxAvailableWidth / 2), 1000); // Protect against monstrous 4k resolutions
                let singlePageHeight = singlePageWidth * aspectRatio;

                setPlayerDimensions({
                    width: Math.max(300, Math.floor(singlePageWidth)),
                    height: Math.max(400, Math.floor(singlePageHeight))
                });
            }
        };

        updateDimensions();
        setTimeout(updateDimensions, 200);

        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [aspectRatio]);

    useEffect(() => {
        axios.get('http://localhost:8000/api/books', { withCredentials: true })
            .then(res => setBooksDB(res.data))
            .catch(console.error);

        axios.get('http://localhost:8000/api/chapters', { withCredentials: true })
            .then(res => setChaptersDB(res.data))
            .catch(console.error);

        axios.get('http://localhost:8000/api/contents/list', { withCredentials: true })
            .then(res => setContentDB(res.data))
            .catch(console.error);

        const timer = setInterval(() => {
            setCurrentTime(formatDateTime(new Date()));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const parsedPayload = React.useMemo(() => {
        const filter = location.state?.filter || 'main';
        let p = [];
        const payloadString = location.state?.payload;
        if (payloadString) {
            try {
                p = typeof payloadString === 'string' ? JSON.parse(payloadString) : payloadString;
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
        const filter = location.state?.filter || 'main';

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

        return fullList.length ? fullList : [{ name: "PROVERBS 1", type: "default" }];
    }, [activeDayNode, booksDB, location.state?.filter]);

    useEffect(() => {
        if (playlistBooks && playlistBooks.length > 0) {
            const currentTrackExists = activeTrackName && playlistBooks.some(b => b.name === activeTrackName);
            if (!activeTrackName || !currentTrackExists) {
                setActiveTrackName(playlistBooks[0].name);
            }
        }
    }, [playlistBooks, activeTrackName]);


    const activePdfUrl = React.useMemo(() => {
        if (!activeTrackName) return null;
        const parts = activeTrackName.trim().split(' ');
        const chapNum = parseInt(parts.pop());
        const bookName = parts.join(' ').toUpperCase();

        const content = contentDB.find(c => c.book_name.toUpperCase() === bookName && parseInt(c.chapter_number) === chapNum);

        if (content && content.pdf_url) {
            try {
                const pdfs = JSON.parse(content.pdf_url);
                if (Array.isArray(pdfs) && pdfs.length > 0) {
                    return `http://localhost:8000${pdfs[0]}`;
                }
                if (typeof pdfs === 'string') {
                    return `http://localhost:8000${pdfs}`;
                }
            } catch (e) {
                return `http://localhost:8000${content.pdf_url}`;
            }
        }
        return null;
    }, [activeTrackName, contentDB]);

    useEffect(() => {
        setAspectReady(false);
    }, [activePdfUrl]);

    function onDocumentLoadSuccess(pdf) {
        setNumPages(pdf.numPages);
        setViewerError(null);
        setCurrentPage(0);

        // Critical Fix: Often the cover page has bizarre aspect ratios. We measure the first internal text page to construct the perfectly matching geometric grid boundary for FlipBook!
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
    }

    function onDocumentLoadError(error) {
        console.error("PDF Load Error:", error);
        setViewerError(error.message || "Failed to load PDF");
    }

    const onPageFlip = (e) => {
        setCurrentPage(e.data);
    };

    const totalPagesToRender = numPages ? (numPages % 2 !== 0 ? numPages + 1 : numPages) : 0;
    const baseWidth = Math.floor(playerDimensions.width);
    const baseHeight = Math.floor(playerDimensions.height);

    const rightSpineObj = { background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(255,255,255,0.4) 3%, rgba(0,0,0,0.1) 8%, rgba(0,0,0,0) 25%)' };
    const leftSpineObj = { background: 'linear-gradient(to left, rgba(0,0,0,0.5) 0%, rgba(255,255,255,0.4) 3%, rgba(0,0,0,0.1) 8%, rgba(0,0,0,0) 25%)' };
    const rightEdgeObj = { background: 'linear-gradient(to left, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0) 5%)' };
    const leftEdgeObj = { background: 'linear-gradient(to right, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0) 5%)' };
    const lightingObj = { background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.06) 100%)' };

    return (
        <div className="fixed inset-0 z-[100] bg-[#0b0f19] flex flex-col font-sans overflow-x-hidden overflow-y-auto">

            <GlobalPDFPageOverrides />

            {showSidebar && (
                <div className="fixed inset-0 bg-black/70 z-[110] backdrop-blur-sm transition-opacity" onClick={() => setShowSidebar(false)} />
            )}

            <div className={`fixed inset-y-0 left-0 bg-[#12182b] flex flex-col border-r border-gray-800 shadow-2xl z-[120] w-80 transform transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Header */}
                <div className="bg-black text-white px-4 py-4 flex flex-col relative shrink-0">
                    <div className="flex justify-between items-center mb-2">
                        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors p-2 bg-gray-800 rounded-lg focus:outline-none">
                            <i className="pi pi-arrow-left text-sm font-bold"></i>
                        </button>
                        <h1 className="text-blue-400 font-bold text-lg tracking-widest text-center flex-1 ml-4">TRACK LIST</h1>
                        <button onClick={() => setShowSidebar(false)} className="text-gray-400 hover:text-white transition-colors p-2 bg-gray-800 rounded-lg focus:outline-none ml-2">
                            <i className="pi pi-times text-sm font-bold"></i>
                        </button>
                    </div>
                </div>

                <div className="bg-[#1a2234] px-4 py-3 flex justify-between items-center border-y border-gray-800 shrink-0">
                    <span className="text-white font-black text-lg tracking-wider">DAY {selectedDay.toString().padStart(2, '0')}</span>
                    <span className="text-blue-400 font-bold text-xs tracking-wider uppercase">Assignments</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-0 flex flex-col gap-[1px] bg-gray-800">
                    {playlistBooks.map((bookObj, idx) => {
                        const bookStr = bookObj.name;
                        const type = bookObj.type;

                        const parts = bookStr.trim().split(' ');
                        const chapNum = parseInt(parts.pop());
                        const bookName = parts.join(' ').toUpperCase();
                        const content = contentDB.find(c => c.book_name.toUpperCase() === bookName && parseInt(c.chapter_number) === chapNum);

                        let hasPdf = false;
                        if (content && content.pdf_url) {
                            try {
                                const parsed = JSON.parse(content.pdf_url);
                                hasPdf = Array.isArray(parsed) ? parsed.length > 0 : !!parsed;
                            } catch (e) {
                                hasPdf = !!content.pdf_url;
                            }
                        }

                        let textColor = 'text-white hover:text-blue-200';
                        if (type === 'morning') textColor = 'text-green-400 hover:text-green-200';
                        if (type === 'evening') textColor = 'text-blue-400 hover:text-blue-200';
                        const finalColor = activeTrackName === bookStr ? (type === 'morning' ? 'text-green-300' : type === 'evening' ? 'text-blue-300' : 'text-yellow-400') : textColor;

                        return (
                            <div
                                key={idx}
                                onClick={() => { setActiveTrackName(bookStr); setShowSidebar(false); }}
                                className={`flex items-center justify-between p-4 transition-all border-l-4 cursor-pointer ${activeTrackName === bookStr ? 'bg-[#0f172a] border-blue-500 shadow-inner' : 'bg-[#1a2234] border-transparent hover:bg-[#1f2937]'} ${finalColor}`}
                            >
                                <div className="flex items-center gap-4">
                                    <i className={`pi pi-file-pdf ${activeTrackName === bookStr ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]' : 'text-gray-500'}`}></i>
                                    <span className="text-sm font-bold tracking-wider">{bookStr}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-[#1a2234] p-4 shrink-0 border-t border-gray-800 z-10">
                    <h3 className="text-gray-400 text-xs font-bold tracking-wider mb-3">DAY NAVIGATION</h3>
                    <div className="grid grid-cols-5 gap-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                        {Array.from({ length: trackingDays }, (_, i) => i + 1).map((num) => (
                            <div
                                key={num}
                                onClick={() => setSelectedDay(num)}
                                className={`text-center font-bold text-sm py-1.5 rounded-md cursor-pointer transition-all ${selectedDay === num ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.6)]' : 'bg-[#131b2e] text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                            >
                                {num}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Auto-Hiding fully responsive navigation top-bar bridging to native scroll systems */}
            <div className="fixed top-0 inset-x-0 z-[150] transition-transform duration-300 ease-out transform -translate-y-full hover:translate-y-0 flex flex-col">
                <div className="absolute top-full inset-x-0 h-4 bg-transparent cursor-ns-resize" />
                <div className="px-4 py-3 flex justify-between items-center z-50 w-full shrink-0 shadow-[0_15px_30px_rgba(0,0,0,0.6)] relative bg-[#0b0f19] border-b border-gray-800">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="bg-gray-800 hover:bg-gray-700 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all border border-gray-600 shrink-0">
                            <i className="pi pi-arrow-left text-lg"></i>
                        </button>
                        <button onClick={() => setShowSidebar(true)} className="bg-blue-600 hover:bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all border border-blue-400 shrink-0">
                            <i className="pi pi-bars text-lg"></i>
                        </button>
                    </div>

                    {numPages && (
                        <div className="flex justify-center items-center flex-1 mx-4 max-w-3xl min-w-[300px]">
                            <button onClick={() => flipBookRef.current?.pageFlip().flipPrev()} className="bg-[#1a2234] hover:bg-blue-600 text-white w-10 h-10 flex items-center justify-center rounded-full shadow-2xl border border-gray-600 transition-all shrink-0">
                                <i className="pi pi-angle-left text-lg font-bold -ml-1"></i>
                            </button>
                            <div className="bg-[#1a2234] border border-gray-600 px-4 py-2 rounded-full flex items-center justify-between shadow-2xl shrink-0 flex-1 mx-2 h-10 min-w-[280px]">
                                {(() => {
                                    const activeTrackIndex = playlistBooks.findIndex(b => b.name === activeTrackName);
                                    const isFirstBook = activeTrackIndex <= 0;
                                    const isLastBook = activeTrackIndex === -1 || activeTrackIndex >= playlistBooks.length - 1;

                                    return (
                                        <>
                                            <button
                                                onClick={() => { if (!isFirstBook) setActiveTrackName(playlistBooks[activeTrackIndex - 1].name); }}
                                                disabled={isFirstBook}
                                                className={`flex items-center justify-center shrink-0 w-6 h-6 rounded-full transition-colors ${isFirstBook ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-700 hover:text-white text-blue-400'}`}
                                                title="Previous Book"
                                            >
                                                <i className="pi pi-step-backward text-[10px]"></i>
                                            </button>

                                            <div className="flex-1 flex justify-between items-center mx-2 px-2 overflow-hidden">
                                                <span className="text-blue-400 font-extrabold tracking-widest text-[11px] uppercase whitespace-nowrap hidden sm:inline-block">DAY {selectedDay.toString().padStart(2, '0')}</span>
                                                <span className="text-white font-black tracking-[0.15em] text-[13px] uppercase text-center truncate mx-2 leading-none flex-1">{activeTrackName || 'Book'}</span>
                                                <span className="text-gray-400 font-bold tracking-widest text-[10px] uppercase whitespace-nowrap pb-[1px] hidden md:inline-block">{numPages} TOTAL PAGES</span>
                                            </div>

                                            <button
                                                onClick={() => { if (!isLastBook) setActiveTrackName(playlistBooks[activeTrackIndex + 1].name); }}
                                                disabled={isLastBook}
                                                className={`flex items-center justify-center shrink-0 w-6 h-6 rounded-full transition-colors ${isLastBook ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-700 hover:text-white text-blue-400'}`}
                                                title="Next Book"
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

                    <div className="flex items-center relative">
                        <div className={`absolute right-12 flex items-center pr-2 gap-2 transition-all duration-300 ${showToolMenu ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'}`}>
                            <button
                                onClick={() => {
                                    setShowAudioPlayer(!showAudioPlayer);
                                    setShowToolMenu(false);
                                }}
                                className="bg-gray-800 hover:bg-blue-600 text-white px-5 py-2 rounded-full flex items-center gap-2 border border-gray-600 shadow-xl transition-colors whitespace-nowrap"
                            >
                                <i className="pi pi-play-circle text-lg"></i>
                                <span className="text-[11px] font-black tracking-widest uppercase">PLAYER</span>
                            </button>
                        </div>
                        <button
                            onClick={() => setShowToolMenu(!showToolMenu)}
                            className={`bg-gray-800 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all border border-gray-600 shrink-0 relative z-10 shadow-lg ${showToolMenu ? 'bg-blue-600 border-blue-400 text-white' : 'hover:bg-gray-700'}`}>
                            <i className="pi pi-wrench text-lg"></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Seamless dynamic-flow viewport enforcing perfectly centered layouts strictly mapped to browser origins! */}
            <div className="w-full flex-1 flex flex-col relative z-20 items-center justify-start min-h-[50vh] pt-2 pb-16" ref={bookContainerRef}>

                {activePdfUrl ? (
                    <Document
                        file={activePdfUrl}
                        options={pdfOptions}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        className="pdf-document relative transition-opacity duration-300"
                        loading={
                            <div className="text-white text-xl animate-pulse flex flex-col items-center justify-center gap-4 h-full py-32 px-20">
                                <i className="pi pi-spinner pi-spin text-5xl opacity-80 decoration-blue-500" />
                                <span className="tracking-widest font-bold opacity-80">LOADING DOCUMENT</span>
                            </div>
                        }
                    >
                        {viewerError && (
                            <div className="bg-red-900/80 text-red-100 border border-red-500 rounded-lg p-6 max-w-lg text-center shadow-xl absolute z-50">
                                <i className="pi pi-exclamation-circle text-4xl mb-4 opacity-80" />
                                <h3 className="text-xl font-bold tracking-widest mb-2 uppercase">Error loading PDF</h3>
                                <p className="text-sm opacity-90">{viewerError}</p>
                            </div>
                        )}

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
                                    className="shadow-[0_45px_100px_rgba(0,0,0,1)] ring-1 ring-gray-700/50 flex flex-col justify-center items-center bg-[#ffffff]"
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
                                        showCover={true}
                                        mobileScrollSupport={true}
                                        disableFlipByClick={true}
                                        className="mx-auto"
                                        flippingTime={900}
                                        usePortrait={false}
                                        onFlip={onPageFlip}
                                        ref={flipBookRef}
                                    >
                                        {Array.from(new Array(totalPagesToRender), (_, index) => {
                                            const isHardCover = index === 0 || index === totalPagesToRender - 1;
                                            const isRightPage = (index + 1) % 2 !== 0;

                                            if (index < numPages) {
                                                return (
                                                    <PDFPageRender
                                                        key={index}
                                                        pageNumber={index + 1}
                                                        width={baseWidth}
                                                        isCover={isHardCover}
                                                        pageHighlights={highlights.filter(h => h.pageNumber === index + 1)}
                                                    />
                                                );
                                            } else {
                                                return (
                                                    <div key={index} className={`page ${isHardCover ? 'bg-[#1e2433]' : 'bg-[#ffffff]'} shadow-2xl`} data-density={isHardCover ? "hard" : "soft"}>
                                                        <div className={`page-content w-full h-full ${isHardCover ? 'bg-[#2a3045] border-[3px] border-[#151a26]' : 'bg-[#e5e7eb]'} flex flex-col justify-center items-center relative`}>
                                                            <i className="pi pi-book text-8xl text-gray-400 opacity-20"></i>
                                                            <div className="absolute inset-y-0 inset-x-0 pointer-events-none z-10" style={lightingObj} />
                                                            <div className="absolute inset-y-0 inset-x-0 pointer-events-none z-20" style={isRightPage ? rightSpineObj : leftSpineObj} />
                                                            <div className="absolute inset-y-0 inset-x-0 pointer-events-none z-30" style={isRightPage ? rightEdgeObj : leftEdgeObj} />
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        })}
                                    </HTMLFlipBook>
                                </div>
                            </div>
                        )}
                    </Document>
                ) : (
                    <div className="mx-auto bg-[#1a2234] border border-gray-700 rounded-xl p-16 py-20 flex flex-col items-center justify-center text-gray-400 gap-6 shadow-2xl max-w-lg relative z-50">
                        <i className="pi pi-file-excel text-6xl opacity-40 text-red-400"></i>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">No Document Attached</h2>
                            <p className="text-sm opacity-80 leading-relaxed">The selected module does not contain any functional PDF payloads mapped to it.</p>
                        </div>
                    </div>
                )}

                {/* Ancient Scroll Overlay Rendering! */}
                {selectionMenu && (
                    <ScrollMenuPopup
                        position={selectionMenu}
                        onSelect={captureHighlight}
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
                                <button onClick={togglePlay} className="text-black hover:scale-110 active:scale-95 transition-all outline-none mr-3">
                                    <i className={`pi ${isPlaying ? 'pi-pause' : 'pi-play'} text-[32px]`}></i>
                                </button>

                                {/* Center Column: Scrubber & Text Row */}
                                <div className="flex-1 flex flex-col justify-center gap-1 mx-2 relative top-0.5">
                                    {/* Scrubber - data-nodrag="true" ensures dragging the bar seeks instead of dragging the whole component */}
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
                                        <span className="text-[14px] uppercase tracking-widest leading-none drop-shadow-sm">{activeTrackName || 'Pro 1'}</span>
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
                                        activePoint={activePoint}
                                        onPencilClick={(color) => {
                                            setPlayerBgColor(color);
                                        }}
                                        onLetterClick={(color) => {
                                            setPlayerBorderColor(color);
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

export default SMTPlayer;
