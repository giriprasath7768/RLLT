import React from 'react';

const ModuleSelector = ({ mdl, modStats, handleDecMdl, handleIncMdl }) => {
    return (
        <div className="flex flex-col gap-3 w-full relative items-center z-20">
            
            {/* Equation row */}
            <div className="flex flex-row items-center justify-center gap-6 mb-3 w-full relative z-10">
                <button 
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-[#fdfbf6] to-[#e8dcb9] border-2 border-[#d3c09b] text-[#0B2149] font-bold text-2xl cursor-pointer hover:bg-gradient-to-br hover:from-[#e8dcb9] hover:to-[#d3c09b] transition-all shadow-[4px_4px_8px_rgba(0,0,0,0.15),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] pb-1"
                    onClick={handleDecMdl}
                >
                    -
                </button>
                
                <div className="bg-gradient-to-br from-[#fcf8ef] to-[#e6d5b0] border-[3px] border-[#d3c09b] rounded-lg flex flex-col items-center justify-center w-[110px] h-[65px] shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.9),4px_4px_10px_rgba(0,0,0,0.15)] transform transition-transform hover:scale-[1.02]">
                    <span className="text-[12px] font-bold text-[#0B2149] tracking-[0.2em] drop-shadow-sm mt-1">MODULE</span>
                    <span className="text-3xl text-[#a67c00] font-bold leading-none mt-1" style={{ fontFamily: "Arial, sans-serif", textShadow: '1px 1px 0px #8a6600, 2px 2px 0px #6e5100, 3px 3px 4px rgba(0,0,0,0.4)' }}>{mdl}</span>
                </div>

                <button 
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-[#fdfbf6] to-[#e8dcb9] border-2 border-[#d3c09b] text-[#0B2149] font-bold text-2xl cursor-pointer hover:bg-gradient-to-br hover:from-[#e8dcb9] hover:to-[#d3c09b] transition-all shadow-[4px_4px_8px_rgba(0,0,0,0.15),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.7)]"
                    onClick={handleIncMdl}
                >
                    +
                </button>

                <div className="bg-gradient-to-br from-[#fcf8ef] to-[#e6d5b0] border-[3px] border-[#d3c09b] rounded-lg flex flex-col items-center justify-center w-[110px] h-[65px] shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.9),4px_4px_10px_rgba(0,0,0,0.15)] transform transition-transform hover:scale-[1.02]">
                    <span className="text-[12px] font-bold text-[#0B2149] tracking-[0.2em] drop-shadow-sm mt-1">DAYS</span>
                    <span className="text-3xl text-[#a67c00] font-bold leading-none mt-1" style={{ fontFamily: "Arial, sans-serif", textShadow: '1px 1px 0px #8a6600, 2px 2px 0px #6e5100, 3px 3px 4px rgba(0,0,0,0.4)' }}>{modStats.days}</span>
                </div>
            </div>

            {/* Pill Summary */}
            <div className="bg-gradient-to-br from-[#fdfbf6] to-[#e8dcb9] border-[2px] border-[#d3c09b] rounded-full py-1.5 px-4 inline-flex shadow-[3px_3px_6px_rgba(0,0,0,0.15),-3px_-3px_6px_rgba(255,255,255,0.8),inset_2px_2px_4px_rgba(255,255,255,0.9),inset_-2px_-2px_4px_rgba(0,0,0,0.05)] relative z-10 w-[80%] overflow-hidden justify-center items-center">
                <span className="text-[11px] font-bold text-[#0B2149] tracking-[0.1em] block w-full text-center truncate" style={{ textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.8), 1px 1px 0px #051024' }}>
                    MODULE {mdl}: {modStats.totalFacetsCount} FACETS. {modStats.totalPhasesCount} PHASES. EACH PHASE {modStats.days} DAYS
                </span>
            </div>
        </div>
    );
};

export default ModuleSelector;
