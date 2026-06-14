import React from 'react';

const DashboardHeader = ({ globalStats }) => {
    return (
        <div className="p-3 pb-1">
            <div className="flex flex-row justify-between items-stretch gap-2">

                {/* Logo Left */}
                <div className="flex flex-col items-center justify-start shrink-0 w-[80px]">
                    <div className="relative w-[70px] h-[80px] flex items-center justify-center mb-1 drop-shadow-xl mt-1">
                        <svg viewBox="0 0 100 115" className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(3px 5px 5px rgba(0,0,0,0.4))' }}>
                            <polygon points="50,5 94,30 94,85 50,110 6,85 6,30" fill="#0B2149" stroke="#d4af37" strokeWidth="8" strokeLinejoin="round" />
                        </svg>
                        <span className="relative text-[2.5rem] text-[#d3c09b] transform -translate-y-1" style={{
                            fontFamily: "Arial, sans-serif",
                            textShadow: '1px 1px 0px #b09c73, 2px 2px 0px #9d8960, 3px 3px 0px #8a774e, 4px 4px 0px #75633c, 5px 5px 0px #63522f, 7px 7px 10px rgba(0,0,0,0)'
                        }}>D</span>
                    </div>
                    <div className="text-[9px] font-black text-[#1c4587] text-center leading-[1.2] tracking-widest mt-1 not-italic" style={{ fontFamily: 'Arial, sans-serif', fontStyle: 'normal', WebkitTextStroke: '0.4px #1c4587' }}>
                        LIGHT CHART<br />DIGITAL
                    </div>
                </div>

                {/* Title Center */}
                <div className="flex flex-col items-center justify-center flex-1 px-1">
                    <h1 className="text-[20px] font-bold text-[#0B2149] tracking-widest text-center shadow-sm leading-tight mt-1" style={{ fontFamily: "Arial, sans-serif", textShadow: '0.5px 0.5px 0px #081a38, 1px 1px 0px #051024, 1.5px 1.5px 0px #030a17, 2px 2px 4px rgba(0,0,0,0)' }}>
                        REAL LIFE LEADERSHIP<br />TRAINING
                    </h1>
                    <p className="text-[#a67c00] italic text-[11px] mt-1 font-medium text-center" style={{ fontFamily: "Arial, sans-serif", textShadow: '0.5px 0.5px 0px #8a6600, 1px 1px 0px #6e5100, 2px 2px 4px rgba(0,0,0,0)' }}>
                        Leadership Impact. Growth. Healthy Transformation.
                    </p>
                    <div className="flex items-center gap-2 mt-2 w-full justify-center">
                        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#d3c09b] to-[#d3c09b] flex-1 max-w-[80px] shadow-sm"></div>
                        <span className="text-[#d3c09b] text-sm leading-none drop-shadow-md">✧</span>
                        <div className="h-[2px] bg-gradient-to-l from-transparent via-[#d3c09b] to-[#d3c09b] flex-1 max-w-[80px] shadow-sm"></div>
                    </div>
                </div>

                {/* Stats Right */}
                <div className="flex shrink-0 border-[3px] border-[#d4af37] rounded-lg overflow-hidden h-[110px] w-[155px] shadow-[6px_6px_12px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(255,255,255,0.8)] bg-[#fcf8ef] mt-1">
                    <div className="flex flex-col w-[45%]">
                        <div className="flex-1 flex flex-col items-center justify-center border-b-[2px] border-[#d4af37] bg-gradient-to-br from-[#fcf8ef] to-[#e8dcb9] shadow-inner pt-1">
                            <span className="text-2xl text-[#a67c00] leading-none mb-1 font-bold" style={{ fontFamily: "Arial, sans-serif", textShadow: '1px 1px 0px #8a6600, 2px 2px 0px #6e5100, 3px 3px 4px rgba(0,0,0,0)' }}>{globalStats.modules}</span>
                            <span className="text-[12px] font-bold text-[#0B2149] tracking-widest" style={{ textShadow: '0.5px 0.5px 0px #051024, 1px 1px 0px #030a17, 2px 2px 2px rgba(0,0,0,0)' }}>MODULES</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-[#fcf8ef] to-[#e8dcb9] shadow-inner pb-1">
                            <span className="text-2xl text-[#a67c00] leading-none mb-1 font-bold" style={{ fontFamily: "Arial, sans-serif", textShadow: '1px 1px 0px #8a6600, 2px 2px 0px #6e5100, 3px 3px 4px rgba(0,0,0,0)' }}>{globalStats.facets}</span>
                            <span className="text-[12px] font-bold text-[#0B2149] tracking-widest" style={{ textShadow: '0.5px 0.5px 0px #051024, 1px 1px 0px #030a17, 2px 2px 2px rgba(0,0,0,0)' }}>FACETS</span>
                        </div>
                    </div>
                    <div className="w-[55%] flex flex-col items-center justify-center bg-gradient-to-br from-[#0B2149] to-[#051024] border-l-[3px] border-[#d4af37] shadow-[inset_0_4px_6px_rgba(0,0,0,0.6)]">
                        <span className="text-4xl text-[#d3c09b] leading-none mb-1 font-bold" style={{ fontFamily: "Arial, sans-serif", textShadow: '1px 1px 0px #a8997a, 2px 2px 0px #8a7c60, 3px 3px 5px rgba(0,0,0,0)' }}>{globalStats.phases}</span>
                        <span className="text-[12px] font-bold text-[#d3c09b] tracking-widest mt-1" style={{ textShadow: '0.5px 0.5px 0px #b09c73, 1px 1px 0px #9d8960, 2px 2px 2px rgba(0,0,0,0)' }}>PHASES</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;
