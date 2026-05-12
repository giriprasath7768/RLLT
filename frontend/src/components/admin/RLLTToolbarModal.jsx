import React, { useState, useEffect } from 'react';

const DividerBox = ({ letter, letterColor, num, onClick }) => {
    const hexColor = letterColor.match(/\[(.*?)\]/)[1];
    return (
        <div
            onClick={() => {
                if (onClick) onClick(hexColor);
            }}
            className="flex flex-col items-center justify-start min-w-0 border-[2px] bg-white shadow-sm pt-2 pb-2 cursor-pointer hover:bg-gray-100 transition-colors"
            style={{ flex: 1.0, borderColor: hexColor }}
        >
            <span className={`font-serif font-black text-xl leading-none drop-shadow-sm pb-2 ${letterColor}`}>
                {letter}
            </span>
            <span className={`font-black text-sm pt-2 pb-2 leading-none text-black`}>
                {num}
            </span>
        </div>
    );
};

const Pencil = ({ label, baseNum, bodyColorClass, tipColorClass, textColor, onClick }) => {
    const hexColorMatch = tipColorClass.match(/\[(.*?)\]/);
    const hexColor = hexColorMatch ? hexColorMatch[1] : null;
    return (
        <div
            onClick={() => {
                if (onClick) onClick(label, hexColor);
            }}
            className="flex flex-col items-center min-w-0 bg-gray-500 border-[1px] border-black cursor-pointer hover:-translate-y-1 transition-transform relative h-full drop-shadow-md pb-0"
            style={{ flex: 1.0 }}
        >
            {/* Wooden Tip (Top 20%) */}
            <div className={`w-full h-[20%] relative flex justify-center items-end ${tipColorClass}`}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-[97%] h-full">
                    {/* Wood core */}
                    <polygon points="50,0 0,100 100,100" fill="#f4d1a6" />
                    {/* Painted pointer matching body color */}
                    <polygon points="50,0 25,50 75,50" fill="currentColor" />
                </svg>
            </div>

            {/* Hexagonal Color Body (Middle 60%) */}
            <div className={`w-[97%] h-[60%] flex relative ${bodyColorClass} overflow-hidden border-t-2 border-black/10`}>
                {/* Left face shadow */}
                <div className="w-[25%] h-full bg-black/20 border-r border-black/10"></div>

                {/* Center face Label */}
                <div className="w-[50%] h-full relative z-10">
                    <span
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 text-[13px] sm:text-[14px] font-black uppercase whitespace-nowrap"
                        style={{
                            color: textColor || '#ffffff',
                            textShadow: '-0.5px 0.5px 0px #a39b8c, -1px 1px 0px #8b8374, -2px 2px 0px #635b4c, -3px 3px 0px #4a4336, -4px 4px 4px rgba(0,0,0,0.8)',
                            letterSpacing: label.length > 8 ? '0px' : '2px'
                        }}
                    >
                        {label}
                    </span>
                </div>

                {/* Right face deep shadow */}
                <div className="w-[25%] h-full bg-black/40 border-l border-white/10"></div>
            </div>

            {/* Metal Ferrule Base (Bottom 8%) */}
            <div className="w-[100%] h-[8%] bg-gradient-to-r from-gray-500 via-gray-200 to-gray-600 flex flex-col justify-between py-[1px] sm:py-[2px] relative shadow-lg z-10 border-t-2 border-black/20 overflow-hidden">
                <div className="w-full h-[1px] bg-black/20 shadow-sm"></div>
                <div className="w-full h-[1px] bg-white/50"></div>
                <div className="w-full h-[1px] bg-black/20 shadow-sm"></div>
                <div className="w-full h-[1px] bg-white/50"></div>
            </div>

            {/* Colored Base Cap & Number (Bottom 12%) */}
            <div className={`w-[97%] h-[12%] flex items-center justify-center relative rounded-b-md shadow-md z-10 overflow-hidden ${bodyColorClass} border-t border-black/50`}>
                {/* Cylindrical shading to match 3D volume but not sharp hexagonal */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/30"></div>
                {/* The tracking digit */}
                <span className="font-extrabold text-[15px] sm:text-[18px] text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-10 relative">
                    {baseNum}
                </span>
            </div>
        </div>
    );
};

const RLLTToolbarModal = ({ isOpen, onClose, onInsertText }) => {
    const [texts, setTexts] = useState({
        W: "WISDOM OF GOD",
        I: "IMAGINATION",
        S: "SCRIPTURES TO PRAYER",
        D: "DAILY GROWING IN GODLINESS",
        O: "OBEDIENCE TO GOD'S WILL",
        M: "MEDITATING ON GOD'S CHARACTER"
    });

    // Read from localStorage to persist user edits if desired
    useEffect(() => {
        const stored = localStorage.getItem('rllt_toolbar_texts');
        if (stored) {
            try { setTexts(JSON.parse(stored)); } catch (e) { }
        }
    }, []);

    const updateText = (key, val) => {
        const newTexts = { ...texts, [key]: val };
        setTexts(newTexts);
        localStorage.setItem('rllt_toolbar_texts', JSON.stringify(newTexts));
    };

    const [activeSquare, setActiveSquare] = useState(null);
    const [pencilTextColor, setPencilTextColor] = useState('#ffffff');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSliderMode, setIsSliderMode] = useState(false);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    const wisdomItems = [
        { letter: 'W', color: '#8e2b8c', key: 'W' },
        { letter: 'I', color: '#294291', key: 'I' },
        { letter: 'S', color: '#86c5f7', key: 'S' },
        { letter: 'D', color: '#38b948', key: 'D' },
        { letter: 'O', color: '#e3242b', key: 'O' },
        { letter: 'M', color: '#ed9b26', key: 'M' }
    ];

    useEffect(() => {
        if (isSliderMode && activeSquare) {
            const idx = wisdomItems.findIndex(i => i.key === activeSquare);
            if (idx !== -1 && idx !== currentSlideIndex) {
                setCurrentSlideIndex(idx);
            }
        }
    }, [activeSquare, isSliderMode]);

    useEffect(() => {
        let interval;
        if (isSliderMode && !activeSquare) {
            interval = setInterval(() => {
                setCurrentSlideIndex((prev) => (prev < wisdomItems.length - 1 ? prev + 1 : 0));
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isSliderMode, activeSquare, currentSlideIndex]);
    return (
        <div
            className={`transition-all duration-300 ease-in-out shrink-0 overflow-hidden flex flex-col bg-white border-r border-gray-300 shadow-[2px_0_10px_rgba(0,0,0,0.1)] print:hidden ${isOpen ? 'w-full sm:w-[430px]' : 'w-0'}`}
        >
            <div className="w-[100vw] sm:w-[430px] h-full flex flex-col shrink-0 min-w-[350px] sm:min-w-[430px]">
                {/* Header */}
                <div className="bg-[#1a2234] text-white px-4 py-1.5 flex justify-between items-center shrink-0">
                    <h2 className="text-sm font-bold tracking-widest uppercase mt-0.5">RLLT Toolbar</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors flex items-center justify-center">
                        <i className="pi pi-times text-lg"></i>
                    </button>
                </div>

                <div className="flex-grow flex flex-col pt-2 pb-4 px-2 overflow-y-auto custom-scrollbar w-full h-full relative">
                    {/* Pencils Row */}
                    <div className="flex p-1 gap-1 h-[200px] sm:h-[225px] w-full justify-between items-stretch">
                        <Pencil label="FAMILY" baseNum="1" bodyColorClass="bg-[#00c0ff]" tipColorClass="text-[#00c0ff]" textColor={pencilTextColor} onClick={onInsertText} />
                        <DividerBox letter="W" letterColor="text-[#8e2b8c]" num="1" onClick={() => { setActiveSquare(prev => prev === 'W' ? null : 'W'); }} />

                        <Pencil label="FINANCE" baseNum="2" bodyColorClass="bg-[#00a638]" tipColorClass="text-[#00a638]" textColor={pencilTextColor} onClick={onInsertText} />
                        <DividerBox letter="I" letterColor="text-[#294291]" num="2" onClick={() => { setActiveSquare(prev => prev === 'I' ? null : 'I'); }} />

                        <Pencil label="GOVERNMENT" baseNum="3" bodyColorClass="bg-[#3340cd]" tipColorClass="text-[#3340cd]" textColor={pencilTextColor} onClick={onInsertText} />
                        <DividerBox letter="S" letterColor="text-[#86c5f7]" num="3" onClick={() => { setActiveSquare(prev => prev === 'S' ? null : 'S'); }} />

                        <Pencil label="SPIRITUALITY" baseNum="4" bodyColorClass="bg-[#fafa33]" tipColorClass="text-[#fafa33]" textColor={pencilTextColor} onClick={onInsertText} />
                        <DividerBox letter="D" letterColor="text-[#38b948]" num="4" onClick={() => { setActiveSquare(prev => prev === 'D' ? null : 'D'); }} />

                        <Pencil label="TALENT" baseNum="5" bodyColorClass="bg-[#bb43b1]" tipColorClass="text-[#bb43b1]" textColor={pencilTextColor} onClick={onInsertText} />
                        <DividerBox letter="O" letterColor="text-[#e3242b]" num="5" onClick={() => { setActiveSquare(prev => prev === 'O' ? null : 'O'); }} />

                        <Pencil label="TRAINING" baseNum="6" bodyColorClass="bg-[#fe6d01]" tipColorClass="text-[#fe6d01]" textColor={pencilTextColor} onClick={onInsertText} />
                        <DividerBox letter="M" letterColor="text-[#ed9b26]" num="6" onClick={() => { setActiveSquare(prev => prev === 'M' ? null : 'M'); }} />

                        <Pencil label="SERVICE" baseNum="7" bodyColorClass="bg-[#fe0005]" tipColorClass="text-[#fe0005]" textColor={pencilTextColor} onClick={onInsertText} />
                    </div>

                    {/* TRANSFORMATION Text Bar */}
                    <div className="w-full bg-black py-1 text-white flex justify-between items-center px-[12px] font-black text-[14px] sm:text-[16px] mx-0 drop-shadow-md z-10 shrink-0 mb-2 mt-2 rounded">
                        {"TRANSFORMATION".split('').map((char, i) => (
                            <span key={i}>{char}</span>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="px-3 pt-2 pb-2 flex flex-col justify-between font-bold font-serif whitespace-nowrap bg-white overflow-hidden w-full min-h-[150px] shrink gap-0 relative">
                        {/* List Header Options / Menu and I AM button */}
                        <div className="absolute top-1 right-2 z-30 flex flex-col items-center gap-3">
                            <div className="relative flex justify-end w-full">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 cursor-pointer focus:outline-none transition-colors shadow-sm"
                                    title="Menu"
                                >
                                    <i className={`pi ${isMenuOpen ? 'pi-times' : 'pi-bars'} text-black`} style={{ fontSize: '14px' }}></i>
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 top-8 bg-white border border-gray-200 shadow-xl rounded-md w-48 py-1 z-40 overflow-hidden transform origin-top-right transition-all">
                                        <label className="w-full text-left px-3 py-2 text-[11px] font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer transition-colors relative mb-0">
                                            <i className="pi pi-palette" style={{ fontSize: '12px' }}></i>
                                            <span>Change Pencil Text</span>
                                            <input
                                                type="color"
                                                value={pencilTextColor}
                                                onChange={(e) => setPencilTextColor(e.target.value)}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            />
                                        </label>
                                        <button
                                            onClick={() => {
                                                setIsSliderMode(!isSliderMode);
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-[11px] font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors border-t border-gray-100"
                                        >
                                            <i className={isSliderMode ? "pi pi-list" : "pi pi-images"} style={{ fontSize: '12px' }}></i>
                                            <span>{isSliderMode ? "Change to List Mode" : "Change to Slider Mode"}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <button
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-xs shadow-[0_5px_0_#5a1a58,0_5px_5px_rgba(0,0,0,0.4)] active:shadow-[0_0px_0_#5a1a58,0_0px_0px_rgba(0,0,0,0.4)] active:translate-y-[5px] transition-all duration-100 cursor-pointer"
                                style={{ backgroundColor: '#8e2b8c' }}
                                title="Insert I AM"
                                onClick={() => onInsertText("I AM", "#8e2b8c")}
                            >
                                <span style={{ textShadow: '1px 1px 0px #000, 2px 2px 0px rgba(0,0,0,0.5)' }}>I AM</span>
                            </button>
                        </div>
                        {!isSliderMode ? (
                            wisdomItems.map((item, idx) => (
                                <div
                                    key={item.key}
                                    className={`flex items-center gap-2 border-2 rounded py-1 px-2 transition-all cursor-pointer hover:bg-gray-50 mb-1`}
                                    style={{ borderColor: activeSquare === item.key ? item.color : 'transparent' }}
                                    onClick={(e) => {
                                        // Insert the full text associated with this letter into the document
                                        onInsertText(texts[item.key], item.color);
                                    }}
                                >
                                    <span style={{ color: item.color }} className="text-[14px] sm:text-[16px] font-black flex-shrink-0 leading-none">{idx + 1}.</span>
                                    <span
                                        style={{ color: item.color }}
                                        className="text-[15px] sm:text-[18px] font-black leading-none drop-shadow-sm flex-shrink-0 px-2"
                                    >
                                        {item.letter}
                                    </span>
                                    <input
                                        type="text"
                                        value={texts[item.key]}
                                        onChange={(e) => updateText(item.key, e.target.value)}
                                        onClick={(e) => e.stopPropagation()} // prevent triggering insert on typing
                                        className="text-black text-[12px] sm:text-[14px] font-black uppercase tracking-wider bg-transparent border-b border-transparent focus:border-gray-300 outline-none flex-grow min-w-0 leading-none py-1"
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="flex-grow flex items-center justify-center relative w-full min-h-[150px] border-2 border-gray-100 rounded-lg overflow-hidden bg-white shadow-inner mt-2">
                                {/* Slide Container */}
                                <div className="w-full h-full relative" style={{ perspective: '1000px' }}>
                                    {wisdomItems.map((item, idx) => (
                                        <div
                                            key={item.key}
                                            className={`absolute inset-0 flex flex-col justify-center items-center transition-all duration-500 ease-in-out px-6 cursor-pointer`}
                                            style={{
                                                transform: `translateX(${(idx - currentSlideIndex) * 100}%)`,
                                                opacity: idx === currentSlideIndex ? 1 : 0,
                                                pointerEvents: idx === currentSlideIndex ? 'auto' : 'none'
                                            }}
                                            onClick={() => onInsertText(texts[item.key], item.color)}
                                        >
                                            <div className="flex items-center justify-center w-full max-w-full">
                                                <div
                                                    className="flex items-center justify-center w-max max-w-full border-2 rounded py-2 px-4 transition-colors duration-300 hover:bg-gray-50"
                                                    style={{ borderColor: activeSquare === item.key ? item.color : 'transparent' }}
                                                >
                                                    <div
                                                        className="text-[40px] sm:text-[60px] font-black drop-shadow-md transition-transform hover:scale-105 leading-none pr-[4px]"
                                                        style={{ color: item.color }}
                                                    >
                                                        {item.letter}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={texts[item.key]}
                                                        onChange={(e) => updateText(item.key, e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className={`text-black font-black uppercase bg-transparent outline-none leading-tight text-left transition-all ${['M', 'D'].includes(item.key) ? 'text-[12px] sm:text-[14px] tracking-normal' : 'text-[16px] sm:text-[20px] tracking-widest'}`}
                                                        style={{ width: `calc(${texts[item.key].length * 1.5}ch + 3rem)`, minWidth: '50px', maxWidth: '90%' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Dots Indicator */}
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                                    {wisdomItems.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={(e) => { e.stopPropagation(); setCurrentSlideIndex(idx); }}
                                            className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none ${idx === currentSlideIndex ? 'bg-gray-800 scale-125' : 'bg-gray-300 hover:bg-gray-400'}`}
                                        ></button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RLLTToolbarModal;
