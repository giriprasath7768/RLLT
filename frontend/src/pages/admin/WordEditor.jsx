import React, { useState, useRef, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import WordToolbar from '../../components/admin/WordToolbar';
import WordContextBar from '../../components/admin/WordContextBar';
import SavedDocumentsModal from '../../components/admin/SavedDocumentsModal';
import axios from 'axios';

if (window.QuillBlotFormatter && window.QuillBlotFormatter.default) {
    Quill.register('modules/blotFormatter', window.QuillBlotFormatter.default);
}

const Font = Quill.import('formats/font');
Font.whitelist = ['sans-serif', 'serif', 'monospace', 'bungee-shade', 'nabla', 'rampart-one', 'bungee', 'londrina', 'alfa-slab-one', 'rubik', 'anton'];
Quill.register(Font, true);

const Parchment = Quill.import('parchment');
const StyleAttributor = Parchment.StyleAttributor || Parchment.Attributor?.Style;

// Custom Size Attributor to support numerical px values
const sizeWhitelist = ['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '22px', '24px', '26px', '28px', '36px', '48px', '72px'];
const SizeStyle = new StyleAttributor('size', 'font-size', {
    scope: Parchment.Scope.INLINE,
    whitelist: sizeWhitelist
});
Quill.register(SizeStyle, true);

const OutlineStyle = new StyleAttributor('outline', '-webkit-text-stroke', {
    scope: Parchment.Scope.INLINE,
});
const ShadowStyle = new StyleAttributor('shadow', 'text-shadow', {
    scope: Parchment.Scope.INLINE,
});

Quill.register(OutlineStyle, true);
Quill.register(ShadowStyle, true);

// Custom format for Wisdom Highlights
const Inline = Quill.import('blots/inline');
class WisdomFormat extends Inline {
    static create(value) {
        let node = super.create();
        if (value === false) return node;

        const [mode, color] = value.split('|');

        if (mode === 'square') {
            node.style.border = `2px solid ${color}`;
            node.style.padding = '1px 3px';
        } else if (mode === 'round') {
            node.style.border = `2px solid ${color}`;
            node.style.borderRadius = '8px';
            node.style.padding = '1px 4px';
        } else if (mode === 'underline') {
            node.style.borderBottom = `3px solid ${color}`;
            node.style.paddingBottom = '1px';
        } else if (mode === 'highlight') {
            node.style.backgroundColor = color;
            if (color.toUpperCase() === '#FAFA33') node.style.color = '#000000';
            else node.style.color = '#FFFFFF';
            node.style.padding = '2px 4px';
            node.style.borderRadius = '4px';
            node.style.webkitPrintColorAdjust = 'exact';
            node.style.printColorAdjust = 'exact';
        }

        node.setAttribute('data-wisdom', value);
        return node;
    }

    static formats(node) {
        return node.getAttribute('data-wisdom');
    }
}
WisdomFormat.blotName = 'wisdom';
WisdomFormat.tagName = 'span';
Quill.register(WisdomFormat, true);

// Custom format for watermark (CSS background)
const CustomToolbarId = 'tnt7-word-toolbar';

const WordEditor = () => {
    const quillRef = useRef(null);
    const [title, setTitle] = useState('Untitled Document');
    const [content, setContent] = useState('');
    const [watermark, setWatermark] = useState('');
    const [language, setLanguage] = useState('en');
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [category, setCategory] = useState(null);
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [documentId, setDocumentId] = useState(null);
    const [mapModalOpen, setMapModalOpen] = useState(false);
    const [mapUrl, setMapUrl] = useState('');
    const debounceTimeout = useRef(null);

    const [savedDocsModalOpen, setSavedDocsModalOpen] = useState(false);
    const [savedDocuments, setSavedDocuments] = useState([]);

    const fetchSavedDocuments = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/documents/', { withCredentials: true });
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
            await axios.delete(`http://localhost:8000/api/documents/${id}`, { withCredentials: true });
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

    // Quill inner modules config
    const modules = {
        toolbar: {
            container: `#${CustomToolbarId}`
        },
        blotFormatter: {}
    };

    const triggerAutoSave = async (payload, currentDocId) => {
        setIsSaving(true);
        try {
            if (currentDocId) {
                await axios.put(`http://localhost:8000/api/documents/${currentDocId}`, payload, { withCredentials: true });
            } else {
                const res = await axios.post('http://localhost:8000/api/documents/', payload, { withCredentials: true });
                setDocumentId(res.data.id);
            }
        } catch (error) {
            console.error("Failed to auto-save document", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleContentChange = (value) => {
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
        if (!quillRef.current || !mapUrl) return;
        const editor = quillRef.current.getEditor();
        const delta = editor.getContents();

        let existingMapIndex = -1;
        let currentIndex = 0;

        // Traverse exactly where the old SVG Map is sitting
        for (let op of delta.ops) {
            if (op.insert && typeof op.insert === 'object' && op.insert.image && op.insert.image.startsWith('data:image/svg+xml')) {
                existingMapIndex = currentIndex;
                break;
            }
            currentIndex += typeof op.insert === 'string' ? op.insert.length : 1;
        }

        if (existingMapIndex !== -1) {
            // Delete exactly 1 block of image memory and overwrite it inline
            editor.deleteText(existingMapIndex, 1);
            editor.insertEmbed(existingMapIndex, 'image', mapUrl);
            editor.setSelection(existingMapIndex + 1);
        } else {
            // Drop normally if document doesn't already contain a map
            const cursorPosition = editor.getSelection()?.index || editor.getLength();
            editor.insertEmbed(cursorPosition, 'image', mapUrl);
            editor.setSelection(cursorPosition + 1);
        }

        setMapModalOpen(false);
    };

    // Prevent body bounce/double-scroll behind the fixed overlay
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    // Ensure Image Formatting tools hide when clicking outside
    useEffect(() => {
        const handleGlobalClick = (e) => {
            if (!quillRef.current) return;
            const editor = quillRef.current.getEditor();
            const formatter = editor.getModule('blotFormatter');
            if (formatter && formatter.currentSpec) {
                const isImage = e.target.tagName === 'IMG';
                const isFormatterOverlay = e.target.closest('[class*="blot-formatter"]');

                if (!isImage && !isFormatterOverlay) {
                    formatter.hide();
                }
            }
        };

        document.addEventListener('mousedown', handleGlobalClick);
        return () => document.removeEventListener('mousedown', handleGlobalClick);
    }, []);

    const UN_COUNTRIES = "AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TJ TZ TH TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VE VN YE ZM ZW".split(' ');
    const getFlagEmoji = (cc) => cc.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50 overflow-hidden text-black transition-all">
            {/* Header / Title area */}
            <div className="bg-white border-b px-6 py-3 flex items-center shadow-sm z-20 print:hidden relative">
                <button
                    onClick={() => window.history.back()}
                    className="mr-4 p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors focus:outline-none shrink-0"
                    title="Exit Editor"
                >
                    <i className="pi pi-arrow-left"></i>
                </button>
                <div className="flex items-center gap-3 w-64 shrink-0">
                    <i className="pi pi-file-word text-blue-600 text-2xl"></i>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-100 px-2 py-1 rounded w-full text-gray-800"
                        placeholder="Document Title"
                    />
                </div>

                {/* 195 Flags Horizontal Scroller using FlagCDN for Windows Compatibility */}
                <div className="flex-1 mx-6 overflow-x-auto flex items-center gap-3 px-3 py-2 shadow-inner bg-gray-50 rounded-lg border border-gray-200" style={{ scrollbarWidth: 'thin' }}>
                    {UN_COUNTRIES.map(code => (
                        <button
                            key={code}
                            title={regionNames.of(code)}
                            onClick={async () => {
                                setSelectedCountry({ code: code, name: regionNames.of(code) });
                                setMapModalOpen(true);
                                try {
                                    const res = await fetch(`https://raw.githubusercontent.com/djaiss/mapsicon/master/all/${code.toLowerCase()}/vector.svg`);
                                    if (res.ok) {
                                        let svgText = await res.text();
                                        svgText = svgText.replace(/fill="#000000"/gi, ''); // Clean existing black attributes
                                        svgText = svgText.replace(/<path\b/gi, '<path fill="#3B82F6" stroke="#1E3A8A" stroke-width="1"'); // Inject rich blue map colors
                                        const safeSvg = encodeURIComponent(svgText).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1));
                                        setMapUrl(`data:image/svg+xml;base64,${btoa(safeSvg)}`);
                                    } else {
                                        setMapUrl(`https://upload.wikimedia.org/wikipedia/commons/e/ec/Map_of_the_World_1998.jpg`);
                                    }
                                } catch (e) {
                                    console.error("Map fetch error:", e);
                                    setMapUrl(`https://upload.wikimedia.org/wikipedia/commons/e/ec/Map_of_the_World_1998.jpg`);
                                }
                            }}
                            className={`transition-transform shrink-0 outline-none rounded-sm overflow-hidden ${selectedCountry?.code === code ? 'scale-125 drop-shadow-md z-10 ring-2 ring-blue-500' : 'grayscale-[40%] hover:grayscale-0 opacity-80 hover:opacity-100 hover:scale-110'}`}
                        >
                            <img
                                src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
                                srcSet={`https://flagcdn.com/w80/${code.toLowerCase()}.png 2x`}
                                width="24"
                                alt={code}
                                className="block"
                            />
                        </button>
                    ))}
                </div>

                <div
                    className={`text-sm flex items-center gap-2 font-medium shrink-0 select-none ${!isSaving ? 'cursor-pointer hover:text-blue-600 transition-colors' : 'text-gray-500'}`}
                    onClick={() => { if (!isSaving) fetchSavedDocuments(); }}
                    title="View Saved Documents"
                >
                    {isSaving ? (
                        <><i className="pi pi-spin pi-spinner text-gray-500"></i> <span className="text-gray-500">Saving...</span></>
                    ) : (
                        <><i className="pi pi-check text-green-500"></i> <span>Saved</span> <i className="pi pi-history text-xs opacity-60"></i></>
                    )}
                </div>
            </div>

            {/* Custom Toolbar */}
            <div className="print:hidden shrink-0">
                <WordToolbar
                    toolbarId={CustomToolbarId}
                    quillRef={quillRef}
                    content={content}
                    title={title}
                    setWatermark={setWatermark}
                    watermark={watermark}
                    language={language}
                    setLanguage={setLanguage}
                    notes={notes}
                    setNotes={setNotes}
                />
            </div>

            {/* Primary Editing Area */}
            <div className={`flex-grow overflow-y-auto p-4 sm:p-8 flex justify-center bg-gray-100 print:bg-white print:p-0 ${['ar', 'he', 'fa', 'ur'].includes(language) ? 'rtl' : 'ltr'}`} lang={language}>
                <div
                    className="shadow-lg border border-gray-300 relative overflow-hidden print:border-none"
                    style={{
                        width: '816px', // 8.5 inches
                        minHeight: '1056px', // 11 inches
                        padding: '1in',
                        backgroundColor: 'white',
                        backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 1055px, #cbd5e1 1055px, #cbd5e1 1056px)',
                        backgroundSize: '100% 1056px'
                    }}
                >
                    {watermark && (
                        <div
                            className="absolute inset-0 pointer-events-none z-0 print:block"
                            style={{
                                backgroundImage: `url(${watermark})`,
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: 'contain',
                                opacity: 0.15,
                                margin: '0.5in'
                            }}
                        />
                    )}
                    <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={content}
                        onChange={handleContentChange}
                        modules={modules}
                        className="border-none relative z-10 bg-transparent"
                    />
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

            {/* Hidden styles to override Quill border within our "page" & strict A4 printing overrides */}
            <style>{`
                .ql-container.ql-snow { 
                    border: none !important; 
                    height: auto !important; 
                    overflow: visible !important; 
                }
                .ql-editor { 
                    padding: 0 !important; 
                    min-height: 100%;
                    font-family: inherit;
                    overflow-y: visible !important;
                    height: auto !important;
                }
                
                @media print {
                    @page { margin: 0; size: auto; }
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
