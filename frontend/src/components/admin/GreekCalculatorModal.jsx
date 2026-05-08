import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./GreekCalculatorModal.css";

const greekLetters = [
    { upper: "Α", lower: "α", name: "Alpha", value: 1, color: "greek-blue" },
    { upper: "Β", lower: "β", name: "Beta", value: 2, color: "greek-blue" },
    { upper: "Γ", lower: "γ", name: "Gamma", value: 3, color: "greek-blue" },
    { upper: "Δ", lower: "δ", name: "Delta", value: 4, color: "greek-blue" },
    { upper: "Ε", lower: "ε", name: "Epsilon", value: 5, color: "greek-teal" },
    { upper: "Ζ", lower: "ζ", name: "Zeta", value: 7, color: "greek-teal" },
    { upper: "Η", lower: "η", name: "Eta", value: 8, color: "greek-green" },
    { upper: "Θ", lower: "θ", name: "Theta", value: 9, color: "greek-green" },
    { upper: "Ι", lower: "ι", name: "Iota", value: 10, color: "greek-green" },
    { upper: "Κ", lower: "κ", name: "Kappa", value: 20, color: "greek-gold" },
    { upper: "Λ", lower: "λ", name: "Lambda", value: 30, color: "greek-gold" },
    { upper: "Μ", lower: "μ", name: "Mu", value: 40, color: "greek-orange" },
    { upper: "Ν", lower: "ν", name: "Nu", value: 50, color: "greek-red" },
    { upper: "Ξ", lower: "ξ", name: "Xi", value: 60, color: "greek-orange" },
    { upper: "Ο", lower: "ο", name: "Omicron", value: 70, color: "greek-pink" },
    { upper: "Π", lower: "π", name: "Pi", value: 80, color: "greek-purple" },
    { upper: "Ρ", lower: "ρ", name: "Rho", value: 100, color: "greek-purple" },
    { upper: "Σ", lower: "σ", alt: "ς", name: "Sigma", value: 200, color: "greek-indigo" },
    { upper: "Τ", lower: "τ", name: "Tau", value: 300, color: "greek-blue" },
    { upper: "Υ", lower: "υ", name: "Upsilon", value: 400, color: "greek-blue" },
    { upper: "Φ", lower: "φ", name: "Phi", value: 500, color: "greek-teal" },
    { upper: "Χ", lower: "χ", name: "Chi", value: 600, color: "greek-green" },
    { upper: "Ψ", lower: "ψ", name: "Psi", value: 700, color: "greek-green" },
    { upper: "Ω", lower: "ω", name: "Omega", value: 800, color: "greek-gold" },
];

const popularExamples = [
    { word: "Ιησούς", meaning: "Jesus", value: 888 },
    { word: "χάρις", meaning: "Grace", value: 548 },
    { word: "εἰρήνη", meaning: "Peace", value: 373 },
];

