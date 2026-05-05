import React, { useState } from 'react';

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

const ScrollMenuModal = ({ onSelect, onClose }) => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleCategoryClick = (e, cat) => {
        if (e) e.stopPropagation();
        setSelectedCategory(cat);
        setIsFlipped(true);
    };

    const handleFormatClick = (format, styleOption = null) => {
        if (onSelect) onSelect(selectedCategory, format, styleOption);
    };

    return (
        <div
            className="fixed z-[2000] bg-black/40 p-2 backdrop-blur-sm pointer-events-auto print:hidden rounded flex items-center justify-center"
            style={{ inset: 0, perspective: '1500px' }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div
                className="relative w-[400px] h-[550px] flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
                style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
                {/* FRONT FACE */}
                <div
                    className={`absolute inset-0 w-full h-full flex flex-col items-center justify-start bg-[#faf4ec] border-[3px] border-[#8b5a2b]/80 rounded-2xl drop-shadow-2xl overflow-hidden transition-opacity duration-300 ${isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
                >
                    <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: "url('/scrollimage.png')",
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            mixBlendMode: 'multiply'
                        }}
                    />
                    
                    <button onClick={onClose} className="absolute top-4 right-4 text-[#8b5a2b] hover:text-red-700 transition-all z-[101]">
                        <i className="pi pi-times text-[18px] font-bold"></i>
                    </button>

                    <div className="relative z-10 px-6 pt-[60px] pb-[60px] flex flex-col gap-[7px] items-center text-[#2d1a11] font-serif w-full h-full justify-center -translate-y-2">
                        <h2 className="text-[17px] font-black uppercase tracking-widest text-[#2d1a11] drop-shadow-sm mb-1 text-center leading-tight w-full flex flex-col gap-[2px]">
                            <button onClick={(e) => handleCategoryClick(e, { label: "The Power of God", color: "#FCD34D" })} className="hover:text-[#8b5a2b] hover:scale-105 transition-all transform cursor-pointer w-full">
                                The Power of God &
                            </button>
                            <button onClick={(e) => handleCategoryClick(e, { label: "The Wisdom of God", color: "#FCD34D" })} className="hover:text-[#8b5a2b] hover:scale-105 transition-all transform cursor-pointer w-full">
                                The Wisdom of God
                            </button>
                        </h2>

                        <div className="flex flex-col w-full items-center gap-[5px] mt-2">
                            {HIGHLIGHT_CATEGORIES.map(cat => (
                                <button
                                    key={cat.label}
                                    onClick={(e) => handleCategoryClick(e, cat)}
                                    className="text-[16px] font-extrabold w-[85%] text-center transform drop-shadow-sm transition-all hover:text-[#8b5a2b] hover:scale-105 cursor-pointer leading-tight"
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        <div className="w-[90%] flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-[16px] font-black font-serif leading-tight">
                            {SEVEN_MOUNTAIN_SPHERES.map(cat => (
                                <button
                                    key={cat.label}
                                    onClick={(e) => handleCategoryClick(e, cat)}
                                    className="hover:text-[#8b5a2b] transition-colors relative group hover:scale-110 transform drop-shadow-sm"
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        <div className="mt-3 flex flex-col items-center text-center text-[10px] leading-tight font-bold tracking-wider opacity-75 uppercase pointer-events-none">
                            <span>I am here to do God's will and do what</span>
                            <span>written about me in this scroll</span>
                        </div>
                    </div>
                </div>

                {/* BACK FACE */}
                <div
                    className={`absolute inset-0 w-full h-full flex flex-col items-center justify-start bg-[#faf4ec] border-[3px] border-[#8b5a2b]/80 shadow-[0_20px_40px_rgba(0,0,0,0.6)] rounded-2xl transition-opacity duration-300 ${isFlipped ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                    style={{
                        transform: 'rotateY(180deg)'
                    }}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
                        className="absolute top-4 left-4 text-[#8b5a2b] hover:text-red-700 hover:scale-110 transition-all z-[101]"
                        title="Flip Back"
                    >
                        <i className="pi pi-arrow-left text-[18px] font-bold"></i>
                    </button>
                    
                    <button onClick={onClose} className="absolute top-4 right-4 text-[#8b5a2b] hover:text-red-700 transition-all z-[101]">
                        <i className="pi pi-times text-[18px] font-bold"></i>
                    </button>

                    <div className="px-6 py-12 flex flex-col items-center w-full h-full overflow-y-auto no-scrollbar">

                        <span className="font-serif font-black text-[13px] text-[#2d1a11] tracking-wider uppercase drop-shadow-sm text-center leading-tight w-full break-words mb-4 border-b pb-2 border-[#8b5a2b]/30">{selectedCategory?.label || ''}</span>

                        <div className="flex flex-col gap-2 w-[95%] flex-shrink-0">
                            {['Underline', 'Circle', 'Square', 'Highlight'].map(fmt => {
                                let formatOptions = [];
                                if (fmt === 'Square' || fmt === 'Circle') {
                                    formatOptions = [
                                        { id: 'solid-1px', bWidth: '2px', bStyle: 'solid' },
                                        { id: 'solid-3px', bWidth: '4px', bStyle: 'solid' },
                                        { id: 'double-3px', bWidth: '4px', bStyle: 'double' },
                                        { id: 'inner-shadow', bWidth: '0px', bStyle: 'none' },
                                        { id: 'outer-shadow', bWidth: '0px', bStyle: 'none' }
                                    ];
                                } else if (fmt === 'Underline') {
                                    formatOptions = [
                                        { id: 'line-1px', bWidth: '1px', bStyle: 'solid' },
                                        { id: 'line-2px', bWidth: '2px', bStyle: 'solid' },
                                        { id: 'line-3px', bWidth: '3px', bStyle: 'solid' },
                                        { id: 'line-4px', bWidth: '4px', bStyle: 'solid' },
                                        { id: 'line-5px', bWidth: '5px', bStyle: 'solid' }
                                    ];
                                } else if (fmt === 'Highlight') {
                                    formatOptions = [
                                        { id: 'hl-1', bWidth: '0px', bStyle: 'none' },
                                        { id: 'hl-2', bWidth: '0px', bStyle: 'none' },
                                        { id: 'hl-3', bWidth: '0px', bStyle: 'none' },
                                        { id: 'hl-4', bWidth: '0px', bStyle: 'none' },
                                        { id: 'hl-5', bWidth: '0px', bStyle: 'none' }
                                    ];
                                }

                                return (
                                    <div key={fmt} className="relative group w-full flex flex-col items-center z-10 bg-[#faf4ec] border border-[#8b5a2b]/20 shadow-sm rounded-lg overflow-hidden">
                                        <div className="w-full px-3 py-1 bg-[#8b5a2b]/10 font-bold font-serif text-[12px] text-[#2d1a11] text-center border-b border-[#8b5a2b]/10">
                                            {fmt}
                                        </div>
                                        <div className="grid grid-cols-5 gap-1 p-1.5 w-full bg-[#faf4ec]">
                                            {formatOptions.map(opt => {
                                                let renderPreview;
                                                const activeColor = selectedCategory?.color || '#8b5a2b';
                                                const bProps = { borderStyle: opt.bStyle, borderWidth: opt.bWidth, borderColor: activeColor };

                                                if (fmt === 'Underline') {
                                                    renderPreview = <div className="w-[90%]" style={{ borderBottomStyle: opt.bStyle, borderBottomWidth: opt.bWidth, borderBottomColor: activeColor }} />;
                                                } else if (fmt === 'Circle') {
                                                    const isInner = opt.id === 'inner-shadow';
                                                    const isOuter = opt.id === 'outer-shadow';
                                                    const shadowStyle = isInner ? { boxShadow: `inset 0 0 4px ${activeColor}` } : isOuter ? { boxShadow: `0 0 6px ${activeColor}` } : bProps;
                                                    renderPreview = <div className="w-[14px] h-[14px] rounded-full flex-shrink-0" style={shadowStyle} />;
                                                } else if (fmt === 'Square') {
                                                    const isInner = opt.id === 'inner-shadow';
                                                    const isOuter = opt.id === 'outer-shadow';
                                                    const shadowStyle = isInner ? { boxShadow: `inset 0 0 4px ${activeColor}` } : isOuter ? { boxShadow: `0 0 6px ${activeColor}` } : bProps;
                                                    renderPreview = <div className="w-[14px] h-[14px] rounded-[2px] flex-shrink-0" style={shadowStyle} />;
                                                } else {
                                                    const hlLvl = parseInt(opt.id.split('-')[1]);
                                                    renderPreview = <div className="w-[90%] rounded-[2px]" style={{ height: `${hlLvl * 2}px`, backgroundColor: activeColor, opacity: 0.35, alignSelf: 'flex-end', marginBottom: '2px' }} />;
                                                }

                                                return (
                                                    <button
                                                        key={opt.id}
                                                        onClick={(e) => { e.stopPropagation(); handleFormatClick(fmt.toLowerCase(), opt.id); }}
                                                        className="w-full h-6 flex items-end justify-center hover:bg-[#8b5a2b]/20 rounded transition-colors pb-1"
                                                        title={opt.id}
                                                    >
                                                        {renderPreview}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScrollMenuModal;
