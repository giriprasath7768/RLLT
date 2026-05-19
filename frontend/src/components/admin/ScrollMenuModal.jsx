import React, { useState } from 'react';

const HIGHLIGHT_CATEGORIES = [
    { label: "Imagination", color: "#3340cd" },
    { label: "Scriptures to prayer", color: "#00c0ff" },
    { label: "Daily growing in Godliness", color: "#00a638" },
    { label: "Obedience to God in action", color: "#fe0005" },
    { label: "Meditating on God's Character", color: "#fe6d01" }
];

const SEVEN_MOUNTAIN_SPHERES = [
    { label: "Family", color: "#00c0ff" },
    { label: "Finance", color: "#00a638" },
    { label: "Government", color: "#3340cd" },
    { label: "Talent", color: "#bb43b1" },
    { label: "Training", color: "#fe6d01" },
    { label: "Spirituality", color: "#fafa33" },
    { label: "Service", color: "#fe0005" }
];

const ScrollMenuModal = ({ isOpen, onSelect, onClose }) => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const handleCategoryClick = (e, cat) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        let format = 'square';
        let styleOption = 'solid-3px';
        
        const isTransformation = SEVEN_MOUNTAIN_SPHERES.some(sphere => sphere.label === cat.label) || 
                                 cat.label.toUpperCase() === 'TRANSFORMATION';
                                 
        if (isTransformation) {
            format = 'highlight';
            styleOption = 'hl-5';
        }

        if (onSelect) {
            onSelect(cat, format, styleOption);
            if (onClose) onClose();
        }
    };

    return (
        <>
            {/* Modal Overlay */}
            <div
                className={`fixed inset-0 bg-black/60 z-[400] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div
                className={`fixed top-[55%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[410] transition-all duration-300 ease-in-out shrink-0 overflow-visible flex flex-col print:hidden bg-transparent ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
                <style>{`
                    .scroll-container {
                        animation: floatPaper 4s ease-in-out infinite;
                    }
                    @keyframes floatPaper {
                        0% { transform: translateY(0px); }
                        50% { transform: translateY(-5px); }
                        100% { transform: translateY(0px); }
                    }
                    .scroll-body {
                        overflow: hidden;
                        transform-origin: top;
                        animation: openScroll 1.5s ease-out forwards;
                    }
                    @keyframes openScroll {
                        0% { height: 0; opacity: 0; }
                        40% { opacity: 1; }
                        100% { height: 900px; opacity: 1; }
                    }
                `}</style>

                <div className="relative flex flex-col items-center justify-center shrink-0 w-[550px] scroll-container drop-shadow-2xl mix-blend-multiply">

                    <div 
                        className={`relative w-full ${isOpen ? 'scroll-body' : 'h-0 opacity-0'}`}
                        style={{ perspective: '1500px' }}
                    >
                        <div className="relative w-full h-[900px] flex items-center justify-center">
                            <div className="absolute inset-0 w-full h-[900px] flex flex-col items-center justify-start bg-transparent">
                            <div 
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    backgroundImage: "url('/scrollimage.png')",
                                    backgroundSize: '100% 100%',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat'
                                }}
                            />
                            


                            <div className="relative z-10 px-8 pt-[20px] pb-[95px] flex flex-col items-center text-[#000] w-full h-[900px] justify-center">
                                <style>{`
                                    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&display=swap');
                                    .font-cinzel {
                                        font-family: 'Cinzel', serif;
                                    }
                                    .font-times {
                                        font-family: 'Times New Roman', Times, serif;
                                    }
                                    .text-stroke-1 {
                                        -webkit-text-stroke: 1px black;
                                    }
                                    .text-stroke-sm {
                                        -webkit-text-stroke: 0.5px black;
                                    }
                                `}</style>

                                <div className="text-center w-full flex flex-col gap-[2px] mb-3 mt-2">
                                    <div className="font-cinzel font-black text-[18px] leading-tight w-full text-center drop-shadow-sm tracking-wide text-stroke-1">
                                        THE POWER OF GOD AND THE-
                                    </div>
                                    <button onMouseDown={(e) => handleCategoryClick(e, { label: "The Wisdom of God", color: "#8A2BE2" })} className="font-cinzel font-black leading-tight hover:text-[#8b5a2b] hover:scale-105 transition-all transform cursor-pointer w-full text-center drop-shadow-sm flex justify-center items-baseline tracking-wide text-stroke-1">
                                        <span className="text-[26px]">W</span>
                                        <span className="text-[18px] ml-[2px]">ISDOM OF GOD</span>
                                    </button>
                                </div>

                                <div className="flex flex-col w-full items-center gap-[8px] mb-4">
                                    {HIGHLIGHT_CATEGORIES.map(cat => (
                                        <button
                                            key={cat.label}
                                            onMouseDown={(e) => handleCategoryClick(e, cat)}
                                            className="w-full text-center transform transition-all hover:text-[#8b5a2b] hover:scale-105 cursor-pointer leading-none flex justify-center items-baseline drop-shadow-sm font-bold"
                                        >
                                            <span className="font-cinzel font-black text-[26px] text-stroke-1">{cat.label.charAt(0)}</span>
                                            <span className="font-times font-black text-[18px] tracking-wide ml-[2px] text-stroke-sm">{cat.label.slice(1)}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="w-full text-center drop-shadow-sm mb-4">
                                    <div className="font-cinzel font-black text-[22px] tracking-wide text-stroke-1">
                                        TRANSFORMATION
                                    </div>
                                </div>

                                <div className="w-[90%] flex flex-wrap justify-center gap-x-3 gap-y-3 mb-3 leading-none drop-shadow-sm">
                                    {SEVEN_MOUNTAIN_SPHERES.slice(0, 4).map(cat => (
                                        <button key={cat.label} onMouseDown={(e) => handleCategoryClick(e, cat)} className="hover:text-[#8b5a2b] transition-colors hover:scale-110 transform flex items-baseline font-bold">
                                            <span className="font-cinzel font-black text-[20px] text-stroke-1">{cat.label.charAt(0)}</span>
                                            <span className="font-times font-black text-[16px] tracking-wide ml-[1px] text-stroke-sm">{cat.label.slice(1)}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="w-[90%] flex flex-wrap justify-center gap-x-3 gap-y-3 mb-3 leading-none drop-shadow-sm">
                                    {SEVEN_MOUNTAIN_SPHERES.slice(4).map(cat => (
                                        <button key={cat.label} onMouseDown={(e) => handleCategoryClick(e, cat)} className="hover:text-[#8b5a2b] transition-colors hover:scale-110 transform flex items-baseline font-bold">
                                            <span className="font-cinzel font-black text-[20px] text-stroke-1">{cat.label.charAt(0)}</span>
                                            <span className="font-times font-black text-[16px] tracking-wide ml-[1px] text-stroke-sm">{cat.label.slice(1)}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-col items-center text-center font-times italic text-[13px] leading-tight font-black pointer-events-none w-[80%] opacity-90 drop-shadow-sm mt-3 mb-0">
                                    <span>I AM HERE TO DO GOD'S WILL and DO WHAT IS</span>
                                    <span>WRITTEN ABOUT ME IN THIS SCROLL</span>
                                </div>

                                <div className="w-full flex justify-center gap-4 mt-3 mb-6">
                                    <button 
                                        onMouseDown={(e) => {
                                            if (e) { e.preventDefault(); e.stopPropagation(); }
                                            if (onSelect) onSelect({ label: 'Remove', color: 'transparent' }, 'remove', null);
                                            if (onClose) onClose();
                                        }}
                                        className="text-black hover:text-red-600 font-bold transition-all hover:scale-110 flex flex-col items-center gap-1 drop-shadow-md cursor-pointer"
                                    >
                                        <i className="pi pi-eraser text-xl"></i>
                                        <span className="text-[10px] tracking-widest uppercase">Remove</span>
                                    </button>
                                    
                                    <button 
                                        onMouseDown={(e) => {
                                            if (e) { e.preventDefault(); e.stopPropagation(); }
                                            if (onSelect) onSelect({ label: 'Underline', color: '#8b5a2b' }, 'underline', 'solid-2px');
                                            if (onClose) onClose();
                                        }}
                                        className="text-black hover:text-blue-600 font-bold transition-all hover:scale-110 flex flex-col items-center gap-1 drop-shadow-md cursor-pointer"
                                    >
                                        <i className="pi pi-minus text-xl"></i>
                                        <span className="text-[10px] tracking-widest uppercase">Underline</span>
                                    </button>
                                    
                                    <button 
                                        onMouseDown={(e) => {
                                            if (e) { e.preventDefault(); e.stopPropagation(); }
                                            if (onSelect) onSelect({ label: 'Copy', color: 'transparent' }, 'copy', null);
                                            if (onClose) onClose();
                                        }}
                                        className="text-black hover:text-green-600 font-bold transition-all hover:scale-110 flex flex-col items-center gap-1 drop-shadow-md cursor-pointer"
                                    >
                                        <i className="pi pi-copy text-xl"></i>
                                        <span className="text-[10px] tracking-widest uppercase">Copy</span>
                                    </button>
                                </div>
                            </div>
                        </div>


                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ScrollMenuModal;

