import React, { useState, useRef, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import WordToolbar from '../../components/admin/WordToolbar';
import WordContextBar from '../../components/admin/WordContextBar';
import SavedDocumentsModal from '../../components/admin/SavedDocumentsModal';
import axios from 'axios';

import ImageResizerOverlay from '../../components/admin/ImageResizerOverlay';

/* Custom Resize Overlay replaces blotFormatter
if (window.QuillBlotFormatter && window.QuillBlotFormatter.default) {
    Quill.register('modules/blotFormatter', window.QuillBlotFormatter.default);
}
*/

const Font = Quill.import('formats/font');
Font.whitelist = ['sans-serif', 'serif', 'monospace', 'bungee-shade', 'nabla', 'rampart-one', 'bungee', 'londrina', 'alfa-slab-one', 'rubik', 'anton'];
Quill.register(Font, true);

const Parchment = Quill.import('parchment');
const StyleAttributor = Parchment.StyleAttributor || Parchment.Attributor?.Style;

// Custom Size Attributor to support numerical px values
const SizeStyle = new StyleAttributor('size', 'font-size', {
    scope: Parchment.Scope.INLINE
});
Quill.register(SizeStyle, true);

const OutlineStyle = new StyleAttributor('outline', '-webkit-text-stroke', {
    scope: Parchment.Scope.INLINE,
});
const ShadowStyle = new StyleAttributor('shadow', 'text-shadow', {
    scope: Parchment.Scope.INLINE,
});

const PositionStyle = new StyleAttributor('position', 'position', { scope: Parchment.Scope.INLINE });
const LeftStyle = new StyleAttributor('left', 'left', { scope: Parchment.Scope.INLINE });
const TopStyle = new StyleAttributor('top', 'top', { scope: Parchment.Scope.INLINE });
const ZIndexStyle = new StyleAttributor('zIndex', 'z-index', { scope: Parchment.Scope.INLINE });

Quill.register(OutlineStyle, true);
Quill.register(ShadowStyle, true);
Quill.register(PositionStyle, true);
Quill.register(LeftStyle, true);
Quill.register(TopStyle, true);
Quill.register(ZIndexStyle, true);

// Custom format for Wisdom Highlights
const Inline = Quill.import('blots/inline');
class WisdomFormat extends Inline {
    static create(value) {
        let node = super.create();
        if (value === false) return node;

        const [mode, color, styleOption] = value.split('|');

        let bStyle = 'solid';
        let bWidth = '2px';
        if (styleOption === 'double-3px') { bStyle = 'double'; bWidth = '4px'; }
        else if (styleOption === 'solid-3px') { bStyle = 'solid'; bWidth = '4px'; }
        else if (styleOption === 'solid-1px') { bStyle = 'solid'; bWidth = '2px'; }
        else if (styleOption === 'dotted-2px') { bStyle = 'dotted'; bWidth = '3px'; }
        else if (styleOption === 'dashed-2px') { bStyle = 'dashed'; bWidth = '3px'; }
        else if (styleOption?.startsWith('line-')) { bWidth = `${styleOption.split('-')[1]}`; }

        if (mode === 'square' || mode === 'round' || mode === 'circle') {
            node.style.padding = mode === 'square' ? '1px 3px' : '1px 4px';
            if (mode === 'round') node.style.borderRadius = '8px';
            if (mode === 'circle') node.style.borderRadius = '9999px';
            
            if (styleOption === 'inner-shadow') {
                node.style.boxShadow = `inset 0 0 12px ${color}`;
            } else if (styleOption === 'outer-shadow') {
                node.style.boxShadow = `0 0 12px ${color}`;
            } else {
                node.style.borderStyle = bStyle;
                node.style.borderWidth = bWidth;
                node.style.borderColor = color;
            }
        } else if (mode === 'underline') {
            node.style.borderBottomStyle = bStyle;
            node.style.borderBottomWidth = bWidth;
            node.style.borderBottomColor = color;
            node.style.paddingBottom = '2px';
        } else if (mode === 'highlight') {
            let thicknessRatio = 1;
            if (styleOption && styleOption.startsWith('hl-')) {
                const level = parseInt(styleOption.split('-')[1]);
                thicknessRatio = level / 5;
            }
            
            const hexToRgba = (hex, a) => {
                const r = parseInt(hex.slice(1,3), 16);
                const g = parseInt(hex.slice(3,5), 16);
                const b = parseInt(hex.slice(5,7), 16);
                return `rgba(${r},${g},${b},${a})`;
            };
            
            if (thicknessRatio < 1) {
                const percent = (1 - thicknessRatio) * 100;
                node.style.background = `linear-gradient(to bottom, transparent ${percent}%, ${hexToRgba(color, 0.35)} ${percent}%, ${hexToRgba(color, 0.35)} 100%)`;
            } else {
                node.style.backgroundColor = hexToRgba(color, 0.35);
            }
            // node.style.mixBlendMode = 'multiply'; // Might not work well for inline text printing
        }

        node.setAttribute('data-wisdom', value);
        return node;
    }

    format(name, value) {
        if (name === this.statics.blotName && value) {
            const [mode, color, styleOption] = value.split('|');

            // Reset previous styles just in case
            this.domNode.style.padding = '';
            this.domNode.style.borderRadius = '';
            this.domNode.style.boxShadow = '';
            this.domNode.style.borderStyle = '';
            this.domNode.style.borderWidth = '';
            this.domNode.style.borderColor = '';
            this.domNode.style.borderBottomStyle = '';
            this.domNode.style.borderBottomWidth = '';
            this.domNode.style.borderBottomColor = '';
            this.domNode.style.paddingBottom = '';
            this.domNode.style.background = '';
            this.domNode.style.backgroundColor = '';

            let bStyle = 'solid';
            let bWidth = '2px';
            if (styleOption === 'double-3px') { bStyle = 'double'; bWidth = '4px'; }
            else if (styleOption === 'solid-3px') { bStyle = 'solid'; bWidth = '4px'; }
            else if (styleOption === 'solid-1px') { bStyle = 'solid'; bWidth = '2px'; }
            else if (styleOption === 'dotted-2px') { bStyle = 'dotted'; bWidth = '3px'; }
            else if (styleOption === 'dashed-2px') { bStyle = 'dashed'; bWidth = '3px'; }
            else if (styleOption?.startsWith('line-')) { bWidth = `${styleOption.split('-')[1]}`; }

            if (mode === 'square' || mode === 'round' || mode === 'circle') {
                this.domNode.style.padding = mode === 'square' ? '1px 3px' : '1px 4px';
                if (mode === 'round') this.domNode.style.borderRadius = '8px';
                if (mode === 'circle') this.domNode.style.borderRadius = '9999px';
                
                if (styleOption === 'inner-shadow') {
                    this.domNode.style.boxShadow = `inset 0 0 12px ${color}`;
                } else if (styleOption === 'outer-shadow') {
                    this.domNode.style.boxShadow = `0 0 12px ${color}`;
                } else {
                    this.domNode.style.borderStyle = bStyle;
                    this.domNode.style.borderWidth = bWidth;
                    this.domNode.style.borderColor = color;
                }
            } else if (mode === 'underline') {
                this.domNode.style.borderBottomStyle = bStyle;
                this.domNode.style.borderBottomWidth = bWidth;
                this.domNode.style.borderBottomColor = color;
                this.domNode.style.paddingBottom = '2px';
            } else if (mode === 'highlight') {
                let thicknessRatio = 1;
                if (styleOption && styleOption.startsWith('hl-')) {
                    const level = parseInt(styleOption.split('-')[1]);
                    thicknessRatio = level / 5;
                }
                
                const hexToRgba = (hex, a) => {
                    const r = parseInt(hex.slice(1,3), 16);
                    const g = parseInt(hex.slice(3,5), 16);
                    const b = parseInt(hex.slice(5,7), 16);
                    return `rgba(${r},${g},${b},${a})`;
                };
                
                if (thicknessRatio < 1) {
                    const percent = (1 - thicknessRatio) * 100;
                    this.domNode.style.background = `linear-gradient(to bottom, transparent ${percent}%, ${hexToRgba(color, 0.35)} ${percent}%, ${hexToRgba(color, 0.35)} 100%)`;
                } else {
                    this.domNode.style.backgroundColor = hexToRgba(color, 0.35);
                }
            }

            this.domNode.setAttribute('data-wisdom', value);
        } else {
            super.format(name, value);
        }
    }

    static formats(node) {
        return node.getAttribute('data-wisdom');
    }
}
WisdomFormat.blotName = 'wisdom';
WisdomFormat.tagName = 'span';
Quill.register(WisdomFormat, true);

// Custom format for 3D/4D/5D Text Effects
class TextEffectFormat extends Inline {
    static create(value) {
        let node = super.create();
        if (value === false) return node;

        const [mode, color] = value.split('|');
        let c = color || '#3b82f6'; // default blue
        
        if (mode === '3d') {
            node.style.textShadow = `1px 1px 0px ${c}, 2px 2px 0px ${c}, 3px 3px 0px ${c}, 4px 4px 3px rgba(0,0,0,0.3)`;
        } else if (mode === '4d') {
            node.style.textShadow = `1px 1px 0px ${c}, 2px 2px 0px ${c}, 3px 3px 0px ${c}, 4px 4px 0px ${c}, 5px 5px 0px ${c}, 6px 6px 4px rgba(0,0,0,0.4)`;
        } else if (mode === '5d') {
            node.style.textShadow = `1px 1px 0px ${c}, 2px 2px 0px ${c}, 3px 3px 0px ${c}, 4px 4px 0px ${c}, 5px 5px 0px ${c}, 6px 6px 0px ${c}, 7px 7px 0px ${c}, 8px 8px 0px ${c}, 9px 9px 5px rgba(0,0,0,0.5)`;
        }
        
        node.style.fontWeight = '900';
        node.setAttribute('data-texteffect', value);
        return node;
    }

    format(name, value) {
        if (name === this.statics.blotName && value) {
            const [mode, color] = value.split('|');
            let c = color || '#3b82f6';
            if (mode === '3d') {
                this.domNode.style.textShadow = `1px 1px 0px ${c}, 2px 2px 0px ${c}, 3px 3px 0px ${c}, 4px 4px 3px rgba(0,0,0,0.3)`;
            } else if (mode === '4d') {
                this.domNode.style.textShadow = `1px 1px 0px ${c}, 2px 2px 0px ${c}, 3px 3px 0px ${c}, 4px 4px 0px ${c}, 5px 5px 0px ${c}, 6px 6px 4px rgba(0,0,0,0.4)`;
            } else if (mode === '5d') {
                this.domNode.style.textShadow = `1px 1px 0px ${c}, 2px 2px 0px ${c}, 3px 3px 0px ${c}, 4px 4px 0px ${c}, 5px 5px 0px ${c}, 6px 6px 0px ${c}, 7px 7px 0px ${c}, 8px 8px 0px ${c}, 9px 9px 5px rgba(0,0,0,0.5)`;
            }
            this.domNode.setAttribute('data-texteffect', value);
        } else {
            super.format(name, value);
        }
    }

    static formats(node) {
        return node.getAttribute('data-texteffect');
    }
}
TextEffectFormat.blotName = 'texteffect';
TextEffectFormat.tagName = 'span';
TextEffectFormat.className = 'custom-text-effect';
Quill.register(TextEffectFormat, true);

// Custom format for watermark (CSS background)
const CustomToolbarId = 'tnt7-word-toolbar';

// Custom format for Draggable Text Boxes
const BlockEmbed = Quill.import('blots/block/embed');
class TextBoxBlot extends BlockEmbed {
    static create(value) {
        let node = super.create();
        node.classList.add('custom-textbox');
        node.setAttribute('contenteditable', 'false');
        
        let textarea = document.createElement('textarea');
        textarea.value = value.text || '';
        textarea.placeholder = 'Type text here...';
        textarea.classList.add('ql-ui'); // Crucial: prevents Quill from observing DOM mutations here
        
        textarea.style.width = '100%';
        textarea.style.height = '100%';
        textarea.style.resize = 'none';
        textarea.style.background = 'transparent';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.padding = '8px';
        textarea.style.boxSizing = 'border-box';
        textarea.style.fontFamily = 'inherit';
        textarea.style.overflow = 'hidden';
        textarea.textContent = value.text || ''; // Ensure innerHTML captures it
        
        textarea.addEventListener('keydown', (e) => {
            e.stopPropagation();
        });
        
        textarea.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            // Force focus asynchronously to beat Quill's selection restoration
            setTimeout(() => {
                textarea.focus();
            }, 0);
        });
        
        textarea.addEventListener('click', (e) => {
            e.stopPropagation();
            textarea.focus();
        });
        
        // Do not update DOM on 'input' to prevent cursor jumping
        textarea.addEventListener('input', (e) => {
            // just let native textarea handle it
        });
        
        textarea.addEventListener('blur', (e) => {
            textarea.textContent = e.target.value;
        });
        
        node.appendChild(textarea);
        
        if (value.style) node.setAttribute('style', value.style);
        if (value.textareaStyle) textarea.setAttribute('style', value.textareaStyle);
        
        // Default positioning if none provided
        if (!value.style && !node.getAttribute('style')) {
            node.style.position = 'absolute';
            node.style.left = '100px';
            node.style.top = '100px';
            node.style.width = '200px';
            node.style.height = '100px';
            node.style.zIndex = '50';
            node.style.backgroundColor = 'transparent'; // default transparent background
        }
        
        if (value.puzzle) {
            node.setAttribute('data-puzzle', value.puzzle);
            let overlay = document.createElement('div');
            overlay.classList.add('puzzle-overlay');
            overlay.style.position = 'absolute';
            overlay.style.inset = '0';
            overlay.style.pointerEvents = 'none';
            overlay.style.backgroundImage = `url(${value.puzzle})`;
            overlay.style.backgroundSize = '100% 100%';
            overlay.style.zIndex = '10'; // Ensure it's over the textarea
            node.appendChild(overlay);
        }

        return node;
    }
    
    static value(node) {
        const textarea = node.querySelector('textarea');
        return {
            text: textarea ? textarea.value : '',
            style: node.getAttribute('style') || '',
            textareaStyle: textarea ? textarea.getAttribute('style') : '',
            puzzle: node.getAttribute('data-puzzle') || ''
        };
    }
}
TextBoxBlot.blotName = 'textbox';
TextBoxBlot.tagName = 'div';
Quill.register(TextBoxBlot, true);

