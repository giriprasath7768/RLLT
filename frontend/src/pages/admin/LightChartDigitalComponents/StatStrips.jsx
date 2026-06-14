import React from 'react';

const StatStrips = ({ selectedPhaseStats }) => {
    return (
        <div className="mx-[18px] mt-2 flex flex-col gap-2">
            {/* Stats Row 1 */}
            <div className="bg-gradient-to-r from-[#fdfbf6] via-[#fcf8ef] to-[#fdfbf6] border-[3px] border-[#d3c09b] rounded-xl flex flex-row justify-between items-center shadow-[0_5px_15px_rgba(0,0,0,0.1),inset_0_2px_10px_rgba(255,255,255,1)] relative overflow-hidden">
                <div className="flex-1 w-full flex flex-col items-center py-2 border-r-[2px] border-[#e8dcb9] z-10 hover:bg-white/50 transition-colors">
                    <span className="text-[12px] font-bold text-[#0B2149] tracking-[0.1em] mb-[2px] drop-shadow-sm">WEEKS/PHASE</span>
                    <span className="text-3xl text-[#a67c00] font-bold leading-none mt-1 drop-shadow-md" style={{ fontFamily: "Arial, sans-serif", textShadow: '1px 1px 0 #d3c09b, 2px 2px 4px rgba(0,0,0,0.2)' }}>{selectedPhaseStats.weeks}</span>
                </div>
                <div className="flex-1 w-full flex flex-col items-center py-2 border-r-[2px] border-[#e8dcb9] z-10 hover:bg-white/50 transition-colors">
                    <span className="text-[12px] font-bold text-[#0B2149] tracking-[0.1em] mb-[2px] drop-shadow-sm">DAYS/PHASE</span>
                    <span className="text-3xl text-[#a67c00] font-bold leading-none mt-1 drop-shadow-md" style={{ fontFamily: "Arial, sans-serif", textShadow: '1px 1px 0 #d3c09b, 2px 2px 4px rgba(0,0,0,0.2)' }}>{selectedPhaseStats.days}</span>
                </div>
                <div className="flex-1 w-full flex flex-col items-center py-2 z-10 hover:bg-white/50 transition-colors">
                    <span className="text-[12px] font-bold text-[#8b2b2b] tracking-[0.1em] mb-[2px] drop-shadow-sm">ART.</span>
                    <span className="text-3xl text-[#a67c00] font-bold leading-none mt-1 drop-shadow-md flex items-baseline gap-1" style={{ fontFamily: "Arial, sans-serif", textShadow: '1px 1px 0 #d3c09b, 2px 2px 4px rgba(0,0,0,0.2)' }}>{selectedPhaseStats.artParts}</span>
                </div>
            </div>

            {/* Stats Row 2 */}
            <div className="bg-gradient-to-br from-[#fdfbf6] to-[#f0e4cd] border-[3px] border-[#d3c09b] rounded-xl flex flex-row shadow-[0_5px_15px_rgba(0,0,0,0.1),inset_2px_2px_5px_rgba(255,255,255,0.8)] overflow-hidden">
                <div className="flex flex-row flex-1 border-r-[2px] border-[#d3c09b] divide-x-[2px] divide-[#d3c09b] bg-white/40">
                    <div className="flex flex-col items-center justify-center py-2 px-1 hover:bg-white/60 transition-colors w-[15%]">
                        <span className="text-[11px] font-bold text-[#0B2149] tracking-widest mb-[2px]" style={{ textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.8), 1px 1px 0px #051024' }}>OT BKS</span>
                        <span className="text-[#2d5a3c] font-bold text-xl" style={{ textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.8), 1px 1px 0px #112a13' }}>{selectedPhaseStats.ot_bks}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-2 px-1 hover:bg-white/60 transition-colors w-[15%]">
                        <span className="text-[11px] font-bold text-[#0B2149] tracking-widest mb-[2px]" style={{ textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.8), 1px 1px 0px #051024' }}>NT BKS</span>
                        <span className="text-[#0B2149] font-bold text-xl" style={{ textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.8), 1px 1px 0px #051024' }}>{selectedPhaseStats.nt_bks}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-2 px-1 hover:bg-white/60 transition-colors w-[15%]">
                        <span className="text-[11px] font-bold text-[#0B2149] tracking-widest mb-[2px]" style={{ textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.8), 1px 1px 0px #051024' }}>CHAP</span>
                        <span className="text-[#0B2149] font-bold text-xl" style={{ textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.8), 1px 1px 0px #051024' }}>{selectedPhaseStats.chp}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-2 px-1 hover:bg-white/60 transition-colors w-[20%]">
                        <span className="text-[11px] font-bold text-[#0B2149] tracking-widest mb-[2px]" style={{ textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.8), 1px 1px 0px #051024' }}>VRS</span>
                        <span className="text-[#2d5a3c] font-bold text-xl" style={{ textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.8), 1px 1px 0px #112a13' }}>{selectedPhaseStats.ver}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-2 px-1 hover:bg-white/40 transition-colors w-[35%] bg-white/20 relative">
                        <i className="pi pi-book text-[#0B2149] text-xl mb-1 drop-shadow-sm opacity-60"></i>
                        <span className="text-[11px] font-bold text-[#0B2149] tracking-widest z-10" style={{ textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.8), 1px 1px 0px #051024' }}>ENGLISH WORDS</span>
                        <span className="text-[#0B2149] font-bold text-lg mt-1 z-10" style={{ textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.8), 1px 1px 0px #051024' }}>{selectedPhaseStats.english_words}</span>
                    </div>
                </div>
                <div className="flex flex-col w-[130px] divide-y-[2px] divide-[#d3c09b] bg-white/20">
                    <div className="flex-1 flex flex-col items-center justify-center py-1 hover:bg-white/40 transition-colors">
                        <div className="flex items-center gap-2">
                            <i className="pi pi-pencil text-[#8b2b2b] text-[10px]"></i>
                            <span className="text-[11px] font-bold text-[#0B2149] tracking-widest" style={{ textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.8), 1px 1px 0px #051024' }}>HEB - WORDS</span>
                        </div>
                        <span className="text-[#8b2b2b] font-bold text-sm leading-none mt-1" style={{ textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.8), 1px 1px 0px #3a0d0d' }}>{selectedPhaseStats.hebrew_words}</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center py-1 hover:bg-white/40 transition-colors">
                        <div className="flex items-center gap-2">
                            <i className="pi pi-list text-[#8b2b2b] text-[10px]"></i>
                            <span className="text-[11px] font-bold text-[#0B2149] tracking-widest" style={{ textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.8), 1px 1px 0px #051024' }}>GK - WORDS</span>
                        </div>
                        <span className="text-[#8b2b2b] font-bold text-sm leading-none mt-1" style={{ textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.8), 1px 1px 0px #3a0d0d' }}>{selectedPhaseStats.greek_words}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatStrips;
