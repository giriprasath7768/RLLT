import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardHeader from './LightChartDigitalComponents/DashboardHeader';
import ModuleSelector from './LightChartDigitalComponents/ModuleSelector';
import FacetsPhasesGrids from './LightChartDigitalComponents/FacetsPhasesGrids';
import StatStrips from './LightChartDigitalComponents/StatStrips';
import FooterVisual from './LightChartDigitalComponents/FooterVisual';

const OT_BOOKS = ["GEN","EXO","LEV","NUM","DEU","JOS","JDG","RUT","1SA","2SA","1KI","2KI","1CH","2CH","EZR","NEH","EST","JOB","ECC","SOS","ISA","JER","LAM","EZE","DAN","HOS","JOE","AMO","OBA","JON","MIC","NAH","HAB","ZEP","HAG","ZEC","MAL"];
const NT_BOOKS = ["MAT","MAR","LUK","JOH","ACT","ROM","1CO","2CO","GAL","EPH","PHP","COL","1TH","2TH","1TI","2TI","TIT","PHM","HEB","JAM","1PE","2PE","1JN","2JN","3JN","JUD","REV"];
const PRO_BOOKS = ["PRO"];

const parseArtStringToMins = (val) => {
    if (!val && val !== 0) return 0;
    if (typeof val === 'number') return val;
    const t = val.toString().trim().toLowerCase();
    if (t.includes('h')) {
        const match = t.match(/(\d+)\s*h[.\s]*(\d*)/);
        if (match) {
            return (parseInt(match[1] || 0, 10) * 60) + (parseInt(match[2] || 0, 10));
        }
    }
    if (t.includes('.')) {
        const parts = t.split('.');
        let sStr = (parts[1] || '0').replace(/[^\d]/g, '');
        if (sStr.length === 1) sStr += '0';
        const minsPart = parseInt((parts[0] || '0').replace(/[^\d]/g, ''), 10) || 0;
        const secsPart = parseInt(sStr.substring(0, 2) || '0', 10) || 0;
        return minsPart + (secsPart / 60);
    }
    return parseFloat(t.replace(/[^\d.]/g, '')) || 0;
};

const parseDateTimeToMs = (dateStr, timeStr) => {
    if (!dateStr) return 0;
    const cleanDate = String(dateStr).trim().replace(/\//g, '-');
    const parts = cleanDate.split('-');
    if (parts.length !== 3) return 0;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return 0;
    let hours = 0, minutes = 0;
    if (timeStr) {
        const tMatch = String(timeStr).trim().match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (tMatch) {
            hours = parseInt(tMatch[1], 10) || 0;
            minutes = parseInt(tMatch[2], 10) || 0;
            const ampm = (tMatch[3] || '').toUpperCase();
            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
        }
    }
    return new Date(year, month, day, hours, minutes).getTime() || 0;
};

const getChartSortTimestamp = (chart) => {
    if (!chart) return 0;
    if (chart.created_at) {
        const isoTs = new Date(chart.created_at).getTime();
        if (!isNaN(isoTs) && isoTs > 0) return isoTs;
    }
    try {
        if (chart.state_payload) {
            const parsed = typeof chart.state_payload === 'string'
                ? JSON.parse(chart.state_payload)
                : chart.state_payload;
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                const cDate = parsed.createdDate || chart.date;
                const cTime = parsed.createdTime || chart.time;
                const ts = parseDateTimeToMs(cDate, cTime);
                if (ts > 0) return ts;
            }
        }
    } catch (e) {}
    return parseDateTimeToMs(chart.date, chart.time);
};