// Custom format for Draggable Shapes
class ShapeBlot extends BlockEmbed {
    static create(value) {
        let node = super.create();
        node.classList.add('custom-shape');
        node.setAttribute('contenteditable', 'false');
        
        let svgWrapper = document.createElement('div');
        svgWrapper.style.width = '100%';
        svgWrapper.style.height = '100%';
        svgWrapper.style.pointerEvents = 'none'; // Let the parent node handle events
        svgWrapper.innerHTML = value.svg || '';
        
        const svgElement = svgWrapper.querySelector('svg');
        if (svgElement) {
            svgElement.style.width = '100%';
            svgElement.style.height = '100%';
            svgElement.setAttribute('preserveAspectRatio', 'none');
            // Remove hardcoded width/height so it fills
            svgElement.removeAttribute('width');
            svgElement.removeAttribute('height');
        }
        
        node.appendChild(svgWrapper);
        
        if (value.style) node.setAttribute('style', value.style);
        
        if (!value.style && !node.getAttribute('style')) {
            node.style.position = 'absolute';
            node.style.left = '100px';
            node.style.top = '100px';
            node.style.width = '100px';
            node.style.height = '100px';
            node.style.zIndex = '50';
        }

        return node;
    }
    
    static value(node) {
        const svgWrapper = node.querySelector('div');
        return {
            svg: svgWrapper ? svgWrapper.innerHTML : '',
            style: node.getAttribute('style') || ''
        };
    }
}
ShapeBlot.blotName = 'shape';
ShapeBlot.tagName = 'div';
Quill.register(ShapeBlot, true);

