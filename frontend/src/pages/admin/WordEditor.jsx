import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import WordToolbar from '../../components/admin/WordToolbar';
import SavedDocumentsModal from '../../components/admin/SavedDocumentsModal';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import FontFamily from '@tiptap/extension-font-family';
import { ResizableImage, ShapeNode, TextBoxNode, WisdomMark, TextEffectMark, FontSizeMark, PageNode, CustomDocument } from '../../components/admin/tiptap-extensions/extensions';

// Phase 3 Migration: Tiptap NodeViews
// Custom Quill Blots have been completely replaced with React-driven Tiptap NodeViews.

const PAGE_SIZES = {
    'A4': { name: 'A4', width: '210mm', height: '297mm', padding: '20mm', linePx: 1122 },
    'A5': { name: 'A5', width: '148mm', height: '210mm', padding: '15mm', linePx: 793 },
    'A6': { name: 'A6', width: '105mm', height: '148mm', padding: '10mm', linePx: 559 },
    'A8': { name: 'A8', width: '52mm', height: '74mm', padding: '5mm', linePx: 280 },
    'Letter': { name: 'Letter', width: '8.5in', height: '11in', padding: '1in', linePx: 1056 },
    'Legal': { name: 'Legal', width: '8.5in', height: '14in', padding: '1in', linePx: 1344 }
};