const GreekCalculatorModal = ({ isOpen, onClose, onInsert }) => {
    const [input, setInput] = useState("");
    const [history, setHistory] = useState([]);
    const [calculatedResult, setCalculatedResult] = useState(null);
    const [showLetterValues, setShowLetterValues] = useState(true);
    const [activeTab, setActiveTab] = useState("Calculator");
    const modalRef = useRef(null);
    
    const [settings, setSettings] = useState({
        logoUrl: "",
        aboutImageUrl: "",
        title: "GREEK GEMATRIA CALCULATOR",
        subtitle: "Greek Alphabet Numeric Values Calculator",
        wisdomText: "WISDOM IN NUMBERS",
        wisdomSubtext: "Numbers Have Meaning"
    });

    useEffect(() => {
        if (!isOpen || !modalRef.current) return;
        const stopNative = (e) => {
            e.stopPropagation();
        };
        const el = modalRef.current;
        el.addEventListener('mousedown', stopNative, true);
        el.addEventListener('touchstart', stopNative, true);
        return () => {
            el.removeEventListener('mousedown', stopNative, true);
            el.removeEventListener('touchstart', stopNative, true);
        };
    }, [isOpen, activeTab]);

    const letterMap = useMemo(() => {
        const map = {};
        greekLetters.forEach((item) => {
            map[item.upper] = item;
            map[item.lower] = item;
            if (item.alt) map[item.alt] = item;
        });
        return map;
    }, []);

    const normalizeGreek = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (!isOpen) return null;

    const handleCalculate = () => {
        if (!input) {
            setCalculatedResult(null);
            return;
        }

        const breakdown = input.split("").map((char) => {
            const normalized = normalizeGreek(char);
            return letterMap[char] || letterMap[normalized];
        }).filter(Boolean);

        const total = breakdown.reduce((sum, item) => sum + item.value, 0);

        const digitalRoot = (num) => {
            while (num > 9) {
                num = num.toString().split("").reduce((a, b) => a + Number(b), 0);
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
        await navigator.clipboard.writeText(`Word: ${input} | Total: ${calculatedResult.total}`);
        alert("Copied to clipboard");
    };

    const handleSave = () => {
        if (!input || !calculatedResult) return;
        const item = { 
            word: input, 
            total: calculatedResult.total, 
            reduced: calculatedResult.reduced, 
            breakdown: calculatedResult.breakdown,
            time: new Date().toLocaleString() 
        };
        setHistory((prev) => [item, ...prev]);
        alert("Saved to History");
    };
    
    const handleInsert = () => {
        if (!input || !calculatedResult) return;
        if (onInsert) {
            onInsert(`${input} = ${calculatedResult.total}`);
            onClose();
        }
    };

    const handleVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice Recognition not supported");
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = "el-GR";
        recognition.start();
        recognition.onresult = (event) => setInput(event.results[0][0].transcript);
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

    const handleAboutImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setSettings({...settings, aboutImageUrl: reader.result});
        };
        reader.readAsDataURL(file);
    };

    return createPortal(
        <div ref={modalRef} className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md print:hidden">
            <div className="bg-[#03091b] border border-[#1d3c6b] shadow-[0_0_40px_rgba(0,140,255,0.4)] rounded-xl overflow-hidden w-full max-w-7xl h-[98vh] max-h-full flex flex-col text-white transform transition-all scale-100 opacity-100 relative greek-calculator-modal">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

                {/* Header with Close Button */}
                <div className="px-6 py-2 border-b border-[#1d3c6b] flex justify-between items-center bg-[#010b24] shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="relative w-14 h-14 flex items-center justify-center">
                                {settings.logoUrl ? (
                                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-md drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]" />
                                ) : (
                                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]">
                                        <path d="M22,80 C5,65 5,35 22,20" fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
                                        <path d="M78,80 C95,65 95,35 78,20" fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
                                        <path d="M15,65 L10,60 M12,50 L5,48 M12,40 L5,42 M15,25 L10,30" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
                                        <path d="M85,65 L90,60 M88,50 L95,48 M88,40 L95,42 M85,25 L90,30" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
                                        
                                        <circle cx="50" cy="50" r="32" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
                                        
                                        <rect x="30" y="68" width="40" height="3" fill="#fbbf24" />
                                        <rect x="25" y="71" width="50" height="4" fill="#fbbf24" />
                                        
                                        <rect x="30" y="48" width="5" height="20" fill="#fbbf24" />
                                        <rect x="42" y="48" width="5" height="20" fill="#fbbf24" />
                                        <rect x="53" y="48" width="5" height="20" fill="#fbbf24" />
                                        <rect x="65" y="48" width="5" height="20" fill="#fbbf24" />
                                        
                                        <rect x="25" y="45" width="50" height="3" fill="#fbbf24" />
                                        <polygon points="50,25 25,45 75,45" fill="#fbbf24" />
                                    </svg>
                                )}
                            </div>
                            <div className="flex flex-col ml-2">
                                <h2 className="text-[22px] font-serif font-bold tracking-wider text-[#fbbf24] drop-shadow-[0_0_8px_rgba(250,204,21,0.5)] m-0">{settings.title}</h2>
                                <p className="text-xs text-gray-300 mt-0.5 tracking-wide m-0">{settings.subtitle}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 ml-6">
                            <button onClick={() => setActiveTab("Calculator")} className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-transform hover:scale-105 ${activeTab === "Calculator" ? "bg-gradient-to-b from-[#1d4ed8] to-[#1e3a8a] border border-[#3b82f6] text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-[#0f172a] border border-[#334155] text-gray-300 hover:bg-[#1e293b] hover:text-white"}`}>
                                <i className="pi pi-calculator text-xl mb-0.5"></i>
                                <span className="text-[9px] font-medium tracking-wide">Calculator</span>
                            </button>
                            <button onClick={() => setActiveTab("History")} className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-transform hover:scale-105 ${activeTab === "History" ? "bg-gradient-to-b from-[#1d4ed8] to-[#1e3a8a] border border-[#3b82f6] text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-[#0f172a] border border-[#334155] text-gray-300 hover:bg-[#1e293b] hover:text-white"}`}>
                                <i className="pi pi-clock text-xl mb-0.5"></i>
                                <span className="text-[9px] font-medium tracking-wide">History</span>
                            </button>
                            <button className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-[#0f172a] border border-[#334155] text-gray-300 transition-colors hover:bg-[#1e293b] hover:text-white">
                                <i className="pi pi-chart-bar text-xl mb-0.5"></i>
                                <span className="text-[9px] font-medium tracking-wide">Chart</span>
                            </button>
                            <button className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-[#0f172a] border border-[#334155] text-gray-300 transition-colors hover:bg-[#1e293b] hover:text-white">
                                <i className="pi pi-book text-xl mb-0.5"></i>
                                <span className="text-[9px] font-medium tracking-wide">Learn</span>
                            </button>
                            <button onClick={() => setActiveTab("Settings")} className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-transform hover:scale-105 ${activeTab === "Settings" ? "bg-gradient-to-b from-[#1d4ed8] to-[#1e3a8a] border border-[#3b82f6] text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-[#0f172a] border border-[#334155] text-gray-300 hover:bg-[#1e293b] hover:text-white"}`}>
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
                        <div className="bg-[#0f142b] border border-[#1e293b] rounded-[16px] p-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col">
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
                                <div className="text-[13px] font-bold tracking-wider uppercase text-gray-300 drop-shadow-md">Greek Alphabet Table (24 Letters)</div>
                            </div>
                            
                            <div className="greek-alphabet-grid">
                                {greekLetters.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`greek-alphabet-card btn-3d ${item.color}`}
                                        onClick={() => handleLetterClick(item.lower)}
                                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <div className="absolute top-1 left-2 text-[10px] text-white font-bold opacity-80">{index + 1}</div>
                                        <div className="greek-symbol" style={{ lineHeight: 1 }}>{item.upper} {item.lower}{item.alt ? `/${item.alt}` : ""}</div>
                                        <div className="greek-name text-[10px]">{item.name}</div>
                                        <div className={`greek-value ${showLetterValues ? '' : 'invisible'}`}>{item.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ABOUT SECTION SEPARATE CARD */}
                        <div className="bg-[#0f142b] border border-[#1e293b] rounded-[16px] p-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] mt-4 flex items-center justify-between gap-4">
                            <div className="flex-1">
                                <h3 className="text-[#5be7ff] font-bold text-sm tracking-wider mb-2 m-0 uppercase">About Greek Gematria</h3>
                                <p className="text-[#cdd6f4] text-[13px] leading-relaxed m-0 pr-4">
                                    Greek Gematria is a system where letters of the Greek alphabet are assigned numeric values. The values are used to analyze words, names, and phrases.
                                </p>
                            </div>
                            <div className="w-32 h-16 bg-blue-900/20 rounded flex items-center justify-center shrink-0 border border-blue-500/20 shadow-[inset_0_0_15px_rgba(0,140,255,0.1)] relative overflow-hidden">
                                {settings.aboutImageUrl ? (
                                    <img src={settings.aboutImageUrl} alt="About Gematria" className="w-full h-full object-cover relative z-10" />
                                ) : (
                                    <i className="pi pi-building text-blue-400/50 text-3xl absolute z-0"></i>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="right-panel flex flex-col gap-3 h-full px-4" style={{width: '55%'}}>
                        {activeTab === "Calculator" && (
                            <>
                                {/* INPUT SECTION */}
                                <div className="bg-[#0f142b] border border-[#1e293b] rounded-[12px] p-3 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                                    <div className="text-center text-[11px] font-bold tracking-wider uppercase text-[#94a3b8] mb-2 drop-shadow-md">Enter Greek Word or Phrase</div>
                                    <div className="flex gap-3 items-center justify-center">
                                        <div className="relative w-full">
                                            <input
                                                type="text"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                placeholder=""
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
                                                background: 'linear-gradient(145deg, #1d4ed8, #3b82f6)', 
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

                                {calculatedResult && (
                                    <>
                                        {/* LETTER BREAKDOWN */}
                                        <div className="bg-[#0f142b] border border-[#1e293b] rounded-[12px] p-2 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                                            <div className="text-center text-[10px] font-bold tracking-wider uppercase text-[#94a3b8] mb-1 drop-shadow-md">Letter Breakdown</div>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {calculatedResult.breakdown.map((item, index) => (
                                                    <div
                                                        key={index}
                                                        className={`letter-card btn-3d ${item.color} flex flex-col items-center justify-center`}
                                                        style={{minWidth: '50px', padding: '2px', borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.5)'}}
                                                    >
                                                        <div className="text-xl font-bold">{item.lower}</div>
                                                        <div className="text-[8px] mt-0.5 opacity-90">{item.name}</div>
                                                        <div className="text-xs font-bold mt-0">{item.value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* TOTAL AND CALCULATION BREAKDOWN */}
                                        <div className="flex gap-3">
                                            {/* TOTAL */}
                                            <div className="flex-1 bg-[#0f142b] border border-[#1e293b] rounded-[12px] p-2 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col">
                                                <div className="text-center text-[10px] font-bold tracking-wider uppercase text-[#94a3b8] mb-1 drop-shadow-md">Total Gematria Value</div>
                                                <div className="flex-1 bg-[#020617] rounded-[10px] border border-[#1e293b] flex items-center justify-center py-2 shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)]">
                                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#5be7ff', textShadow: '0 0 20px rgba(91, 231, 255, 0.5)' }}>
                                                        {calculatedResult.total}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* BREAKDOWN */}
                                            <div className="flex-[1.2] bg-[#0f142b] border border-[#1e293b] rounded-[12px] p-2 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col">
                                                <div className="text-center text-[10px] font-bold tracking-wider uppercase text-[#94a3b8] mb-1 drop-shadow-md">Calculation Breakdown</div>
                                                <div className="flex-1 bg-[#020617] rounded-[10px] border border-[#1e293b] flex items-center justify-center p-2 shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] gap-2">
                                                    <div style={{ fontSize: '16px', color: '#fbbf24', fontWeight: 'bold' }}>
                                                        {calculatedResult.breakdown.map((b) => b.value).join(" + ") || "0"}
                                                    </div>
                                                    <div style={{ fontSize: '18px', color: '#00d65a', fontWeight: 'bold' }}>
                                                        = {calculatedResult.total}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* BUTTON ROW */}
                                        <div className="flex gap-2 justify-between">
                                            <button onClick={handleCopy} className="btn-3d flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[8px] text-[10px] font-bold text-white" style={{background: 'linear-gradient(145deg, #1d4ed8, #3b82f6)'}}>
                                                <i className="pi pi-copy text-xs"></i> COPY RESULT
                                            </button>
                                            <button onClick={handleClear} className="btn-3d flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[8px] text-[10px] font-bold text-white" style={{background: 'linear-gradient(145deg, #7a0000, #ff2d2d)'}}>
                                                <i className="pi pi-trash text-xs"></i> CLEAR
                                            </button>
                                            <button onClick={handleVoiceInput} className="btn-3d flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[8px] text-[10px] font-bold text-white" style={{background: 'linear-gradient(145deg, #0f766e, #14b8a6)'}}>
                                                <i className="pi pi-microphone text-xs"></i> VOICE INPUT
                                            </button>
                                            <button onClick={handleSave} className="btn-3d flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[8px] text-[10px] font-bold text-white" style={{background: 'linear-gradient(145deg, #005c28, #00d65a)'}}>
                                                <i className="pi pi-save text-xs"></i> SAVE TO HISTORY
                                            </button>
                                        </div>

                                        {/* BOTTOM INFO ROW */}
                                        <div className="flex gap-3">
                                            <div className="flex-[1] bg-[#0f142b] border border-[#1e293b] rounded-[12px] p-3 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col">
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2">Reduced Value</div>
                                                <div className="flex-1 bg-[#020617] rounded-[10px] border border-[#1e293b] flex items-center justify-center p-2 shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)]">
                                                    <div className="text-white font-bold text-xs tracking-widest flex items-center gap-2">
                                                        <span>{calculatedResult.total.toString().split("").join("+")} &rarr;</span>
                                                        <span className="text-cyan-400 text-lg">{calculatedResult.reduced}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-[1] bg-[#0f142b] border border-[#1e293b] rounded-[12px] p-3 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col">
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2">Word Information</div>
                                                <div className="flex-1 bg-[#020617] rounded-[10px] border border-[#1e293b] p-3 shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] flex flex-col justify-center gap-1">
                                                    <div className="flex justify-between text-[11px] text-gray-300"><span>Letters:</span> <span className="font-bold">{calculatedResult.breakdown.length}</span></div>
                                                    <div className="flex justify-between text-[11px] text-gray-300"><span>Total:</span> <span className="text-[#5be7ff] font-bold">{calculatedResult.total}</span></div>
                                                    <div className="flex justify-between text-[11px] text-gray-300"><span>Reduced:</span> <span className="text-white font-bold">{calculatedResult.reduced}</span></div>
                                                </div>
                                            </div>

                                            <div className="flex-[1.2] bg-[#0f142b] border border-[#1e293b] rounded-[12px] p-3 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col">
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2 text-center">Popular Examples</div>
                                                <div className="flex-1 bg-[#020617] rounded-[10px] border border-[#1e293b] flex flex-col justify-center p-2 shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] overflow-y-auto">
                                                    {popularExamples.map((ex, i) => (
                                                        <div key={i} className="flex justify-between items-center text-[10px] cursor-pointer hover:bg-[#1e293b] p-1 rounded" onClick={() => { setInput(ex.word); }}>
                                                            <span className="text-[#fbbf24] font-bold">{ex.word}</span>
                                                            <span className="text-gray-400">({ex.meaning})</span>
                                                            <span className="text-[#00ffcc] font-bold">{ex.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
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
                                                        <div className="text-[#5be7ff] font-bold text-lg">{item.total}</div>
                                                    </div>
                                                    <i className="pi pi-chevron-right text-gray-600"></i>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
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
                                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">About Section Image</label>
                                        <div className="flex items-center gap-4 mt-1">
                                            <label className="cursor-pointer bg-gradient-to-r from-teal-600 to-teal-800 hover:from-teal-500 hover:to-teal-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                                                <i className="pi pi-upload mr-2"></i> UPLOAD IMAGE
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={handleAboutImageUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                            {settings.aboutImageUrl && (
                                                <button 
                                                    onClick={() => setSettings({...settings, aboutImageUrl: ""})} 
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

export default GreekCalculatorModal;