const parseChartPayloadStats = (statePayloadStr) => {
    let ot = new Set(), nt = new Set(), pro = new Set(), psa = new Set(), psa119 = new Set(), dpsa = new Set();
    let chap = 0, ver = 0, artMins = 0, daysCount = 0;
    let numDaysMeta = 0, grandChp = 0, grandVer = 0, grandArtMins = 0, chunksCount = 0;
    try {
        const payload = typeof statePayloadStr === 'string' ? JSON.parse(statePayloadStr) : statePayloadStr;
        let chunks = [];
        if (Array.isArray(payload)) {
            chunks = payload;
        } else if (payload && typeof payload === 'object') {
            const fullPlan = payload.fullPlan && typeof payload.fullPlan === 'object' ? payload.fullPlan : {};
            chunks = Array.isArray(payload.payload)
                ? payload.payload
                : (Array.isArray(payload.chunks)
                    ? payload.chunks
                    : (Array.isArray(fullPlan.chunks) ? fullPlan.chunks : []));
            numDaysMeta = Number(payload.numDays || fullPlan.numDays) || 0;
            grandChp = Number(payload.grandTotalChapters || fullPlan.grandTotalChapters) || 0;
            grandVer = Number(payload.grandTotalVerses || fullPlan.grandTotalVerses) || 0;
            grandArtMins = Number(payload.grandTotalArtMins || fullPlan.grandTotalArtMins) || 0;
        }
        chunksCount = Array.isArray(chunks) ? chunks.length : 0;
        const bookKeys = ['m1b', 'm2b', 'm3b', 'm3b_morning', 'm3b_evening', 'm4b', 'm4b_morning', 'm4b_evening', 'm5b'];
        if (Array.isArray(chunks)) {
            chunks.forEach(chunk => {
                if (chunk && Array.isArray(chunk.days)) {
                    chunk.days.forEach(d => {
                        if (!d) return;
                        daysCount++;
                        chap += Number(d.chap) || 0;
                        ver += Number(d.verse) || 0;
                        if (d.artMins !== undefined && d.artMins !== null && Number(d.artMins) > 0) {
                            artMins += Number(d.artMins);
                        } else if (d.art) {
                            artMins += parseArtStringToMins(d.art);
                        }
                        bookKeys.forEach(key => {
                            if (d[key]) {
                                const rawStr = d[key].toString().toUpperCase();
                                rawStr.split(',').forEach(seg => {
                                    const segClean = seg.trim();
                                    if (!segClean) return;
                                    if (segClean.includes('DAVID') || segClean.includes('D.PSA') || segClean.includes('DPSA')) {
                                        dpsa.add('DPSA');
                                        return;
                                    }
                                    const match = segClean.match(/^(\d?\s*[A-Z]+)\b/);
                                    if (match) {
                                        const bk = match[1].replace(/\s+/g, '');
                                        if (bk === 'PSA' || bk === 'PSALM' || bk === 'PSALMS') {
                                            if (segClean.includes('119') && !segClean.includes('-')) {
                                                psa119.add('PSA119');
                                            } else {
                                                psa.add('PSA');
                                            }
                                        } else if (PRO_BOOKS.includes(bk) || bk === 'PROV' || bk === 'PROVERBS') {
                                            pro.add('PRO');
                                        } else if (OT_BOOKS.includes(bk)) {
                                            ot.add(bk);
                                        } else if (NT_BOOKS.includes(bk)) {
                                            nt.add(bk);
                                        }
                                    }
                                });
                            }
                        });
                    });
                }
            });
        }
    } catch (e) {}

    const resolvedDays = numDaysMeta > 0 ? numDaysMeta : daysCount;
    const resolvedChp = grandChp > 0 ? grandChp : chap;
    const resolvedVer = grandVer > 0 ? grandVer : ver;
    const resolvedArtMins = grandArtMins > 0 ? grandArtMins : artMins;
    const resolvedWe5 = resolvedDays > 0 ? Math.max(1, Math.ceil(resolvedDays / 5)) : (chunksCount || 6);

    let artStr = "0m";
    if (resolvedArtMins > 0) {
        const rounded = Math.round(resolvedArtMins);
        const h = Math.floor(rounded / 60);
        const m = rounded % 60;
        artStr = h > 0 ? (m > 0 ? `${h}h.${m}m` : `${h}h`) : `${m}m`;
    }

    return {
        days: resolvedDays || 30,
        weeks: String(resolvedWe5),
        art: artStr,
        ot_bks: ot.size > 0 ? String(ot.size) : "-",
        nt_bks: nt.size > 0 ? String(nt.size) : "-",
        chp: resolvedChp > 0 ? String(resolvedChp) : "-",
        ver: resolvedVer > 0 ? String(resolvedVer) : "-",
    };
};