const WordEditor = () => {
    const quillRef = useRef(null);
    const [title, setTitle] = useState('Untitled Document');
    const [content, setContent] = useState('');
    const [pageSize, setPageSize] = useState('Letter'); // Added state for Dynamic Settings
    const [watermark, setWatermark] = useState('');
    const [language, setLanguage] = useState('en');
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [category, setCategory] = useState(null);
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isChartEditing, setIsChartEditing] = useState(false);
    const [documentId, setDocumentId] = useState(null);
    const [mapModalOpen, setMapModalOpen] = useState(false);
    const [mapUrl, setMapUrl] = useState('');
    const [zoomLevel, setZoomLevel] = useState(1);
    const [selectedImage, setSelectedImage] = useState(null);
    const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);
    const debounceTimeout = useRef(null);

    // Book Index States
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);
    const [expandedBookId, setExpandedBookId] = useState(null);
    const [expandedChapterId, setExpandedChapterId] = useState(null);

    useEffect(() => {
        axios.get('http://' + window.location.hostname + ':8000/api/books', { withCredentials: true })
            .then(res => {
                const sorted = res.data.sort((a, b) => a.name.localeCompare(b.name));
                setBooksDB(sorted);
            })
            .catch(console.error);

        axios.get('http://' + window.location.hostname + ':8000/api/chapters', { withCredentials: true })
            .then(res => setChaptersDB(res.data))
            .catch(console.error);
    }, []);

    const editor = useEditor({
        extensions: [
            CustomDocument,
            PageNode,
            StarterKit.configure({ document: false }),
            TextStyle,
            Color,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            ResizableImage,
            ShapeNode,
            TextBoxNode,
            WisdomMark,
            TextEffectMark,
            FontSizeMark,
            Link.configure({ openOnClick: false }),
            FontFamily
        ],
        content: content,
        onUpdate: ({ editor }) => {
            handleContentChange(editor.getHTML());
        }
    });

    // We keep a fake quillRef to not crash WordToolbar during Phase 2 migration
    useEffect(() => {
        if (!quillRef.current) {
            quillRef.current = {
                getEditor: () => ({
                    on: () => {},
                    off: () => {},
                    format: () => {},
                    getFormat: () => ({}),
                    getSelection: () => ({ index: 0, length: 0 }),
                    getLength: () => 0,
                    insertText: () => {},
                    insertEmbed: () => {},
                    deleteText: () => {},
                    setSelection: () => {},
                    root: {
                        addEventListener: () => {},
                        removeEventListener: () => {},
                        setAttribute: () => {},
                        blur: () => {},
                        innerHTML: ''
                    }
                })
            };
        }
    }, []);

    // Update Tiptap if external content changes
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // we don't want to replace content continuously
            // editor.commands.setContent(content, false)
        }
    }, [content, editor]);

    useEffect(() => {
        // Tiptap doesn't natively use spellcheck attribute at root quite the same way, but we can set it.
        if (editor) {
            editor.view.dom.setAttribute('spellcheck', spellCheckEnabled.toString());
        }
    }, [spellCheckEnabled, editor]);

    // Handle global CSS variable for Watermark without relying on React VDOM
    useEffect(() => {
        if (watermark) {
            document.documentElement.style.setProperty('--global-watermark', `url("${watermark}")`);
        } else {
            document.documentElement.style.removeProperty('--global-watermark');
        }
    }, [watermark]);

    useEffect(() => {
        // Mock window.forceWordEditorSync
        window.forceWordEditorSync = (newContent) => {
            setContent(newContent);
            if (editor) editor.commands.setContent(newContent, false);
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
            debounceTimeout.current = setTimeout(() => triggerAutoSave({ title, content: newContent, watermark_url: watermark, country_code: selectedCountry?.code, category, language, notes }, documentId), 1000);
        };
        return () => {
            window.forceWordEditorSync = null;
        };
    }, [isChartEditing, title, watermark, selectedCountry, category, language, notes, documentId, editor]);

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

    const handleVerseInsert = (book, chapter, verseNum) => {
        if (!editor) return;
        const citation = `${book.name} ${chapter.chapter_number}:${verseNum} `;
        editor.chain().focus().insertContent(citation).run();
        setIsSidebarOpen(false);
    };

    const [savedDocsModalOpen, setSavedDocsModalOpen] = useState(false);
    const [savedDocuments, setSavedDocuments] = useState([]);

    const fetchSavedDocuments = async () => {
        try {
            const res = await axios.get('http://' + window.location.hostname + ':8000/api/documents/', { withCredentials: true });
            setSavedDocuments(res.data);
            setSavedDocsModalOpen(true);
        } catch (error) {
            console.error("Failed to fetch documents", error);
        }
    };

    const loadDocument = (doc) => {
        setDocumentId(doc.id);
        setTitle(doc.title || 'Untitled Document');
        setContent(doc.content || '');
        setWatermark(doc.watermark_url || '');
        setLanguage(doc.language || 'en');
        if (doc.country_code) {
            setSelectedCountry({ code: doc.country_code, name: regionNames.of(doc.country_code) });
        } else {
            setSelectedCountry(null);
        }
        setCategory(doc.category || null);
        setNotes(doc.notes || '');
        setSavedDocsModalOpen(false);
    };

    const deleteDocument = async (id) => {
        if (!window.confirm("Are you sure you want to delete this document? This cannot be undone.")) return;
        try {
            await axios.delete(`http://${window.location.hostname}:8000/api/documents/${id}`, { withCredentials: true });
            setSavedDocuments(prev => prev.filter(doc => doc.id !== id));
            if (documentId === id) {
                setDocumentId(null);
                setTitle('Untitled Document');
                setContent('');
                setNotes('');
                setCategory(null);
            }
        } catch (error) {
            console.error("Failed to delete document", error);
            alert("Failed to delete document. Ensure you are logged in.");
        }
    };


    const triggerAutoSave = async (payload, currentDocId) => {
        setIsSaving(true);
        try {
            if (currentDocId) {
                await axios.put(`http://${window.location.hostname}:8000/api/documents/${currentDocId}`, payload, { withCredentials: true });
            } else {
                const res = await axios.post('http://' + window.location.hostname + ':8000/api/documents/', payload, { withCredentials: true });
                setDocumentId(res.data.id);
            }
        } catch (error) {
            console.error("Failed to auto-save document", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleContentChange = (value) => {
        if (isChartEditing || window.isChartEditing) return; // Prevent ReactQuill from stealing focus during chart edits
        setContent(value);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {
            const payload = {
                title: title,
                content: value,
                watermark_url: watermark || null,
                country_code: selectedCountry ? selectedCountry.code : null,
                category: category || null,
                notes: notes || null
            };
            triggerAutoSave(payload, documentId);
        }, 1500); // 1.5 seconds debounce
    };

    // Re-trigger auto save if these metadata states change
    useEffect(() => {
        if (!documentId) return; // Wait for initial save which usually happens via content change
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        debounceTimeout.current = setTimeout(() => {
            const payload = {
                title, content, watermark_url: watermark || null, country_code: selectedCountry ? selectedCountry.code : null, category: category || null, language: language, notes: notes || null
            };
            triggerAutoSave(payload, documentId);
        }, 1500);
    }, [title, watermark, selectedCountry, category, language, notes]);

    // Apply RTL/LTR when language changes
    useEffect(() => {
        if (!quillRef.current) return;
        const editor = quillRef.current.getEditor();
        const isRtl = ['ar', 'he', 'fa', 'ur'].includes(language);

        editor.format('direction', isRtl ? 'rtl' : 'ltr');
        editor.format('align', isRtl ? 'right' : 'left');
    }, [language]);

    const insertMapIntoDocument = () => {
        if (!editor || !mapUrl) return;
        editor.chain().focus().setImage({ src: mapUrl }).run();
        setMapModalOpen(false);
    };

    const handleOpenMap = async (code, name) => {
        setSelectedCountry({ code, name });
        setMapModalOpen(true);
        try {
            const res = await fetch(`https://raw.githubusercontent.com/djaiss/mapsicon/master/all/${code.toLowerCase()}/vector.svg`);
            if (res.ok) {
                let svgText = await res.text();
                svgText = svgText.replace(/fill="#000000"/gi, '');
                svgText = svgText.replace(/<path\b/gi, '<path fill="#3B82F6" stroke="#1E3A8A" stroke-width="1"');
                const safeSvg = encodeURIComponent(svgText).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1));
                setMapUrl(`data:image/svg+xml;base64,${btoa(safeSvg)}`);
            } else {
                setMapUrl(`https://upload.wikimedia.org/wikipedia/commons/e/ec/Map_of_the_World_1998.jpg`);
            }
        } catch (e) {
            console.error("Map fetch error:", e);
            setMapUrl(`https://upload.wikimedia.org/wikipedia/commons/e/ec/Map_of_the_World_1998.jpg`);
        }
    };

    // Prevent body bounce/double-scroll behind the fixed overlay
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    // Element Selection handling for Drag/Resize Overlay (Simplified for Phase 1)
    useEffect(() => {
        const handleElementSelection = (e) => {
            if (e.target.tagName === 'IMG') {
                setSelectedImage(e.target);
            } else {
                setSelectedImage(null);
            }
        };

        if (editor) {
            editor.view.dom.addEventListener('click', handleElementSelection);
            editor.view.dom.addEventListener('touchstart', handleElementSelection);
        }

        return () => {
            if (editor) {
                editor.view.dom.removeEventListener('click', handleElementSelection);
                editor.view.dom.removeEventListener('touchstart', handleElementSelection);
            }
        };
    }, [editor]);

    // Tiptap format interceptor disabled for now.
    // In Phase 3, NodeViews will handle their own internal styling instead of toolbar interception.

    const UN_COUNTRIES = "AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TJ TZ TH TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VE VN YE ZM ZW".split(' ');
    const getFlagEmoji = (cc) => cc.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50 overflow-hidden text-black transition-all">
            {/* Header / Title area */}
            <div className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm z-20 print:hidden relative">
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={() => window.history.back()}
                        className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                        title="Exit Editor"
                    >
                        <i className="pi pi-arrow-left"></i>
                    </button>
                    <i className="pi pi-file-word text-blue-600 text-2xl translate-y-[1px]"></i>
                </div>

                <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2 w-full max-w-sm justify-center pointer-events-none">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-lg font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-100 px-2 py-1 rounded w-full text-gray-800 text-center pointer-events-auto"
                        placeholder="Document Title"
                    />
                </div>

                <div
                    className={`text-sm flex items-center gap-2 font-medium shrink-0 select-none ${!isSaving ? 'cursor-pointer hover:text-blue-600 transition-colors' : 'text-gray-500'}`}
                    onClick={() => { if (!isSaving) fetchSavedDocuments(); }}
                    title="View Saved Documents"
                >
                    {isSaving ? (
                        <><i className="pi pi-spin pi-spinner text-gray-400"></i> <span className="text-gray-500">Saving...</span></>
                    ) : (
                        <><i className="pi pi-check text-green-500"></i> <span>Saved</span> <i className="pi pi-history text-xs opacity-60"></i></>
                    )}
                </div>
            </div>

            {/* Custom Toolbar */}
            {/* Toolbar Container - Elevated z-index to ensure fixed modals (sidebar) stay above the Iron Shield focus-trap */}
            <div className="print:hidden shrink-0 relative z-[300]">
                <WordToolbar
                    PAGE_SIZES={PAGE_SIZES}
                    pageSize={pageSize}
                    setPageSize={setPageSize}
                    setIsSidebarOpen={setIsSidebarOpen}
                    handleOpenMap={handleOpenMap}
                    UN_COUNTRIES={UN_COUNTRIES}
                    regionNames={regionNames}
                    toolbarId="tnt7-word-toolbar"
                    quillRef={quillRef}
                    tiptapEditor={editor}
                    content={content}
                    title={title}
                    setWatermark={setWatermark}
                    watermark={watermark}
                    language={language}
                    setLanguage={setLanguage}
                    notes={notes}
                    setNotes={setNotes}
                    zoomLevel={zoomLevel}
                    setZoomLevel={setZoomLevel}
                    isSaving={isSaving}
                    fetchSavedDocuments={fetchSavedDocuments}
                    spellCheckEnabled={spellCheckEnabled}
                    setSpellCheckEnabled={setSpellCheckEnabled}
                    setIsChartEditing={setIsChartEditing}
                />
            </div>

            {/* Primary Editing Area */}
            <div className={`flex-grow overflow-y-auto p-4 sm:p-8 flex justify-center bg-gray-100 print:bg-white print:p-0 ${['ar', 'he', 'fa', 'ur'].includes(language) ? 'rtl' : 'ltr'}`} lang={language}>
                <div
                    id="pdf-export-container"
                    className="relative transition-all mx-auto flex flex-col duration-300"
                    style={{
                        width: PAGE_SIZES[pageSize].width,
                        '--page-min-height': PAGE_SIZES[pageSize].height,
                        '--page-padding': PAGE_SIZES[pageSize].padding,
                        '--page-padding': PAGE_SIZES[pageSize].padding,
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'top center',
                        marginBottom: `calc(${PAGE_SIZES[pageSize].height} * ${Math.max(0, zoomLevel - 1)})`,
                    }}
                >
                    <div className="relative w-full flex-grow flex flex-col cursor-text" onClick={(e) => { if (e.target === e.currentTarget && editor) editor.commands.focus(); }}>
                        <EditorContent 
                            editor={editor} 
                            readOnly={isChartEditing}
                            className="border-none relative z-10 bg-transparent flex-grow flex flex-col min-h-full tiptap-editor-container"
                        />

                        {/* IRON SHIELD: Physical interaction blocker */}
                        {isChartEditing && (
                            <div 
                                className="absolute inset-0 z-[150] bg-white/5 cursor-not-allowed pointer-events-auto backdrop-blur-[1px]"
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Map Preview Modal */}
            {mapModalOpen && (
                <div className="absolute inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
                    <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md flex flex-col transform transition-all scale-100 opacity-100">
                        <div className="px-5 py-4 bg-gray-100 border-b flex justify-between items-center bg-gradient-to-r from-gray-100 to-gray-50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <i className="pi pi-map-marker text-blue-500 text-lg"></i>
                                {selectedCountry?.name} Map Overview
                            </h3>
                            <button onClick={() => setMapModalOpen(false)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors focus:outline-none">
                                <i className="pi pi-times"></i>
                            </button>
                        </div>
                        <div className="p-8 flex justify-center bg-white min-h-[250px] relative items-center">
                            <img
                                src={mapUrl}
                                alt={`Map of ${selectedCountry?.name}`}
                                className="max-h-64 h-auto w-auto object-contain drop-shadow-md"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://upload.wikimedia.org/wikipedia/commons/e/ec/Map_of_the_World_1998.jpg`;
                                }}
                            />
                        </div>
                        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                            <button
                                onClick={() => setMapModalOpen(false)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={insertMapIntoDocument}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg shadow cursor-pointer flex items-center gap-2 transition-transform hover:scale-105 focus:outline-none"
                            >
                                <i className="pi pi-plus-circle"></i> Insert into Document
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden styles to override Tiptap border within our "page" & strict A4 printing overrides */}
            <style>{`
                .tiptap-editor-container { 
                    border: none !important; 
                    height: auto !important; 
                    overflow: visible !important; 
                    display: flex !important;
                    flex-direction: column !important;
                    flex-grow: 1 !important;
                }
                .tiptap { 
                    padding: 0 !important; 
                    min-height: 100%;
                    flex-grow: 1;
                    font-family: inherit;
                    font-size: 16px;
                    overflow-y: visible !important;
                    height: auto !important;
                }
                .tiptap:focus {
                    outline: none !important;
                }
                
                @media print {
                    @page { margin: 0; size: ${PAGE_SIZES[pageSize].width} ${PAGE_SIZES[pageSize].height}; }
                    body { margin: 0; padding: 0; background: white; }
                    .fixed.inset-0, .fixed.inset-0 * { visibility: visible !important; }
                    .print\\:hidden, .print\\:hidden * { display: none !important; visibility: hidden !important; }
                    .fixed.inset-0 { 
                        position: absolute !important; 
                        left: 0;
                        top: 0;
                        overflow: visible !important; 
                        background: white !important; 
                        display: block !important;
                    }
                    .bg-white.shadow-lg { 
                        box-shadow: none !important; 
                        border: none !important; 
                        margin: 0 auto !important; 
                        width: 100% !important; 
                        height: auto !important; 
                        min-height: 0 !important;
                    }
                }
            `}</style>

            {/* Sidebar Overlay */}
            <div
                className={`fixed inset-0 bg-black/60 z-[350] transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsSidebarOpen(false)}
            ></div>

            {/* TIER 1: Book List (Sidebar) Drawer */}
            <div className={`fixed top-0 left-0 h-full w-64 sm:w-72 md:w-80 bg-[#1e2433] text-gray-300 shadow-2xl z-[360] flex flex-col overflow-hidden transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="px-6 py-5 border-b border-[#2a3045] bg-[#151a26] flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-3">
                            <i className="pi pi-book text-[#c8a165]"></i>
                            Book Index
                        </h2>
                        <p className="text-xs text-gray-400 mt-2 tracking-wider">Navigate & Insert Scriptures</p>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white p-1">
                        <i className="pi pi-times text-xl"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 #1f2937' }}>
                    {Object.keys(groupedBooks).map(type => (
                        <div key={type} className="mb-6">
                            <h3 className="text-xs font-black text-[#8b9bb4] uppercase tracking-widest pl-3 mb-2">{type}</h3>
                            <ul className="space-y-1">
                                {groupedBooks[type].map(book => (
                                    <li key={book.id}>
                                        <button
                                            onClick={() => {
                                                setExpandedBookId(prev => prev === book.id ? null : book.id);
                                                setExpandedChapterId(null);
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
                                            <div className="flex flex-col gap-1.5 mt-2 p-1.5 bg-[#0f131c] rounded-md shadow-inner mb-2 mx-2">
                                                {!expandedChapterId ? (
                                                    <div className="grid grid-cols-5 gap-1.5">
                                                        {expandedBookChapters.length > 0 ? (
                                                            expandedBookChapters.map(chapter => (
                                                                <div key={chapter.id} className="relative">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setExpandedChapterId(chapter.id);
                                                                        }}
                                                                        className={`flex items-center justify-center w-full aspect-square rounded font-bold text-sm transition-all duration-200 bg-[#1e2433] text-gray-400 hover:bg-[#2d3748] hover:text-white`}
                                                                        title={`Chapter ${chapter.chapter_number} (${chapter.verse_count || 0} Verses)`}
                                                                    >
                                                                        {chapter.chapter_number}
                                                                    </button>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <span className="col-span-5 text-[#8b9bb4] text-xs text-center italic py-2">No chapters</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="mt-1 p-2 animate-fadein">
                                                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-800">
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setExpandedChapterId(null);
                                                                }}
                                                                className="text-[#3b82f6] hover:text-[#60a5fa] text-xs font-bold flex items-center gap-1 transition-colors"
                                                            >
                                                                <i className="pi pi-arrow-left text-[10px]"></i>
                                                                Back to Chapters
                                                            </button>
                                                            <div className="text-[10px] font-bold text-[#8b9bb4] uppercase tracking-widest">
                                                                Ch {expandedBookChapters.find(c => c.id === expandedChapterId)?.chapter_number} Verses
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-6 gap-1 max-h-[250px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                                                            {(() => {
                                                                const chap = expandedBookChapters.find(c => c.id === expandedChapterId);
                                                                const count = chap?.verse_count || 0;
                                                                if (count === 0) return <span className="col-span-6 text-center text-xs italic text-gray-600">No verses</span>;

                                                                return Array.from({ length: count }, (_, i) => i + 1).map(v => (
                                                                    <button
                                                                        key={v}
                                                                        onClick={() => handleVerseInsert(book, chap, v)}
                                                                        className="bg-[#2a3045] hover:bg-green-600 text-gray-300 hover:text-white text-[11px] font-medium py-1.5 rounded transition-colors text-center shadow-sm"
                                                                    >
                                                                        {v}
                                                                    </button>
                                                                ));
                                                            })()}
                                                        </div>
                                                    </div>
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

            <SavedDocumentsModal
                isOpen={savedDocsModalOpen}
                onClose={() => setSavedDocsModalOpen(false)}
                documents={savedDocuments}
                onSelectDocument={loadDocument}
                onDeleteDocument={deleteDocument}
            />

        </div >
    );
};

export default WordEditor;
