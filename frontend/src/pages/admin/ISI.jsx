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

const ITEM_HEIGHT = 44; // 44px (h-11)

/**
 * Interactive vertical drum/wheel scroller with real vertical number list,
 * supporting mouse wheel, touch/mouse drag, and click-to-step.
 */
const NumberWheelScroller = ({
    value,
    onChange,
    min = 0,
    max = 100,
    className = '',
    textClassName = ''
}) => {
    const scrollRef = useRef(null);
    const isInternalScroll = useRef(false);
    const scrollTimeout = useRef(null);
    const dragStartY = useRef(null);
    const dragStartScrollTop = useRef(0);
    const hasDragged = useRef(false);

    const items = React.useMemo(() => {
        const arr = [];
        for (let i = min; i <= max; i++) {
            arr.push(i);
        }
        return arr;
    }, [min, max]);

    // Sync scrollTop when value changes externally
    useEffect(() => {
        const el = scrollRef.current;
        if (!el || isInternalScroll.current) return;
        const idx = Math.max(0, Math.min(items.length - 1, value - min));
        const targetTop = idx * ITEM_HEIGHT;
        if (Math.abs(el.scrollTop - targetTop) > 1) {
            el.scrollTo({ top: targetTop, behavior: 'smooth' });
        }
    }, [value, min, items.length]);

    // Position immediately on mount
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const idx = Math.max(0, Math.min(items.length - 1, value - min));
        el.scrollTop = idx * ITEM_HEIGHT;
    }, []);

    // Controlled wheel handler (1 step per wheel notch, clamped to [min, max])
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const handleWheel = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const dir = e.deltaY > 0 ? 1 : -1;
            const nextVal = Math.max(min, Math.min(max, value + dir));
            if (nextVal !== value) {
                onChange(nextVal);
            }
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [value, min, max, onChange]);

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el) return;

        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
            const idx = Math.round(el.scrollTop / ITEM_HEIGHT);
            const clampedIdx = Math.max(0, Math.min(items.length - 1, idx));
            const nextVal = min + clampedIdx;
            if (nextVal !== value) {
                isInternalScroll.current = true;
                onChange(nextVal);
                setTimeout(() => {
                    isInternalScroll.current = false;
                }, 80);
            }
        }, 40);
    };

    const handlePointerDown = (e) => {
        const el = scrollRef.current;
        if (!el) return;
        dragStartY.current = e.clientY;
        dragStartScrollTop.current = el.scrollTop;
        hasDragged.current = false;
        if (el.setPointerCapture) {
            try {
                el.setPointerCapture(e.pointerId);
            } catch (_) {}
        }
    };

    const handlePointerMove = (e) => {
        const el = scrollRef.current;
        if (!el || dragStartY.current === null) return;
        const deltaY = dragStartY.current - e.clientY;
        if (Math.abs(deltaY) > 4) {
            hasDragged.current = true;
            el.scrollTop = dragStartScrollTop.current + deltaY;
        }
    };

    const handlePointerUp = (e) => {
        const el = scrollRef.current;
        if (!el || dragStartY.current === null) return;
        const wasDragged = hasDragged.current;
        dragStartY.current = null;
        if (el.releasePointerCapture) {
            try {
                el.releasePointerCapture(e.pointerId);
            } catch (_) {}
        }

        if (wasDragged) {
            const idx = Math.round(el.scrollTop / ITEM_HEIGHT);
            const clampedIdx = Math.max(0, Math.min(items.length - 1, idx));
            const nextVal = min + clampedIdx;
            el.scrollTo({ top: clampedIdx * ITEM_HEIGHT, behavior: 'smooth' });
            if (nextVal !== value) {
                onChange(nextVal);
            }
        } else {
            const nextVal = value >= max ? min : value + 1;
            onChange(nextVal);
        }
    };

    return (
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            title="Scroll or drag to select number"
            style={{ height: `${ITEM_HEIGHT}px`, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            className={`overflow-y-scroll snap-y snap-mandatory select-none cursor-ns-resize [&::-webkit-scrollbar]:hidden ${className}`}
        >
            {items.map((num) => (
                <div
                    key={num}
                    style={{ height: `${ITEM_HEIGHT}px` }}
                    className="w-full flex items-center justify-center snap-center shrink-0"
                >
                    <span className={textClassName}>{num}</span>
                </div>
            ))}
        </div>
    );
};

const ISI = () => {
    const [rlltDB, setRlltDB] = useState([]);
    const [topCount, setTopCount] = useState(0);
    const [ableCount, setAbleCount] = useState(0);

    const [mdl, setMdl] = useState(1);
    const [fct, setFct] = useState(1);
    const [phs, setPhs] = useState(1);
    const [bannerDay, setBannerDay] = useState(6);
    const [selectorDay, setSelectorDay] = useState(30);
    const [isSubmitted, setIsSubmitted] = useState(true);
    const [selectedColorIdx, setSelectedColorIdx] = useState(0);

    const [isSaving, setIsSaving] = useState(false);
    const [saveFeedback, setSaveFeedback] = useState(null);
    const [isiRecords, setIsiRecords] = useState([]);

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

    useEffect(() => {
        axios
            .get('http://' + window.location.hostname + ':8000/api/rllt_lookup', { withCredentials: true })
            .then((res) => {
                if (Array.isArray(res.data)) {
                    setRlltDB(res.data);
                }
            })
            .catch((err) => console.error('Failed to fetch RLLT lookup:', err));

        fetchIsiRecords();
    }, []);

    const phaseMeta = React.useMemo(() => {
        const match =
            rlltDB.find(
                (d) => Number(d.module) === mdl && Number(d.facet) === fct && Number(d.phase) === phs
            ) ||
            rlltDB.find((d) => Number(d.module) === mdl && Number(d.facet) === fct) ||
            rlltDB.find((d) => Number(d.module) === mdl);

        const maxFacet = (() => {
            const modRows = rlltDB.filter((d) => Number(d.module) === mdl);
            const facets = modRows.map((d) => Number(d.facet)).filter((n) => !isNaN(n) && n > 0);
            return facets.length > 0 ? Math.max(...facets) : 12;
        })();

        const maxPhase = (() => {
            const fctRows = rlltDB.filter((d) => Number(d.module) === mdl && Number(d.facet) === fct);
            const phases = fctRows.map((d) => Number(d.phase)).filter((n) => !isNaN(n) && n > 0);
            return phases.length > 0 ? Math.max(...phases) : 12;
        })();

        const days = match && Number(match.scheduled_value_days) ? Number(match.scheduled_value_days) : 30;
        const art = match && match.art ? match.art : '1m';

        return { days, art, maxFacet, maxPhase };
    }, [rlltDB, mdl, fct, phs]);

    const activeColor = TRANSFORMATION_COLORS[selectedColorIdx] || TRANSFORMATION_COLORS[0];

    const handleResetConfirm = () => {
        setIsSubmitted(false);
        setMdl(1);
        setFct(1);
        setPhs(1);
        setSelectorDay(phaseMeta.days || 30);
        setTopCount(0);
        setAbleCount(0);
        setSaveFeedback(null);
    };

    const handleSubmitClick = () => {
        setIsSubmitted(true);
        setBannerDay(selectorDay);
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
            <div className="w-full max-w-[500px] bg-white rounded-[30px] shadow-[0_10px_35px_rgba(15,23,42,0.08)] border border-gray-100 px-5 sm:px-7 py-7 flex flex-col items-center">
                
                {/* Top Row: Logo + RLLT-DAILY-ISI + Wheel Scroller */}
                <div className="w-full flex items-center justify-center gap-4 sm:gap-5 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-[0_3px_12px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center justify-center p-1.5 shrink-0">
                        <img
                            src="/custom-logo.png"
                            alt="RLLT Logo"
                            className="w-full h-full object-contain rounded-full"
                        />
                    </div>

                    <h1 className="text-[#1e293b] font-extrabold text-[20px] sm:text-[22px] tracking-tight whitespace-nowrap">
                        RLLT-DAILY-ISI
                    </h1>

                    <NumberWheelScroller
                        value={topCount}
                        onChange={setTopCount}
                        min={0}
                        max={100}
                        className="w-14 rounded-xl bg-[#f1f5f9] border border-[#cbd5e1] shadow-inner shrink-0"
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
                    {/* I AM ABLE AGAIN + Wheel Scroller */}
                    <div className="w-full flex items-center justify-between mb-3.5">
                        <span className="text-[#64748b] font-bold text-[12px] sm:text-[13px] tracking-wide uppercase">
                            I AM ABLE AGAIN
                        </span>

                        <NumberWheelScroller
                            value={ableCount}
                            onChange={setAbleCount}
                            min={0}
                            max={100}
                            className="w-14 rounded-xl bg-[#f1f5f9] border border-[#cbd5e1] shadow-inner shrink-0"
                            textClassName="text-[#0f172a] font-extrabold text-[17px]"
                        />
                    </div>

                    {/* MDL / FCT / PHS / DAY / Confirm Selector Card */}
                    <div className="w-full bg-white border border-[#cbd5e1] rounded-2xl px-3 sm:px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-2 sm:gap-3">
                            {/* MDL */}
                            <div className="flex flex-col items-center">
                                <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-2">
                                    MDL
                                </span>
                                <NumberWheelScroller
                                    value={mdl}
                                    onChange={(nextMdl) => {
                                        setMdl(nextMdl);
                                    }}
                                    min={1}
                                    max={5}
                                    className="w-11 sm:w-12 rounded-xl bg-[#e2e8f0]/90 border border-[#cbd5e1]"
                                    textClassName="text-[#64748b] font-extrabold text-[17px]"
                                />
                            </div>

                            {/* FCT */}
                            <div className="flex flex-col items-center">
                                <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-2">
                                    FCT
                                </span>
                                <NumberWheelScroller
                                    value={fct}
                                    onChange={(nextFct) => {
                                        setFct(nextFct);
                                    }}
                                    min={1}
                                    max={phaseMeta.maxFacet}
                                    className="w-11 sm:w-12 rounded-xl bg-[#e2e8f0]/90 border border-[#cbd5e1]"
                                    textClassName="text-[#64748b] font-extrabold text-[17px]"
                                />
                            </div>

                            {/* PHS */}
                            <div className="flex flex-col items-center">
                                <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-2">
                                    PHS
                                </span>
                                <NumberWheelScroller
                                    value={phs}
                                    onChange={(nextPhs) => {
                                        setPhs(nextPhs);
                                    }}
                                    min={1}
                                    max={phaseMeta.maxPhase}
                                    className="w-11 sm:w-12 rounded-xl hover:bg-slate-100"
                                    textClassName="text-[#0f172a] font-extrabold text-[17px]"
                                />
                            </div>

                            {/* DAY */}
                            <div className="flex flex-col items-center">
                                <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-2">
                                    DAY
                                </span>
                                <NumberWheelScroller
                                    value={selectorDay}
                                    onChange={(nextDay) => {
                                        setSelectorDay(nextDay);
                                        setBannerDay(nextDay);
                                    }}
                                    min={1}
                                    max={phaseMeta.days || 30}
                                    className="w-11 sm:w-12 rounded-xl hover:bg-slate-100"
                                    textClassName="text-[#0f172a] font-extrabold text-[17px]"
                                />
                            </div>

                            {/* Confirm + Submitted */}
                            <div className="flex flex-col items-center pl-1">
                                <div className="flex items-center gap-1.5 mb-2">
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
                                    className={`h-11 px-4 sm:px-5 rounded-xl font-bold text-[12px] sm:text-[13px] tracking-wider uppercase shadow-sm transition-all cursor-pointer ${
                                        isSubmitted
                                            ? 'bg-[#16a34a] hover:bg-[#15803d] text-white'
                                            : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white'
                                    }`}
                                >
                                    {isSubmitted ? 'SUBMITTED' : 'SUBMIT'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Phase Summary Line */}
                    <div className="w-full text-center text-[#0f172a] font-extrabold text-[12px] sm:text-[13px] tracking-wide uppercase mt-4 mb-3.5">
                        EACH PHASE IS {phaseMeta.days} DAYS-ART {phaseMeta.art}
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
                    className="w-full py-3.5 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] active:scale-[0.99] disabled:opacity-60 text-white font-extrabold text-[15px] sm:text-[16px] tracking-wider uppercase shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
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

            {/* Dedicated ISI Records Table */}
            <div className="w-full max-w-5xl bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.06)] border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
                    <div>
                        <h2 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight">
                            ISI Records Table (<code className="text-xs sm:text-sm text-blue-600">isi_records</code>)
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Saved phase submissions by user, role, student category, Daily ISI wheel number, and Able Again number
                        </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                        {isiRecords.length} {isiRecords.length === 1 ? 'Record' : 'Records'}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                            <tr className="bg-slate-100/80 text-slate-600 uppercase text-[11px] font-extrabold tracking-wider border-b border-gray-200">
                                <th className="py-3 px-4">#</th>
                                <th className="py-3 px-4">Username</th>
                                <th className="py-3 px-4">Role</th>
                                <th className="py-3 px-4">Category</th>
                                <th className="py-3 px-4 text-center">MDL</th>
                                <th className="py-3 px-4 text-center">FCT</th>
                                <th className="py-3 px-4 text-center">PHS</th>
                                <th className="py-3 px-4 text-center">DAY</th>
                                <th className="py-3 px-4 text-center">Daily ISI (Before DONE)</th>
                                <th className="py-3 px-4 text-center">Able Again (After ✅)</th>
                                <th className="py-3 px-4">Color Code</th>
                                <th className="py-3 px-4">Banner Text</th>
                                <th className="py-3 px-4">Saved At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-slate-700">
                            {isiRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={13} className="py-8 text-center text-slate-400 font-medium">
                                        No ISI records saved yet. Click DONE above to save a record.
                                    </td>
                                </tr>
                            ) : (
                                isiRecords.map((rec, idx) => {
                                    const stickerColor = (rec.color_code || rec.theme_color || '#00B4FF').toUpperCase();
                                    return (
                                        <tr key={rec.id || idx} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                                            <td className="py-3 px-4 font-bold text-slate-900">{rec.username}</td>
                                            <td className="py-3 px-4">
                                                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                    {rec.role}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {rec.category ? (
                                                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                        {rec.category}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center font-bold">{rec.module}</td>
                                            <td className="py-3 px-4 text-center font-bold">{rec.facet}</td>
                                            <td className="py-3 px-4 text-center font-bold">{rec.phase}</td>
                                            <td className="py-3 px-4 text-center font-bold">{rec.day}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-extrabold border border-sky-200">
                                                    {rec.daily_isi_count}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200">
                                                    {rec.able_again_count}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-xs font-extrabold text-slate-800">
                                                    <span
                                                        className="w-3.5 h-3.5 rounded-full border border-black/25 shrink-0"
                                                        style={{ backgroundColor: stickerColor }}
                                                    />
                                                    {stickerColor}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                                                {rec.banner_text}
                                            </td>
                                            <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                                                {rec.created_at ? new Date(rec.created_at).toLocaleString() : '—'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ISI;
