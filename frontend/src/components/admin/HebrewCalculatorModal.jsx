import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './HebrewCalculatorModal.css';

const hebrewLetters = [
    { letter: "א", name: "Aleph", value: 1, color: "red" },
    { letter: "ב", name: "Bet", value: 2, color: "orange" },
    { letter: "ג", name: "Gimel", value: 3, color: "yellow" },
    { letter: "ד", name: "Dalet", value: 4, color: "green" },
    { letter: "ה", name: "He", value: 5, color: "teal" },

    { letter: "ו", name: "Vav", value: 6, color: "blue" },
    { letter: "ז", name: "Zayin", value: 7, color: "blue" },
    { letter: "ח", name: "Chet", value: 8, color: "purple" },
    { letter: "ט", name: "Tet", value: 9, color: "pink" },
    { letter: "י", name: "Yod", value: 10, color: "magenta" },

    { letter: "כ", name: "Kaf", value: 20, color: "gold" },
    { letter: "ל", name: "Lamed", value: 30, color: "green" },
    { letter: "מ", name: "Mem", value: 40, color: "cyan" },
    { letter: "נ", name: "Nun", value: 50, color: "blue" },
    { letter: "ס", name: "Samekh", value: 60, color: "purple" },

    { letter: "ע", name: "Ayin", value: 70, color: "pink" },
    { letter: "פ", name: "Pe", value: 80, color: "orange" },
    { letter: "צ", name: "Tsadi", value: 90, color: "gold" },
    { letter: "ק", name: "Qof", value: 100, color: "green" },
    { letter: "ר", name: "Resh", value: 200, color: "teal" },

    { letter: "ש", name: "Shin", value: 300, color: "purple" },
    { letter: "ת", name: "Tav", value: 400, color: "indigo" },

    // Final forms at the end, marked to hide their index
    { letter: "ך", name: "Final Kaf", value: 20, color: "gold", isFinal: true },
    { letter: "ם", name: "Final Mem", value: 40, color: "cyan", isFinal: true },
    { letter: "ן", name: "Final Nun", value: 50, color: "blue", isFinal: true },
    { letter: "ף", name: "Final Pe", value: 80, color: "orange", isFinal: true },
    { letter: "ץ", name: "Final Tsadi", value: 90, color: "gold", isFinal: true },
];

const meanings = {
    1: "Unity",
    3: "Divine completeness",
    7: "Perfection",
    13: "Love",
    18: "Life",
    26: "Sacred Name",
    40: "Transformation",
    73: "Wisdom (Chokmah)",
};

