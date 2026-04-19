import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import pptxgen from "pptxgenjs";
import ScriptViewerModal from './ScriptViewerModal';
import DocumentNotesModal from './DocumentNotesModal';
import CChartModal from './CChartModal';
import LionChartModal from './LionChartModal';
import { ANTI_GRAVITY_SCRIPTS } from '../../data/antiGravityScripts';

const EMOJIS = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "☺️", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😮‍💨", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🫣", "🤗", "🫡", "🤔", "🫢", "🤭", "🤫", "🤥", "😶", "😶‍🌫️", "😐", "😑", "😬", "🫠", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "😵‍💫", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾",
    "👋", "🤚", "🖐", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🫀", "🫁", "🧠", "🦷", "🦴", "👀", "👁", "👅", "👄", "💋", "🩸",
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "狼", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌", "🐞", "🐜", "🪰", "🪲", "🪳", "🦟", "🦗", "🕷", "🕸", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🦭", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🦣", "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🦬", "🐃", "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🦙", "🐐", "🦌", "🐕", "🐩", "🦮", "🐕‍🦺", "🐈", "🐈‍⬛", "🪶", "🐓", "🦃", "🦤", "🦚", "🦜", "🦢", "🦩", "🕊", "🐇", "🦝", "🦨", "🦡", "🦫", "🦦", "🦥", "🐁", "🐀", "🐿", "🦔", "🐾", "🐉", "🐲", "🌵", "🎄", "🌲", "🌳", "🌴", "🪵", "🌱", "🌿", "☘️", "🍀", "🎍", "🪴", "🎋", "🍃", "🍂", "🍁", "🍄", "🐚", "🪨", "🌾", "💐", "🌷", "🌹", "🥀", "🌺", "🌸", "🌼", "🌻", "🌞", "🌝", "🌛", "🌜", "🌚", "🌕", "🌖", "🌗", "🌘", "🌑", "🌒", "🌓", "🌔", "🌙", "🌎", "🌍", "🌏", "🪐", "💫", "⭐️", "🌟", "✨", "⚡️", "☄️", "💥", "🔥", "🌪", "🌈", "☀️", "🌤", "⛅️", "🌥", "☁️", "🌦", "🌧", "⛈", "🌩", "🌨", "❄️", "☃️", "⛄️", "🌬", "💨", "💧", "💦", "☔️", "☂️", "🌊", "🌫",
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈️", "♉️", "♊️", "♋️", "♌️", "♍️", "♎️", "♏️", "♐️", "♑️", "♒️", "♓️", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳", "🈶", "🈚️", "🈸", "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️", "㊗️", "🈴", "🈵", "🈹", "🈲", "🅰️", "🅱️", "🆎", "🆑", "🅾️", "🆘", "❌", "⭕️", "🛑", "⛔️", "📛", "🚫", "💯", "💢", "♨️", "🚷", "🚯", "🚳", "🚱", "🔞", "📵", "🚭", "❗️", "❕", "❓", "❔", "‼️", "⁉️", "🔅", "🔆", "〽️", "⚠️", "🚸", "🔱", "⚜️", "🔰", "♻️", "✅", "🈯️", "💹", "❇️", "✳️", "❎", "🌐", "💠", "Ⓜ️", "🌀", "💤", "🏧", "🚾", "♿️", "🅿️", "🛗", "🈳", "🈂️", "🛂", "🛃", "🛄", "🛅"
];

const UN_CODES = "AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TJ TZ TH TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VE VN YE ZM ZW".split(' ');
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
const COUNTRIES = UN_CODES.map(code => regionNames.of(code)).sort();