const LightChartDigital = () => {
    const [rlltDB, setRlltDB] = useState([]);
    const [chartsDB, setChartsDB] = useState([]);
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
        const baseUrl = 'http://' + window.location.hostname + ':8000';
        Promise.all([
            axios.get(`${baseUrl}/api/rllt_lookup`, { withCredentials: true }),
            axios.get(`${baseUrl}/api/charts/list`, { withCredentials: true }).catch(() => ({ data: [] })),
            axios.get(`${baseUrl}/api/charts/reading-plans`, { withCredentials: true }).catch(() => ({ data: [] }))
        ])
            .then(([rlltRes, chartsRes, rpRes]) => {
                const data = Array.isArray(rlltRes.data) ? rlltRes.data : [];
                setRlltDB(data);
                const baseCharts = Array.isArray(chartsRes.data) ? chartsRes.data : [];
                const rpCharts = Array.isArray(rpRes.data) ? rpRes.data.filter(r => r && r.state_payload) : [];
                setChartsDB([...rpCharts, ...baseCharts]);
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
        return {
            modules: mods,
            facets: allFacets.size > 0 ? allFacets.size : 40,
            phases: 153
        };
    }, [rlltDB, uniqueModules]);

    const fctStats = React.useMemo(() => {
        if (mdl === 5) {
            return { maxPhase: fct === 1 ? 4 : 5 };
        }
        const fctRecords = rlltDB.filter(d => Number(d.module) === mdl && Number(d.facet) === fct);
        const phasesSet = new Set(fctRecords.map(d => Number(d.phase)).filter(p => !isNaN(p) && p > 0));
        const maxPhase = phasesSet.size > 0 ? Math.max(...Array.from(phasesSet)) : 12;
        return { maxPhase };
    }, [rlltDB, mdl, fct]);

    const selectedPhaseStats = React.useMemo(() => {
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

        let usedChart = false;
        if (mdl === 5 && fct >= 2) {
            const matchingCharts = (chartsDB || []).filter(
                c => Number(c.module) === 5 && Number(c.facet) === fct && Number(c.phase) === phs && c.state_payload
            );
            if (matchingCharts.length > 0) {
                const sorted = [...matchingCharts].sort((a, b) => getChartSortTimestamp(b) - getChartSortTimestamp(a));
                const parsedStats = parseChartPayloadStats(sorted[0].state_payload);
                days = parsedStats.days;
                weeks = parsedStats.weeks;
                art = parsedStats.art;
                ot_bks = parsedStats.ot_bks;
                nt_bks = parsedStats.nt_bks;
                chp = parsedStats.chp;
                ver = parsedStats.ver;
                usedChart = true;
            }
        }

        if (!usedChart) {
            let currentData = rlltDB.find(d => Number(d.module) === mdl && Number(d.facet) === fct && Number(d.phase) === phs);
            if (!currentData && mdl !== 5) {
                currentData = rlltDB.find(d => Number(d.module) === mdl && Number(d.facet) === fct)
                           || rlltDB.find(d => Number(d.module) === mdl);
            } else if (!currentData && mdl === 5 && fct === 1) {
                currentData = rlltDB.find(d => Number(d.module) === 5 && Number(d.facet) === 1);
            }

            if (currentData) {
                days = Number(currentData.scheduled_value_days) || 30;
                art = currentData.art && currentData.art !== '-' ? currentData.art : "0m";
                weeks = currentData.we5 && currentData.we5 !== '-' ? currentData.we5 : "0";
                ot_bks = currentData.ot_bks || "-";
                nt_bks = currentData.nt_bks || "-";
                chp = currentData.chp || "-";
                ver = currentData.ver || "-";
            }
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
    }, [rlltDB, chartsDB, mdl, fct, phs]);

    const modStats = React.useMemo(() => {
        if (mdl === 5) {
            return {
                days: selectedPhaseStats.days || 30,
                totalFacetsCount: 5,
                totalPhasesCount: 24,
                maxFacet: 5,
                maxPhase: 5
            };
        }
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
    }, [rlltDB, mdl, fct, phs, selectedPhaseStats.days]);

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
