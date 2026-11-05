import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const TRANSFORMATION_COLORS = [
    { hex: '#00b4ff', textClass: 'text-black' },
    { hex: '#00a651', textClass: 'text-black' },
    { hex: '#3340cd', textClass: 'text-white' },
    { hex: '#fafa33', textClass: 'text-black' },
    { hex: '#bb43b1', textClass: 'text-white' },
    { hex: '#fe6d01', textClass: 'text-black' },
    { hex: '#fe0005', textClass: 'text-white' }
];

/**
 * Increment/decrement number picker with minus (-) on the left and plus (+) on the right.
 */
const NumberWheelScroller = ({
    value,
    onChange,
    min = 0,
    max = 100,
    compact = false,
    disabled = false,
    className = '',
    textClassName = ''
}) => {
    const handleDecrement = () => {
        if (disabled) return;
        const nextVal = Math.max(min, Number(value) - 1);
        if (nextVal !== value) {
            onChange(nextVal);
        }
    };

    const handleIncrement = () => {
        if (disabled) return;
        const nextVal = Math.min(max, Number(value) + 1);
        if (nextVal !== value) {
            onChange(nextVal);
        }
    };

    if (compact) {
        return (
            <div
                className={`inline-flex items-center justify-between h-10 px-1 rounded-xl bg-[#f1f5f9] border border-[#cbd5e1] shadow-inner select-none gap-0.5 shrink-0 ${
                    disabled ? 'opacity-75 bg-slate-200/80' : ''
                } ${className}`}
            >
                <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={disabled || value <= min}
                    aria-label="Decrease value"
                    className="w-5 h-7 rounded-md bg-white hover:bg-slate-100 active:scale-95 border border-slate-200 text-slate-700 font-black text-xs flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                    −
                </button>
                <span className={`min-w-[18px] text-center px-0.5 ${textClassName}`}>
                    {value}
                </span>
                <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={disabled || value >= max}
                    aria-label="Increase value"
                    className="w-5 h-7 rounded-md bg-white hover:bg-slate-100 active:scale-95 border border-slate-200 text-slate-700 font-black text-xs flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                    +
                </button>
            </div>
        );
    }

    return (
        <div
            className={`inline-flex items-center justify-between h-11 px-1.5 rounded-xl bg-[#f1f5f9] border border-[#cbd5e1] shadow-inner select-none gap-1.5 shrink-0 ${className}`}
        >
            <button
                type="button"
                onClick={handleDecrement}
                disabled={value <= min}
                aria-label="Decrease value"
                className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 active:scale-95 border border-slate-200 text-slate-700 font-black text-base flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs"
            >
                −
            </button>
            <span className={`min-w-[30px] text-center px-1 ${textClassName}`}>
                {value}
            </span>
            <button
                type="button"
                onClick={handleIncrement}
                disabled={value >= max}
                aria-label="Increase value"
                className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 active:scale-95 border border-slate-200 text-slate-700 font-black text-base flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs"
            >
                +
            </button>
        </div>
    );
};

