import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toPng } from 'html-to-image';

const DailyISIModal = ({ isOpen, onClose, onInsertImage }) => {
    const [ableCounter, setAbleCounter] = useState(0);
    const [mdl, setMdl] = useState(1);
    const [fct, setFct] = useState(1);
    const [phs, setPhs] = useState(1);
    const [day, setDay] = useState(1);
    const [bgColor, setBgColor] = useState('#1bc5fc');
    const [baseTextColor, setBaseTextColor] = useState('#0f172a');
    const [pickerColor, setPickerColor] = useState('#0f172a');
    const [fontSize, setFontSize] = useState(14);
    const [showStyleMenu, setShowStyleMenu] = useState(false);
    const [currentTransIdx, setCurrentTransIdx] = useState(0);
    const [rlltData, setRlltData] = useState([]);
    
    const stickerRef = useRef(null);
    const [isCapturing, setIsCapturing] = useState(false);

    const savedSelection = useRef(null);

    const bannerRef = useRef(null);

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount > 0) {
            savedSelection.current = sel.getRangeAt(0).cloneRange();
        }
    };

    const restoreSelection = () => {
        if (savedSelection.current) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedSelection.current);
        }
    };

    const handleColorChange = (e) => {
        const color = e.target.value;
        setPickerColor(color);
        restoreSelection();
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed) {
            if (bannerRef.current) bannerRef.current.focus();
            document.execCommand('styleWithCSS', false, true);
            document.execCommand('foreColor', false, color);
            saveSelection();
        } else {
            setBaseTextColor(color);
        }
    };

    const transformations = [
        { label: "FAMILY", color: "#1bc5fc" },
        { label: "FINANCE", color: "#10b981" },
        { label: "GOVERNMENT", color: "#3b82f6" },
        { label: "SPIRITUALITY", color: "#eab308" },
        { label: "TALENT", color: "#a855f7" },
        { label: "TRAINING", color: "#f97316" },
        { label: "SERVICE", color: "#ef4444" }
    ];

    useEffect(() => {
        // Fetch RLLT lookup data
        axios.get('http://' + window.location.hostname + ':8000/api/rllt_lookup', { withCredentials: true })
            .then(res => setRlltData(res.data))
            .catch(console.error);

        const interval = setInterval(() => {
            setCurrentTransIdx((prev) => (prev + 1) % transformations.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Dynamic Maximums based on data
    const maxMdl = rlltData.length > 0 ? Math.max(...rlltData.map(r => Number(r.module))) : 1;
    const mdlRecords = rlltData.filter(r => Number(r.module) === Number(mdl));
    const maxFct = mdlRecords.length > 0 ? Math.max(...mdlRecords.map(r => Number(r.facet))) : 1;
    const fctRecords = mdlRecords.filter(r => Number(r.facet) === Number(fct));
    const maxPhs = fctRecords.length > 0 ? Math.max(...fctRecords.map(r => Number(r.phase))) : 1;

    // Find matching record (try exact day first, then fallback to phase level, then facet level)
    const exactRecord = rlltData.find(r => Number(r.module) === Number(mdl) && Number(r.facet) === Number(fct) && Number(r.phase) === Number(phs) && Number(r.day) === Number(day));
    const fallbackRecord = rlltData.find(r => Number(r.module) === Number(mdl) && Number(r.facet) === Number(fct) && Number(r.phase) === Number(phs));
    const facetRecord = rlltData.find(r => Number(r.module) === Number(mdl) && Number(r.facet) === Number(fct));
    
    const matchingRecord = exactRecord || fallbackRecord || facetRecord;
    
    const scheduledDays = matchingRecord?.scheduled_value_days || 30;

    const parseTime = (t) => {
        if (!t) return 0;
        t = t.toString().trim().toLowerCase();
        if (t.includes('h')) {
            const match = t.match(/(\d+)h\.?(\d*)m?/);
            if (match) {
                return (parseInt(match[1] || 0) * 60) + parseInt(match[2] || 0);
            }
        } else if (t.includes('.')) {
            const parts = t.split('.');
            let sStr = parts[1] || "0";
            if (sStr.length === 1) sStr += '0';
            return parseInt(parts[0] || 0) + (parseInt(sStr.substring(0, 2)) / 60);
        } else {
            return parseInt(t) || 0;
        }
        return 0;
    };

    const phaseRecords = rlltData.filter(r => Number(r.module) === Number(mdl) && Number(r.facet) === Number(fct) && Number(r.phase) === Number(phs));
    let totalArtMins = 0;
    phaseRecords.forEach(r => {
        totalArtMins += parseTime(r.art);
    });

    const formatHrMin = (mins) => {
        if (!mins) return "0m";
        const h = Math.floor(mins / 60);
        const m = Math.round(mins % 60);
        if (h > 0 && m > 0) return `${h}h.${m}m`;
        if (h > 0) return `${h}h`;
        return `${m}m`;
    };

    const artTime = phaseRecords.length > 0 ? formatHrMin(totalArtMins) : (matchingRecord?.art || '1m');

    const today = new Date();
    const formattedDate = `${today.getDate()} ${today.toLocaleString('en-US', { month: 'short' }).toUpperCase()} ${today.getFullYear().toString().slice(-2)}`;

    const handleSubmit = async () => {
        if (!stickerRef.current) return;
        try {
            setIsCapturing(true);
            // wait a tick for state update
            await new Promise(r => setTimeout(r, 50)); 
            const dataUrl = await toPng(stickerRef.current, { cacheBust: true, quality: 0.95 });
            if (onInsertImage) {
                onInsertImage(dataUrl);
            }
            setIsCapturing(false);
            onClose();
        } catch (err) {
            console.error("Failed to generate image", err);
            setIsCapturing(false);
        }
    };

    return (
        <div
            className={`transition-all duration-300 ease-in-out shrink-0 overflow-hidden flex flex-col bg-[#f0f2f5] border-r border-gray-300 shadow-[2px_0_10px_rgba(0,0,0,0.1)] print:hidden ${isOpen ? 'w-full sm:w-[430px]' : 'w-0'}`}
        >
            <div className="w-[100vw] sm:w-[430px] h-full flex flex-col shrink-0 min-w-[350px] sm:min-w-[430px] overflow-y-auto custom-scrollbar relative">
                {/* Header Actions */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                    <button onClick={onClose} className="bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-700 focus:outline-none">
                        <i className="pi pi-times"></i>
                    </button>
                </div>

                <div className="flex-1 bg-white mx-4 mt-12 mb-4 rounded-3xl shadow-sm p-4 pb-6 flex flex-col items-center">
                    
                    {/* Top Section */}
                    <div className="w-full flex items-center mb-6">
                        <div className="flex-1"></div>
                        <div className="flex items-center justify-center gap-3 shrink-0">
                            <img src="/custom-logo.png" alt="RLLT Logo" className="w-10 h-10 rounded-full border border-gray-300 object-cover shadow-sm" />
                            <h2 className="text-lg font-black text-[#1e293b] tracking-wide">RLLT-DAILY-ISI</h2>
                        </div>
                        <div className="flex-1 flex justify-end">
                            <button onClick={() => setShowStyleMenu(!showStyleMenu)} className="p-2 hover:bg-gray-100 rounded-full focus:outline-none">
                                <i className="pi pi-ellipsis-v text-gray-500"></i>
                            </button>
                        </div>
                    </div>

                    {showStyleMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowStyleMenu(false)}></div>
                            <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-200 shadow-2xl rounded-2xl p-6 w-64 z-50">
                                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Text Styling</h4>
                                    <button onClick={() => setShowStyleMenu(false)} className="text-gray-400 hover:text-gray-700 focus:outline-none">
                                        <i className="pi pi-times text-sm"></i>
                                    </button>
                                </div>
                                <div className="mb-5">
                                    <label className="text-xs font-bold text-gray-600 block mb-2">Text Color</label>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="color" 
                                            value={pickerColor} 
                                            onChange={handleColorChange}
                                            className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                                        />
                                        <span className="text-xs font-mono text-gray-400 uppercase">{pickerColor}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 block mb-2">Font Size</label>
                                    <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 w-full justify-between">
                                        <button onClick={() => setFontSize(Math.max(12, fontSize - 1))} className="text-gray-400 hover:text-black focus:outline-none px-3 py-1">-</button>
                                        <span className="font-bold text-gray-600 text-sm">{fontSize}px</span>
                                        <button onClick={() => setFontSize(Math.min(48, fontSize + 1))} className="text-gray-300 hover:text-black focus:outline-none px-3 py-1">+</button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Big Blue Banner */}
                    <div className="w-full overflow-x-auto custom-scrollbar mb-6 flex justify-center">
                        <div 
                            ref={stickerRef}
                            className="w-max min-w-full rounded-2xl px-6 py-4 transition-colors duration-300 text-center"
                            style={{ backgroundColor: bgColor }}
                        >
                            <h3 
                                ref={bannerRef}
                                contentEditable={true}
                                suppressContentEditableWarning={true}
                                onMouseUp={saveSelection}
                                onKeyUp={saveSelection}
                                onMouseLeave={saveSelection}
                                className="font-black leading-tight whitespace-nowrap outline-none"
                                style={{ color: baseTextColor, fontSize: `${fontSize}px` }}
                            >
                                RLLT-MDL{mdl} FCT{fct} PHS{phs}/{maxPhs} {formattedDate} - DAY {day}
                            </h3>
                        </div>
                    </div>



                    {/* Grid Controls */}
                    <div className="w-full border border-gray-200 rounded-2xl p-3 mb-4">
                        <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                            <span className="w-14 text-center">MDL</span>
                            <span className="w-14 text-center">FCT</span>
                            <span className="w-10 text-center">PHS</span>
                            <span className="w-10 text-center">DAY</span>
                            <span className="w-20 text-center">Confirm</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 w-16 justify-between">
                                {!isCapturing && <button onClick={() => setMdl(Math.max(1, mdl - 1))} className="text-gray-400 hover:text-black focus:outline-none">-</button>}
                                <span className="font-bold text-gray-600 w-full text-center">{mdl}</span>
                                {!isCapturing && <button onClick={() => setMdl(Math.min(maxMdl, mdl + 1))} className="text-gray-300 hover:text-black focus:outline-none">+</button>}
                            </div>
                            <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 w-16 justify-between">
                                {!isCapturing && <button onClick={() => setFct(Math.max(1, fct - 1))} className="text-gray-400 hover:text-black focus:outline-none">-</button>}
                                <span className="font-bold text-gray-600 w-full text-center">{fct}</span>
                                {!isCapturing && <button onClick={() => setFct(Math.min(maxFct, fct + 1))} className="text-gray-300 hover:text-black focus:outline-none">+</button>}
                            </div>
                            <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 w-16 justify-between">
                                {!isCapturing && <button onClick={() => setPhs(Math.max(1, phs - 1))} className="text-gray-400 hover:text-black focus:outline-none">-</button>}
                                <span className="font-bold text-gray-600 w-full text-center">{phs}</span>
                                {!isCapturing && <button onClick={() => setPhs(Math.min(maxPhs, phs + 1))} className="text-gray-300 hover:text-black focus:outline-none">+</button>}
                            </div>
                            <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 w-16 justify-between">
                                {!isCapturing && <button onClick={() => setDay(Math.max(1, day - 1))} className="text-gray-400 hover:text-black focus:outline-none">-</button>}
                                <span className="font-bold text-gray-600 w-full text-center">{day}</span>
                                {!isCapturing && <button onClick={() => setDay(day + 1)} className="text-gray-300 hover:text-black focus:outline-none">+</button>}
                            </div>
                            {!isCapturing && (
                                <button onClick={handleSubmit} className="bg-[#10b981] text-white font-bold text-[10px] px-3 py-2 rounded-lg w-20 hover:bg-[#059669]">
                                    SUBMITTED
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="text-[#1e293b] font-bold text-sm tracking-wide mb-4 uppercase">
                        EACH PHASE IS {scheduledDays} DAYS-ART {artTime}
                    </p>

                    <button className="w-full border-2 border-[#1bc5fc] text-[#1e293b] font-bold text-sm py-1.5 rounded-full mb-4">
                        I Am Choosing 7TN Truth-GPS
                    </button>

                    <div className="flex justify-between w-full mb-6 px-1">
                        {['#1bc5fc', '#10b981', '#3b82f6', '#fde047', '#a855f7', '#f97316', '#ef4444'].map((color) => (
                            <div 
                                key={color}
                                onClick={() => setBgColor(color)}
                                className={`w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 ${bgColor === color ? 'border-[3px] border-black scale-110' : ''}`}
                                style={{ backgroundColor: color }}
                            ></div>
                        ))}
                    </div>



                    <button 
                        className="w-full text-white font-black text-xl py-4 rounded-2xl shadow-sm transition-all duration-500 tracking-widest focus:outline-none"
                        style={{ backgroundColor: transformations[currentTransIdx].color }}
                    >
                        {transformations[currentTransIdx].label}
                    </button>

                </div>
            </div>
        </div>
    );
};

export default DailyISIModal;
