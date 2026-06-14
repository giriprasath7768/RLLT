import React from 'react';

const FacetsPhasesGrids = ({ fct, phs, setFct, setPhs, modStats, fctStats }) => {
    return (
        <div className="flex flex-row gap-4 w-full h-[120px]">
            {/* FACETS Grid */}
            <div className="flex-1 bg-[#0f2115] rounded-xl border-[2px] border-[#d3c09b] py-[2px] pr-[2px] pl-[14px] shadow-[4px_4px_10px_rgba(0,0,0,0.3)] flex">
                {/* Main Face */}
                <div className="flex-1 bg-gradient-to-b from-[#112a13] to-[#0b1b0c] border-[2px] border-[#d3c09b] rounded-lg flex flex-col overflow-hidden">
                    <div className="text-center text-[#d3c09b] py-1 font-bold tracking-[0.4em] text-[11px] border-b-[2px] border-[#d3c09b]" style={{ fontFamily: "Arial, sans-serif" }}>
                        F A C E T S
                    </div>
                    <div className="grid grid-cols-4 flex-1 bg-[#fdfbf6] p-1 gap-1">
                        {Array.from({ length: modStats.maxFacet }, (_, i) => i + 1).map(num => (
                            <button 
                                key={num} 
                                onClick={() => setFct(num)}
                                className={`border-[1.5px] border-[#d3c09b] rounded flex items-center justify-center text-sm font-bold shadow-sm cursor-pointer transition-all transform hover:scale-[1.05]
                                    ${fct === num 
                                        ? 'bg-gradient-to-br from-[#c7a96b] to-[#a67c00] text-white shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)]' 
                                        : 'bg-gradient-to-br from-[#fcf8ef] to-[#e6d5b0] text-[#1e4620] hover:from-[#f0e4cd] hover:to-[#dfcba4] shadow-[2px_2px_4px_rgba(0,0,0,0.1)]'
                                    }`} 
                                style={{ fontFamily: "Arial, sans-serif" }}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* PHASES Grid */}
            <div className="flex-1 bg-[#3a0d0d] rounded-xl border-[2px] border-[#d3c09b] py-[2px] pl-[2px] pr-[14px] shadow-[4px_4px_10px_rgba(0,0,0,0.3)] flex">
                {/* Main Face */}
                <div className="flex-1 bg-gradient-to-b from-[#591414] to-[#3a0d0d] border-[2px] border-[#d3c09b] rounded-lg flex flex-col overflow-hidden">
                    <div className="text-center text-[#d3c09b] py-1 font-bold tracking-[0.4em] text-[11px] border-b-[2px] border-[#d3c09b]" style={{ fontFamily: "Arial, sans-serif" }}>
                        P H A S E S
                    </div>
                    <div className={`p-1 gap-1 flex-1 bg-[#fdfbf6] ${fctStats.maxPhase === 1 ? 'flex items-center justify-center' : 'grid grid-cols-4 content-start'}`}>
                        {Array.from({ length: fctStats.maxPhase }, (_, i) => i + 1).map(num => (
                            <button 
                                key={num} 
                                onClick={() => setPhs(num)}
                                className={`border-[1.5px] border-[#d3c09b] rounded flex items-center justify-center font-bold shadow-sm cursor-pointer transition-all transform hover:scale-[1.05]
                                    ${fctStats.maxPhase === 1 ? 'w-full h-full text-4xl' : 'text-sm min-h-[35px]'} 
                                    ${phs === num 
                                        ? 'bg-gradient-to-br from-[#c7a96b] to-[#a67c00] text-white shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)]' 
                                        : 'bg-gradient-to-br from-[#fcf8ef] to-[#e6d5b0] text-[#8b2b2b] hover:from-[#f0e4cd] hover:to-[#dfcba4] shadow-[2px_2px_4px_rgba(0,0,0,0.1)]'
                                    }`} 
                                style={{ fontFamily: "Arial, sans-serif" }}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacetsPhasesGrids;
