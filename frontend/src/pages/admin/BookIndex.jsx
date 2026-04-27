import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import HTMLFlipBook from 'react-pageflip';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const pdfOptions = {
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
    cMapPacked: true,
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
            <div className="px-4 py-3 flex flex-col gap-1 font-bold font-serif whitespace-nowrap bg-white">
                <div className="flex items-center gap-2">
                    <span className="text-[#8e2b8c] text-sm">1.</span>
                    <span className="text-[#8e2b8c] text-xl font-black leading-none drop-shadow-sm">W</span>
                    <span className="text-black text-xs font-black uppercase tracking-wider">ISDOM OF GOD</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[#294291] text-sm">2.</span>
                    <span className="text-[#294291] text-xl font-black leading-none drop-shadow-sm">I</span>
                    <span className="text-black text-xs font-black uppercase tracking-wider">MAGINATION</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[#86c5f7] text-sm">3.</span>
                    <span className="text-[#86c5f7] text-xl font-black leading-none drop-shadow-sm">S</span>
                    <span className="text-black text-xs font-black uppercase tracking-wider">CRIPTURES TO PRAYER</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[#38b948] text-sm">4.</span>
                    <span className="text-[#38b948] text-xl font-black leading-none drop-shadow-sm">D</span>
                    <span className="text-black text-xs font-black uppercase tracking-wider">AILY GROWING IN GODLINESS</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[#e3242b] text-sm">5.</span>
                    <span className="text-[#e3242b] text-xl font-black leading-none drop-shadow-sm">O</span>
                    <span className="text-black text-xs font-black uppercase tracking-wider">BEDIENCE TO GOD'S WILL</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[#ed9b26] text-sm">6.</span>
                    <span className="text-[#ed9b26] text-xl font-black leading-none drop-shadow-sm">M</span>
                    <span className="text-black text-xs font-black uppercase tracking-wider">EDITATING ON GOD'S CHARACTER</span>
                </div>
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

                {/* Explicit Corner Hover Zones */}
                <div className="absolute top-0 left-0 w-[15%] h-[15%] cursor-pointer z-[60]" />
                <div className="absolute top-0 right-0 w-[15%] h-[15%] cursor-pointer z-[60]" />
                <div className="absolute bottom-0 left-0 w-[15%] h-[15%] cursor-pointer z-[60]" />
                <div className="absolute bottom-0 right-0 w-[15%] h-[15%] cursor-pointer z-[60]" />
            </div>
        </div>
    );
});

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


    const togglePlay = () => {
        if (!selectedBook || !selectedChapter) return;
        const trackIdentifier = `${selectedBook.name} ${selectedChapter.chapter_number}`;

        if (audioLoadedTrackName !== trackIdentifier) {
            const content = contentDB.find(c => c.book_id === selectedBook.id && c.chapter_id === selectedChapter.id);
            if (content && content.audio_url) {
                audioRef.current.src = `http://localhost:8000${content.audio_url}`;
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
        const handleStopPropagation = (e) => {
            if (e.target.closest('.react-pdf__Page__textContent')) {
                e.stopPropagation();
            }
        };

        const handleTextSelectionComplete = (e) => {
            if (e.target.closest('.ancient-scroll-bg')) return;
            const textContentNode = e.target.closest('.react-pdf__Page__textContent');
            if (!textContentNode) {
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

        document.addEventListener('mousedown', handleStopPropagation, true);
        document.addEventListener('touchstart', handleStopPropagation, true);
        document.addEventListener('pointerdown', handleStopPropagation, true);
        document.addEventListener('mouseup', handleTextSelectionComplete);

        return () => {
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
            if (isMountain) { nextState.hasMountain = true; } else { nextState.hasCategory = true; }
            if (nextState.hasMountain && nextState.hasCategory) {
                setTimeout(() => window.getSelection().removeAllRanges(), 0);
                return null;
            }
            return nextState;
        });
    };

    const groupedBooks = React.useMemo(() => {
        const groups = {};
        booksDB.forEach(book => {
            const type = book.book_type || 'Uncategorized';
            if (!groups[type]) groups[type] = [];
            groups[type].push(book);
        });
        return groups;
    }, [booksDB]);

    const expandedBookChapters = React.useMemo(() => {
        if (!expandedBookId) return [];
        return chaptersDB
            .filter(c => c.book_id === expandedBookId)
            .sort((a, b) => a.chapter_number - b.chapter_number);
    }, [expandedBookId, chaptersDB]);

    // Cleanup: When the user opens the accordion, no chapter should be selected automatically.

    useEffect(() => {
        axios.get('http://localhost:8000/api/books', { withCredentials: true })
            .then(res => {
                const sorted = res.data.sort((a, b) => a.name.localeCompare(b.name));
                setBooksDB(sorted);
            })
            .catch(console.error);

        axios.get('http://localhost:8000/api/chapters', { withCredentials: true })
            .then(res => setChaptersDB(res.data))
            .catch(console.error);

        axios.get('http://localhost:8000/api/contents/list', { withCredentials: true })
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
                if (Array.isArray(pdfs) && pdfs.length > 0) return `http://localhost:8000${pdfs[0]}`;
                if (typeof pdfs === 'string') return `http://localhost:8000${pdfs}`;
            } catch (e) {
                return `http://localhost:8000${content.pdf_url}`;
            }
        }
        return null;
    }, [selectedBook, selectedChapter, contentDB]);

    useEffect(() => {
        setAspectReady(false);
    }, [activePdfUrl]);

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
                    <button onClick={() => setIsSidebarOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all border border-blue-400 shrink-0">
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
                <div className="px-6 py-5 border-b border-[#2a3045] bg-[#151a26] flex justify-between items-start">
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

                <div className="flex-1 overflow-y-auto tier1-scroll px-3 py-4">
                    {Object.keys(groupedBooks).map(type => (
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
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-100 relative custom-scrollbar">

                {/* TIER 3: Reading Interface (Reader Canvas) */}
                <div className="flex-1 relative bookindex-reader-bg w-full min-h-max pb-24" ref={bookContainerRef}>

                    <div className="relative z-10 w-full flex justify-center items-start">
                        {activePdfUrl ? (
                            <div className="w-full h-full flex justify-center items-center">
                                <Document
                                    file={activePdfUrl}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    options={pdfOptions}
                                    className="pdf-document relative flex flex-col justify-center items-center h-full w-full"
                                    loading={
                                        <div className="flex flex-col items-center justify-center p-20 text-[#8b5a2b]">
                                            <i className="pi pi-spinner pi-spin text-4xl opacity-70 mb-4"></i>
                                            <span className="font-bold tracking-widest uppercase text-sm">Unrolling Scroll...</span>
                                        </div>
                                    }
                                    error={
                                        <div className="flex flex-col items-center justify-center p-20 text-red-800/60 font-bold bg-white/30 rounded-lg shadow-inner">
                                            <i className="pi pi-exclamation-triangle text-4xl mb-4"></i>
                                            <p className="tracking-widest uppercase">The scroll for this chapter is missing.</p>
                                        </div>
                                    }
                                >
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
                                                            const rightSpineObj = { background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(255,255,255,0.4) 3%, rgba(0,0,0,0.1) 8%, rgba(0,0,0,0) 25%)' };
                                                            const leftSpineObj = { background: 'linear-gradient(to left, rgba(0,0,0,0.5) 0%, rgba(255,255,255,0.4) 3%, rgba(0,0,0,0.1) 8%, rgba(0,0,0,0) 25%)' };
                                                            const lightingObj = { background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.06) 100%)' };

                                                            return (
                                                                <div key={index} className={`page ${isHardCover ? 'bg-[#1e2433]' : 'bg-[#ffffff]'} shadow-2xl`} data-density={isHardCover ? "hard" : "soft"}>
                                                                    <div className={`page-content w-full h-full ${isHardCover ? 'bg-[#2a3045] border-[3px] border-[#151a26]' : 'bg-[#e5e7eb]'} flex flex-col justify-center items-center relative`}>
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
                                </Document>
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

export default BookIndex;

