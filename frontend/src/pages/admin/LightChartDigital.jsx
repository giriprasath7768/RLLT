import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardHeader from './LightChartDigitalComponents/DashboardHeader';
import ModuleSelector from './LightChartDigitalComponents/ModuleSelector';
import FacetsPhasesGrids from './LightChartDigitalComponents/FacetsPhasesGrids';
import StatStrips from './LightChartDigitalComponents/StatStrips';
import FooterVisual from './LightChartDigitalComponents/FooterVisual';

const LightChartDigital = () => {
    const [rlltDB, setRlltDB] = useState([]);
    const [mdl, setMdl] = useState(1);
    const [fct, setFct] = useState(1);
    const [phs, setPhs] = useState(1);

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
        const unique = new Set(rlltDB.map(d => Number(d.module)).filter(m => !isNaN(m) && m > 0));
        // Always include modules 1 to 5 as they are core modules, even if empty in DB
        [1, 2, 3, 4, 5].forEach(m => unique.add(m));
        return Array.from(unique).sort((a, b) => a - b);
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

        const facetsSet = new Set(modRecords.map(d => Number(d.facet)).filter(f => !isNaN(f) && f > 0));
        const phasesSet = new Set(modRecords.map(d => Number(d.phase)).filter(p => !isNaN(p) && p > 0));
        
        const totalFacetsCount = facetsSet.size > 0 ? facetsSet.size : 12;
        
        const uniquePhasesInMod = new Set(modRecords.map(d => `${d.facet}-${d.phase}`));
        const totalPhasesCount = uniquePhasesInMod.size > 0 ? uniquePhasesInMod.size : 75;
        
        const maxFacet = facetsSet.size > 0 ? Math.max(...Array.from(facetsSet)) : 12;
        const maxPhase = phasesSet.size > 0 ? Math.max(...Array.from(phasesSet)) : 12;

        return { days, totalFacetsCount, totalPhasesCount, maxFacet, maxPhase };
    }, [rlltDB, mdl, fct, phs]);

    const fctStats = React.useMemo(() => {
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

        if (currentData) {
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
            artParts.push(<span key="h" className="text-xl">H</span>);
            if (splitH[1]) {
                const rest = splitH[1].trim();
                if (rest.includes('m')) {
                    const numberPart = rest.replace(/[^\d]/g, '');
                    const textPart = rest.replace(/[\d]/g, '');
                    artParts.push(' ' + numberPart);
                    artParts.push(<span key="m" className="text-xl">{textPart}</span>);
                } else {
                    artParts.push(' ' + rest);
                }
            }
        } else if (formattedArt.includes('m')) {
            const numberPart = formattedArt.replace(/[^\d]/g, '');
            const textPart = formattedArt.replace(/[\d]/g, '');
            artParts.push(numberPart);
            artParts.push(<span key="m" className="text-xl">{textPart}</span>);
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
    }, [rlltDB, mdl, fct, phs]);

    const handleDecMdl = () => {
        const idx = uniqueModules.indexOf(mdl);
        if (idx > 0) setMdl(uniqueModules[idx - 1]);
    };

    const handleIncMdl = () => {
        const idx = uniqueModules.indexOf(mdl);
        if (idx !== -1 && idx < uniqueModules.length - 1) setMdl(uniqueModules[idx + 1]);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#e8dcb9] to-[#fcf8ef] py-4 flex justify-center items-start font-sans overflow-x-hidden w-full">
            <style>{`
                @media (max-width: 380px) {
                    .mobile-compact {
                        width: 630px !important;
                        max-width: 630px !important;
                        zoom: 0.55;
                    }
                }
                @media (min-width: 381px) and (max-width: 450px) {
                    .mobile-compact {
                        width: 630px !important;
                        max-width: 630px !important;
                        zoom: 0.65;
                    }
                }
                @media (min-width: 451px) and (max-width: 549px) {
                    .mobile-compact {
                        width: 630px !important;
                        max-width: 630px !important;
                        zoom: 0.75;
                    }
                }
                @media (min-width: 550px) and (max-width: 640px) {
                    .mobile-compact {
                        width: 630px !important;
                        max-width: 630px !important;
                        zoom: 0.85;
                    }
                }
                @media (min-width: 641px) {
                    .mobile-compact {
                        width: 630px !important;
                        max-width: 630px !important;
                        zoom: 1;
                    }
                }
            `}</style>
            
            {/* Main Container */}
            <div className="bg-[#fdfbf6] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(0,0,0,0.05)] relative border-[6px] border-[#d4af37] outline outline-[1px] outline-black/10 overflow-hidden mobile-compact">
                
                <DashboardHeader globalStats={globalStats} />
                
                {/* Combined Module & Grids Container */}
                <div className="mx-[18px] mt-2 p-3 pb-2 bg-gradient-to-br from-[#fdfbf6] to-[#f0e4cd] border-[3px] border-[#d3c09b] rounded-xl shadow-[0_5px_15px_rgba(0,0,0,0.1),inset_0_2px_10px_rgba(255,255,255,1)] flex flex-col gap-3 relative z-10">
                    <ModuleSelector 
                        mdl={mdl} 
                        modStats={modStats} 
                        handleDecMdl={handleDecMdl} 
                        handleIncMdl={handleIncMdl} 
                    />

                    <FacetsPhasesGrids 
                        fct={fct} 
                        phs={phs} 
                        setFct={setFct} 
                        setPhs={setPhs} 
                        modStats={modStats} 
                        fctStats={fctStats} 
                    />
                </div>

                <StatStrips selectedPhaseStats={selectedPhaseStats} />

                <FooterVisual />
            </div>
        </div>
    );
};

export default LightChartDigital;