const ISI = () => {
    const [rlltDB, setRlltDB] = useState([]);
    const [chartsDB, setChartsDB] = useState([]);
    const [topCount, setTopCount] = useState(0);
    const [ableCount, setAbleCount] = useState(0);

    const [mdl, setMdl] = useState(1);
    const [fct, setFct] = useState(1);
    const [phs, setPhs] = useState(1);
    const [bannerDay, setBannerDay] = useState(1);
    const [selectorDay, setSelectorDay] = useState(30);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedAt, setSubmittedAt] = useState(null);
    const [lockedPhaseDays, setLockedPhaseDays] = useState(30);
    const [selectedColorIdx, setSelectedColorIdx] = useState(0);

    const [isSaving, setIsSaving] = useState(false);
    const [saveFeedback, setSaveFeedback] = useState(null);
    const [isiRecords, setIsiRecords] = useState([]);

    const computeLockProgress = (submittedAtVal, totalDaysVal) => {
        if (!submittedAtVal) return { locked: false, currentDay: 1 };
        const ts = new Date(submittedAtVal).getTime();
        if (isNaN(ts)) return { locked: false, currentDay: 1 };
        const totalDays = Number(totalDaysVal) > 0 ? Number(totalDaysVal) : 30;
        const elapsedMs = Math.max(0, Date.now() - ts);
        const elapsedDays = Math.floor(elapsedMs / 86400000);
        if (elapsedDays >= totalDays) {
            return { locked: false, currentDay: 1 };
        }
        return {
            locked: true,
            currentDay: Math.min(totalDays, elapsedDays + 1)
        };
    };

    const fetchIsiRecords = () => {
        axios
            .get('http://' + window.location.hostname + ':8000/api/isi', { withCredentials: true })
            .then((res) => {
                if (Array.isArray(res.data)) {
                    setIsiRecords(res.data);
                }
            })
            .catch((err) => console.error('Failed to fetch ISI records:', err));
    };

    const fetchPhaseLock = () => {
        axios
            .get('http://' + window.location.hostname + ':8000/api/isi/lock', { withCredentials: true })
            .then((res) => {
                const data = res.data;
                if (data && data.locked) {
                    const nextMdl = Number(data.module) || 1;
                    const nextFct = Number(data.facet) || 1;
                    const nextPhs = Number(data.phase) || 1;
                    const nextDays = Number(data.phase_days) || 30;
                    const nextDay = Number(data.current_day) || 1;
                    setMdl(nextMdl);
                    setFct(nextFct);
                    setPhs(nextPhs);
                    setLockedPhaseDays(nextDays);
                    setSubmittedAt(data.submitted_at);
                    setBannerDay(nextDay);
                    setIsSubmitted(true);
                    try {
                        localStorage.setItem(
                            'isi_phase_lock',
                            JSON.stringify({
                                module: nextMdl,
                                facet: nextFct,
                                phase: nextPhs,
                                phase_days: nextDays,
                                submitted_at: data.submitted_at
                            })
                        );
                    } catch (_) {}
                } else {
                    setIsSubmitted(false);
                    setSubmittedAt(null);
                    setBannerDay(1);
                    try {
                        localStorage.removeItem('isi_phase_lock');
                    } catch (_) {}
                }
            })
            .catch(() => {
                try {
                    const raw = localStorage.getItem('isi_phase_lock');
                    if (raw) {
                        const saved = JSON.parse(raw);
                        const progress = computeLockProgress(saved.submitted_at, saved.phase_days);
                        if (progress.locked) {
                            setMdl(Number(saved.module) || 1);
                            setFct(Number(saved.facet) || 1);
                            setPhs(Number(saved.phase) || 1);
                            setLockedPhaseDays(Number(saved.phase_days) || 30);
                            setSubmittedAt(saved.submitted_at);
                            setBannerDay(progress.currentDay);
                            setIsSubmitted(true);
                        } else {
                            localStorage.removeItem('isi_phase_lock');
                        }
                    }
                } catch (_) {}
            });
    };

    useEffect(() => {
        const baseUrl = 'http://' + window.location.hostname + ':8000';
        Promise.all([
            axios.get(`${baseUrl}/api/rllt_lookup`, { withCredentials: true }),
            axios.get(`${baseUrl}/api/charts/list`, { withCredentials: true }).catch(() => ({ data: [] })),
            axios.get(`${baseUrl}/api/charts/reading-plans`, { withCredentials: true }).catch(() => ({ data: [] }))
        ])
            .then(([rlltRes, chartsRes, rpRes]) => {
                if (Array.isArray(rlltRes.data)) {
                    setRlltDB(rlltRes.data);
                }
                const baseCharts = Array.isArray(chartsRes.data) ? chartsRes.data : [];
                const rpCharts = Array.isArray(rpRes.data) ? rpRes.data.filter((r) => r && r.state_payload) : [];
                setChartsDB([...rpCharts, ...baseCharts]);
            })
            .catch((err) => console.error('Failed to fetch RLLT lookup:', err));

        fetchIsiRecords();
        fetchPhaseLock();
    }, []);

    const phaseMeta = React.useMemo(() => {
        const exactMatch = rlltDB.find(
            (d) => Number(d.module) === mdl && Number(d.facet) === fct && Number(d.phase) === phs
        );
        const match =
            exactMatch ||
            (mdl === 5
                ? (fct === 1 ? rlltDB.find((d) => Number(d.module) === 5 && Number(d.facet) === 1) : null)
                : (rlltDB.find((d) => Number(d.module) === mdl && Number(d.facet) === fct) ||
                   rlltDB.find((d) => Number(d.module) === mdl)));

        const maxFacet = (() => {
            if (mdl === 5) return 5;
            const modRows = rlltDB.filter((d) => Number(d.module) === mdl);
            const facets = modRows.map((d) => Number(d.facet)).filter((n) => !isNaN(n) && n > 0);
            return facets.length > 0 ? Math.max(...facets) : 12;
        })();

        const maxPhase = (() => {
            if (mdl === 5) return fct === 1 ? 4 : 5;
            const fctRows = rlltDB.filter((d) => Number(d.module) === mdl && Number(d.facet) === fct);
            const phases = fctRows.map((d) => Number(d.phase)).filter((n) => !isNaN(n) && n > 0);
            return phases.length > 0 ? Math.max(...phases) : 12;
        })();

        let days = match && Number(match.scheduled_value_days) ? Number(match.scheduled_value_days) : 30;
        let art = match && match.art && match.art !== '-' ? match.art : '1m';

        if (mdl === 5 && fct >= 2) {
            const matchingCharts = (chartsDB || []).filter(
                (c) => Number(c.module) === 5 && Number(c.facet) === fct && Number(c.phase) === phs && c.state_payload
            );
            if (matchingCharts.length > 0) {
                const parseDt = (dateStr, timeStr) => {
                    if (!dateStr) return 0;
                    const parts = String(dateStr).trim().replace(/\//g, '-').split('-');
                    if (parts.length !== 3) return 0;
                    const d = parseInt(parts[0], 10);
                    const m = parseInt(parts[1], 10) - 1;
                    const y = parseInt(parts[2], 10);
                    let h = 0, min = 0;
                    if (timeStr) {
                        const tm = String(timeStr).trim().match(/(\d+):(\d+)\s*(AM|PM)?/i);
                        if (tm) {
                            h = parseInt(tm[1], 10) || 0;
                            min = parseInt(tm[2], 10) || 0;
                            const ap = (tm[3] || '').toUpperCase();
                            if (ap === 'PM' && h < 12) h += 12;
                            if (ap === 'AM' && h === 12) h = 0;
                        }
                    }
                    return new Date(y, m, d, h, min).getTime() || 0;
                };
                const getTs = (ch) => {
                    if (ch.created_at) {
                        const t = new Date(ch.created_at).getTime();
                        if (!isNaN(t) && t > 0) return t;
                    }
                    try {
                        const p = typeof ch.state_payload === 'string' ? JSON.parse(ch.state_payload) : ch.state_payload;
                        if (p && typeof p === 'object' && !Array.isArray(p)) {
                            const ts = parseDt(p.createdDate || ch.date, p.createdTime || ch.time);
                            if (ts > 0) return ts;
                        }
                    } catch (_) {}
                    return parseDt(ch.date, ch.time);
                };
                const sorted = [...matchingCharts].sort((a, b) => getTs(b) - getTs(a));
                const latest = sorted[0];
                try {
                    const p = typeof latest.state_payload === 'string' ? JSON.parse(latest.state_payload) : latest.state_payload;
                    const fp = p && typeof p.fullPlan === 'object' ? p.fullPlan : {};
                    const chunks = Array.isArray(p)
                        ? p
                        : (Array.isArray(p?.payload) ? p.payload : (Array.isArray(p?.chunks) ? p.chunks : (Array.isArray(fp?.chunks) ? fp.chunks : [])));
                    const numDaysMeta = Number(p?.numDays || fp?.numDays) || 0;
                    const grandArtMins = Number(p?.grandTotalArtMins || fp?.grandTotalArtMins) || 0;
                    let rowDays = 0;
                    let sumArtMins = 0;
                    chunks.forEach((ch) => {
                        if (ch && Array.isArray(ch.days)) {
                            ch.days.forEach((d) => {
                                if (!d) return;
                                rowDays++;
                                if (d.artMins !== undefined && d.artMins !== null && Number(d.artMins) > 0) {
                                    sumArtMins += Number(d.artMins);
                                } else if (d.art) {
                                    const s = String(d.art).trim().toLowerCase();
                                    if (s.includes('h')) {
                                        const m = s.match(/(\d+)\s*h[.\s]*(\d*)/);
                                        if (m) sumArtMins += (parseInt(m[1] || 0, 10) * 60) + (parseInt(m[2] || 0, 10));
                                    } else if (s.includes('.')) {
                                        const pts = s.split('.');
                                        let s1 = (pts[1] || '0').replace(/[^\d]/g, '');
                                        if (s1.length === 1) s1 += '0';
                                        sumArtMins += (parseInt((pts[0] || '0').replace(/[^\d]/g, ''), 10) || 0) + ((parseInt(s1.substring(0, 2) || '0', 10) || 0) / 60);
                                    } else {
                                        sumArtMins += parseFloat(s.replace(/[^\d.]/g, '')) || 0;
                                    }
                                }
                            });
                        }
                    });
                    const finalDays = numDaysMeta > 0 ? numDaysMeta : rowDays;
                    const finalArtMins = grandArtMins > 0 ? grandArtMins : sumArtMins;
                    if (finalDays > 0) days = finalDays;
                    if (finalArtMins > 0) {
                        const rounded = Math.round(finalArtMins);
                        const h = Math.floor(rounded / 60);
                        const m = rounded % 60;
                        art = h > 0 ? (m > 0 ? `${h}h.${m}m` : `${h}h`) : `${m}m`;
                    }
                } catch (_) {}
            }
        }

        return { days, art, maxFacet, maxPhase };
    }, [rlltDB, chartsDB, mdl, fct, phs]);

    useEffect(() => {
        setSelectorDay(phaseMeta.days || 30);
    }, [phaseMeta.days]);

    useEffect(() => {
        if (!isSubmitted || !submittedAt) return;
        const totalDays = lockedPhaseDays || phaseMeta.days || 30;
        const checkProgress = () => {
            const progress = computeLockProgress(submittedAt, totalDays);
            if (!progress.locked) {
                setIsSubmitted(false);
                setSubmittedAt(null);
                setBannerDay(1);
                try {
                    localStorage.removeItem('isi_phase_lock');
                } catch (_) {}
            } else {
                setBannerDay(progress.currentDay);
            }
        };
        checkProgress();
        const timer = setInterval(checkProgress, 30000);
        return () => clearInterval(timer);
    }, [isSubmitted, submittedAt, lockedPhaseDays, phaseMeta.days]);

    const activeColor = TRANSFORMATION_COLORS[selectedColorIdx] || TRANSFORMATION_COLORS[0];

    const handleResetConfirm = async () => {
        setIsSubmitted(false);
        setSubmittedAt(null);
        setMdl(1);
        setFct(1);
        setPhs(1);
        setSelectorDay(phaseMeta.days || 30);
        setBannerDay(1);
        setTopCount(0);
        setAbleCount(0);
        setSaveFeedback(null);
        try {
            localStorage.removeItem('isi_phase_lock');
        } catch (_) {}
        try {
            await axios.delete(
                'http://' + window.location.hostname + ':8000/api/isi/lock',
                { withCredentials: true }
            );
        } catch (err) {
            console.error('Failed to clear ISI phase lock:', err);
        }
    };

    const handleSubmitClick = async () => {
        if (isSubmitted) return;
        const totalDays = phaseMeta.days || 30;
        const nowIso = new Date().toISOString();
        setIsSubmitted(true);
        setSubmittedAt(nowIso);
        setLockedPhaseDays(totalDays);
        setBannerDay(1);
        try {
            localStorage.setItem(
                'isi_phase_lock',
                JSON.stringify({
                    module: mdl,
                    facet: fct,
                    phase: phs,
                    phase_days: totalDays,
                    submitted_at: nowIso
                })
            );
        } catch (_) {}

        try {
            const res = await axios.post(
                'http://' + window.location.hostname + ':8000/api/isi/lock',
                {
                    module: mdl,
                    facet: fct,
                    phase: phs,
                    phase_days: totalDays
                },
                { withCredentials: true }
            );
            if (res.data && res.data.submitted_at) {
                setSubmittedAt(res.data.submitted_at);
                setBannerDay(Number(res.data.current_day) || 1);
                try {
                    localStorage.setItem(
                        'isi_phase_lock',
                        JSON.stringify({
                            module: mdl,
                            facet: fct,
                            phase: phs,
                            phase_days: totalDays,
                            submitted_at: res.data.submitted_at
                        })
                    );
                } catch (_) {}
            }
        } catch (err) {
            console.error('Failed to persist ISI phase lock:', err);
        }
    };

    const handleDoneSave = async () => {
        setIsSaving(true);
        setSaveFeedback(null);
        try {
            const bannerText = `RLLT-MDL${mdl} FCT${fct} PHS${phs} DAY ${bannerDay}`;
            const res = await axios.post(
                'http://' + window.location.hostname + ':8000/api/isi',
                {
                    module: mdl,
                    facet: fct,
                    phase: phs,
                    day: bannerDay,
                    phase_days: phaseMeta.days,
                    art: phaseMeta.art,
                    daily_isi_count: topCount,
                    able_again_count: ableCount,
                    color_code: activeColor.hex.toUpperCase(),
                    theme_color: activeColor.hex.toUpperCase(),
                    banner_text: bannerText
                },
                { withCredentials: true }
            );

            const rec = res.data?.record;
            if (rec) {
                setIsiRecords((prev) => [rec, ...prev]);
            } else {
                fetchIsiRecords();
            }

            const roleInfo = rec?.role === 'student' && rec?.category
                ? `${rec.username} (${rec.role} - ${rec.category})`
                : `${rec?.username || 'User'} (${rec?.role || ''})`;

            setSaveFeedback({
                type: 'success',
                message: `Saved ${bannerText} for ${roleInfo}`
            });
            setTimeout(() => setSaveFeedback(null), 4000);
        } catch (err) {
            console.error('Failed to save ISI record:', err);
            setSaveFeedback({
                type: 'error',
                message: 'Failed to save ISI details. Please try again.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] w-full bg-[#eef2f6] flex flex-col items-center py-6 px-3 sm:px-6 font-sans gap-8">
            {/* Main Rounded Corner Card */}
            <div className="w-full max-w-[540px] bg-white rounded-[30px] shadow-[0_10px_35px_rgba(15,23,42,0.08)] border border-gray-100 px-5 sm:px-7 py-7 flex flex-col items-center">
                
                {/* Top Row: Logo + RLLT-DAILY-ISI + Increment/Decrement Picker */}
                <div className="w-full flex items-center justify-between gap-3 sm:gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-[0_3px_12px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center justify-center p-1.5 shrink-0">
                        <img
                            src="/custom-logo.png"
                            alt="RLLT Logo"
                            className="w-full h-full object-contain rounded-full"
                        />
                    </div>

                    <h1 className="text-[#1e293b] font-extrabold text-[19px] sm:text-[22px] tracking-tight whitespace-nowrap">
                        RLLT-DAILY-ISI
                    </h1>

                    <NumberWheelScroller
                        value={topCount}
                        onChange={setTopCount}
                        min={0}
                        max={100}
                        textClassName="text-[#0f172a] font-extrabold text-[17px]"
                    />
                </div>

                {/* Colored Status Banner */}
                <div
                    className="w-full rounded-2xl px-6 sm:px-8 py-10 sm:py-12 mb-6 shadow-sm transition-colors duration-300 flex flex-col justify-center"
                    style={{ backgroundColor: activeColor.hex }}
                >
                    <div className={`font-extrabold text-[21px] sm:text-[25px] leading-snug tracking-tight ${activeColor.textClass}`}>
                        RLLT-MDL{mdl} FCT{fct} PHS{phs} DAY {bannerDay}
                    </div>
                    <div className={`font-extrabold text-[21px] sm:text-[25px] leading-snug tracking-tight mt-1 flex items-center flex-wrap gap-2 ${activeColor.textClass}`}>
                        <span>{topCount > 0 ? `${topCount} DONE` : 'DONE'}</span>
                        <span className="inline-flex items-center gap-2 text-[22px] sm:text-[25px]">
                            <span>😊</span>
                            <span>😊</span>
                            <span>😊</span>
                            <span>😊</span>
                            <span>😊</span>
                            <span>✅</span>
                        </span>
                        {ableCount > 0 && (
                            <span className="font-extrabold text-[21px] sm:text-[25px]">
                                {ableCount}
                            </span>
                        )}
                    </div>
                </div>

                {/* Inner Control Container */}
                <div className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 sm:p-5 mb-5">
                    {/* I AM ABLE AGAIN + Increment/Decrement Picker */}
                    <div className="w-full flex items-center justify-between mb-3.5">
                        <span className="text-[#64748b] font-bold text-[12px] sm:text-[13px] tracking-wide uppercase">
                            I AM ABLE AGAIN
                        </span>

                        <NumberWheelScroller
                            value={ableCount}
                            onChange={setAbleCount}
                            min={0}
                            max={100}
                            textClassName="text-[#0f172a] font-extrabold text-[17px]"
                        />
                    </div>

                    {/* MDL / FCT / PHS / DAY / Confirm Selector Card */}
                    <div className="w-full bg-white border border-[#cbd5e1] rounded-2xl px-3 sm:px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
                        <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 w-full">
                            {/* MDL */}
                            <div className="flex flex-col items-center shrink-0">
                                <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                                    MDL
                                </span>
                                <NumberWheelScroller
                                    value={mdl}
                                    onChange={(nextMdl) => {
                                        if (!isSubmitted) setMdl(nextMdl);
                                    }}
                                    min={1}
                                    max={5}
                                    compact={true}
                                    disabled={isSubmitted}
                                    className="bg-[#e2e8f0]/90 border-[#cbd5e1]"
                                    textClassName="text-[#64748b] font-extrabold text-[14px] sm:text-[15px]"
                                />
                            </div>

                            {/* FCT */}
                            <div className="flex flex-col items-center shrink-0">
                                <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                                    FCT
                                </span>
                                <NumberWheelScroller
                                    value={fct}
                                    onChange={(nextFct) => {
                                        if (!isSubmitted) setFct(nextFct);
                                    }}
                                    min={1}
                                    max={phaseMeta.maxFacet}
                                    compact={true}
                                    disabled={isSubmitted}
                                    className="bg-[#e2e8f0]/90 border-[#cbd5e1]"
                                    textClassName="text-[#64748b] font-extrabold text-[14px] sm:text-[15px]"
                                />
                            </div>

                            {/* PHS */}
                            <div className="flex flex-col items-center shrink-0">
                                <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                                    PHS
                                </span>
                                <NumberWheelScroller
                                    value={phs}
                                    onChange={(nextPhs) => {
                                        if (!isSubmitted) setPhs(nextPhs);
                                    }}
                                    min={1}
                                    max={phaseMeta.maxPhase}
                                    compact={true}
                                    disabled={isSubmitted}
                                    textClassName="text-[#0f172a] font-extrabold text-[14px] sm:text-[15px]"
                                />
                            </div>

                            {/* DAY (Read-only display from Light Chart) */}
                            <div className="flex flex-col items-center shrink-0">
                                <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                                    DAY
                                </span>
                                <div
                                    title="Scheduled days from Light Chart"
                                    className="h-10 min-w-[42px] px-2.5 rounded-xl bg-[#f1f5f9] border border-[#cbd5e1] shadow-inner flex items-center justify-center select-none"
                                >
                                    <span className="text-[#0f172a] font-extrabold text-[14px] sm:text-[15px]">
                                        {phaseMeta.days}
                                    </span>
                                </div>
                            </div>

                            {/* Confirm + Submitted */}
                            <div className="flex flex-col items-center shrink-0">
                                <div className="flex items-center gap-1 mb-1.5">
                                    <span className="text-[11px] font-bold text-[#475569] tracking-wide">
                                        Confirm
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleResetConfirm}
                                        title="Reset"
                                        className="w-5 h-5 rounded bg-[#fee2e2] hover:bg-[#fecaca] text-[#ef4444] flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                        <i className="pi pi-refresh text-[10px] font-bold" />
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSubmitClick}
                                    disabled={isSubmitted}
                                    className={`h-10 px-3 sm:px-3.5 rounded-xl font-bold text-[11px] sm:text-[12px] tracking-wider uppercase shadow-sm transition-all whitespace-nowrap ${
                                        isSubmitted
                                            ? 'bg-[#16a34a] text-white cursor-not-allowed'
                                            : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white cursor-pointer'
                                    }`}
                                >
                                    {isSubmitted ? 'SUBMITTED' : 'SUBMIT'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Phase Summary Line */}
                    <div className="w-full text-center text-[#0f172a] font-extrabold text-[12px] sm:text-[13px] tracking-wide uppercase mt-4 mb-3.5">
                        {mdl === 5
                            ? `PHASE ${phs} HAS ${phaseMeta.days} DAYS-ART ${phaseMeta.art}`
                            : `EACH PHASE IS ${phaseMeta.days} DAYS-ART ${phaseMeta.art}`}
                    </div>

                    {/* I Am Choosing 7TN Truth-GPS Pill */}
                    <div
                        className="w-full bg-white rounded-xl py-2.5 px-4 text-center font-extrabold text-[#0f172a] text-[14px] sm:text-[15px] tracking-tight transition-colors duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                        style={{ border: `2.5px solid ${activeColor.hex}` }}
                    >
                        I Am Choosing 7TN Truth-GPS
                    </div>
                </div>

                {/* 7 Color Selector Circles */}
                <div className="w-full flex items-center justify-between px-1 sm:px-2 pt-1 mb-5">
                    {TRANSFORMATION_COLORS.map((c, idx) => {
                        const isSelected = idx === selectedColorIdx;
                        return (
                            <button
                                key={c.hex}
                                type="button"
                                onClick={() => setSelectedColorIdx(idx)}
                                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full transition-transform duration-150 cursor-pointer focus:outline-none ${
                                    isSelected ? 'scale-105 ring-[3px] ring-black' : 'hover:scale-105'
                                }`}
                                style={{ backgroundColor: c.hex }}
                                aria-label={`Select color ${idx + 1}`}
                            />
                        );
                    })}
                </div>

                {/* Bottom DONE Button */}
                <button
                    type="button"
                    onClick={handleDoneSave}
                    disabled={isSaving}
                    className="w-full py-5 sm:py-5.5 min-h-[62px] rounded-2xl bg-[#16a34a] hover:bg-[#15803d] active:scale-[0.99] disabled:opacity-60 text-white font-extrabold text-[17px] sm:text-[18px] tracking-wider uppercase shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                    {isSaving ? 'SAVING...' : 'DONE'}
                </button>

                {saveFeedback && (
                    <div
                        className={`w-full mt-3 px-4 py-2.5 rounded-xl text-center text-xs sm:text-sm font-bold ${
                            saveFeedback.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-600 border border-red-200'
                        }`}
                    >
                        {saveFeedback.message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ISI;