const PAGE_SIZES = {
    'A4': { name: 'A4', width: '210mm', height: '297mm', padding: '20mm', linePx: 1122 },
    'A5': { name: 'A5', width: '148mm', height: '210mm', padding: '15mm', linePx: 793 },
    'A6': { name: 'A6', width: '105mm', height: '148mm', padding: '10mm', linePx: 559 },
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

    useEffect(() => {
        if (quillRef.current) {
            const editor = quillRef.current.getEditor();
            editor.root.setAttribute('spellcheck', spellCheckEnabled.toString());
        }
    }, [spellCheckEnabled]);

    useEffect(() => {
        if (!quillRef.current) return;
        const editor = quillRef.current.getEditor();
        
        // IRON SHIELD: Capture-phase focus trap to prevent focus-theft
        const handleFocusCapture = (e) => {
            if (window.isChartEditing || isChartEditing) {
                // Check if the focus attempt came from a child element we want to allow (none currently)
                // Otherwise, immediately kill the event and force focus away
                e.stopPropagation();
                editor.root.blur();
            }
        };

        editor.root.addEventListener('focus', handleFocusCapture, true);
        
        window.forceWordEditorSync = (newContent) => {
            setContent(newContent);
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
            debounceTimeout.current = setTimeout(() => triggerAutoSave({ title, content: newContent, watermark_url: watermark, country_code: selectedCountry?.code, category, language, notes }, documentId), 1000);
        };
        return () => {
            editor.root.removeEventListener('focus', handleFocusCapture, true);
            window.forceWordEditorSync = null;
        };
    }, [isChartEditing, title, watermark, selectedCountry, category, language, notes, documentId]);

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
        if (!quillRef.current) return;
        const editor = quillRef.current.getEditor();
        editor.focus();
        let cursorPosition = editor.getSelection()?.index;
        if (cursorPosition === undefined) cursorPosition = editor.getLength();

        const citation = `${book.name} ${chapter.chapter_number}:${verseNum} `;
        editor.insertText(cursorPosition, citation);
        editor.setSelection(cursorPosition + citation.length);
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

    // Quill inner modules config
    const modules = {
        toolbar: {
            container: `#${CustomToolbarId}`
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

    // Custom Element Selection handling for our Drag/Resize Overlay
    useEffect(() => {
        const handleElementSelection = (e) => {
            const textBoxNode = e.target.closest('.custom-textbox');
            const shapeNode = e.target.closest('.custom-shape');
            if (e.target.tagName === 'IMG') {
                setSelectedImage(e.target);
            } else if (textBoxNode) {
                setSelectedImage(textBoxNode);
            } else if (shapeNode) {
                setSelectedImage(shapeNode);
            } else {
                setSelectedImage(null);
            }
        };

        if (quillRef.current) {
            const editor = quillRef.current.getEditor();
            editor.root.addEventListener('click', handleElementSelection);
            editor.root.addEventListener('touchstart', handleElementSelection);
        }

        return () => {
            if (quillRef.current) {
                const editor = quillRef.current.getEditor();
                editor.root.removeEventListener('click', handleElementSelection);
                editor.root.removeEventListener('touchstart', handleElementSelection);
            }
        };
    }, []);

    // Intercept Quill Toolbar Formats to apply them to the selected TextBox instead!
    useEffect(() => {
        if (!quillRef.current) return;
        const editor = quillRef.current.getEditor();
        const originalFormat = editor.format.bind(editor);

        editor.format = (name, value, source) => {
            if (selectedImage && selectedImage.classList.contains('custom-textbox')) {
                const textarea = selectedImage.querySelector('textarea');
                if (textarea) {
                    if (name === 'font') textarea.style.fontFamily = value;
                    else if (name === 'size') textarea.style.fontSize = value;
                    else if (name === 'color') textarea.style.color = value;
                    else if (name === 'background') selectedImage.style.backgroundColor = value;
                    else if (name === 'bold') textarea.style.fontWeight = value ? 'bold' : 'normal';
                    else if (name === 'italic') textarea.style.fontStyle = value ? 'italic' : 'normal';
                    else if (name === 'underline') textarea.style.textDecoration = value ? 'underline' : 'none';
                    else if (name === 'align') textarea.style.textAlign = value;
                    
                    // Save to inline style so it persists
                    selectedImage.setAttribute('style', selectedImage.getAttribute('style') || '');
                    
                    // Trigger save
                    const index = editor.getLength();
                    editor.insertText(index, '\n');
                    editor.deleteText(index, 1);
                    return; 
                }
            } else if (selectedImage && selectedImage.classList.contains('custom-shape')) {
                const svg = selectedImage.querySelector('svg');
                if (svg) {
                    if (name === 'color') {
                        const newColor = value || 'currentColor';
                        svg.setAttribute('stroke', newColor);
                        svg.querySelectorAll('path, rect, circle, polygon, ellipse, line, polyline').forEach(el => {
                            if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
                                el.setAttribute('stroke', newColor);
                            }
                        });
                    }
                    else if (name === 'background') {
                        const newFill = value || 'none';
                        svg.setAttribute('fill', newFill);
                        svg.querySelectorAll('path, rect, circle, polygon, ellipse, line, polyline').forEach(el => {
                            if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none') {
                                el.setAttribute('fill', newFill);
                            }
                        });
                    }
                    
                    selectedImage.setAttribute('style', selectedImage.getAttribute('style') || '');
                    
                    const index = editor.getLength();
                    editor.insertText(index, '\n');
                    editor.deleteText(index, 1);
                    return;
                }
            }
            return originalFormat(name, value, source);
        };

        return () => {
            editor.format = originalFormat;
        };
    }, [selectedImage]);

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
                    className="shadow-lg border border-gray-300 relative overflow-hidden print:border-none duration-300 transition-all mx-auto flex flex-col"
                    style={{
                        width: PAGE_SIZES[pageSize].width,
                        minHeight: PAGE_SIZES[pageSize].height,
                        padding: PAGE_SIZES[pageSize].padding,
                        backgroundColor: 'white',
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'top center',
                        marginBottom: `calc(${PAGE_SIZES[pageSize].height} * ${Math.max(0, zoomLevel - 1)})`,
                        backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent ${PAGE_SIZES[pageSize].linePx - 1}px, #cbd5e1 ${PAGE_SIZES[pageSize].linePx - 1}px, #cbd5e1 ${PAGE_SIZES[pageSize].linePx}px)`,
                        backgroundSize: `100% ${PAGE_SIZES[pageSize].linePx}px`
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
                    <div className="relative w-full flex-grow flex flex-col cursor-text" onClick={(e) => { if (e.target === e.currentTarget && quillRef.current) quillRef.current.getEditor().focus(); }}>
                        <ReactQuill
                            ref={quillRef}
                            theme="snow"
                            value={content}
                            onChange={handleContentChange}
                            modules={modules}
                            readOnly={isChartEditing}
                            className="border-none relative z-10 bg-transparent flex-grow flex flex-col"
                        />

                        {/* IRON SHIELD: Physical interaction blocker */}
                        {isChartEditing && (
                            <div 
                                className="absolute inset-0 z-[150] bg-white/5 cursor-not-allowed pointer-events-auto backdrop-blur-[1px]"
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            />
                        )}
                        
                        <ImageResizerOverlay 
                            selectedElement={selectedImage}
                            setSelectedImage={setSelectedImage}
                            quillRef={quillRef}
                            zoomLevel={zoomLevel}
                        />
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

            {/* Hidden styles to override Quill border within our "page" & strict A4 printing overrides */}
            <style>{`
                .ql-container.ql-snow { 
                    border: none !important; 
                    height: auto !important; 
                    overflow: visible !important; 
                    display: flex !important;
                    flex-direction: column !important;
                    flex-grow: 1 !important;
                }
                .ql-editor { 
                    padding: 0 !important; 
                    min-height: 100%;
                    flex-grow: 1;
                    font-family: inherit;
                    font-size: 16px;
                    overflow-y: visible !important;
                    height: auto !important;
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
                className={`fixed inset-0 bg-black/60 z-[250] transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsSidebarOpen(false)}
            ></div>

            {/* TIER 1: Book List (Sidebar) Drawer */}
            <div className={`fixed top-0 left-0 h-full w-64 sm:w-72 md:w-80 bg-[#1e2433] text-gray-300 shadow-2xl z-[260] flex flex-col overflow-hidden transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
                                                <div className="grid grid-cols-5 gap-1.5">
                                                    {expandedBookChapters.length > 0 ? (
                                                        expandedBookChapters.map(chapter => (
                                                            <div key={chapter.id} className="relative">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setExpandedChapterId(prev => prev === chapter.id ? null : chapter.id);
                                                                    }}
                                                                    className={`flex items-center justify-center w-full aspect-square rounded font-bold text-sm transition-all duration-200 ${expandedChapterId === chapter.id
                                                                        ? 'bg-[#3b82f6] text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                                                                        : 'bg-[#1e2433] text-gray-400 hover:bg-[#2d3748] hover:text-white'
                                                                        }`}
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

                                                {/* Verse Grid beneath Chapter list */}
                                                {expandedChapterId && (
                                                    <div className="mt-2 p-2 border-t border-gray-800 animate-fadein">
                                                        <div className="text-[10px] font-bold text-[#8b9bb4] uppercase tracking-widest text-center mb-2">
                                                            Verses (Chapter {expandedBookChapters.find(c => c.id === expandedChapterId)?.chapter_number})
                                                        </div>
                                                        <div className="grid grid-cols-6 gap-1 max-h-[200px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
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