const DropdownPortal = ({ isOpen, anchorRef, children }) => {
    if (!isOpen || !anchorRef.current) return null;
    const rect = anchorRef.current.getBoundingClientRect();
    // Use wider offset for right bound menus so e.g. Emoji grid doesn't squash or clip
    return createPortal(
        <div
            className="fixed z-[99999] pointer-events-auto"
            style={{
                top: rect.bottom + 5,
                left: Math.min(rect.left, window.innerWidth - 300)
            }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </div>,
        document.body
    );
};

const WordToolbar = ({ toolbarId, quillRef, content, title, watermark, setWatermark, language, setLanguage, notes, setNotes }) => {
    const fileInputRef = useRef(null);
    const puzzleInputRef = useRef(null);
    const watermarkInputRef = useRef(null);

    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const interimRangeRef = useRef(null);

    const emojiDropdownRef = useRef(null);
    const [emojiDropdownOpen, setEmojiDropdownOpen] = useState(false);

    const chartsDropdownRef = useRef(null);
    const [chartsDropdownOpen, setChartsDropdownOpen] = useState(false);

    const graphsDropdownRef = useRef(null);
    const [graphsDropdownOpen, setGraphsDropdownOpen] = useState(false);

    const countryDropdownRef = useRef(null);
    const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

    const imageDropdownRef = useRef(null);
    const [imageDropdownOpen, setImageDropdownOpen] = useState(false);

    const agScriptDropdownRef = useRef(null);
    const [agScriptDropdownOpen, setAgScriptDropdownOpen] = useState(false);
    const [viewerScript, setViewerScript] = useState(null);

    const [notesModalOpen, setNotesModalOpen] = useState(false);
    const [cChartModalOpen, setCChartModalOpen] = useState(false);
    const [lionChartModalOpen, setLionChartModalOpen] = useState(false);
    const cChartCursorRef = useRef(null);
    const lionChartInsertedRef = useRef(false);

    const handleCChartInsert = (selectedText) => {
        if (!quillRef.current) return;
        const editor = quillRef.current.getEditor();
        let cursorPosition = cChartCursorRef.current !== null ? cChartCursorRef.current : editor.getLength();

        // Append selected text with a trailing newline for cleaner formatting when doing multi-inserts
        editor.insertText(cursorPosition, selectedText + "\n");

        // Automatically shift the internal cursor ref down to match the new text boundary exactly
        cChartCursorRef.current = cursorPosition + selectedText.length + 1;
        // Do NOT close the modal, allowing sequential insertions until user clicks outside
    };

    const wisdomDropdownRef = useRef(null);
    const [wisdomOpen, setWisdomOpen] = useState(false);
    const [wisdomMode, setWisdomMode] = useState('highlight');

    const WISDOM_COLORS = ['#00C0FF', '#00A638', '#3340CD', '#FAFA33', '#BB43B1', '#FE6D01', '#FE0005'];
    const WISDOM_MODES = [
        { id: 'square', icon: 'pi pi-stop', label: 'Square' },
        { id: 'round', icon: 'pi pi-check-circle', label: 'Round' },
        { id: 'underline', icon: 'pi pi-minus', label: 'Underline' },
        { id: 'highlight', icon: 'pi pi-pencil', label: 'Highlight' }
    ];

    const applyWisdom = (color) => {
        if (!quillRef.current) return;
        const editor = quillRef.current.getEditor();
        editor.focus();
        editor.format('wisdom', `${wisdomMode}|${color}`);
        setWisdomOpen(false);
    };

    const clearWisdom = () => {
        if (!quillRef.current) return;
        const editor = quillRef.current.getEditor();
        editor.focus();
        editor.format('wisdom', false);
        setWisdomOpen(false);
    };

    const [graphModal, setGraphModal] = useState({ isOpen: false, type: null });
    const [xData, setXData] = useState("");
    const [yData, setYData] = useState("");

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        // The API uses BCP-47 language tags
        recognition.lang = language === 'zh' ? 'zh-CN' : (language === 'ar' ? 'ar-SA' : language);

        recognition.onstart = () => {
            setIsListening(true);
            interimRangeRef.current = null;
        };

        recognition.onresult = (event) => {
            if (!quillRef.current) return;
            const editor = quillRef.current.getEditor();

            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (interimRangeRef.current) {
                editor.deleteText(interimRangeRef.current.index, interimRangeRef.current.length);
                interimRangeRef.current = null;
            }

            let cursorPosition = editor.getSelection()?.index;
            if (cursorPosition === undefined) cursorPosition = editor.getLength();

            if (finalTranscript !== '') {
                const textToInsert = finalTranscript.trim() + ' ';
                editor.insertText(cursorPosition, textToInsert);
                editor.setSelection(cursorPosition + textToInsert.length);
            }

            if (interimTranscript !== '') {
                cursorPosition = editor.getSelection()?.index;
                if (cursorPosition === undefined) cursorPosition = editor.getLength();
                editor.insertText(cursorPosition, interimTranscript);
                interimRangeRef.current = {
                    index: cursorPosition,
                    length: interimTranscript.length
                };
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
            interimRangeRef.current = null;
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [language, quillRef]);

    const wordCount = React.useMemo(() => {
        if (!content) return 0;
        // Strip HTML tags and normalize whitespace to count words accurately
        const text = content.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
        return text.length > 0 ? text.split(/\s+/).length : 0;
    }, [content]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiDropdownRef.current && !emojiDropdownRef.current.contains(event.target)) {
                setEmojiDropdownOpen(false);
            }
            if (chartsDropdownRef.current && !chartsDropdownRef.current.contains(event.target)) {
                setChartsDropdownOpen(false);
            }
            if (graphsDropdownRef.current && !graphsDropdownRef.current.contains(event.target)) {
                setGraphsDropdownOpen(false);
            }
            if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
                setCountryDropdownOpen(false);
            }
            if (imageDropdownRef.current && !imageDropdownRef.current.contains(event.target)) {
                setImageDropdownOpen(false);
            }
            if (agScriptDropdownRef.current && !agScriptDropdownRef.current.contains(event.target)) {
                setAgScriptDropdownOpen(false);
            }
            if (wisdomDropdownRef.current && !wisdomDropdownRef.current.contains(event.target)) {
                setWisdomOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const insertEmoji = (emoji) => {
        if (!quillRef.current) return;
        const editor = quillRef.current.getEditor();
        editor.focus();
        let cursorPosition = editor.getSelection()?.index;
        if (cursorPosition === undefined) cursorPosition = editor.getLength();
        editor.insertText(cursorPosition, emoji);
        editor.setSelection(cursorPosition + emoji.length);
        setEmojiDropdownOpen(false);
    };

    const handleWatermarkUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            if (setWatermark) setWatermark(reader.result);
        };
        reader.readAsDataURL(file);
        e.target.value = null;
    };

    const insertCountry = (countryName) => {
        if (!quillRef.current) return;
        const editor = quillRef.current.getEditor();
        editor.focus();
        let cursorPosition = editor.getSelection()?.index;
        if (cursorPosition === undefined) cursorPosition = editor.getLength();
        editor.insertText(cursorPosition, countryName);
        editor.setSelection(cursorPosition + countryName.length);
        setCountryDropdownOpen(false);
    };

    const toggleDictation = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                if (quillRef.current) {
                    quillRef.current.getEditor().focus();
                }
                recognitionRef.current.start();
            } catch (e) {
                console.error("Microphone start error:", e);
            }
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleOutlineColor = (e) => {
        if (!quillRef.current) return;
        quillRef.current.getEditor().format('outline', `1.5px ${e.target.value}`);
    };

    const handleShadowColor = (e) => {
        if (!quillRef.current) return;
        quillRef.current.getEditor().format('shadow', `4px 4px 0px ${e.target.value}`);
    };

    const handleExportPPT = () => {
        let pptx = new pptxgen();
        let slide = pptx.addSlide();

        // 1. Add Header Title
        slide.addText(title || "Document", { x: 0.5, y: 0.5, w: "90%", h: 0.5, fontSize: 24, bold: true, color: "051220", align: 'center' });

        // 2. Parse Content to preserve paragraphs and Images
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = content;

        let currentY = 1.2; // Start rendering content right below the title

        // Iterate through all top-level child elements generated by Quill (typically <p>, <h1>, <img>)
        Array.from(tempDiv.childNodes).forEach(node => {
            if (node.nodeName === 'IMG') {
                // Determine responsive image size (scaled to fit well)
                slide.addImage({ data: node.src, x: 1.0, y: currentY, w: 8.0, h: 4.5, sizing: { type: 'contain', w: 8.0, h: 4.5 } });
                currentY += 4.8; // Bump Y significantly for charts
            } else if (node.nodeName === 'P' || node.nodeName === 'H1' || node.nodeName === 'H2') {
                // If the paragraph happens to contain an embedded image within it (Quill sometimes nests nodes)
                const imgInside = node.querySelector('img');
                if (imgInside) {
                    slide.addImage({ data: imgInside.src, x: 1.0, y: currentY, w: 8.0, h: 4.5, sizing: { type: 'contain', w: 8.0, h: 4.5 } });
                    currentY += 4.8;
                } else {
                    const cleanText = node.textContent.trim();
                    if (cleanText) {
                        const isHeader = node.nodeName === 'H1' || node.nodeName === 'H2';
                        slide.addText(cleanText, { x: 0.5, y: currentY, w: "90%", fontSize: isHeader ? 20 : 16, color: "363636", bold: isHeader });
                        currentY += isHeader ? 0.6 : 0.4;
                    }
                }
            } else {
                const text = node.textContent?.trim();
                if (text) {
                    slide.addText(text, { x: 0.5, y: currentY, w: "90%", fontSize: 16, color: "363636" });
                    currentY += 0.4;
                }
            }

            // Create a new slide if we ran out of space natively!
            if (currentY > 7.0) {
                slide = pptx.addSlide();
                currentY = 0.5; // Reset Y on fresh slide
            }
        });

        pptx.writeFile({ fileName: `${title ? title.trim() : 'Document'}.pptx` });
    };

    const handleShare = async () => {
        // MS Word HTML-to-RTF parser crashes heavily on "data:image/svg+xml" strings, leading to completely blank documents.
        // We must selectively intercept any SVG base64 nodes from Quill and asynchronously rasterize them to PNGs before compiling.
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = content;

        const images = Array.from(tempDiv.querySelectorAll('img[src^="data:image/svg+xml"]'));

        await Promise.all(images.map((img) => {
            return new Promise((resolve) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const svgImage = new Image();

                svgImage.onload = () => {
                    // Extract native width/height or default to safe boundaries
                    canvas.width = svgImage.width || 800;
                    canvas.height = svgImage.height || 500;

                    // Draw white background (SVGs are transparent, Word prefers solid backgrounds)
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Draw the SVG over it
                    ctx.drawImage(svgImage, 0, 0);

                    // Mutate the DOM node's src directly to the safe PNG format
                    img.src = canvas.toDataURL("image/png");
                    resolve();
                };

                svgImage.onerror = () => {
                    // If parsing fails simply strip the offending image to save the rest of the text document
                    img.remove();
                    resolve();
                };

                svgImage.src = img.src;
            });
        }));

        const safeContent = tempDiv.innerHTML;

        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
            "xmlns:w='urn:schemas-microsoft-com:office:word' " +
            "xmlns='http://www.w3.org/TR/REC-html40'>" +
            "<head><meta charset='utf-8'><title>Export HTML to Word Document Document</title></head><body style=\"font-family: Arial, sans-serif;\">";
        const footer = "</body></html>";
        const sourceHTML = header + safeContent + footer;

        const blob = new Blob(['\ufeff', sourceHTML], {
            type: 'application/msword'
        });

        const filename = `${title ? title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'document'}.doc`;
        const docFile = new File([blob], filename, { type: 'application/msword' });

        if (navigator.canShare && navigator.canShare({ files: [docFile] })) {
            try {
                await navigator.share({
                    title: title || 'Document',
                    files: [docFile]
                });
            } catch (err) {
                console.error("Share failed", err);
                triggerDownload(blob, filename);
            }
        } else {
            triggerDownload(blob, filename);
        }
    };

    // Helper for downloading
    const triggerDownload = (blob, filename) => {
        const downloadLink = document.createElement("a");
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
    };

    const handlePuzzleUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !quillRef.current) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw original image
                ctx.drawImage(img, 0, 0);

                // Draw Puzzle Overlay
                const cols = 5;
                const rows = 4;
                const tileW = canvas.width / cols;
                const tileH = canvas.height / rows;

                ctx.lineWidth = Math.max(3, canvas.width * 0.005);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
                ctx.shadowColor = "rgba(0,0,0,0.6)";
                ctx.shadowBlur = Math.max(4, canvas.width * 0.01);
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;

                const drawHorizontalEdge = (x, y, w, dir) => {
                    const tabSize = w * 0.2;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(w * 0.35, 0);
                    ctx.bezierCurveTo(w * 0.35, dir * tabSize * 1.5, w * 0.65, dir * tabSize * 1.5, w * 0.65, 0);
                    ctx.lineTo(w, 0);
                    ctx.stroke();
                    ctx.restore();
                };

                const drawVerticalEdge = (x, y, h, dir) => {
                    const tabSize = h * 0.2;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, h * 0.35);
                    ctx.bezierCurveTo(dir * tabSize * 1.5, h * 0.35, dir * tabSize * 1.5, h * 0.65, 0, h * 0.65);
                    ctx.lineTo(0, h);
                    ctx.stroke();
                    ctx.restore();
                };

                for (let r = 1; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const dir = (r + c) % 2 === 0 ? 1 : -1;
                        drawHorizontalEdge(c * tileW, r * tileH, tileW, dir);
                    }
                }

                for (let c = 1; c < cols; c++) {
                    for (let r = 0; r < rows; r++) {
                        const dir = (r + c) % 2 === 0 ? 1 : -1;
                        drawVerticalEdge(c * tileW, r * tileH, tileH, dir);
                    }
                }

                // Insert into Quill
                const editor = quillRef.current.getEditor();
                const range = editor.getSelection(true);
                const base64Data = canvas.toDataURL('image/png');
                editor.insertEmbed(range ? range.index : 0, 'image', base64Data);
                editor.setSelection((range ? range.index : 0) + 1);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleLionChartLiveUpdate = (base64Img) => {
        if (!quillRef.current) return;
        const editor = quillRef.current.getEditor();
        let cursorPosition = cChartCursorRef.current !== null ? cChartCursorRef.current : editor.getLength();

        if (lionChartInsertedRef.current) {
            // Re-targeting stable sequence to overwrite previous generated layout block dynamically!
            editor.deleteText(cursorPosition, 1);
        }

        // Project new state right into cursor
        editor.insertEmbed(cursorPosition, 'image', base64Img);
        lionChartInsertedRef.current = true;
    };

    const handleGraphInsert = (type) => {
        setGraphModal({ isOpen: true, type });
        setGraphsDropdownOpen(false);
    };

    const submitGraph = () => {
        if (!graphModal.type || !quillRef.current) return;

        let svgContent = '';
        const xArr = xData.split(',').map(s => s.trim()).filter(s => s !== "");
        const yArr = yData.split(',').map(Number).filter(n => !isNaN(n));

        const len = Math.max(xArr.length, yArr.length) || 1;
        const labels = Array.from({ length: len }, (_, i) => xArr[i] || `X${i + 1}`);
        const values = Array.from({ length: len }, (_, i) => isNaN(yArr[i]) || yArr[i] === undefined ? 0 : yArr[i]);

        const width = 500;
        const height = 300;
        const padX = 50;
        const padY = 50;
        const chartW = width - padX * 2;
        const chartH = height - padY * 2;

        const maxValRaw = Math.max(...values, 1);

        const tickSpacingFunc = (range) => {
            let exponent = Math.floor(Math.log10(range));
            let fraction = range / Math.pow(10, exponent);
            let niceFraction;
            if (fraction < 1.5) niceFraction = 1;
            else if (fraction < 3) niceFraction = 2;
            else if (fraction < 7) niceFraction = 5;
            else niceFraction = 10;
            return niceFraction * Math.pow(10, exponent);
        };
        const tickSpacing = tickSpacingFunc(maxValRaw / 4) || 1;
        const maxVal = Math.ceil(maxValRaw / tickSpacing) * tickSpacing;

        const scaleY = chartH / maxVal;
        const stepX = chartW / (len > 1 ? len - 1 : 1);
        const colW = Math.min(40, chartW / len * 0.8);

        let grid = `<rect width="${width}" height="${height}" fill="#ffffff"/>`;
        grid += `<line x1="${padX}" y1="${padY}" x2="${padX}" y2="${height - padY}" stroke="#333" stroke-width="2"/>`;
        grid += `<line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="#333" stroke-width="2"/>`;

        let ticksCount = maxVal / tickSpacing;
        for (let i = 0; i <= ticksCount; i++) {
            let tickVal = i * tickSpacing;
            let y = height - padY - (tickVal * scaleY);
            grid += `<line x1="${padX - 5}" y1="${y}" x2="${padX}" y2="${y}" stroke="#333" stroke-width="1"/>`;
            if (i > 0) grid += `<line x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`;
            grid += `<text x="${padX - 10}" y="${y + 4}" font-family="sans-serif" font-size="12" text-anchor="end" fill="#666">${tickVal}</text>`;
        }

        switch (graphModal.type) {
            case 'bar':
                let bars = '';
                values.forEach((v, i) => {
                    let h = Math.max(v * scaleY, 0);
                    let x = padX + (chartW / len) * i + (chartW / len - colW) / 2;
                    let y = height - padY - h;
                    let barColor = i % 2 === 0 ? '#3b82f6' : '#10b981';
                    bars += `<rect x="${x}" y="${y}" width="${colW}" height="${h}" fill="${barColor}"><title>${labels[i]}: ${v}</title></rect>`;
                    bars += `<text x="${x + colW / 2}" y="${height - padY + 20}" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#666">${labels[i]}</text>`;
                });
                svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${grid}${bars}</svg>`;
                break;

            case 'line':
            case 'area':
                let points = values.map((v, i) => {
                    let x = padX + stepX * i;
                    let y = height - padY - Math.max(v * scaleY, 0);
                    return { x, y };
                });

                let ptsStr = points.map(p => `${p.x},${p.y}`).join(' ');
                let poly = `<polyline points="${ptsStr}" fill="none" stroke="#6366f1" stroke-width="4"/>`;
                let circles = points.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="5" fill="#6366f1"><title>${labels[i]}: ${values[i]}</title></circle><text x="${p.x}" y="${height - padY + 20}" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#666">${labels[i]}</text>`).join('');

                if (graphModal.type === 'area') {
                    let areaPts = `${points[0].x},${height - padY} ${ptsStr} ${points[points.length - 1].x},${height - padY}`;
                    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${grid}<polygon points="${areaPts}" fill="#a78bfa" opacity="0.6"/><polyline points="${ptsStr}" fill="none" stroke="#8b5cf6" stroke-width="3"/>${circles}</svg>`;
                } else {
                    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${grid}${poly}${circles}</svg>`;
                }
                break;

            case 'pie':
                let total = values.reduce((a, b) => a + b, 0) || 1;
                let cx = width / 2;
                let cy = height / 2;
                let r = Math.min(chartW, chartH) / 2;

                let piePaths = '';
                let legend = '';
                let startAngle = 0;
                let colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

                values.forEach((v, i) => {
                    let sliceAngle = (v / total) * 360;
                    if (sliceAngle === 360) sliceAngle = 359.9;
                    let endAngle = startAngle + sliceAngle;

                    let x1 = cx + r * Math.cos(Math.PI * startAngle / 180);
                    let y1 = cy + r * Math.sin(Math.PI * startAngle / 180);
                    let x2 = cx + r * Math.cos(Math.PI * endAngle / 180);
                    let y2 = cy + r * Math.sin(Math.PI * endAngle / 180);
                    let largeArc = sliceAngle > 180 ? 1 : 0;

                    piePaths += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${colors[i % colors.length]}"><title>${labels[i]}: ${v}</title></path>`;
                    legend += `<circle cx="${padX}" cy="${padY + i * 20}" r="5" fill="${colors[i % colors.length]}"/><text x="${padX + 15}" y="${padY + i * 20 + 5}" font-family="sans-serif" font-size="12" fill="#666">${labels[i]} (${v})</text>`;
                    startAngle = endAngle;
                });
                svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="#ffffff"/>${piePaths}${legend}</svg>`;
                break;
        }

        const safeSvg = encodeURIComponent(svgContent).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1));
        const base64Data = `data:image/svg+xml;base64,${btoa(safeSvg)}`;

        const editor = quillRef.current.getEditor();
        editor.focus();
        const cursorPosition = editor.getSelection()?.index || editor.getLength();
        editor.insertEmbed(cursorPosition, 'image', base64Data);
        editor.setSelection(cursorPosition + 1);

        setGraphModal({ isOpen: false, type: null });
        setXData("");
        setYData("");
    };

    return (
        <div
            className="bg-white border-b px-2 py-1 flex flex-nowrap overflow-x-auto overflow-y-hidden items-center gap-2 z-10 sticky top-0 shadow-sm text-sm"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            <style>{`
                .word-toolbar-wrapper::-webkit-scrollbar { display: none; }
            `}</style>
            {/* Quill's Internal Toolbar Container - restricted to only native Quill formats! */}
            <div id={toolbarId} className="flex flex-nowrap items-center gap-1 border-none border-0 m-0 p-0 shadow-none bg-transparent shrink-0 word-toolbar-wrapper">
                {/* Typography Group */}
                <div className="flex items-center gap-0 border-r pr-2">
                    <span className="ql-formats m-0 mr-1 flex items-center gap-0">
                        <select className="ql-font" defaultValue="sans-serif">
                            <option value="sans-serif">Sans Serif</option>
                            <option value="serif">Serif</option>
                            <option value="monospace">Monospace</option>
                            <option value="bungee-shade">Bungee Shade (3D)</option>
                            <option value="nabla">Nabla (3D Color)</option>
                            <option value="rampart-one">Rampart One (3D Layered)</option>
                            <option value="bungee">Bungee (Layer Base)</option>
                            <option value="londrina">Londrina Solid (Layer Base)</option>
                            <option value="alfa-slab-one">Alfa Slab One (Block)</option>
                            <option value="rubik">Rubik Black (Block)</option>
                            <option value="anton">Anton (Tall Block)</option>
                        </select>
                        <select className="ql-size" defaultValue="16px">
                            <option value="8px">8</option>
                            <option value="9px">9</option>
                            <option value="10px">10</option>
                            <option value="11px">11</option>
                            <option value="12px">12</option>
                            <option value="14px">14</option>
                            <option value="16px">16</option>
                            <option value="18px">18</option>
                            <option value="20px">20</option>
                            <option value="22px">22</option>
                            <option value="24px">24</option>
                            <option value="26px">26</option>
                            <option value="28px">28</option>
                            <option value="36px">36</option>
                            <option value="48px">48</option>
                            <option value="72px">72</option>
                        </select>
                    </span>
                </div>

                <div className="flex items-center gap-1 border-r pr-2">
                    <span className="ql-formats m-0 flex items-center gap-0">
                        <button className="ql-bold"></button>
                        <button className="ql-italic"></button>
                        <button className="ql-underline"></button>
                        <select className="ql-color" title="Fill Color"></select>
                        <select className="ql-background" title="Highlight Color"></select>
                    </span>

                    {/* Custom Layering Controls using standard inputs hooked into Quill formats */}
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded">
                        <label className="flex items-center gap-1 cursor-pointer" title="Outline Color">
                            <i className="pi pi-stop text-gray-500 text-xs"></i>
                            <input type="color" defaultValue="#000000" className="w-5 h-5 rounded cursor-pointer border-0 p-0" onChange={handleOutlineColor} />
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer" title="Drop Shadow Color">
                            <i className="pi pi-clone text-gray-500 text-xs"></i>
                            <input type="color" defaultValue="#aaaaaa" className="w-5 h-5 rounded cursor-pointer border-0 p-0" onChange={handleShadowColor} />
                        </label>
                    </div>

                    {/* Wisdom Overlay Tool */}
                    <div className="flex items-center relative pl-2" ref={wisdomDropdownRef}>
                        <button
                            onClick={() => setWisdomOpen(!wisdomOpen)}
                            className={`flex justify-center items-center gap-1 w-8 h-8 rounded transition-colors ${wisdomOpen ? 'bg-amber-100 text-amber-700' : 'hover:bg-gray-100 text-gray-500'}`}
                            title="Wisdom Overlay Toolkit"
                        >
                            <i className="pi pi-sparkles"></i>
                        </button>
                        <DropdownPortal isOpen={wisdomOpen} anchorRef={wisdomDropdownRef}>
                            <div className="bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-52 p-3 animate-fadein">
                                <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest text-center">Form Overlay</div>
                                <div className="grid grid-cols-4 gap-2 mb-3">
                                    {WISDOM_MODES.map(m => (
                                        <button
                                            key={m.id}
                                            onMouseDown={(e) => { e.preventDefault(); setWisdomMode(m.id); }}
                                            className={`py-2 px-1 border rounded flex justify-center items-center transition-all ${wisdomMode === m.id ? 'bg-amber-50 border-amber-300 text-amber-600 ring-1 ring-amber-300 shadow-inner' : 'hover:bg-gray-50 text-gray-400 border-gray-200'}`}
                                            title={m.label}
                                        >
                                            <i className={m.icon}></i>
                                        </button>
                                    ))}
                                </div>
                                <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest text-center">Wisdom Application</div>
                                <div className="grid grid-cols-7 gap-1">
                                    {WISDOM_COLORS.map(color => (
                                        <button
                                            key={color}
                                            className="w-full aspect-square rounded shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] hover:scale-110 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400"
                                            style={{ backgroundColor: color }}
                                            onMouseDown={(e) => { e.preventDefault(); applyWisdom(color); }}
                                            title={`Apply Color`}
                                        />
                                    ))}
                                </div>
                                <button onMouseDown={(e) => { e.preventDefault(); clearWisdom(); }} className="w-full mt-4 py-1.5 text-xs text-red-600 font-medium hover:bg-red-50 rounded border border-red-100 transition-colors flex justify-center items-center gap-1">
                                    <i className="pi pi-eraser text-[10px]"></i> Clear Form
                                </button>
                            </div>
                        </DropdownPortal>
                    </div>

                    {/* Watermark Upload Background Tool */}
                    <div className="flex items-center gap-1 border-l pl-2 ml-1">
                        <button
                            onClick={() => watermarkInputRef.current?.click()}
                            className="flex justify-center items-center gap-1 w-8 h-8 rounded transition-colors text-gray-500 hover:bg-blue-50 hover:text-blue-600 shadow-sm border border-gray-100 bg-white"
                            title="Set Background Transparent Watermark"
                        >
                            <i className="pi pi-images"></i>
                        </button>
                        {watermark && (
                            <button
                                onClick={() => setWatermark && setWatermark('')}
                                className="flex justify-center items-center gap-1 w-8 h-8 rounded transition-colors text-red-400 hover:bg-red-50 hover:text-red-500"
                                title="Remove Watermark"
                            >
                                <i className="pi pi-times"></i>
                            </button>
                        )}
                        <input
                            type="file"
                            ref={watermarkInputRef}
                            accept="image/*"
                            className="hidden"
                            onChange={handleWatermarkUpload}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-1 border-r pr-2">
                    <span className="ql-formats m-0 flex items-center gap-0">
                        <button className="ql-list" value="ordered"></button>
                        <button className="ql-list" value="bullet"></button>
                        <select className="ql-align" title="Text Alignment"></select>
                        <button className="ql-link"></button>
                        <button className="ql-image"></button>
                    </span>
                </div>

            </div> {/* END QUILL CONTAINER */}

            {/* Document Assets - Native React Components outside Quill's scope! */}
            <div className="flex items-center gap-1 border-r pr-2 shrink-0">
                <div className="relative shrink-0" ref={imageDropdownRef}>
                    <button
                        onClick={() => setImageDropdownOpen(!imageDropdownOpen)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${imageDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'} hidden xl:flex`}
                        title="Image Tools"
                    >
                        <i className="pi pi-image text-gray-500"></i>
                        Image
                    </button>
                    <button
                        onClick={() => setImageDropdownOpen(!imageDropdownOpen)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${imageDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'} xl:hidden`}
                        title="Image Tools"
                    >
                        <i className="pi pi-image text-gray-500"></i>
                    </button>

                    <DropdownPortal isOpen={imageDropdownOpen} anchorRef={imageDropdownRef}>
                        <div className="w-48 bg-white border border-gray-200 shadow-2xl rounded-lg p-1 flex flex-col gap-1">
                            <button
                                onMouseDown={(e) => { e.preventDefault(); setImageDropdownOpen(false); puzzleInputRef.current?.click(); }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-gray-700 transition-colors w-full text-left"
                            >
                                <i className="pi pi-table text-blue-500"></i>
                                Upload Puzzle
                            </button>
                            <button
                                onMouseDown={(e) => { e.preventDefault(); setImageDropdownOpen(false); fileInputRef.current?.click(); }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-gray-700 transition-colors w-full text-left"
                            >
                                <i className="pi pi-image text-emerald-500"></i>
                                Add Watermark
                            </button>
                        </div>
                    </DropdownPortal>
                </div>

                <input
                    type="file"
                    ref={puzzleInputRef}
                    onChange={handlePuzzleUpload}
                    accept="image/*"
                    className="hidden"
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleWatermarkUpload}
                    accept="image/*"
                    className="hidden"
                />

                <div className="relative border-r border-gray-200 pr-1 mr-1 shrink-0" ref={agScriptDropdownRef}>
                    <button
                        onClick={() => setAgScriptDropdownOpen(!agScriptDropdownOpen)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${agScriptDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'}`}
                        title="Anti-Gravity Scripts"
                    >
                        <i className="pi pi-moon text-indigo-500"></i>
                        <span className="hidden xl:inline font-medium">Scripts</span>
                    </button>
                    <DropdownPortal isOpen={agScriptDropdownOpen} anchorRef={agScriptDropdownRef}>
                        <div className="w-48 bg-gray-900 border border-gray-700 shadow-2xl rounded-lg p-1 flex flex-col gap-1 text-gray-200 pointer-events-auto">
                            {Object.values(ANTI_GRAVITY_SCRIPTS).map(script => (
                                <button
                                    key={script.id}
                                    onMouseDown={(e) => { e.preventDefault(); setAgScriptDropdownOpen(false); setViewerScript(script); }}
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded text-gray-300 transition-colors w-full text-left"
                                >
                                    <i className="pi pi-compass text-emerald-500"></i>
                                    {script.name}
                                </button>
                            ))}
                        </div>
                    </DropdownPortal>
                </div>

                <div className="relative border-r border-gray-200 pr-1 mr-1 shrink-0" ref={countryDropdownRef}>
                    <button
                        onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${countryDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'}`}
                        title="Insert Country"
                    >
                        <i className="pi pi-globe text-emerald-600"></i>
                        <span className="hidden xl:inline font-medium">Country</span>
                    </button>
                    <DropdownPortal isOpen={countryDropdownOpen} anchorRef={countryDropdownRef}>
                        <div className="w-64 max-h-64 overflow-y-auto bg-white border border-gray-200 shadow-2xl rounded-lg py-1 flex flex-col custom-scrollbar">
                            {COUNTRIES.map((country, idx) => (
                                <button
                                    key={idx}
                                    onMouseDown={(e) => { e.preventDefault(); insertCountry(country); }}
                                    className="px-4 py-2 text-left hover:bg-gray-100 text-gray-700 transition-colors text-sm w-full border-b border-gray-50 last:border-0"
                                >
                                    {country}
                                </button>
                            ))}
                        </div>
                    </DropdownPortal>
                </div>

                <div className="relative" ref={chartsDropdownRef}>
                    <button
                        onClick={() => setChartsDropdownOpen(!chartsDropdownOpen)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${chartsDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'} hidden xl:flex`}
                        title="Charts"
                    >
                        <i className="pi pi-chart-bar text-gray-500"></i>
                        Charts
                    </button>
                    <button
                        onClick={() => setChartsDropdownOpen(!chartsDropdownOpen)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${chartsDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'} xl:hidden`}
                        title="Charts"
                    >
                        <i className="pi pi-chart-bar text-gray-500"></i>
                    </button>

                    <DropdownPortal isOpen={chartsDropdownOpen} anchorRef={chartsDropdownRef}>
                        <div className="w-48 bg-white border border-gray-200 shadow-2xl rounded-lg p-1 flex flex-col gap-1">
                            <button
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setChartsDropdownOpen(false);
                                    cChartCursorRef.current = quillRef.current?.getEditor()?.getSelection()?.index || quillRef.current?.getEditor()?.getLength() || 0;
                                    setCChartModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-gray-700 transition-colors w-full text-left"
                            >
                                <i className="pi pi-chart-pie text-blue-500"></i>
                                C Chart
                            </button>
                            <button
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setChartsDropdownOpen(false);
                                    cChartCursorRef.current = quillRef.current?.getEditor()?.getSelection()?.index || quillRef.current?.getEditor()?.getLength() || 0;
                                    lionChartInsertedRef.current = false;
                                    setLionChartModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-gray-700 transition-colors w-full text-left"
                            >
                                <i className="pi pi-chart-line text-orange-500"></i>
                                Lion Chart
                            </button>
                        </div>
                    </DropdownPortal>
                </div>

                <div className="relative" ref={graphsDropdownRef}>
                    <button
                        onClick={() => setGraphsDropdownOpen(!graphsDropdownOpen)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${graphsDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'} hidden xl:flex`}
                        title="Graphs"
                    >
                        <i className="pi pi-chart-scatter text-gray-500"></i>
                        Graphs
                    </button>
                    <button
                        onClick={() => setGraphsDropdownOpen(!graphsDropdownOpen)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${graphsDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'} xl:hidden`}
                        title="Graphs"
                    >
                        <i className="pi pi-chart-scatter text-gray-500"></i>
                    </button>

                    <DropdownPortal isOpen={graphsDropdownOpen} anchorRef={graphsDropdownRef}>
                        <div className="w-40 bg-white border border-gray-200 shadow-2xl rounded-lg p-1 flex flex-col gap-1">
                            <button
                                onMouseDown={(e) => { e.preventDefault(); handleGraphInsert('bar'); }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-gray-700 transition-colors w-full text-left"
                            >
                                <i className="pi pi-align-left rotate-90 text-blue-500"></i> {/* Pseudo Bar Icon */}
                                Bar Graph
                            </button>
                            <button
                                onMouseDown={(e) => { e.preventDefault(); handleGraphInsert('line'); }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-gray-700 transition-colors w-full text-left"
                            >
                                <i className="pi pi-wave-pulse text-indigo-500"></i>
                                Line Graph
                            </button>
                            <button
                                onMouseDown={(e) => { e.preventDefault(); handleGraphInsert('pie'); }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-gray-700 transition-colors w-full text-left"
                            >
                                <i className="pi pi-chart-pie text-red-500"></i>
                                Pie Chart
                            </button>
                            <button
                                onMouseDown={(e) => { e.preventDefault(); handleGraphInsert('area'); }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-gray-700 transition-colors w-full text-left"
                            >
                                <i className="pi pi-image text-purple-500"></i>
                                Area Chart
                            </button>
                        </div>
                    </DropdownPortal>
                </div>

                <div className="border-l border-gray-300 mx-1 h-5 hidden sm:block"></div>
                <button
                    onClick={toggleDictation}
                    className={`flex items-center gap-1 px-2 py-1 rounded transition-colors hidden xl:flex ${isListening ? 'bg-red-50 text-red-600' : 'hover:bg-gray-100 text-gray-700'}`}
                    title={isListening ? 'Listening...' : 'Start Dictation'}
                >
                    <i className={`pi pi-microphone ${isListening ? 'animate-pulse text-red-600' : 'text-gray-500'}`}></i>
                    {isListening ? <span className="animate-pulse">Listening...</span> : "Dictation"}
                </button>
                <button
                    onClick={toggleDictation}
                    className={`flex items-center gap-1 px-2 py-1 rounded transition-colors shrink-0 xl:hidden ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-gray-100 text-gray-700'}`}
                    title="Voice to Text Dictation"
                >
                    <i className={`pi pi-microphone ${isListening ? 'animate-pulse text-red-600' : 'text-gray-500'}`}></i>
                </button>
            </div>

            {/* Advanced Actions */}
            <div className="flex items-center gap-1 ml-auto">
                <div className="flex items-center gap-1 px-3 py-1 mr-1 border-r border-gray-200 text-gray-600 hidden md:flex" title="Word Count">
                    <i className="pi pi-book text-gray-400"></i>
                    <span className="font-bold">{wordCount}</span>
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-400">words</span>
                </div>

                <div className="relative border-r border-gray-200 pr-1 mr-1" ref={emojiDropdownRef}>
                    <button
                        onClick={() => setEmojiDropdownOpen(!emojiDropdownOpen)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${emojiDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'}`}
                        title="Insert Emoji"
                    >
                        <i className="pi pi-face-smile text-lg text-yellow-500"></i>
                        <span className="hidden lg:inline font-medium">Emoji</span>
                    </button>
                    <DropdownPortal isOpen={emojiDropdownOpen} anchorRef={emojiDropdownRef}>
                        <div className="w-72 max-h-64 overflow-y-auto bg-white border border-gray-200 shadow-2xl rounded-lg p-2 grid grid-cols-8 gap-1 custom-scrollbar">
                            {EMOJIS.map((emoji, idx) => (
                                <button
                                    key={idx}
                                    onMouseDown={(e) => { e.preventDefault(); insertEmoji(emoji); }}
                                    className="text-xl hover:bg-gray-100 rounded p-1 transition-transform hover:scale-125 focus:outline-none flex justify-center items-center"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </DropdownPortal>
                </div>

                <button
                    onClick={handleExportPPT}
                    className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded font-semibold transition-colors border border-orange-200"
                    title="Export as PowerPoint"
                >
                    <i className="pi pi-file-export"></i>
                    <span className="hidden md:inline">PPT</span>
                </button>

                <button
                    onClick={handlePrint}
                    className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-gray-700 transition-colors"
                    title="Print Document"
                >
                    <i className="pi pi-print"></i>
                </button>

                <button
                    onClick={handleShare}
                    className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-gray-700 transition-colors border-r border-gray-200 pr-3 mr-1"
                    title="Download"
                >
                    <i className="pi pi-download"></i>
                </button>
                <button
                    onClick={() => setNotesModalOpen(true)}
                    className="flex items-center gap-1 px-2 py-1 hover:bg-amber-100 rounded text-amber-700 transition-colors ml-1 font-medium"
                    title="Document Notes"
                >
                    <i className="pi pi-clipboard"></i>
                    <span className="hidden sm:inline">Notes</span>
                </button>
            </div>

            {/* Graph Data Prompt Modal */}
            {graphModal.isOpen && (
                <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
                    <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md flex flex-col transform transition-all scale-100 opacity-100">
                        <div className="px-5 py-4 bg-gray-100 border-b flex justify-between items-center bg-gradient-to-r from-gray-100 to-gray-50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <i className="pi pi-chart-bar text-blue-500 text-lg"></i>
                                {graphModal.type.charAt(0).toUpperCase() + graphModal.type.slice(1)} Graph Data
                            </h3>
                            <button onClick={() => setGraphModal({ isOpen: false, type: null })} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors focus:outline-none">
                                <i className="pi pi-times"></i>
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">X-Axis Labels (comma separated)</label>
                                <input type="text" value={xData} onChange={e => setXData(e.target.value)} placeholder="e.g. Jan, Feb, Mar, Apr" className="w-full border rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Y-Axis Values (comma separated)</label>
                                <input type="text" value={yData} onChange={e => setYData(e.target.value)} placeholder="e.g. 10, 25, 45, 80" className="w-full border rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                            <button onClick={() => setGraphModal({ isOpen: false, type: null })} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors focus:outline-none">Cancel</button>
                            <button onClick={submitGraph} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg shadow cursor-pointer transition-transform hover:scale-105 focus:outline-none">Generate</button>
                        </div>
                    </div>
                </div>
            )}

            <ScriptViewerModal
                isOpen={!!viewerScript}
                onClose={() => setViewerScript(null)}
                scriptData={viewerScript}
                onInsert={(glyph) => { insertCountry(glyph); setViewerScript(null); }}
            />

            <DocumentNotesModal
                isOpen={notesModalOpen}
                onClose={() => setNotesModalOpen(false)}
                notes={notes}
                setNotes={setNotes}
            />

            <CChartModal
                visible={cChartModalOpen}
                onHide={() => setCChartModalOpen(false)}
                onInsert={handleCChartInsert}
            />

            <LionChartModal
                visible={lionChartModalOpen}
                onHide={() => {
                    setLionChartModalOpen(false);
                    if (quillRef.current) {
                        const editor = quillRef.current.getEditor();
                        // Anchor safety shifting ensures typing works without erasing injected elements
                        let newPos = (cChartCursorRef.current !== null ? cChartCursorRef.current : editor.getLength()) + 1;
                        editor.setSelection(newPos);
                    }
                    cChartCursorRef.current = null;
                }}
                onUpdate={handleLionChartLiveUpdate}
            />

            <style>{`
                #${toolbarId} .ql-formats { margin-right: 0; }
                #${toolbarId} button { padding: 3px 5px !important; width: auto !important; height: auto !important; }
                #${toolbarId} .ql-picker.ql-font { width: 110px !important; }
                #${toolbarId} .ql-picker.ql-size { width: 55px !important; }
                #${toolbarId} .ql-picker.ql-color, #${toolbarId} .ql-picker.ql-background { width: 28px !important; }

                .ql-font-bungee-shade { font-family: 'Bungee Shade', cursive; letter-spacing: 1px; }
                .ql-font-nabla { font-family: 'Nabla', system-ui; }
                .ql-font-rampart-one { font-family: 'Rampart One', cursive; }
                .ql-font-bungee { font-family: 'Bungee', cursive; }
                .ql-font-londrina { font-family: 'Londrina Solid', cursive; }
                .ql-font-alfa-slab-one { font-family: 'Alfa Slab One', serif; font-weight: 400; }
                .ql-font-rubik { font-family: 'Rubik', sans-serif; font-weight: 900; }
                .ql-font-anton { font-family: 'Anton', sans-serif; }

                /* Also preview them in the toolbar dropdown */
                .ql-picker.ql-font .ql-picker-item[data-value="bungee-shade"]::before,
                .ql-picker.ql-font .ql-picker-label[data-value="bungee-shade"]::before { content: 'Bungee Shade'; font-family: 'Bungee Shade', cursive; }
                
                .ql-picker.ql-font .ql-picker-item[data-value="nabla"]::before,
                .ql-picker.ql-font .ql-picker-label[data-value="nabla"]::before { content: 'Nabla'; font-family: 'Nabla', system-ui; }
                
                .ql-picker.ql-font .ql-picker-item[data-value="rampart-one"]::before,
                .ql-picker.ql-font .ql-picker-label[data-value="rampart-one"]::before { content: 'Rampart One'; font-family: 'Rampart One', cursive; }
                
                .ql-picker.ql-font .ql-picker-item[data-value="bungee"]::before,
                .ql-picker.ql-font .ql-picker-label[data-value="bungee"]::before { content: 'Bungee'; font-family: 'Bungee', cursive; }
                
                .ql-picker.ql-font .ql-picker-item[data-value="londrina"]::before,
                .ql-picker.ql-font .ql-picker-label[data-value="londrina"]::before { content: 'Londrina Solid'; font-family: 'Londrina Solid', cursive; font-weight: 900; }
                
                .ql-picker.ql-font .ql-picker-item[data-value="alfa-slab-one"]::before,
                .ql-picker.ql-font .ql-picker-label[data-value="alfa-slab-one"]::before { content: 'Alfa Slab One'; font-family: 'Alfa Slab One', serif; }
                
                .ql-picker.ql-font .ql-picker-item[data-value="rubik"]::before,
                .ql-picker.ql-font .ql-picker-label[data-value="rubik"]::before { content: 'Rubik (Black)'; font-family: 'Rubik', sans-serif; font-weight: 900; }
                
                .ql-picker.ql-font .ql-picker-item[data-value="anton"]::before,
                .ql-picker.ql-font .ql-picker-label[data-value="anton"]::before { content: 'Anton'; font-family: 'Anton', sans-serif; }

                /* Style Numerical Size overrides to render labels instead of generic sizes natively if requested */
                .ql-picker.ql-size .ql-picker-item[data-value]::before {
                    content: attr(data-value) !important;
                }
                .ql-picker.ql-size .ql-picker-label[data-value]::before {
                    content: attr(data-value) !important;
                }
            `}</style>
        </div>
    );
};

export default WordToolbar;