const HebrewCalculatorModal = ({ isOpen, onClose }) => {
    const [input, setInput] = useState("");
    const [history, setHistory] = useState([]);
    const [calculatedResult, setCalculatedResult] = useState(null);
    const [showLetterValues, setShowLetterValues] = useState(true);
    const [activeTab, setActiveTab] = useState("Calculator");
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const modalRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !modalRef.current) return;
        const stopNative = (e) => {
            e.stopPropagation();
            // We do not prevent default here, so inputs can get focus natively!
        };
        const el = modalRef.current;
        el.addEventListener('mousedown', stopNative, true);
        el.addEventListener('touchstart', stopNative, true);
        return () => {
            el.removeEventListener('mousedown', stopNative, true);
            el.removeEventListener('touchstart', stopNative, true);
        };
    }, [isOpen, activeTab]);

    const [settings, setSettings] = useState({
        logoUrl: "",
        title: "HEBREW GEMATRIA CALCULATOR",
        subtitle: "Hebrew Alphabet Numeric Values Calculator",
        wisdomText: "WISDOM IN NUMBERS",
        wisdomSubtext: "Numbers Have Meaning"
    });

    const letterMap = useMemo(() => {
        const map = {};
        hebrewLetters.forEach((l) => {
            map[l.letter] = l;
        });
        return map;
    }, []);

    if (!isOpen) return null;

    const handleCalculate = () => {
        if (!input) {
            setCalculatedResult(null);
            return;
        }

        const breakdown = input
            .split("")
            .map((char) => letterMap[char])
            .filter(Boolean);

        const total = breakdown.reduce((sum, item) => sum + item.value, 0);

        const digitalRoot = (num) => {
            while (num > 9) {
                num = num
                    .toString()
                    .split("")
                    .reduce((a, b) => a + Number(b), 0);
            }
            return num;
        };

        const reduced = digitalRoot(total);

        setCalculatedResult({
            breakdown,
            total,
            reduced
        });
    };

    const handleLetterClick = (letter) => {
        setInput((prev) => prev + letter);
    };

    const handleClear = () => {
        setInput("");
        setCalculatedResult(null);
    };

    const handleCopy = async () => {
        if (!calculatedResult) return;
        await navigator.clipboard.writeText(
            `Word: ${input} | Total: ${calculatedResult.total}`
        );
        alert("Copied to clipboard");
    };

    const handleSave = () => {
        if (!input || !calculatedResult) return;
        const item = {
            word: input,
            total: calculatedResult.total,
            reduced: calculatedResult.reduced,
            breakdown: calculatedResult.breakdown,
            time: new Date().toLocaleString(),
        };

        setHistory((prev) => [item, ...prev]);
        alert("Saved to History");
    };

    const toggleVoiceInput = () => {
        if (isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech Recognition not supported");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "he-IL";
        recognition.continuous = true;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            
            const voiceMap = {
                "1": "א", "2": "ב", "3": "ג", "4": "ד", "5": "ה",
                "6": "ו", "7": "ז", "8": "ח", "9": "ט", "10": "י",
                "11": "כ", "12": "ל", "13": "מ", "14": "נ", "15": "ס",
                "16": "ע", "17": "פ", "18": "צ", "19": "ק", "20": "ר",
                "21": "ש", "22": "ת",
                "one": "א", "two": "ב", "three": "ג", "four": "ד", "five": "ה",
                "six": "ו", "seven": "ז", "eight": "ח", "nine": "ט", "ten": "י",
                "eleven": "כ", "twelve": "ל", "thirteen": "מ", "fourteen": "נ", "fifteen": "ס",
                "sixteen": "ע", "seventeen": "פ", "eighteen": "צ", "nineteen": "ק", "twenty": "ר",
                "twenty-one": "ש", "twenty-two": "ת",
                "aleph": "א", "bet": "ב", "gimel": "ג", "dalet": "ד", "he": "ה",
                "vav": "ו", "zayin": "ז", "chet": "ח", "tet": "ט", "yod": "י",
                "kaf": "כ", "lamed": "ל", "mem": "מ", "nun": "נ", "samekh": "ס",
                "ayin": "ע", "pe": "פ", "tsadi": "צ", "qof": "ק", "resh": "ר",
                "shin": "ש", "tav": "ת",
                "אחת": "א", "שתיים": "ב", "שלוש": "ג", "ארבע": "ד", "חמש": "ה",
                "שש": "ו", "שבע": "ז", "שמונה": "ח", "תשע": "ט", "עשר": "י",
                "אחת עשרה": "כ", "שתים עשרה": "ל", "שלוש עשרה": "מ", "ארבע עשרה": "נ", "חמש עשרה": "ס",
                "שש עשרה": "ע", "שבע עשרה": "פ", "שמונה עשרה": "צ", "תשע עשרה": "ק", "עשרים": "ר",
                "עשרים ואחת": "ש", "עשרים ושתיים": "ת"
            };

            let lowerTranscript = transcript.toLowerCase().replace(/[.,;·]/g, '');
            lowerTranscript = lowerTranscript.replace(/twenty one/g, "twenty-one");
            lowerTranscript = lowerTranscript.replace(/twenty two/g, "twenty-two");
            lowerTranscript = lowerTranscript.replace(/אחת עשרה/g, "אחת_עשרה");
            lowerTranscript = lowerTranscript.replace(/שתים עשרה/g, "שתים_עשרה");
            lowerTranscript = lowerTranscript.replace(/שלוש עשרה/g, "שלוש_עשרה");
            lowerTranscript = lowerTranscript.replace(/ארבע עשרה/g, "ארבע_עשרה");
            lowerTranscript = lowerTranscript.replace(/חמש עשרה/g, "חמש_עשרה");
            lowerTranscript = lowerTranscript.replace(/שש עשרה/g, "שש_עשרה");
            lowerTranscript = lowerTranscript.replace(/שבע עשרה/g, "שבע_עשרה");
            lowerTranscript = lowerTranscript.replace(/שמונה עשרה/g, "שמונה_עשרה");
            lowerTranscript = lowerTranscript.replace(/תשע עשרה/g, "תשע_עשרה");
            lowerTranscript = lowerTranscript.replace(/עשרים ואחת/g, "עשרים_ואחת");
            lowerTranscript = lowerTranscript.replace(/עשרים ושתיים/g, "עשרים_ושתיים");
            
            // Re-map the combined Hebrew phrases correctly in the dictionary map
            voiceMap["אחת_עשרה"] = "כ";
            voiceMap["שתים_עשרה"] = "ל";
            voiceMap["שלוש_עשרה"] = "מ";
            voiceMap["ארבע_עשרה"] = "נ";
            voiceMap["חמש_עשרה"] = "ס";
            voiceMap["שש_עשרה"] = "ע";
            voiceMap["שבע_עשרה"] = "פ";
            voiceMap["שמונה_עשרה"] = "צ";
            voiceMap["תשע_עשרה"] = "ק";
            voiceMap["עשרים_ואחת"] = "ש";
            voiceMap["עשרים_ושתיים"] = "ת";

            const processed = lowerTranscript.split(/\s+/).map(word => {
                if (voiceMap[word]) return voiceMap[word];
                if (/^\d+$/.test(word)) {
                    return word.split('').map(digit => voiceMap[digit] || digit).join('');
                }
                return word;
            }).join("");

            setInput((prev) => prev + processed);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const handleHistoryClick = (item) => {
        setInput(item.word);
        setCalculatedResult({
            total: item.total,
            reduced: item.reduced,
            breakdown: item.breakdown,
        });
        setActiveTab("Calculator");
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setSettings({...settings, logoUrl: reader.result});
        };
        reader.readAsDataURL(file);
    };

    const res = calculatedResult || { breakdown: [], total: 0, reduced: 0 };

    return createPortal(
        <div 
            ref={modalRef}
            className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 py-8 backdrop-blur-md print:hidden"
        >
            <div className="bg-[#03091b] border border-gray-700 shadow-[0_0_40px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden w-full max-w-7xl h-[95vh] max-h-full flex flex-col text-gray-100 transform transition-all scale-100 opacity-100 relative hebrew-calculator-modal">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

                {/* Header with Close Button */}
                <div className="px-6 py-2 border-b border-gray-800/80 flex justify-between items-center bg-[#010b24] shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                {settings.logoUrl ? (
                                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-md drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]" />
                                ) : (
                                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]">
                                        <polygon points="50,10 85,75 15,75" fill="none" stroke="#fbbf24" strokeWidth="6" strokeLinejoin="round" />
                                        <polygon points="50,90 85,25 15,25" fill="none" stroke="#fbbf24" strokeWidth="6" strokeLinejoin="round" />
                                        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="#fbbf24" fontSize="26" fontWeight="bold">ה</text>
                                    </svg>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-lg font-bold tracking-wider text-[#fbbf24] drop-shadow-md m-0">{settings.title}</h2>
                                <p className="text-xs text-gray-400 mt-0.5 tracking-wide m-0">{settings.subtitle}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 ml-6">
                            <button onClick={() => setActiveTab("Calculator")} className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-transform hover:scale-105 ${activeTab === "Calculator" ? "bg-gradient-to-b from-[#5b21b6] to-[#312e81] border border-[#7c3aed] text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]" : "bg-[#0f172a] border border-[#334155] text-gray-300 hover:bg-[#1e293b] hover:text-white"}`}>
                                <i className="pi pi-calculator text-xl mb-0.5"></i>
                                <span className="text-[9px] font-medium tracking-wide">Calculator</span>
                            </button>
                            <button onClick={() => setActiveTab("History")} className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-transform hover:scale-105 ${activeTab === "History" ? "bg-gradient-to-b from-[#5b21b6] to-[#312e81] border border-[#7c3aed] text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]" : "bg-[#0f172a] border border-[#334155] text-gray-300 hover:bg-[#1e293b] hover:text-white"}`}>
                                <i className="pi pi-clock text-xl mb-0.5"></i>
                                <span className="text-[9px] font-medium tracking-wide">History</span>
                            </button>
                            <button className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-[#0f172a] border border-[#334155] text-gray-300 transition-colors hover:bg-[#1e293b] hover:text-white">
                                <i className="pi pi-chart-bar text-xl mb-0.5"></i>
                                <span className="text-[9px] font-medium tracking-wide">Chart</span>
                            </button>
                            <button onClick={() => setActiveTab("Information")} className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-transform hover:scale-105 ${activeTab === "Information" ? "bg-gradient-to-b from-[#5b21b6] to-[#312e81] border border-[#7c3aed] text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]" : "bg-[#0f172a] border border-[#334155] text-gray-300 hover:bg-[#1e293b] hover:text-white"}`}>
                                <i className="pi pi-info-circle text-xl mb-0.5"></i>
                                <span className="text-[9px] font-medium tracking-wide">Information</span>
                            </button>
                            <button onClick={() => setActiveTab("Settings")} className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-transform hover:scale-105 ${activeTab === "Settings" ? "bg-gradient-to-b from-[#5b21b6] to-[#312e81] border border-[#7c3aed] text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]" : "bg-[#0f172a] border border-[#334155] text-gray-300 hover:bg-[#1e293b] hover:text-white"}`}>
                                <i className="pi pi-cog text-xl mb-0.5"></i>
                                <span className="text-[9px] font-medium tracking-wide">Settings</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center justify-center border border-[#00e1ff]/40 rounded-xl px-4 py-1.5 bg-gradient-to-r from-[#020617] to-[#082f49] shadow-[inset_0_0_15px_rgba(0,225,255,0.1)] min-w-[160px] whitespace-nowrap">
                            <h3 className="text-[#00e1ff] font-bold text-sm tracking-widest drop-shadow-[0_0_8px_rgba(0,225,255,0.5)] m-0">{settings.wisdomText}</h3>
                            <p className="text-gray-300 text-[10px] mt-0.5 tracking-wide m-0">{settings.wisdomSubtext}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-red-400 bg-gray-800/50 hover:bg-gray-800 p-3 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center justify-center" title="Close Calculator">
                            <i className="pi pi-times text-xl"></i>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar container" style={{display: 'flex', gap: '20px'}}>
                    {/* LEFT PANEL */}
                    <div className="left-panel flex flex-col h-full" style={{width: '45%'}}>
                        <div className="bg-[#0f142b] border border-[#1e293b] rounded-[16px] p-4 flex-1 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col">
                            <div className="relative mb-3 flex items-center justify-center">
                                <label className="absolute left-0 flex items-center gap-1.5 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={showLetterValues} 
                                        onChange={() => setShowLetterValues(!showLetterValues)}
                                        className="h-3 w-3 accent-[#00ffcc] cursor-pointer"
                                    />
                                    <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold group-hover:text-[#00ffcc] transition-colors">Letter Value</span>
                                </label>
                                <div className="text-[13px] font-bold tracking-wider uppercase text-gray-300 drop-shadow-md">Hebrew Alphabet Table (22 Letters)</div>
                            </div>
                            <div className="letters-grid flex-1">
                                {hebrewLetters.map((item, index) => (
                                    <React.Fragment key={item.letter}>
                                        <div
                                            className={`letter-card btn-3d ${item.color}`}
                                            onClick={() => handleLetterClick(item.letter)}
                                        >
                                            {!item.isFinal && <div className="absolute top-1 left-2 text-[10px] text-white font-bold opacity-80">{index + 1}</div>}
                                            <div className="letter">{item.letter}</div>
                                            <div className="name">{item.name}</div>
                                            <div className={`value ${showLetterValues ? '' : 'invisible'}`}>{item.value}</div>
                                        </div>
                                        {/* Force line break after the 22nd standard letter (Tav) */}
                                        {item.letter === "ת" && <div className="w-full h-0 m-0 p-0 border-0"></div>}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="right-panel flex flex-col gap-3 h-full px-4" style={{width: '55%'}}>
                        {activeTab === "Calculator" && (
                            <>
                                {/* INPUT SECTION */}
                                <div className="bg-[#0f142b] border border-[#1e293b] rounded-[12px] p-3 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                                    <div className="text-center text-[11px] font-bold tracking-wider uppercase text-[#94a3b8] mb-2 drop-shadow-md">Enter Hebrew Word or Phrase</div>
                                    <div className="flex gap-3 items-center justify-center">
                                        <div className="relative w-full">
                                            <input
                                                type="text"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                placeholder=""
                                                dir="rtl"
                                                className="w-full text-3xl font-bold text-center text-white"
                                                style={{ padding: '8px 40px 8px 12px', background: '#020617', border: '1px solid #1e293b', borderRadius: '10px', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.8)' }}
                                            />
                                            {input && (
                                                <button 
                                                    onClick={() => setInput("")}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                                >
                                                    <i className="pi pi-times-circle text-lg"></i>
                                                </button>
                                            )}
                                        </div>
                                        <button 
                                            onClick={handleCalculate}
                                            className="btn-3d flex items-center gap-2 justify-center min-w-[140px]"
                                            style={{ 
                                                background: 'linear-gradient(145deg, #42007d, #b400ff)', 
                                                padding: '12px 20px', 
                                                borderRadius: '10px',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: '12px',
                                            }}
                                        >
                                            <i className="pi pi-calculator text-lg"></i> CALCULATE
                                        </button>
                                    </div>
                                </div>

                                        {/* LETTER BREAKDOWN */}
                                        <div className="bg-[#0f142b] border border-[#1e293b] rounded-[12px] p-2 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                                            <div className="text-center text-[10px] font-bold tracking-wider uppercase text-[#94a3b8] mb-1 drop-shadow-md">Letter Breakdown</div>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {res.breakdown.length === 0 ? (
                                                    <span className="text-gray-600 text-xs py-2 italic font-medium tracking-wide">Enter a word to see its breakdown</span>
                                                ) : (
                                                    res.breakdown.map((item, index) => (
                                                        <div
                                                            key={index}
                                                            className={`letter-card btn-3d ${item.color} flex flex-col items-center justify-center`}
                                                            style={{minWidth: '50px', padding: '2px', borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.5)'}}
                                                        >
                                                            <div className="text-xl font-bold">{item.letter}</div>
                                                            <div className="text-[8px] mt-0.5 opacity-90">{item.name}</div>
                                                            <div className="text-xs font-bold mt-0">{item.value}</div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        {/* TOTAL AND CALCULATION BREAKDOWN */}
                                        <div className="flex gap-3">
                                            {/* TOTAL */}
                                            <div className="flex-1 bg-[#0f142b] border border-[#1e293b] rounded-[12px] p-2 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col">
                                                <div className="text-center text-[10px] font-bold tracking-wider uppercase text-[#94a3b8] mb-1 drop-shadow-md">Total Gematria Value</div>
                                                <div className="flex-1 bg-[#020617] rounded-[10px] border border-[#1e293b] flex items-center justify-center py-2 shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)]">
                                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#00ffcc', textShadow: '0 0 20px rgba(0, 255, 204, 0.5)' }}>
                                                        {res.total}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* BREAKDOWN */}
                                            <div className="flex-[1.2] bg-[#0f142b] border border-[#1e293b] rounded-[12px] p-2 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col">
                                                <div className="text-center text-[10px] font-bold tracking-wider uppercase text-[#94a3b8] mb-1 drop-shadow-md">Calculation Breakdown</div>
                                                <div className="flex-1 bg-[#020617] rounded-[10px] border border-[#1e293b] flex items-center justify-center p-2 shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] gap-2">
                                                    <div style={{ fontSize: '16px', color: '#fbbf24', fontWeight: 'bold' }}>
                                                        {res.breakdown.map((b) => b.value).join(" + ") || "0"}
                                                    </div>
                                                    <div style={{ fontSize: '18px', color: '#00d65a', fontWeight: 'bold' }}>
                                                        = {res.total}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* BUTTON ROW */}
                                        <div className="flex gap-2 justify-between">
                                            <button onClick={handleCopy} className="btn-3d flex-1 flex items-center justify-center gap-2 py-1.5 rounded-[8px] text-[10px] font-bold text-white" style={{background: 'linear-gradient(145deg, #42007d, #b400ff)'}}>
                                                <i className="pi pi-copy text-xs"></i> COPY RESULT
                                            </button>
                                            <button onClick={handleSave} className="btn-3d flex-1 flex items-center justify-center gap-2 py-1.5 rounded-[8px] text-[10px] font-bold text-white" style={{background: 'linear-gradient(145deg, #005c28, #00d65a)'}}>
                                                <i className="pi pi-save text-xs"></i> SAVE TO HISTORY
                                            </button>
                                            <button onClick={toggleVoiceInput} className="btn-3d flex-1 flex items-center justify-center gap-2 py-1.5 rounded-[8px] text-[10px] font-bold text-white transition-all duration-300" style={{background: isListening ? 'linear-gradient(145deg, #ef4444, #991b1b)' : 'linear-gradient(145deg, #003a7a, #0077ff)', boxShadow: isListening ? '0 0 15px rgba(239, 68, 68, 0.6)' : ''}}>
                                                <i className={`pi ${isListening ? 'pi-stop-circle animate-pulse' : 'pi-microphone'} text-xs`}></i> {isListening ? 'STOP VOICE' : 'VOICE INPUT'}
                                            </button>
                                            <button onClick={handleClear} className="btn-3d flex-1 flex items-center justify-center gap-2 py-1.5 rounded-[8px] text-[10px] font-bold text-white" style={{background: 'linear-gradient(145deg, #7a0000, #ff2d2d)'}}>
                                                <i className="pi pi-trash text-xs"></i> CLEAR
                                            </button>
                                        </div>

                                        {/* BOTTOM INFO ROW */}
                                        <div className="flex gap-3">
                                            <div className="flex-[1.2] bg-[#0f142b] border border-[#1e293b] rounded-[12px] p-3 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col">
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2">Reduced Value (Digital Root)</div>
                                                <div className="flex-1 bg-[#020617] rounded-[10px] border border-[#1e293b] flex items-center justify-center p-2 shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)]">
                                                    <div className="text-white font-bold text-sm tracking-widest flex items-center gap-2">
                                                        <span>{res.total.toString().split("").join("+")} = {res.total.toString().split("").reduce((a, b) => a + Number(b), 0)} &rarr;</span>
                                                        <span className="text-cyan-400 text-xl">{res.reduced}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 bg-[#0f142b] border border-[#1e293b] rounded-[12px] p-3 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col">
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2">Hebrew Word Information</div>
                                                <div className="flex-1 bg-[#020617] rounded-[10px] border border-[#1e293b] p-3 shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] flex flex-col justify-center gap-1">
                                                    <div className="flex justify-between text-[11px] text-gray-300"><span>Letters:</span> <span className="font-bold">{res.breakdown.length}</span></div>
                                                    <div className="flex justify-between text-[11px] text-gray-300"><span>Total Value:</span> <span className="text-[#00ffcc] font-bold">{res.total}</span></div>
                                                    <div className="flex justify-between text-[11px] text-gray-300"><span>Reduced Value:</span> <span className="text-white font-bold">{res.reduced}</span></div>
                                                </div>
                                            </div>

                                            <div className="flex-1 bg-[#0f142b] border border-[#1e293b] rounded-[12px] p-3 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col">
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2">Meaning (Optional)</div>
                                                <div className="flex-1 bg-[#020617] rounded-[10px] border border-[#1e293b] flex items-center justify-between p-3 shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)]">
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-bold text-sm">{meanings[res.total] || "Unknown"}</span>
                                                        {meanings[res.total] && <span className="text-[#00ffcc] text-[10px]">(Chokmah)</span>}
                                                    </div>
                                                    <i className="pi pi-lightbulb text-yellow-500 text-2xl" style={{ filter: 'drop-shadow(0 0 10px rgba(234, 179, 8, 0.5))' }}></i>
                                                </div>
                                            </div>
                                         </div>
                            </>
                        )}
                        {activeTab === "History" && (
                            <div className="bg-[#0f142b] border border-[#1e293b] rounded-[12px] p-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col h-full">
                                <div className="text-center text-[13px] font-bold tracking-wider uppercase text-[#94a3b8] mb-4 drop-shadow-md">Saved History</div>
                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2">
                                    {history.length === 0 ? (
                                        <div className="text-center text-gray-500 mt-10 text-sm">No history saved yet.</div>
                                    ) : (
                                        history.map((item, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => handleHistoryClick(item)}
                                                className="bg-[#020617] border border-[#1e293b] rounded-[10px] p-3 flex items-center justify-between cursor-pointer hover:bg-[#1e293b] transition-colors"
                                            >
                                                <div className="flex flex-col">
                                                    <div className="text-[#fbbf24] font-bold text-lg">{item.word}</div>
                                                    <div className="text-[10px] text-gray-500">{item.time}</div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-center">
                                                        <div className="text-[9px] text-gray-400 uppercase">Total</div>
                                                        <div className="text-[#00ffcc] font-bold text-lg">{item.total}</div>
                                                    </div>
                                                    <i className="pi pi-chevron-right text-gray-600"></i>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === "Information" && (
                            <InformationTab storageKey="hebrew_calculator_info" />
                        )}
                        {activeTab === "Settings" && (
                            <div className="bg-[#0f142b] border border-[#1e293b] rounded-[12px] p-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col h-full overflow-y-auto custom-scrollbar">
                                <div className="text-center text-[13px] font-bold tracking-wider uppercase text-[#94a3b8] mb-4 drop-shadow-md">Calculator Settings</div>
                                
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Logo Image</label>
                                        <div className="flex items-center gap-4 mt-1">
                                            <label className="cursor-pointer bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                                                <i className="pi pi-upload mr-2"></i> UPLOAD LOGO
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                            {settings.logoUrl && (
                                                <button 
                                                    onClick={() => setSettings({...settings, logoUrl: ""})} 
                                                    className="text-red-400 hover:text-red-300 text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-900/30 transition-colors"
                                                >
                                                    <i className="pi pi-trash mr-1"></i> REMOVE
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">App Title</label>
                                        <input 
                                            type="text" 
                                            value={settings.title} 
                                            onChange={(e) => setSettings({...settings, title: e.target.value})} 
                                            className="bg-[#020617] border border-[#1e293b] rounded-lg p-2 text-white text-sm focus:outline-none focus:border-[#7c3aed]"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">App Subtitle</label>
                                        <input 
                                            type="text" 
                                            value={settings.subtitle} 
                                            onChange={(e) => setSettings({...settings, subtitle: e.target.value})} 
                                            className="bg-[#020617] border border-[#1e293b] rounded-lg p-2 text-white text-sm focus:outline-none focus:border-[#7c3aed]"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Right Side Heading</label>
                                        <input 
                                            type="text" 
                                            value={settings.wisdomText} 
                                            onChange={(e) => setSettings({...settings, wisdomText: e.target.value})} 
                                            className="bg-[#020617] border border-[#1e293b] rounded-lg p-2 text-white text-sm focus:outline-none focus:border-[#7c3aed]"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Right Side Subheading</label>
                                        <input 
                                            type="text" 
                                            value={settings.wisdomSubtext} 
                                            onChange={(e) => setSettings({...settings, wisdomSubtext: e.target.value})} 
                                            className="bg-[#020617] border border-[#1e293b] rounded-lg p-2 text-white text-sm focus:outline-none focus:border-[#7c3aed]"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// Extracted Information Tab Component for Reuse
const InformationTab = ({ storageKey }) => {
    const [infoList, setInfoList] = useState([]);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try { setInfoList(JSON.parse(stored)); } catch(e){}
        }
    }, [storageKey]);

    const saveToStorage = (list) => {
        setInfoList(list);
        localStorage.setItem(storageKey, JSON.stringify(list));
    };

    const handleSave = () => {
        if (!title.trim() || !content.trim()) return;
        
        if (editingId) {
            saveToStorage(infoList.map(info => 
                info.id === editingId ? { ...info, title, content, updatedAt: new Date().toLocaleString() } : info
            ));
            setEditingId(null);
        } else {
            saveToStorage([...infoList, { 
                id: Date.now().toString(), 
                title, 
                content, 
                createdAt: new Date().toLocaleString() 
            }]);
        }
        setTitle("");
        setContent("");
    };

    const handleEdit = (info) => {
        setEditingId(info.id);
        setTitle(info.title);
        setContent(info.content);
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this information?")) {
            saveToStorage(infoList.filter(info => info.id !== id));
            if (editingId === id) {
                setEditingId(null);
                setTitle("");
                setContent("");
            }
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setTitle("");
        setContent("");
    };

    return (
        <div className="bg-[#0f142b] border border-[#1e293b] rounded-[12px] p-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col h-full overflow-hidden">
            <div className="text-center text-[13px] font-bold tracking-wider uppercase text-[#94a3b8] mb-4 drop-shadow-md">Information Management</div>
            
            {/* Form Section */}
            <div className="bg-[#020617] border border-[#1e293b] p-3 rounded-[10px] mb-4 flex flex-col gap-2 shrink-0">
                <input 
                    type="text" 
                    placeholder="Title" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-[#0f172a] border border-[#334155] rounded text-white px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 w-full"
                />
                <textarea 
                    placeholder="Content details..." 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="bg-[#0f172a] border border-[#334155] rounded text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full resize-none h-[80px]"
                ></textarea>
                <div className="flex gap-2 justify-end mt-1">
                    {editingId && (
                        <button onClick={handleCancel} className="text-xs text-gray-400 hover:text-white px-3 py-1.5 transition-colors">Cancel</button>
                    )}
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-1.5 rounded transition-colors shadow-lg">
                        {editingId ? "Update Information" : "Add Information"}
                    </button>
                </div>
            </div>

            {/* List Section */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2">
                {infoList.length === 0 ? (
                    <div className="text-center text-gray-500 mt-4 text-sm italic">No information available. Add some above.</div>
                ) : (
                    infoList.map(info => (
                        <div key={info.id} className="bg-[#020617] border border-[#1e293b] rounded-[10px] p-3 flex flex-col gap-2 group relative">
                            <div className="flex justify-between items-start">
                                <h4 className="text-[#00ffcc] font-bold text-sm">{info.title}</h4>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(info)} className="text-blue-400 hover:text-blue-300 p-1" title="Edit"><i className="pi pi-pencil text-xs"></i></button>
                                    <button onClick={() => handleDelete(info.id)} className="text-red-400 hover:text-red-300 p-1" title="Delete"><i className="pi pi-trash text-xs"></i></button>
                                </div>
                            </div>
                            <p className="text-gray-300 text-xs whitespace-pre-wrap">{info.content}</p>
                            <span className="text-[9px] text-gray-600 mt-1 self-end">{info.updatedAt || info.createdAt}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HebrewCalculatorModal;
