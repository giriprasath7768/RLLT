import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BookSelectionModal from '../../components/BookSelectionModal';

const LightChartDigital = () => {
    const [rlltDB, setRlltDB] = useState([]);
    const [mdl, setMdl] = useState(1);
    const [fct, setFct] = useState(1);
    const [phs, setPhs] = useState(1);
    const [bookModalVisible, setBookModalVisible] = useState(false);
    const [mod5Overrides, setMod5Overrides] = useState({});

    useEffect(() => {
        setFct(1);
        setPhs(1);
    }, [mdl]);

    useEffect(() => {
        setPhs(1);
    }, [fct]);

    useEffect(() => {
        axios.get('http://' + window.location.hostname + ':8000/api/rllt_lookup', { withCredentials: true })
            .then(res => {
                const data = res.data;
                setRlltDB(data);
                if (data && data.length > 0) {
                    setMdl(1);
                }
            })
            .catch(err => console.error(err));
    }, []);

    const uniqueModules = React.useMemo(() => {
        const unique = [...new Set(rlltDB.map(d => Number(d.module)))].filter(m => !isNaN(m) && m > 0);
        return unique.sort((a, b) => a - b);
    }, [rlltDB]);

    const globalStats = React.useMemo(() => {
        const mods = uniqueModules.length > 0 ? Math.max(...uniqueModules) : 5;
        const allFacets = new Set(rlltDB.map(d => `${d.module}-${d.facet}`));
        const allPhases = new Set(rlltDB.map(d => `${d.module}-${d.facet}-${d.phase}`));
        return {
            modules: mods,
            facets: allFacets.size > 0 ? allFacets.size : 40,
            phases: 153
        };
    }, [rlltDB, uniqueModules]);

    const modStats = React.useMemo(() => {
        const modRecords = rlltDB.filter(d => Number(d.module) === mdl);
        let days = 30;
        if (modRecords.length > 0 && modRecords[0].scheduled_value_days) {
            days = Number(modRecords[0].scheduled_value_days);
        }

        if (mdl === 5) {
            const currentOverride = mod5Overrides[`${fct}-${phs}`];
            return {
                days: currentOverride ? currentOverride.days : 0,
                totalFacetsCount: 5,
                totalPhasesCount: 5,
                maxFacet: 5,
                maxPhase: 5
            };
        }

        const facetsSet = new Set(modRecords.map(d => Number(d.facet)).filter(f => !isNaN(f) && f > 0));
        const phasesSet = new Set(modRecords.map(d => Number(d.phase)).filter(p => !isNaN(p) && p > 0));
        
        const totalFacetsCount = facetsSet.size > 0 ? facetsSet.size : 12;
        
        const uniquePhasesInMod = new Set(modRecords.map(d => `${d.facet}-${d.phase}`));
        const totalPhasesCount = uniquePhasesInMod.size > 0 ? uniquePhasesInMod.size : 75;
        
        const maxFacet = facetsSet.size > 0 ? Math.max(...Array.from(facetsSet)) : 12;
        const maxPhase = phasesSet.size > 0 ? Math.max(...Array.from(phasesSet)) : 12;

        return { days, totalFacetsCount, totalPhasesCount, maxFacet, maxPhase };
    }, [rlltDB, mdl, fct, phs, mod5Overrides]);

    const fctStats = React.useMemo(() => {
        if (mdl === 5) {
            return { maxPhase: 5 };
        }
        const fctRecords = rlltDB.filter(d => Number(d.module) === mdl && Number(d.facet) === fct);
        const phasesSet = new Set(fctRecords.map(d => Number(d.phase)).filter(p => !isNaN(p) && p > 0));
        const maxPhase = phasesSet.size > 0 ? Math.max(...Array.from(phasesSet)) : 12;
        return { maxPhase };
    }, [rlltDB, mdl, fct]);

    const selectedPhaseStats = React.useMemo(() => {
        let currentData = rlltDB.find(d => Number(d.module) === mdl && Number(d.facet) === fct && Number(d.phase) === phs)
                       || rlltDB.find(d => Number(d.module) === mdl && Number(d.facet) === fct)
                       || rlltDB.find(d => Number(d.module) === mdl);
        
        let days = 30;
        let art = "0m";
        let weeks = "0";
        let ot_bks = "-";
        let nt_bks = "-";
        let chp = "-";
        let ver = "-";
        let english_words = "-";
        let hebrew_words = "-";
        let greek_words = "-";

        if (mdl === 5) {
            if (mod5Overrides[`${fct}-${phs}`]) {
                const override = mod5Overrides[`${fct}-${phs}`];
                days = override.days || 0;
                art = override.art || "0m";
                weeks = override.we5 || "0";
                ot_bks = override.ot_bks || "0";
                nt_bks = override.nt_bks || "0";
                chp = override.chp || "0";
                ver = override.ver || "0";
                english_words = override.english_words || "0";
                hebrew_words = override.hebrew_words || "0";
                greek_words = override.greek_words || "0";
            } else {
                days = 0;
                art = "0m";
                weeks = "0";
                ot_bks = "0";
                nt_bks = "0";
                chp = "0";
                ver = "0";
                english_words = "0";
                hebrew_words = "0";
                greek_words = "0";
            }
        } else if (currentData) {
            days = Number(currentData.scheduled_value_days) || 30;
            art = currentData.art || "0m";
            weeks = currentData.we5 || "0";
            ot_bks = currentData.ot_bks || "-";
            nt_bks = currentData.nt_bks || "-";
            chp = currentData.chp || "-";
            ver = currentData.ver || "-";
            english_words = "-"; 
            hebrew_words = "-";
            greek_words = "-";
        }

        let formattedArt = art.replace('h.', 'H ').replace('h', 'H');
        let artParts = [];
        if (formattedArt.includes('H')) {
            const splitH = formattedArt.split('H');
            artParts.push(splitH[0]);
            artParts.push(<span key="h" className="text-2xl">H</span>);
            if (splitH[1]) {
                const rest = splitH[1].trim();
                if (rest.includes('m')) {
                    const numberPart = rest.replace(/[^\d]/g, '');
                    const textPart = rest.replace(/[\d]/g, '');
                    artParts.push(' ' + numberPart);
                    artParts.push(<span key="m" className="text-2xl">{textPart}</span>);
                } else {
                    artParts.push(' ' + rest);
                }
            }
        } else if (formattedArt.includes('m')) {
            const numberPart = formattedArt.replace(/[^\d]/g, '');
            const textPart = formattedArt.replace(/[\d]/g, '');
            artParts.push(numberPart);
            artParts.push(<span key="m" className="text-2xl">{textPart}</span>);
        } else {
            artParts.push(formattedArt);
        }

        return {
            days,
            weeks,
            artParts,
            ot_bks,
            nt_bks,
            chp,
            ver,
            english_words,
            hebrew_words,
            greek_words
        };
    }, [rlltDB, mdl, fct, phs, mod5Overrides]);

    const handleDecMdl = () => {
        const idx = uniqueModules.indexOf(mdl);
        if (idx > 0) setMdl(uniqueModules[idx - 1]);
    };

    const handleIncMdl = () => {
        const idx = uniqueModules.indexOf(mdl);
        if (idx !== -1 && idx < uniqueModules.length - 1) setMdl(uniqueModules[idx + 1]);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8 flex justify-start md:justify-center items-start font-sans overflow-x-auto w-full">
            <div className="bg-[#fcf8ef] rounded-lg shadow-2xl w-full min-w-[780px] max-w-[800px] relative" style={{ border: '2px solid #d3c09b', outline: '4px solid #fcf8ef', outlineOffset: '-6px' }}>
                
                {/* Top Section */}
                <div className="p-6 pb-2">
                    <div className="flex justify-between items-start">
                        
                        {/* Logo Left */}
                        <div className="flex flex-col items-center mt-1">
                            <div className="relative w-24 h-28 flex items-center justify-center mb-1">
                                <svg viewBox="0 0 100 115" className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(3px 5px 5px rgba(0,0,0,0.4))' }}>
                                    <polygon points="50,5 94,30 94,85 50,110 6,85 6,30" fill="#0B2149" stroke="#d3c09b" strokeWidth="8" strokeLinejoin="round" />
                                </svg>
                                <span className="relative text-[3.8rem] text-[#d3c09b] transform -translate-y-1" style={{ 
                                    fontFamily: "'Algerian', serif",
                                    textShadow: '1px 1px 0px #b09c73, 2px 2px 0px #9d8960, 3px 3px 0px #8a774e, 4px 4px 0px #75633c, 5px 5px 0px #63522f, 7px 7px 10px rgba(0,0,0,0.6)'
                                }}>D</span>
                            </div>
                            <div className="text-[10px] font-bold text-[#0B2149] text-center leading-tight tracking-widest">
                                LIGHT CHART<br/>DIGITAL
                            </div>
                        </div>

                        {/* Title Center */}
                        <div className="flex flex-col items-center mt-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-[#0B2149] tracking-widest text-center" style={{ fontFamily: "'Algerian', serif" }}>
                                REAL LIFE LEADERSHIP TRAINING
                            </h1>
                            <p className="text-[#a67c00] italic text-sm mt-1" style={{ fontFamily: "Georgia, serif" }}>
                                Leadership Impact. Growth. Healthy Transformation.
                            </p>
                            <div className="flex items-center gap-2 mt-2 w-full justify-center">
                                <div className="h-[1px] bg-[#d3c09b] flex-1 max-w-[100px]"></div>
                                <span className="text-[#d3c09b] text-xl leading-none">✧</span>
                                <div className="h-[1px] bg-[#d3c09b] flex-1 max-w-[100px]"></div>
                            </div>
                        </div>

                        {/* Stats Right */}
                        <div className="flex shrink-0 border-2 border-[#d3c09b] rounded-lg shadow-md overflow-hidden h-24 w-36">
                            <div className="flex flex-col w-1/2 bg-[#fcf8ef]">
                                <div className="flex-1 flex flex-col items-center justify-center border-b-2 border-[#d3c09b]">
                                    <span className="text-xl text-[#a67c00] leading-none mb-1" style={{ fontFamily: "'Times New Roman', Times, serif" }}>{globalStats.modules}</span>
                                    <span className="text-[8px] font-bold text-[#0B2149] tracking-widest">MODULES</span>
                                </div>
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <span className="text-xl text-[#a67c00] leading-none mb-1" style={{ fontFamily: "'Times New Roman', Times, serif" }}>{globalStats.facets}</span>
                                    <span className="text-[8px] font-bold text-[#0B2149] tracking-widest">FACETS</span>
                                </div>
                            </div>
                            <div className="w-1/2 flex flex-col items-center justify-center bg-[#0B2149] border-l-2 border-[#d3c09b]">
                                <span className="text-3xl text-[#d3c09b] leading-none mb-1" style={{ fontFamily: "'Times New Roman', Times, serif" }}>{globalStats.phases}</span>
                                <span className="text-[9px] font-bold text-[#d3c09b] tracking-widest mt-1">PHASES</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Module Selection Card Wrapper */}
                <div className="mx-6 mt-4 p-4 bg-[#fcf8ef] border-2 border-[#d3c09b] rounded-lg shadow-sm">
                    {/* Subtitle */}
                    <div className="text-center mb-4 flex flex-col items-center">
                        {/* Equation row */}
                        <div className="flex items-center justify-center gap-10 mb-4">
                            <span 
                                className="text-[#d3c09b] font-bold text-[42px] cursor-pointer hover:text-[#b5a07c] transition-colors leading-none" 
                                onClick={handleDecMdl}
                            >-</span>
                            <div className="bg-[#fcf8ef] border-2 border-[#d3c09b] rounded flex flex-col items-center justify-center w-32 h-24 shadow-inner">
                                <span className="text-[16px] font-bold text-[#0B2149] tracking-widest">MODULE</span>
                                <span className="text-[42px] text-[#5a6b5a] leading-none mt-1" style={{ fontFamily: "'Times New Roman', Times, serif" }}>{mdl}</span>
                            </div>
                            <span 
                                className="text-[#d3c09b] font-bold text-[42px] cursor-pointer hover:text-[#b5a07c] transition-colors leading-none"
                                onClick={handleIncMdl}
                            >+</span>
                            <div className="bg-[#fcf8ef] border-2 border-[#d3c09b] rounded flex flex-col items-center justify-center w-32 h-24 shadow-inner">
                                <span className="text-[16px] font-bold text-[#0B2149] tracking-widest">DAYS</span>
                                <span className="text-[42px] text-[#5a6b5a] leading-none mt-1" style={{ fontFamily: "'Times New Roman', Times, serif" }}>{modStats.days}</span>
                            </div>
                        </div>

                        <div className="bg-[#fdfbf6] border border-[#d3c09b] rounded py-1 px-4 inline-block shadow-sm">
                            <span className="text-xs font-bold text-[#0B2149] tracking-[0.15em]">
                                MODULE {mdl}: {modStats.totalFacetsCount} FACETS. {modStats.totalPhasesCount} PHASES. EACH PHASE {modStats.days} DAYS
                            </span>
                        </div>
                    </div>

                    {/* Grid Section */}
                    <div className="flex gap-4">
                        {/* FACETS Grid */}
                        <div className="flex-1 bg-gradient-to-r from-[#1e4620] to-[#2d5a3c] rounded-lg flex relative shadow-lg overflow-hidden p-1 pl-0">
                            <div className="w-20 flex items-center justify-center relative overflow-hidden">
                            </div>
                            <div className="flex-1 bg-[#fdfbf6] rounded border-[2px] border-[#d3c09b] flex flex-col shadow-[0_0_15px_rgba(0,0,0,0.6)] z-10 overflow-hidden">
                                <div className="text-center text-white bg-gradient-to-b from-[#1e4620] to-[#112a13] py-1 font-bold tracking-[0.3em] text-sm border-b-2 border-[#d3c09b]" style={{ fontFamily: "'Algerian', serif" }}>
                                    F A C E T S
                                </div>
                                <div className="grid grid-cols-4 flex-1 bg-[#fdfbf6]">
                                    {Array.from({ length: modStats.maxFacet }, (_, i) => i + 1).map(num => (
                                        <div 
                                            key={num} 
                                            onClick={() => setFct(num)}
                                            className={`border-[0.5px] border-[#e8dcb9] flex items-center justify-center text-xl shadow-sm cursor-pointer transition-colors ${fct === num ? 'bg-[#c7a96b] text-white font-bold' : 'bg-[#fcf8ef] text-[#5a6b5a] hover:bg-[#f0e4cd]'}`} 
                                            style={{ fontFamily: "Georgia, serif", minHeight: '40px' }}
                                        >
                                            {num}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* PHASES Grid */}
                        <div className="flex-1 bg-gradient-to-l from-[#8b2b2b] to-[#6b151a] rounded-lg flex relative shadow-lg overflow-hidden p-1 pr-0">
                            <div className="flex-1 bg-[#fdfbf6] rounded border-[2px] border-[#d3c09b] flex flex-col shadow-[0_0_15px_rgba(0,0,0,0.6)] z-10 overflow-hidden">
                                <div className="text-center text-white bg-gradient-to-b from-[#8b2b2b] to-[#591414] py-1 font-bold tracking-[0.3em] text-sm border-b-2 border-[#d3c09b]" style={{ fontFamily: "'Algerian', serif" }}>
                                    P H A S E S
                                </div>
                                <div className={fctStats.maxPhase === 1 ? "flex items-center justify-center flex-1 bg-[#fdfbf6]" : "grid grid-cols-4 flex-1 content-start bg-[#fdfbf6]"}>
                                    {Array.from({ length: fctStats.maxPhase }, (_, i) => i + 1).map(num => (
                                        <div 
                                            key={num} 
                                            onClick={() => {
                                                setPhs(num);
                                                if (mdl === 5) setBookModalVisible(true);
                                            }}
                                            className={`border-[0.5px] border-[#e8dcb9] flex items-center justify-center shadow-sm cursor-pointer transition-all ${fctStats.maxPhase === 1 ? 'w-full h-full text-5xl md:text-6xl font-bold' : 'text-xl'} ${phs === num ? 'bg-[#c7a96b] text-white font-bold' : 'bg-[#fcf8ef] text-[#5a6b5a] hover:bg-[#f0e4cd]'}`} 
                                            style={{ fontFamily: "Georgia, serif", minHeight: fctStats.maxPhase === 1 ? '96px' : '40px' }}
                                        >
                                            {num}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="w-20 flex items-center justify-center relative overflow-hidden">
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Row 1 */}
                <div className="px-6 mt-4">
                    <div className="bg-[#fdfbf6] border-2 border-[#d3c09b] rounded flex justify-between items-center shadow-sm relative overflow-hidden">
                        {/* Decorative watermark left */}
                        <div className="absolute left-0 top-0 bottom-0 w-20 opacity-10 flex items-center justify-center pointer-events-none">
                            <i className="pi pi-sun text-6xl text-[#a67c00]"></i>
                        </div>
                        {/* Decorative watermark right */}
                        <div className="absolute right-0 top-0 bottom-0 w-20 opacity-10 flex items-center justify-center pointer-events-none">
                            <i className="pi pi-sun text-6xl text-[#a67c00]"></i>
                        </div>

                        <div className="flex-1 flex flex-col items-center py-4 border-r border-[#e8dcb9] z-10">
                            <span className="text-[16px] font-bold text-[#0B2149] tracking-widest mb-1">WEEKS/PHASE</span>
                            <span className="text-[42px] text-[#a67c00] leading-none mt-1" style={{ fontFamily: "'Times New Roman', Times, serif" }}>{selectedPhaseStats.weeks}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center py-4 border-r border-[#e8dcb9] z-10">
                            <span className="text-[16px] font-bold text-[#0B2149] tracking-widest mb-1">DAYS/PHASE</span>
                            <span className="text-[42px] text-[#a67c00] leading-none mt-1" style={{ fontFamily: "'Times New Roman', Times, serif" }}>{selectedPhaseStats.days}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center py-4 z-10">
                            <span className="text-[16px] font-bold text-[#8b2b2b] tracking-widest mb-1">ART.</span>
                            <span className="text-[42px] text-[#a67c00] leading-none mt-1" style={{ fontFamily: "'Times New Roman', Times, serif" }}>{selectedPhaseStats.artParts}</span>
                        </div>
                    </div>
                </div>

                {/* Stats Row 2 (Icons) */}
                <div className="px-6 mt-4">
                    <div className="bg-[#fdfbf6] border-2 border-[#d3c09b] rounded flex shadow-sm divide-x divide-[#e8dcb9]">
                        <div className="flex-1 flex flex-col items-center justify-center py-3">
                            <span className="text-[14px] font-bold text-[#0B2149] tracking-wider mb-1">OT BKS</span>
                            <span className="text-[#2d5a3c] font-bold text-2xl">{selectedPhaseStats.ot_bks}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center py-3">
                            <span className="text-[14px] font-bold text-[#0B2149] tracking-wider mb-1">NT BKS</span>
                            <span className="text-[#0B2149] font-bold text-2xl">{selectedPhaseStats.nt_bks}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center py-3">
                            <span className="text-[14px] font-bold text-[#0B2149] tracking-wider mb-1">CHAP</span>
                            <span className="text-[#0B2149] font-bold text-2xl">{selectedPhaseStats.chp}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center py-3">
                            <span className="text-[14px] font-bold text-[#0B2149] tracking-wider mb-1">VRS</span>
                            <span className="text-[#2d5a3c] font-bold text-2xl">{selectedPhaseStats.ver}</span>
                        </div>
                        <div className="flex-[1.5] flex flex-col items-center justify-center py-3 bg-[#fdfbf6]">
                            <i className="pi pi-book text-[#0B2149] text-2xl mb-1"></i>
                            <span className="text-[14px] font-bold text-[#0B2149] tracking-wider">ENGLISH WORDS</span>
                            <span className="text-[#0B2149] font-bold text-2xl mt-1">{selectedPhaseStats.english_words}</span>
                        </div>
                        
                        <div className="flex-[2] flex flex-col">
                            <div className="flex-1 flex flex-col items-center justify-center border-b border-[#e8dcb9] py-2">
                                <div className="flex items-center gap-2">
                                    <i className="pi pi-pencil text-[#8b2b2b] text-[16px]"></i>
                                    <span className="text-[14px] font-bold text-[#0B2149] tracking-wider">HEB - WORDS</span>
                                </div>
                                <span className="text-[#8b2b2b] font-bold text-2xl leading-none mt-1">{selectedPhaseStats.hebrew_words}</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center py-2">
                                <div className="flex items-center gap-2">
                                    <i className="pi pi-building text-[#8b2b2b] text-[16px]"></i>
                                    <span className="text-[14px] font-bold text-[#0B2149] tracking-wider">GK. WORDS</span>
                                </div>
                                <span className="text-[#8b2b2b] font-bold text-2xl leading-none mt-1">{selectedPhaseStats.greek_words}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Image Area */}
                <div className="px-6 mt-4 mb-6">
                    <div className="rounded-lg overflow-hidden border-2 border-[#d3c09b] shadow-md">
                        <img src="/footer-image.png" alt="Discover More Footer" className="w-full object-cover" />
                    </div>
                </div>
            </div>
            
            <BookSelectionModal 
                visible={bookModalVisible} 
                onHide={() => setBookModalVisible(false)} 
                onConfirm={(stats) => {
                    setMod5Overrides(prev => ({
                        ...prev,
                        [`${fct}-${phs}`]: stats
                    }));
                    setBookModalVisible(false);
                }}
            />
        </div>
    );
};

export default LightChartDigital;
