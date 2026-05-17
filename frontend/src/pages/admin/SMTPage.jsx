import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { StudentService } from '../../services/studentService';
import ScrollMenuModal from '../../components/admin/ScrollMenuModal';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const pdfOptions = {
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
    cMapPacked: true,
};


// --- Shared Constants & Utilities from SMTPlayer ---
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

const HIGHLIGHT_CATEGORIES = [
    { label: "Imagination", color: "#294291" },
    { label: "Scriptures to prayer", color: "#86c5f7" },
    { label: "Daily growing in Godliness", color: "#38b948" },
    { label: "Obedience to God's will", color: "#e3242b" },
    { label: "Meditating on God's character", color: "#ed9b26" }
];

const SEVEN_MOUNTAIN_SPHERES = [
    { label: "Family", color: "#00c0ff" },
    { label: "Finance", color: "#00a638" },
    { label: "Government", color: "#3340cd" },
    { label: "Spirituality", color: "#fafa33" },
    { label: "Talent", color: "#bb43b1" },
    { label: "Training", color: "#fe6d01" },
    { label: "Service", color: "#fe0005" }
];

const AUDIO_TIMESTAMPS = {
    'PSALMS 1': [
        { point: 1, start: 5, end: 15 },
        { point: 2, start: 16, end: 25 },
        { point: 3, start: 26, end: 35 },
        { point: 4, start: 36, end: 45 },
        { point: 5, start: 46, end: 55 },
        { point: 6, start: 56, end: 65 }
    ]
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

// --- Custom Components ---
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

// Global styles for HTML Document Pages (A4 virtual mapping)
const HTMLPageOverrides = () => (
    <style>{`
        .smt-html-page {
            width: 100%;
            max-width: 900px;
            min-height: 500px;
            background: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            margin: 0 auto 20px auto;
            position: relative;
            box-sizing: border-box;
            padding: 40px;
            overflow: hidden;
            flex-shrink: 0;
            transition: transform 0.2s ease-out;
            border-radius: 14px;
        }
        .smt-pdf-page {
            padding: 0 !important;
            width: max-content !important;
            min-height: auto !important;
        }
        .smt-html-page-content {
            width: 100%;
            height: 100%;
            position: relative;
            font-family: Georgia, serif;
            line-height: 1.8;
            color: #222;
            z-index: 10;
        }
        .smt-html-page-content p {
            margin-bottom: 1em;
        }
        .smt-html-page-content h1 {
            text-align: center;
            color: #6b3e12;
            margin-bottom: 40px;
            font-weight: bold;
        }
        .smt-html-page-content h2 {
            color: #8b4513;
            border-bottom: 2px solid #ddd;
            padding-bottom: 5px;
            margin-top: 40px;
            margin-bottom: 0.5em;
            font-weight: bold;
        }
        .smt-html-page-content .verse {
            margin: 10px 0;
        }
        .smt-html-page-content .verse-number {
            font-weight: bold;
            color: #a0522d;
        }
        
        .html-annotation-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 20;
        }

        .highlight-rect {
            position: absolute;
            mix-blend-mode: multiply;
            pointer-events: auto;
            cursor: pointer;
            transition: all 0.2s;
        }
        .highlight-rect:hover {
            opacity: 0.8;
            filter: brightness(1.2);
        }

        .annotation-marker {
            position: absolute;
            pointer-events: auto;
            cursor: pointer;
            z-index: 30;
            transform: translate(-50%, -50%);
        }

        @media print {
            body { background: white !important; }
            .smt-html-page {
                box-shadow: none !important;
                margin: 0 !important;
                break-after: page;
            }
            .no-print { display: none !important; }
        }
    `}</style>
);





// --- Main HTML Page Renderer component ---
const HTMLPageRender = React.forwardRef(({ 
    pageData, 
    pageNumber, 
    zoomLevel, 
    highlights, 
    onAddAnnotation,
    onHighlightClick
}, ref) => {
    
    return (
        <div 
            ref={ref}
            className="smt-html-page" 
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
            data-page-number={pageNumber}
            onDoubleClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                if(onAddAnnotation) onAddAnnotation(pageNumber, x, y);
            }}
        >
            <div 
                className="smt-html-page-content"
                dangerouslySetInnerHTML={{ __html: pageData?.content || '' }}
            />

            <div className="html-annotation-layer">
                {highlights.map(h => {
                    return h.rects.map((rect, i) => {
                        let styles = {
                            top: `${rect.top}%`,
                            left: `${rect.left}%`,
                            width: `${rect.width}%`,
                            height: `${rect.height}%`,
                        };
                        
                        if (h.format === 'underline') {
                            styles.borderBottom = `2px solid ${h.color}`;
                        } else if (h.format === 'square' || h.isSquare) {
                            styles.border = `2px solid ${h.color}`;
                            styles.borderRadius = '4px';
                        } else if (h.format === 'circle') {
                            styles.border = `2px solid ${h.color}`;
                            styles.borderRadius = '9999px';
                        } else {
                            styles.backgroundColor = h.color;
                            styles.opacity = 0.35;
                        }

                        return (
                            <div 
                                key={`${h.id}_${i}`} 
                                className="highlight-rect" 
                                style={styles}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if(onHighlightClick) onHighlightClick(h);
                                }}
                            />
                        );
                    });
                })}
                
                {highlights.filter(h => h.annotation).map(h => (
                    <div 
                        key={`anno_${h.id}`}
                        className="annotation-marker shadow-md"
                        style={{
                            top: `${h.rects[0]?.top}%`,
                            left: `${h.rects[0]?.left}%`,
                            backgroundColor: '#ffeb3b',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            transform: 'translate(0, -100%)'
                        }}
                    >
                        <i className="pi pi-comment mr-1"></i>
                    </div>
                ))}
            </div>
        </div>
    );
});


const SMTPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const trackingDays = parseInt(searchParams.get('days')) || 30;

    const [currentTime, setCurrentTime] = useState(formatDateTime(new Date()));

    const [booksDB, setBooksDB] = useState([]);
    const [contentDB, setContentDB] = useState([]);

    const [activeTrackName, setActiveTrackName] = useState('');
    const [expandedBook, setExpandedBook] = useState(null);
    const [showSidebar, setShowSidebar] = useState(false);
    
    // HTML Document State
    const [htmlPages, setHtmlPages] = useState([]);
    const [zoomLevel, setZoomLevel] = useState(1);
    const documentContainerRef = useRef(null);

    // PDF Document State
    const [numPages, setNumPages] = useState(null);
    const [activePdfUrl, setActivePdfUrl] = useState(null);


    // Highlighting State Memory
    const [highlights, setHighlights] = useState([]);
    const [selectionMenu, setSelectionMenu] = useState(null);

    // Local Completion Tracking
    const [finishedDays, setFinishedDays] = useState(() => {
        try {
            return new Set(JSON.parse(localStorage.getItem('finished_days_smt') || '[]'));
        } catch {
            return new Set();
        }
    });

    useEffect(() => {
        localStorage.setItem('finished_days_smt', JSON.stringify([...finishedDays]));
    }, [finishedDays]);

    const lastTouchRef = useRef(0);

    const incrementKltTouch = () => {
        const now = Date.now();
        if (now - lastTouchRef.current < 500) return;
        lastTouchRef.current = now;
        StudentService.updateMyTouchCounts({ transformation: 0, team_transformation: 0, klt_reading_plan: 1 })
            .catch(err => console.log('Touch count update skipped:', err?.response?.status));
    };

    useEffect(() => {
        if (booksDB && booksDB.length > 0 && !activeTrackName) {
            setActiveTrackName(`${booksDB[0].name} 1`);
            setExpandedBook(booksDB[0].name);
        }
    }, [booksDB, activeTrackName]);


    // Data Fetching
    useEffect(() => {
        axios.get('http://' + window.location.hostname + ':8000/api/books', { withCredentials: true })
            .then(res => setBooksDB(res.data))
            .catch(console.error);

        axios.get('http://' + window.location.hostname + ':8000/api/contents/list', { withCredentials: true })
            .then(res => setContentDB(res.data))
            .catch(console.error);

        const timer = setInterval(() => setCurrentTime(formatDateTime(new Date())), 1000);
        return () => clearInterval(timer);
    }, []);

    // Load HTML / PDF Document Content
    useEffect(() => {
        if (!activeTrackName || contentDB.length === 0) {
            setActivePdfUrl(null);
            setHtmlPages([]);
            return;
        }
        
        const parts = activeTrackName.trim().split(' ');
        const chapNum = parseInt(parts.pop());
        const bookName = parts.join(' ').toUpperCase();

        const content = contentDB.find(c => c.book_name.toUpperCase() === bookName && parseInt(c.chapter_number) === chapNum);
        
        if (content) {
            if (content.pdf_url) {
                try {
                    const pdfs = JSON.parse(content.pdf_url);
                    if (Array.isArray(pdfs) && pdfs.length > 0) {
                        setActivePdfUrl(`http://${window.location.hostname}:8000${pdfs[0]}`);
                    } else if (typeof pdfs === 'string') {
                        setActivePdfUrl(`http://${window.location.hostname}:8000${pdfs}`);
                    }
                } catch (e) {
                    setActivePdfUrl(`http://${window.location.hostname}:8000${content.pdf_url}`);
                }
                setHtmlPages([]);
            } else if (content.description) {
                setActivePdfUrl(null);
                let contentStr = content.description || "";
                setHtmlPages([{ id: 1, content: `<h1>${activeTrackName}</h1>` + contentStr }]);
            } else {
                setActivePdfUrl(null);
                setHtmlPages([]);
            }
        } else {
            setActivePdfUrl(null);
            setHtmlPages([]);
        }
    }, [activeTrackName, contentDB]);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }


    // DOM Text Selection Logic (Highlighter Engine)
    useEffect(() => {
        const handleTextSelectionComplete = (e) => {
            if (e.target.closest('.smt-scroll-popup') || e.target.closest('.no-print')) return;

            const pageNode = e.target.closest('.smt-html-page');
            if (!pageNode) return;

            const selection = window.getSelection();
            if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
                const range = selection.getRangeAt(0);
                
                // Collect specific text nodes to prevent block-element gaps from being highlighted
                let textNodes = [];
                if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
                    textNodes.push(range.commonAncestorContainer);
                } else {
                    const treeWalker = document.createTreeWalker(
                        range.commonAncestorContainer,
                        NodeFilter.SHOW_TEXT,
                        {
                            acceptNode: function(node) {
                                return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                            }
                        }
                    );
                    while(treeWalker.nextNode()) textNodes.push(treeWalker.currentNode);
                }

                let rects = [];
                if (textNodes.length > 0) {
                    textNodes.forEach(node => {
                        const subRange = document.createRange();
                        subRange.selectNodeContents(node);
                        
                        if (node === range.startContainer) {
                            subRange.setStart(node, range.startOffset);
                        }
                        if (node === range.endContainer) {
                            subRange.setEnd(node, range.endOffset);
                        }
                        
                        // Only add rects that have actual dimensions (ignores empty newlines)
                        const nodeRects = Array.from(subRange.getClientRects()).filter(r => r.width > 2 && r.height > 2);
                        rects.push(...nodeRects);
                    });
                } else {
                    rects = Array.from(range.getClientRects()).filter(r => r.width > 2 && r.height > 2);
                }
                
                if (rects.length === 0) {
                    setSelectionMenu(null);
                    return;
                }

                const pageRect = pageNode.getBoundingClientRect();
                const pageNumber = parseInt(pageNode.getAttribute('data-page-number')) || 1;

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

        document.addEventListener('mouseup', handleTextSelectionComplete);
        return () => document.removeEventListener('mouseup', handleTextSelectionComplete);
    }, []);

    const captureHighlight = (categoryObj, format, styleOption) => {
        if (!selectionMenu) return;

        if (format === 'copy') {
            navigator.clipboard.writeText(selectionMenu.text || window.getSelection().toString());
            setSelectionMenu(null);
            setTimeout(() => window.getSelection().removeAllRanges(), 0);
            return;
        }

        if (format === 'remove') {
            setHighlights(prev => prev.filter(h => {
                if (h.pageNumber !== selectionMenu.pageNumber) return true;
                return !h.rects.some(hr => 
                    selectionMenu.rects.some(sr => 
                        !(hr.left > sr.left + sr.width || hr.left + hr.width < sr.left || hr.top > sr.top + sr.height || hr.top + hr.height < sr.top)
                    )
                );
            }));
            setSelectionMenu(null);
            setTimeout(() => window.getSelection().removeAllRanges(), 0);
            return;
        }

        const isMountain = SEVEN_MOUNTAIN_SPHERES.some(m => m.label === categoryObj.label);

        setHighlights(prev => [...prev, {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            color: categoryObj.color,
            label: categoryObj.label,
            rects: selectionMenu.rects,
            pageNumber: selectionMenu.pageNumber,
            isSquare: isMountain,
            format: format,
            styleOption: styleOption,
            text: selectionMenu.text
        }]);

        setSelectionMenu(null);
        setTimeout(() => window.getSelection().removeAllRanges(), 0);
    };

    // Zoom & Navigation
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 3));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.4));
    
    return (
        <div className="fixed inset-0 z-[100] bg-[#e5e7eb] flex flex-col font-sans overflow-hidden">
            <HTMLPageOverrides />

            {/* Sidebar (reused logic) */}
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
                    <span className="text-white font-black text-lg tracking-wider">BOOKS</span>
                    <span className="text-blue-400 font-bold text-xs tracking-wider uppercase">Library</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-0 flex flex-col gap-[1px] bg-gray-800 pb-10">
                    {booksDB.map((bookObj, idx) => {
                        const bookStr = bookObj.name;
                        const isExpanded = expandedBook === bookStr;

                        return (
                            <div key={idx} className="flex flex-col border-b border-gray-700">
                                <div
                                    onClick={() => setExpandedBook(isExpanded ? null : bookStr)}
                                    className={`flex items-center justify-between p-4 transition-all cursor-pointer ${isExpanded ? 'bg-[#0f172a]' : 'bg-[#1a2234] hover:bg-[#1f2937]'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <i className={`pi ${isExpanded ? 'pi-folder-open' : 'pi-folder'} ${isExpanded ? 'text-blue-400' : 'text-gray-500'}`}></i>
                                        <span className={`text-sm font-bold tracking-wider ${isExpanded ? 'text-blue-300' : 'text-white'}`}>{bookStr}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-400 bg-gray-900 px-2 py-0.5 rounded-md">{bookObj.total_chapters || 0} Ch</span>
                                        <i className={`pi ${isExpanded ? 'pi-chevron-down' : 'pi-chevron-right'} text-xs text-gray-500`}></i>
                                    </div>
                                </div>
                                
                                {isExpanded && (
                                    <div className="bg-[#111827] flex flex-col pl-4 pr-2 py-2 gap-1 max-h-60 overflow-y-auto custom-scrollbar shadow-inner">
                                        {Array.from({ length: bookObj.total_chapters || 0 }, (_, i) => i + 1).map(chapterNum => {
                                            const trackStr = `${bookStr} ${chapterNum}`;
                                            const isActive = activeTrackName === trackStr;
                                            return (
                                                <div
                                                    key={chapterNum}
                                                    onClick={() => { setActiveTrackName(trackStr); setShowSidebar(false); incrementKltTouch(); }}
                                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${isActive ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent'}`}
                                                >
                                                    <i className={`pi pi-file text-xs ${isActive ? 'text-blue-400' : 'text-gray-600'}`}></i>
                                                    <span className="text-sm font-bold tracking-wide">Chapter {chapterNum}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Top Toolbar */}
            <div className="no-print fixed top-0 inset-x-0 z-[100] bg-white border-b border-gray-300 shadow-sm px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-black transition-colors w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200">
                        <i className="pi pi-arrow-left text-lg"></i>
                    </button>
                    <button onClick={() => setShowSidebar(true)} className="text-white bg-blue-600 hover:bg-blue-700 transition-colors w-10 h-10 rounded-full flex items-center justify-center shadow-md">
                        <i className="pi pi-bars text-lg"></i>
                    </button>
                </div>

                <div className="flex items-center gap-4 bg-gray-100 rounded-lg p-1 shadow-inner">
                    <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-white rounded hover:shadow-sm transition-all"><i className="pi pi-search-minus"></i></button>
                    <span className="text-sm font-bold w-12 text-center text-gray-700">{Math.round(zoomLevel * 100)}%</span>
                    <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-white rounded hover:shadow-sm transition-all"><i className="pi pi-search-plus"></i></button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Print and PDF options removed as per request */}
                </div>
            </div>

            {/* Document Workspace */}
            <div className="flex-1 overflow-y-auto w-full pt-24 pb-20 flex flex-col items-center bg-[#f5f3ee]" ref={documentContainerRef}>
                <div className="flex flex-col items-center w-full max-w-[1400px] px-10 gap-10">
                    {activePdfUrl ? (
                        <Document
                            file={activePdfUrl}
                            options={pdfOptions}
                            onLoadSuccess={onDocumentLoadSuccess}
                            className="flex flex-col items-center w-full gap-10"
                            loading={
                                <div className="flex items-center justify-center h-64 text-gray-500">
                                    <i className="pi pi-spinner pi-spin text-4xl opacity-50"></i>
                                </div>
                            }
                        >
                            {Array.from(new Array(numPages || 0), (el, index) => (
                                <div key={`page_${index + 1}`} className="shadow-2xl relative bg-white smt-html-page smt-pdf-page" data-page-number={index + 1} style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}>
                                    <Page 
                                        pageNumber={index + 1} 
                                        width={794} 
                                        renderTextLayer={true} 
                                        renderAnnotationLayer={false}
                                        devicePixelRatio={Math.max(window.devicePixelRatio || 1, 2.0)}
                                        className="smt-canvas-wrapper"
                                    />
                                    {/* Overlay our custom highlights over the PDF page! */}
                                    {highlights.filter(h => h.pageNumber === index + 1).map(h => {
                                        return (
                                            <React.Fragment key={h.id}>
                                                {h.rects.map((rect, i) => {
                                                    let styles = {
                                                        position: 'absolute',
                                                        top: `${rect.top}%`,
                                                        left: `${rect.left}%`,
                                                        width: `${rect.width}%`,
                                                        height: `${rect.height}%`,
                                                        pointerEvents: 'none',
                                                        zIndex: (h.format === 'highlight' || (!h.format && !h.isSquare)) ? 45 : 55
                                                    };

                                                    let bStyle = 'solid';
                                                    let bWidth = '2px';
                                                    if (h.styleOption === 'double-3px') { bStyle = 'double'; bWidth = '4px'; }
                                                    else if (h.styleOption === 'solid-3px') { bStyle = 'solid'; bWidth = '4px'; }
                                                    else if (h.styleOption === 'solid-1px') { bStyle = 'solid'; bWidth = '2px'; }
                                                    else if (h.styleOption === 'dotted-2px') { bStyle = 'dotted'; bWidth = '3px'; }
                                                    else if (h.styleOption === 'dashed-2px') { bStyle = 'dashed'; bWidth = '3px'; }
                                                    else if (h.styleOption?.startsWith('line-')) {
                                                        bStyle = 'solid';
                                                        bWidth = `${h.styleOption.split('-')[1]}`;
                                                    }

                                                    if (h.format === 'underline') {
                                                        return (
                                                            <div key={`${h.id}_${i}`} style={styles}>
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    bottom: '-2px',
                                                                    left: 0,
                                                                    width: '100%',
                                                                    height: '2px',
                                                                    boxSizing: 'content-box',
                                                                    borderBottomStyle: bStyle,
                                                                    borderBottomWidth: bWidth,
                                                                    borderBottomColor: h.color || '#dc2626'
                                                                }} />
                                                            </div>
                                                        );
                                                    }

                                                    let shadowStyle = {};
                                                    if (h.styleOption === 'inner-shadow') {
                                                        bStyle = 'none';
                                                        bWidth = '0';
                                                        shadowStyle = { boxShadow: `inset 0 0 12px ${h.color || '#dc2626'}` };
                                                    } else if (h.styleOption === 'outer-shadow') {
                                                        bStyle = 'none';
                                                        bWidth = '0';
                                                        shadowStyle = { boxShadow: `0 0 12px ${h.color || '#dc2626'}` };
                                                    }

                                                    if (h.format === 'circle') {
                                                        styles.borderStyle = bStyle;
                                                        styles.borderWidth = bWidth;
                                                        styles.borderColor = h.color || '#dc2626';
                                                        styles.borderRadius = '9999px';
                                                        styles.opacity = 1;
                                                        styles.boxSizing = 'content-box';
                                                        styles.padding = '0px 4px';
                                                        styles.margin = '2px 0 0 -4px';
                                                        styles.height = `calc(${rect.height}% - 4px)`;
                                                        Object.assign(styles, shadowStyle);
                                                    } else if (h.format === 'square' || (!h.format && h.isSquare)) {
                                                        styles.borderStyle = bStyle;
                                                        styles.borderWidth = bWidth;
                                                        styles.borderColor = h.color || '#dc2626';
                                                        styles.borderRadius = '4px';
                                                        styles.opacity = 1;
                                                        styles.boxSizing = 'content-box';
                                                        styles.padding = '0px 2px';
                                                        styles.margin = '2px 0 0 -2px';
                                                        styles.height = `calc(${rect.height}% - 4px)`;
                                                        Object.assign(styles, shadowStyle);
                                                    } else {
                                                        let thicknessRatio = 1;
                                                        if (h.styleOption && h.styleOption.startsWith('hl-')) {
                                                            const level = parseInt(h.styleOption.split('-')[1]);
                                                            thicknessRatio = level / 5;
                                                        }
                                                        styles.backgroundColor = h.color || '#ffeb3b';
                                                        styles.opacity = 0.75;
                                                        styles.mixBlendMode = 'multiply';
                                                        const currentH = parseFloat(rect.height);
                                                        const newH = currentH * thicknessRatio;
                                                        const topOffset = currentH - newH;
                                                        styles.top = `${parseFloat(rect.top) + topOffset}%`;
                                                        styles.height = `${newH}%`;
                                                    }

                                                    return <div key={`${h.id}_${i}`} style={styles} />;
                                                })}
                                            </React.Fragment>
                                        );
                                    })}

                                    {/* Render Annotation Icons for PDF */}
                                    {highlights.filter(h => h.pageNumber === index + 1 && (h.format === 'highlight' || (!h.format && !h.isSquare))).map(h => (
                                        <div
                                            key={`icon_${h.id}`}
                                            className="absolute cursor-pointer hover:scale-110 transition-transform shadow-md z-50 flex items-center justify-center bg-white border border-gray-200"
                                            style={{
                                                top: `${h.rects[0]?.top}%`,
                                                left: `${h.rects[0]?.left}%`,
                                                backgroundColor: '#ffeb3b',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                transform: 'translate(0, -100%)'
                                            }}
                                        >
                                            <i className="pi pi-comment mr-1"></i>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </Document>
                    ) : htmlPages.length > 0 ? (
                        htmlPages.map((page, index) => (
                            <div key={`html_page_${page.id}`} className="mb-10 w-fit">
                                <HTMLPageRender 
                                    pageData={page}
                                    pageNumber={index + 1}
                                    zoomLevel={zoomLevel}
                                    highlights={highlights.filter(h => h.pageNumber === index + 1)}
                                    onHighlightClick={(h) => {
                                        console.log("Clicked highlight:", h);
                                    }}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="mt-20 bg-white border border-gray-300 rounded-xl p-16 py-20 flex flex-col items-center justify-center text-gray-400 gap-6 shadow-sm max-w-lg w-full">
                            <i className="pi pi-file text-6xl text-gray-300"></i>
                            <h2 className="text-2xl font-bold text-gray-600 mb-2 tracking-wide">No Content Found</h2>
                        </div>
                    )}
                </div>
            </div>

            <ScrollMenuModal
                isOpen={!!selectionMenu}
                onSelect={(cat, format, styleOption) => captureHighlight(cat, format, styleOption)}
                onClose={() => {
                    setSelectionMenu(null);
                    window.getSelection().removeAllRanges();
                }}
            />
        </div>
    );
};

export default SMTPage;
