import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toast } from 'primereact/toast';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

const formatChartTime = (totalMins, formatType = 'm') => {
    const rawMins = Math.round(totalMins || 0);
    if (rawMins <= 0) return formatType === 'HrMins' ? '0 Mins' : '0m';
    const h = Math.floor(rawMins / 60);
    const m = rawMins % 60;
    if (formatType === 'HrMins') {
        return rawMins >= 60 ? `${h} Hr ${m} Mins` : `${rawMins} Mins`;
    }
    if (formatType === 'Hm') {
        return rawMins >= 60 ? `${h}H ${m}m` : `${rawMins}m`;
    }
    if (formatType === 'hm_compact') {
        return rawMins >= 60 ? `${h}h${m}m` : `${rawMins}m`;
    }
    return rawMins >= 60 ? `${h}H ${m}m` : `${rawMins}m`;
};

const DEFAULT_WEEK_PROMISES = [
    "I WILL MAKE YOU A GREAT NATION: GEN 12:2",
    "I WILL GIVE YOU TREASURES HIDDEN IN THE DARKNESS - SECRET PLACES: ISA 45:3",
    "ONLY ASK, I WILL GIVE YOU NATIONS AS YOUR INHERITANCE: PSA 2:8",
    "GOD IS MY FATHER AND POTTER. I AM, WORK OF HIS HAND. ISA 64:8",
    "GOD CREATED ALL THINGS. EVERYTHIG IS FROM HIS HANDS: JOH 1:3",
    "I AM WITH YOU ALWAYS, GO, TRAIN, MULTIPLY: MAT 28:18-20"
];

const PROMISE_BORDER_COLORS = [
    '#00b0f0',
    '#00b050',
    '#002060',
    '#ffff00',
    '#c000c0',
    '#c45911',
    '#ff0000',
    '#00b050'
];

const TRANSFORMATION_PALETTE_COLORS = [
    { color: '#00C0FF', label: 'Light Blue' },
    { color: '#00A638', label: 'Green' },
    { color: '#3340CD', label: 'Dark Blue' },
    { color: '#FAFA33', label: 'Yellow' },
    { color: '#BB43B1', label: 'Purple' },
    { color: '#FE6D01', label: 'Orange' },
    { color: '#FE0005', label: 'Red' }
];

const PRINT_SIZE_OPTIONS = [
    {
        key: 'a4',
        label: 'Print A4',
        dimLabel: '210×297 mm',
        pageWidthMm: 210,
        pageHeightMm: 297,
        marginXMm: 6,
        marginYMm: 6,
        cssPageSize: '210mm 297mm'
    },
    {
        key: 'a5',
        label: 'Print A5',
        dimLabel: '148×210 mm',
        pageWidthMm: 148,
        pageHeightMm: 210,
        marginXMm: 5,
        marginYMm: 5,
        cssPageSize: '148mm 210mm'
    },
    {
        key: 'a6',
        label: 'Print A6',
        dimLabel: '105×148 mm',
        pageWidthMm: 105,
        pageHeightMm: 148,
        marginXMm: 2.5,
        marginYMm: 2.5,
        cssPageSize: '105mm 148mm'
    },
    {
        key: 'a7',
        label: 'Print A7',
        dimLabel: '74×105 mm',
        pageWidthMm: 74,
        pageHeightMm: 105,
        marginXMm: 2,
        marginYMm: 2,
        cssPageSize: '74mm 105mm'
    },
    {
        key: 'visa',
        label: 'Print Visa',
        dimLabel: '89×51 mm',
        pageWidthMm: 89,
        pageHeightMm: 51,
        marginXMm: 2,
        marginYMm: 2,
        cssPageSize: '89mm 51mm'
    },
    {
        key: 'dl',
        label: 'Print DL Size',
        dimLabel: '99×210 mm',
        pageWidthMm: 99,
        pageHeightMm: 210,
        marginXMm: 2.5,
        marginYMm: 2.5,
        cssPageSize: '99mm 210mm'
    }
];

const TABLE_COLUMN_DEFINITIONS = [
    { key: 'team', label: 'Team / Week (Left Vertical)', shortLabel: 'TEAM / WEEK', weight: 3.2 },
    { key: 'date', label: 'Date (DATE)', shortLabel: 'DATE', weight: 4.8 },
    { key: 'reg1Book', label: 'Regular Book 1 (e.g. PRO)', shortLabel: 'BOOK 1', weight: 7.2 },
    { key: 'reg1Time', label: 'Regular Book 1 Time (TIME)', shortLabel: 'TIME 1', weight: 4.6 },
    { key: 'reg2Book', label: 'Regular Book 2 (e.g. PSA)', shortLabel: 'BOOK 2', weight: 10.2 },
    { key: 'reg2Time', label: 'Regular Book 2 Time (TIME)', shortLabel: 'TIME 2', weight: 4.2 },
    { key: 'otherBooks', label: 'Main Books (Morning & Evening)', shortLabel: 'MAIN BOOKS', weight: 31.8 },
    { key: 'otherTime', label: 'Main Books Time (TIME)', shortLabel: 'MAIN TIME', weight: 8.6 },
    { key: 'chap', label: 'Chapters (CHAP)', shortLabel: 'CHAP', weight: 4.6 },
    { key: 'verse', label: 'Verses (VERSE)', shortLabel: 'VERSE', weight: 5.6 },
    { key: 'art', label: 'Average Reading Time (ART)', shortLabel: 'ART', weight: 7.4 },
    { key: 'day', label: 'Day Check Column (DAY)', shortLabel: 'DAY', weight: 3.9 },
    { key: 'phaseSide', label: 'Module / Facet / Phase (Right Vertical)', shortLabel: 'MDL:FCT:PHS', weight: 3.9 }
];

const DEFAULT_SELECTED_COLUMNS = TABLE_COLUMN_DEFINITIONS.reduce((acc, col) => {
    acc[col.key] = true;
    return acc;
}, {});

const BOLDNESS_LEVEL_OPTIONS = [
    { level: 1, label: 'Normal', weight: '400', strokePx: 0 },
    { level: 2, label: 'Medium', weight: '600', strokePx: 0.15 },
    { level: 3, label: 'Bold', weight: '800', strokePx: 0.35 },
    { level: 4, label: 'Extra Bold', weight: '900', strokePx: 0.6 },
    { level: 5, label: 'Ultra Bold', weight: '900', strokePx: 0.9 }
];

const ImageUploadPlaceholder = ({ state, setState, label }) => {
    const imageUrl = typeof state === 'object' && state !== null ? state.url : state;

    return (
        <label className="w-full h-full flex items-center justify-center cursor-pointer bg-white overflow-hidden relative group">
            <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            setState({ file, url: ev.target.result });
                        };
                        reader.readAsDataURL(file);
                    }
                }}
            />
            {imageUrl ? (
                <img src={imageUrl} className="w-full h-full object-contain" alt="Header Logo" />
            ) : (
                <div className="print-hide-empty-camera flex flex-col items-center justify-center text-gray-400 p-1 text-center w-full h-full">
                    <i className="pi pi-camera text-xl group-hover:text-[#00a8ff] transition-colors"></i>
                    {label && <span className="text-[10px] font-bold leading-tight mt-1">{label}</span>}
                </div>
            )}
        </label>
    );
};

const normalizePlanPhaseLabels = (plan) => {
    if (!plan) return null;
    const mod = Number(plan.mdl) || 5;
    const rawFct = Number(plan.fct) || 2;
    const fct = (mod === 5 && rawFct < 2) ? 2 : rawFct;
    const phs = Number(plan.phs) || 1;
    const maxPhases = Number(plan.maxPhases) || 1;
    const sideLabel = `MDL ${mod}: FCT ${fct}: PHS - ${phs}`;

    return {
        ...plan,
        mdl: mod,
        fct,
        phs,
        maxPhases,
        headerSubtitle: `MODULE${mod}:FACET${fct}:PHASE-${phs}/${maxPhases}`,
        footerPhaseText: `MODULE ${mod} - FACET ${fct}: PHASE - ${phs}/${maxPhases}`,
        chunks: (plan.chunks || []).map((ch, idx) => {
            const weekNum = ch.weekNumber || idx + 1;
            const teamPrefix = ch.teamPrefix || 'TEAM / WEEK - ';
            return {
                ...ch,
                weekNumber: weekNum,
                teamPrefix,
                teamLabel: ch.teamLabel ?? `${teamPrefix}${weekNum}`,
                promiseNote: ch.promiseNote ?? '',
                promiseInput: ch.promiseInput ?? (DEFAULT_WEEK_PROMISES[idx] || DEFAULT_WEEK_PROMISES[0]),
                h1: ch.h1 ?? '',
                h2: ch.h2 ?? '',
                h3: ch.h3 ?? '',
                phaseSideLabel: sideLabel
            };
        })
    };
};

const reconstructPlanFromSavedData = (apiData) => {
    if (!apiData) return null;

    let parsed = {};
    try {
        parsed = typeof apiData.state_payload === 'string'
            ? JSON.parse(apiData.state_payload)
            : (apiData.state_payload || {});
    } catch (e) {
        parsed = {};
    }

    const mod = Number(apiData.module || parsed.fullPlan?.mdl) || 5;
    const rawFct = Number(apiData.facet || parsed.fullPlan?.fct) || 2;
    const fct = (mod === 5 && rawFct < 2) ? 2 : rawFct;
    const phs = Number(apiData.phase || parsed.fullPlan?.phs) || 1;

    const rawChunks = Array.isArray(parsed)
        ? parsed
        : (Array.isArray(parsed.payload) ? parsed.payload : (parsed.fullPlan?.chunks || []));

    const normalizedChunks = rawChunks.map((ch, idx) => {
        const weekNum = ch.weekNumber || idx + 1;
        const borderColor = ch.borderColor || PROMISE_BORDER_COLORS[idx % PROMISE_BORDER_COLORS.length];
        const days = (ch.days || []).map((d, dIdx) => ({
            ...d,
            id: d.id ?? (idx * 5 + dIdx + 1),
            dayIndex: d.dayIndex ?? (idx * 5 + dIdx + 1),
            dateLabel: d.dateLabel || d.day || `${idx * 5 + dIdx + 1}`,
            m1b: d.m1b || '',
            m1t: d.m1t || '',
            m2b: d.m2b || '',
            m2t: d.m2t || '',
            m3b_morning: d.m3b_morning ?? d.m3b ?? '',
            m3b_evening: d.m3b_evening ?? '',
            m3t_morning: d.m3t_morning ?? d.m3t ?? '',
            m3t_evening: d.m3t_evening ?? '',
            chap: Number(d.chap) || 0,
            verse: Number(d.verse) || 0,
            artMins: Number(d.artMins) || 0,
            art: d.art || ''
        }));

        const chapTotal = ch.chapTotal ?? days.reduce((s, d) => s + (Number(d.chap) || 0), 0);
        const verseTotal = ch.verseTotal ?? days.reduce((s, d) => s + (Number(d.verse) || 0), 0);
        const artTotalMins = ch.artTotalMins ?? days.reduce((s, d) => s + (Number(d.artMins) || 0), 0);

        return {
            ...ch,
            id: ch.id || `week_${weekNum}`,
            weekNumber: weekNum,
            teamPrefix: ch.teamPrefix || 'TEAM / WEEK - ',
            teamLabel: ch.teamLabel ?? `${ch.teamPrefix || 'TEAM / WEEK - '}${weekNum}`,
            promises: ch.promises || "GOD'S PROMISES :",
            promiseNote: ch.promiseNote ?? '',
            promiseInput: ch.promiseInput ?? (DEFAULT_WEEK_PROMISES[idx] || DEFAULT_WEEK_PROMISES[0]),
            h1: ch.h1 ?? '',
            h2: ch.h2 ?? '',
            h3: ch.h3 ?? '',
            borderColor,
            colorBoxText: ch.colorBoxText || '',
            colorBoxTextColor: ch.colorBoxTextColor || borderColor || '#000000',
            phaseSideLabel: `MDL ${mod}: FCT ${fct}: PHS - ${phs}`,
            days,
            m1TotalStr: ch.m1TotalStr ?? ch.m1Total ?? '',
            m2TotalStr: ch.m2TotalStr ?? ch.m2Total ?? '',
            m3TotalStr: ch.m3TotalStr ?? ch.m3Total ?? '',
            chapTotal,
            verseTotal,
            artTotalMins,
            artTotalStr: ch.artTotalStr || ch.artTotal || formatChartTime(artTotalMins, 'Hm')
        };
    });

    const allRows = normalizedChunks.flatMap(c => c.days || []);
    const maxPhases = parsed.maxPhases || parsed.fullPlan?.maxPhases || 1;
    const grandTotalChapters = parsed.grandTotalChapters
        ?? parsed.fullPlan?.grandTotalChapters
        ?? normalizedChunks.reduce((s, c) => s + (Number(c.chapTotal) || 0), 0);
    const grandTotalVerses = parsed.grandTotalVerses
        ?? parsed.fullPlan?.grandTotalVerses
        ?? normalizedChunks.reduce((s, c) => s + (Number(c.verseTotal) || 0), 0);
    const grandTotalArtMins = parsed.grandTotalArtMins
        ?? parsed.fullPlan?.grandTotalArtMins
        ?? normalizedChunks.reduce((s, c) => s + (Number(c.artTotalMins) || 0), 0);

    const now = new Date();
    const defaultDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    const rawHours = now.getHours();
    const h12 = rawHours % 12 === 0 ? 12 : rawHours % 12;
    const defaultTime = `${String(h12).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${rawHours >= 12 ? 'PM' : 'AM'}`;

    const selectedDateText = (apiData.date || parsed.selectedDateText || parsed.fullPlan?.selectedDateText || defaultDate).replace(/\//g, '-');
    const selectedTimeText = apiData.time || parsed.selectedTimeText || parsed.fullPlan?.selectedTimeText || defaultTime;

    return {
        numDays: parsed.numDays || parsed.fullPlan?.numDays || allRows.length || 30,
        numPersons: parsed.numPersons || parsed.fullPlan?.numPersons || null,
        durationText: parsed.durationText || parsed.fullPlan?.durationText || null,
        selectedDateText,
        selectedTimeText,
        mdl: mod,
        fct,
        phs,
        maxPhases,
        headerSubtitle: `MODULE${mod}:FACET${fct}:PHASE-${phs}/${maxPhases}`,
        footerPhaseText: `MODULE ${mod} - FACET ${fct}: PHASE - ${phs}/${maxPhases}`,
        bkArBks: parsed.bkArBks || parsed.fullPlan?.bkArBks || '6 6',
        bkArArt: parsed.bkArArt || parsed.fullPlan?.bkArArt || '4 0 +',
        chunks: normalizedChunks,
        rows: allRows,
        grandTotalChapters,
        grandTotalVerses,
        grandTotalArtMins,
        grandTotalArtHrMins: parsed.grandTotalArtHrMins || parsed.fullPlan?.grandTotalArtHrMins || formatChartTime(grandTotalArtMins, 'HrMins'),
        grandTotalArtCompact: parsed.grandTotalArtCompact || parsed.fullPlan?.grandTotalArtCompact || formatChartTime(grandTotalArtMins, 'hm_compact')
    };
};

const ReadingPlanView = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useRef(null);

    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [readingPlanId, setReadingPlanId] = useState(location.state?.readingPlanId || null);
    const [tLabel, setTLabel] = useState('T');
    const [bannerText, setBannerText] = useState('MAIN CHART - 30 DAYS');
    const [logo1, setLogo1] = useState(null);
    const [logo2, setLogo2] = useState(null);
    const [logo3, setLogo3] = useState(null);

    const [isSavingChart, setIsSavingChart] = useState(false);
    const [isDownloadingChart, setIsDownloadingChart] = useState(false);
    const [isPrintingChart, setIsPrintingChart] = useState(false);
    const [exportProgress, setExportProgress] = useState(null);
    const [isLoadingChart, setIsLoadingChart] = useState(false);
    const [chartFontSize, setChartFontSize] = useState(12);
    const [isBold, setIsBold] = useState(true);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [wrapText, setWrapText] = useState(true);

    // On-screen pagination for large charts (200+ weeks) so DOM stays fast & responsive
    const [currentScreenPage, setCurrentScreenPage] = useState(1);
    const [pagesPerScreen, setPagesPerScreen] = useState(10); // 10 chart pages = 50 weeks per view (0 = Show All)
    const [weekRangeFrom, setWeekRangeFrom] = useState('1');
    const [weekRangeTo, setWeekRangeTo] = useState('50');

    const [activeColorBoxPopupId, setActiveColorBoxPopupId] = useState(null);
    const [editingColorBoxId, setEditingColorBoxId] = useState(null);

    // Custom Print Modal State (for A5, A6, A7, Visa, DL Size)
    const [printModalSizeKey, setPrintModalSizeKey] = useState(null);
    const [printSelectedWeekIds, setPrintSelectedWeekIds] = useState([]);
    const [printSelectedCols, setPrintSelectedCols] = useState({ ...DEFAULT_SELECTED_COLUMNS });
    const [printWeeksPerPage, setPrintWeeksPerPage] = useState(0); // 0 = All selected weeks on 1 page, or N weeks per page
    const [printBoldnessLevel, setPrintBoldnessLevel] = useState(4); // 1=Normal, 2=Medium, 3=Bold, 4=Extra Bold, 5=Ultra Bold
    const [printFontSize, setPrintFontSize] = useState(15);
    const [printShowTopHeader, setPrintShowTopHeader] = useState(true);
    const [printShowPromisesRow, setPrintShowPromisesRow] = useState(true);
    const [printShowSubtotalRow, setPrintShowSubtotalRow] = useState(true);
    const [printShowGrandTotalRow, setPrintShowGrandTotalRow] = useState(true);

    const [userRole, setUserRole] = useState(null);
    const [userId, setUserId] = useState(null);
    const [userLocation, setUserLocation] = useState('');

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (!e.target.closest('.color-box-popup') && !e.target.closest('.promise-color-box')) {
                setActiveColorBoxPopupId(null);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    useEffect(() => {
        axios.get('http://' + window.location.hostname + ':8000/api/me', { withCredentials: true })
            .then(res => {
                setUserRole(res.data.role);
                if (res.data.id) setUserId(res.data.id);
                if (res.data.location_name) setUserLocation(res.data.location_name);
            })
            .catch(err => console.error('Error fetching user role:', err));
    }, []);

    const applyLoadedChartData = (data, triggerAutoPrint = false) => {
        const host = 'http://' + window.location.hostname + ':8000';
        const plan = reconstructPlanFromSavedData(data);
        if (plan) {
            setGeneratedPlan(plan);
            try {
                sessionStorage.setItem('latest_reading_plan', JSON.stringify(plan));
            } catch (e) {}
        }
        if (data.id) {
            setReadingPlanId(data.id);
        }
        if (data.banner_text) {
            setBannerText(data.banner_text);
            try {
                sessionStorage.setItem('latest_reading_plan_banner', data.banner_text);
            } catch (e) {}
        } else if (plan) {
            const defaultHeading = `MAIN CHART - ${plan.numDays} DAYS`;
            setBannerText(defaultHeading);
            try {
                sessionStorage.setItem('latest_reading_plan_banner', defaultHeading);
            } catch (e) {}
        }
        if (data.t_label) {
            setTLabel(data.t_label);
        }
        if (data.logo_urls_json) {
            try {
                const logosObj = typeof data.logo_urls_json === 'string'
                    ? JSON.parse(data.logo_urls_json)
                    : data.logo_urls_json;
                setLogo1(logosObj?.logo1 ? `${host}${logosObj.logo1}` : null);
                setLogo2(logosObj?.logo2 ? `${host}${logosObj.logo2}` : null);
                setLogo3(logosObj?.logo3 ? `${host}${logosObj.logo3}` : null);
            } catch (e) {
                setLogo1(data.logo_url ? `${host}${data.logo_url}` : null);
                setLogo2(null);
                setLogo3(null);
            }
        } else {
            setLogo1(data.logo_url ? `${host}${data.logo_url}` : null);
            setLogo2(null);
            setLogo3(null);
        }

        if (triggerAutoPrint && plan) {
            setTimeout(() => {
                handlePrintReadingPlan(plan);
            }, 600);
        }
    };

    const loadReadingPlanById = async (chartId, triggerAutoPrint = false) => {
        setIsLoadingChart(true);
        try {
            const host = 'http://' + window.location.hostname + ':8000';
            const res = await axios.get(`${host}/api/charts/reading-plans/${chartId}`, {
                withCredentials: true
            });
            if (res.data) {
                applyLoadedChartData(res.data, triggerAutoPrint);
            }
        } catch (err) {
            console.error('Error loading Reading Plan by ID:', err);
            toast.current?.show({
                severity: 'warn',
                summary: 'Not Found',
                detail: 'Could not load the selected Reading Plan chart.',
                life: 3500
            });
        } finally {
            setIsLoadingChart(false);
        }
    };

    const loadChartFromDB = async (mod, fct, phs, triggerAutoPrint = false) => {
        setIsLoadingChart(true);
        try {
            const host = 'http://' + window.location.hostname + ':8000';
            const res = await axios.get(`${host}/api/charts/sync/${mod}/${fct}/${phs}`, {
                withCredentials: true
            });
            if (res.data) {
                applyLoadedChartData(res.data, triggerAutoPrint);
            }
        } catch (err) {
            console.error('Error loading saved Reading Plan chart:', err);
            toast.current?.show({
                severity: 'warn',
                summary: 'Not Found',
                detail: `No saved Reading Plan chart found for Module ${mod}, Facet ${fct}, Phase ${phs}.`,
                life: 3500
            });
        } finally {
            setIsLoadingChart(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            // Priority 1: Specific Reading Plan ID passed from ReadingPlanListing.jsx
            if (location.state?.readingPlanId) {
                await loadReadingPlanById(location.state.readingPlanId, location.state.autoPrint === true);
                return;
            }

            // Priority 2: Newly generated chart passed via router state from ReadingPlan.jsx
            if (location.state?.generatedPlan) {
                setReadingPlanId(null);
                const incomingPlan = normalizePlanPhaseLabels(location.state.generatedPlan);
                setGeneratedPlan(incomingPlan);
                const incomingBanner = location.state.bannerText || `MAIN CHART - ${incomingPlan.numDays} DAYS`;
                setBannerText(incomingBanner);
                if (location.state.tLabel) setTLabel(location.state.tLabel);
                try {
                    sessionStorage.setItem('latest_reading_plan', JSON.stringify(incomingPlan));
                    sessionStorage.setItem('latest_reading_plan_banner', incomingBanner);
                } catch (e) {}

                if (location.state.autoPrint) {
                    setTimeout(() => handlePrintReadingPlan(incomingPlan), 600);
                }
                return;
            }

            // Priority 3: Preselected Module/Facet/Phase passed via VIEW or PRINT from ReadingPlan.jsx
            if (location.state?.preselect) {
                const { module: m, facet: f, phase: p } = location.state.preselect;
                await loadChartFromDB(m, f, p, location.state.autoPrint === true);
                return;
            }

            // Priority 4: Restore latest generated plan from sessionStorage if available
            const cachedStr = sessionStorage.getItem('latest_reading_plan');
            if (cachedStr) {
                try {
                    const cachedPlan = normalizePlanPhaseLabels(JSON.parse(cachedStr));
                    if (cachedPlan && Array.isArray(cachedPlan.chunks)) {
                        setGeneratedPlan(cachedPlan);
                        try {
                            sessionStorage.setItem('latest_reading_plan', JSON.stringify(cachedPlan));
                        } catch (e) {}
                        const cachedBanner = sessionStorage.getItem('latest_reading_plan_banner') || `MAIN CHART - ${cachedPlan.numDays} DAYS`;
                        setBannerText(cachedBanner);
                        return;
                    }
                } catch (e) {
                    // ignore invalid cache
                }
            }

            // Priority 5: Load first saved Reading Plan if present
            try {
                const res = await axios.get('http://' + window.location.hostname + ':8000/api/charts/reading-plans', {
                    withCredentials: true
                });
                const plans = Array.isArray(res.data) ? res.data : [];
                if (plans.length > 0) {
                    await loadReadingPlanById(plans[0].id, false);
                }
            } catch (e) {
                console.error('Error checking saved reading plans:', e);
            }
        };

        init();
    }, [location.state]);

    const updateChunkColorBox = (chunkId, updates) => {
        setGeneratedPlan((prev) => {
            if (!prev) return prev;
            const updated = {
                ...prev,
                chunks: prev.chunks.map((ch) =>
                    ch.id === chunkId ? { ...ch, ...updates } : ch
                )
            };
            if (updated.chunks.length <= 250) {
                try {
                    sessionStorage.setItem('latest_reading_plan', JSON.stringify(updated));
                } catch (e) {}
            }
            return updated;
        });
    };

    const enableColorBoxEditing = (chunkId) => {
        setActiveColorBoxPopupId(null);
        setEditingColorBoxId(chunkId);
        setTimeout(() => {
            const inputEl = document.getElementById(`color-box-input-${chunkId}`);
            if (inputEl) {
                inputEl.focus();
            }
        }, 0);
    };

    const saveReadingPlanChart = async () => {
        if (!generatedPlan) return;
        setIsSavingChart(true);
        try {
            const mod = generatedPlan.mdl || 5;
            const fct = generatedPlan.fct || 2;
            const phs = generatedPlan.phs || 1;
            const resolvedChartName = (bannerText || '').trim() || `MAIN CHART - ${generatedPlan.numDays} DAYS`;

            // Current date and time when the chart is created/saved
            const now = new Date();
            const currentCreatedDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
            const rawHours = now.getHours();
            const h12 = rawHours % 12 === 0 ? 12 : rawHours % 12;
            const currentCreatedTime = `${String(h12).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${rawHours >= 12 ? 'PM' : 'AM'}`;

            const formData = new FormData();
            formData.append('module', String(mod));
            formData.append('facet', String(fct));
            formData.append('phase', String(phs));
            formData.append('banner_text', resolvedChartName);
            formData.append('t_label', tLabel || 'T');
            formData.append('date', currentCreatedDate);
            formData.append('time', currentCreatedTime);
            if (userId) formData.append('user_id', String(userId));
            if (userLocation) formData.append('location', userLocation);
            if (readingPlanId) formData.append('reading_plan_id', String(readingPlanId));

            const scheduleDateStr = (generatedPlan.selectedDateText || currentCreatedDate).replace(/\//g, '-');
            const scheduleTimeStr = generatedPlan.selectedTimeText || currentCreatedTime;

            const payloadToSync = {
                _isWrapped: true,
                readingPlan: true,
                chartName: resolvedChartName,
                createdDate: currentCreatedDate,
                createdTime: currentCreatedTime,
                bkArBks: generatedPlan.bkArBks,
                bkArArt: generatedPlan.bkArArt,
                numDays: generatedPlan.numDays,
                numPersons: generatedPlan.numPersons,
                durationText: generatedPlan.durationText,
                selectedDateText: scheduleDateStr,
                selectedTimeText: scheduleTimeStr,
                maxPhases: generatedPlan.maxPhases,
                headerSubtitle: generatedPlan.headerSubtitle,
                footerPhaseText: generatedPlan.footerPhaseText,
                grandTotalChapters: generatedPlan.grandTotalChapters,
                grandTotalVerses: generatedPlan.grandTotalVerses,
                grandTotalArtMins: generatedPlan.grandTotalArtMins,
                grandTotalArtHrMins: generatedPlan.grandTotalArtHrMins,
                grandTotalArtCompact: generatedPlan.grandTotalArtCompact,
                fullPlan: generatedPlan,
                payload: generatedPlan.chunks
            };
            formData.append('state_payload', JSON.stringify(payloadToSync));

            if (logo1 && logo1.file instanceof File) formData.append('logo1', logo1.file);
            else if (logo1 instanceof File) formData.append('logo1', logo1);

            if (logo2 && logo2.file instanceof File) formData.append('logo2', logo2.file);
            else if (logo2 instanceof File) formData.append('logo2', logo2);

            if (logo3 && logo3.file instanceof File) formData.append('logo3', logo3.file);
            else if (logo3 instanceof File) formData.append('logo3', logo3);

            const syncRes = await axios.post('http://' + window.location.hostname + ':8000/api/charts/sync', formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (syncRes.data?.reading_plan_id) {
                setReadingPlanId(syncRes.data.reading_plan_id);
            }

            setBannerText(resolvedChartName);
            try {
                sessionStorage.setItem('latest_reading_plan', JSON.stringify(generatedPlan));
                sessionStorage.setItem('latest_reading_plan_banner', resolvedChartName);
            } catch (e) {}

            toast.current?.show({
                severity: 'success',
                summary: 'Chart Saved Automatically',
                detail: `Saved "${resolvedChartName}" (Created: ${currentCreatedDate} ${currentCreatedTime}).`,
                life: 3500
            });
        } catch (err) {
            console.error('Error saving reading plan chart:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Save Failed',
                detail: 'Could not save Reading Plan chart to database.',
                life: 3500
            });
        } finally {
            setIsSavingChart(false);
        }
    };

    const printSelectedWeekIdSet = useMemo(() => new Set(printSelectedWeekIds), [printSelectedWeekIds]);

    const loadLogoImageElement = (logoState) =>
        new Promise((resolve) => {
            const url = typeof logoState === 'object' && logoState !== null ? logoState.url : logoState;
            if (!url) {
                resolve(null);
                return;
            }
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = url;
        });

    const getExportPagesData = (planToUse, sizeConfig) => {
        if (!planToUse || !Array.isArray(planToUse.chunks)) return [];
        const customFilter = Boolean(sizeConfig?.key && sizeConfig.key !== 'a4' && printModalSizeKey);
        const filteredChunks = customFilter
            ? planToUse.chunks.filter((c) => printSelectedWeekIdSet.has(c.id))
            : planToUse.chunks;
        const chunksToPaginate = filteredChunks.length > 0 ? filteredChunks : planToUse.chunks.slice(0, 1);
        const weeksPerPage = customFilter
            ? (printWeeksPerPage > 0 ? printWeeksPerPage : Math.max(1, chunksToPaginate.length))
            : 5;

        const pages = [];
        for (let i = 0; i < chunksToPaginate.length; i += weeksPerPage) {
            pages.push(chunksToPaginate.slice(i, i + weeksPerPage));
        }
        return pages;
    };

    const renderReadingPlanPageToCanvas = (
        canvas,
        pageChunks,
        isLastPage,
        planToUse,
        sizeConfig,
        logoImgs,
        wrapCache
    ) => {
        const pageWidthMm = sizeConfig?.pageWidthMm || 210;
        const pageHeightMm = sizeConfig?.pageHeightMm || 297;
        const marginXMm = sizeConfig?.marginXMm ?? 6;
        const marginYMm = sizeConfig?.marginYMm ?? 6;
        const maxContentWidthMm = pageWidthMm - marginXMm * 2;
        const maxContentHeightMm = pageHeightMm - marginYMm * 2;
        const aspectRatio = maxContentHeightMm / maxContentWidthMm;

        const isCustomSize = Boolean(sizeConfig?.key && sizeConfig.key !== 'a4');
        const isSmallFormat = ['a6', 'a7', 'visa', 'dl'].includes(sizeConfig?.key);
        const activeBoldnessConfig =
            BOLDNESS_LEVEL_OPTIONS.find((b) => b.level === printBoldnessLevel) || BOLDNESS_LEVEL_OPTIONS[3];

        const customFilter = isCustomSize && Boolean(printModalSizeKey);
        const selColCount = TABLE_COLUMN_DEFINITIONS.filter((c) => Boolean(printSelectedCols[c.key])).length;
        const checkColVisible = (colKey) => {
            if (!customFilter) return true;
            if (selColCount === 0) return colKey === 'date';
            return Boolean(printSelectedCols[colKey]);
        };

        const cols = TABLE_COLUMN_DEFINITIONS.filter((c) => checkColVisible(c.key));
        const numCols = cols.length;
        const totalWeight = cols.reduce((s, c) => s + c.weight, 0) || 100;

        const showTopHdr = !customFilter || printShowTopHeader;
        const showPromRow = !customFilter || printShowPromisesRow;
        const showSubRow = !customFilter || printShowSubtotalRow;
        const showGrandRow = !customFilter || printShowGrandTotalRow;

        const logicalW = isSmallFormat
            ? numCols <= 6
                ? 640
                : numCols <= 10
                ? 700
                : 760
            : 1000;
        const targetPageH = Math.round(logicalW * aspectRatio);

        const fontSizePx = isCustomSize
            ? isSmallFormat && numCols <= 6
                ? Math.max(printFontSize + 2, 16)
                : printFontSize
            : chartFontSize;
        const fontWeightStr = isCustomSize ? activeBoldnessConfig.weight : isBold ? '800' : '400';
        const fontStyleStr = !isCustomSize && isItalic ? 'italic' : 'normal';
        const strokePx = isCustomSize ? activeBoldnessConfig.strokePx : 0;
        const lineHeightPx = Math.max(fontSizePx + 2, Math.round(fontSizePx * (isSmallFormat ? 1.14 : 1.2)));
        const cellPadX = isSmallFormat ? 2 : 4;
        const cellPadY = isSmallFormat ? 2 : 3;
        const greenColor = isSmallFormat ? '#007a33' : '#00b050';
        const blueColor = '#002060';
        const tableFont = `${fontStyleStr} ${fontWeightStr} ${fontSizePx}px "Arial Narrow", "Oswald", Arial, sans-serif`;

        const colWidths = cols.map((c) => (c.weight / totalWeight) * logicalW);
        const colX = [];
        let accX = 0;
        for (let i = 0; i < colWidths.length; i++) {
            colX.push(accX);
            accX += colWidths[i];
        }
        const colIndexByKey = {};
        cols.forEach((c, idx) => {
            colIndexByKey[c.key] = idx;
        });

        const getSpanBounds = (startIdx, spanCount) => {
            if (startIdx < 0 || spanCount <= 0 || startIdx >= cols.length) return { x: 0, w: 0 };
            const x = colX[startIdx];
            let w = 0;
            for (let k = startIdx; k < Math.min(cols.length, startIdx + spanCount); k++) {
                w += colWidths[k];
            }
            return { x, w };
        };

        const measureCtx = canvas.getContext('2d');
        measureCtx.font = tableFont;

        const wrapTextLines = (rawText, maxW, forceSingleLine = false) => {
            const str = String(rawText ?? '').trim();
            if (!str) return [''];
            const availW = Math.max(12, Math.floor(maxW));
            const shouldWrap = wrapText && !forceSingleLine;
            const cacheKey = `${tableFont}|${availW}|${shouldWrap ? 1 : 0}|${str}`;
            if (wrapCache.has(cacheKey)) return wrapCache.get(cacheKey);

            if (!shouldWrap || measureCtx.measureText(str).width <= availW) {
                const single = [str];
                wrapCache.set(cacheKey, single);
                return single;
            }

            const words = str.split(/\s+/);
            const lines = [];
            let curLine = '';
            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                const candidate = curLine ? `${curLine} ${word}` : word;
                if (measureCtx.measureText(candidate).width <= availW) {
                    curLine = candidate;
                } else {
                    if (curLine) lines.push(curLine);
                    curLine = word;
                }
            }
            if (curLine) lines.push(curLine);
            const result = lines.length > 0 ? lines : [str];
            wrapCache.set(cacheKey, result);
            return result;
        };

        // Build row descriptors to compute exact natural heights first
        const rowDescriptors = [];
        const hasTeamCol = checkColVisible('team');
        const hasPhaseSideCol = checkColVisible('phaseSide');
        const remAfterTeam = Math.max(0, numCols - (hasTeamCol ? 1 : 0));
        let promisesColSpan = remAfterTeam;
        let colorBoxColSpan = 0;
        if (remAfterTeam >= 3) {
            colorBoxColSpan = Math.min(4, Math.max(1, Math.round(remAfterTeam / 3)));
            promisesColSpan = remAfterTeam - colorBoxColSpan;
        } else if (remAfterTeam === 2) {
            promisesColSpan = 1;
            colorBoxColSpan = 1;
        }

        pageChunks.forEach((chunk) => {
            if (showPromRow) {
                const promStartIdx = hasTeamCol ? 1 : 0;
                const promBounds = getSpanBounds(promStartIdx, promisesColSpan);
                const fullPromText = [chunk.promises, chunk.promiseNote, chunk.promiseInput]
                    .map((s) => String(s || '').trim())
                    .filter(Boolean)
                    .join(' ');
                const lines = wrapTextLines(fullPromText, promBounds.w - cellPadX * 2);
                const h = Math.max(26, lines.length * lineHeightPx + cellPadY * 2);
                rowDescriptors.push({ type: 'promises', chunk, naturalH: h, h });
            }

            const hdrRowIdx = rowDescriptors.length;
            rowDescriptors.push({ type: 'weekHeader', chunk, naturalH: 24, h: 24 });

            (chunk.days || []).forEach((d) => {
                let maxLines = 1;
                cols.forEach((col, cIdx) => {
                    const colW = colWidths[cIdx];
                    if (col.key === 'date') {
                        maxLines = Math.max(maxLines, wrapTextLines(d.dateLabel, colW - cellPadX * 2).length);
                    } else if (col.key === 'reg1Book') {
                        maxLines = Math.max(maxLines, wrapTextLines(d.m1b, colW - cellPadX * 2).length);
                    } else if (col.key === 'reg1Time') {
                        maxLines = Math.max(maxLines, wrapTextLines(d.m1t, colW - cellPadX * 2).length);
                    } else if (col.key === 'reg2Book') {
                        maxLines = Math.max(maxLines, wrapTextLines(d.m2b, colW - cellPadX * 2).length);
                    } else if (col.key === 'reg2Time') {
                        maxLines = Math.max(maxLines, wrapTextLines(d.m2t, colW - cellPadX * 2).length);
                    } else if (col.key === 'otherBooks') {
                        const halfW = colW / 2 - cellPadX * 2;
                        maxLines = Math.max(
                            maxLines,
                            wrapTextLines(d.m3b_morning, halfW).length,
                            wrapTextLines(d.m3b_evening, halfW).length
                        );
                    } else if (col.key === 'otherTime') {
                        const halfW = colW / 2 - cellPadX * 2;
                        maxLines = Math.max(
                            maxLines,
                            wrapTextLines(d.m3t_morning, halfW).length,
                            wrapTextLines(d.m3t_evening, halfW).length
                        );
                    } else if (col.key === 'art') {
                        maxLines = Math.max(maxLines, wrapTextLines(d.art, colW - cellPadX * 2).length);
                    }
                });
                const dayH = Math.max(24, maxLines * lineHeightPx + cellPadY * 2);
                rowDescriptors.push({ type: 'day', chunk, day: d, naturalH: dayH, h: dayH });
            });

            if (showSubRow) {
                rowDescriptors.push({ type: 'subtotal', chunk, naturalH: 24, h: 24 });
            }

            const endRowIdx = rowDescriptors.length - 1;
            rowDescriptors[hdrRowIdx].teamEndRowIdx = showSubRow ? endRowIdx - 1 : endRowIdx;
            rowDescriptors[hdrRowIdx].phaseEndRowIdx = endRowIdx;
        });

        if (isLastPage && showGrandRow) {
            rowDescriptors.push({ type: 'grandTotal', naturalH: 25, h: 25 });
            const quoteText =
                'It is the same with my word. I send it out, and it always produces fruit. It will accomplish all I want it to, and it will prosper everywhere I send it. Isaiah 55:11';
            const quoteLines = wrapTextLines(quoteText, logicalW - 16);
            const quoteH = Math.max(25, quoteLines.length * lineHeightPx + cellPadY * 2);
            rowDescriptors.push({ type: 'quote', quoteText, naturalH: quoteH, h: quoteH });
        }

        const hdrRow1H = showTopHdr ? (isSmallFormat ? 44 : 54) : 0;
        const hdrRow2H = showTopHdr ? (isSmallFormat ? 48 : 62) : 0;
        const topHeaderH = hdrRow1H + hdrRow2H;
        const footerH = Math.max(22, lineHeightPx + 8);

        const naturalTableH = rowDescriptors.reduce((s, r) => s + r.naturalH, 0);
        const naturalPageH = topHeaderH + naturalTableH + footerH;
        const safeTargetHeight = targetPageH - 4;
        const deficit = Math.max(0, safeTargetHeight - naturalPageH);

        if (deficit > 0 && rowDescriptors.length > 0) {
            const dayRowIndices = [];
            const compactRowIndices = [];
            rowDescriptors.forEach((r, idx) => {
                if (r.type === 'day') dayRowIndices.push(idx);
                else compactRowIndices.push(idx);
            });

            if (dayRowIndices.length === 0) {
                const baseAdd = Math.floor(deficit / rowDescriptors.length);
                const rem = deficit % rowDescriptors.length;
                rowDescriptors.forEach((r, idx) => {
                    r.h = r.naturalH + baseAdd + (idx < rem ? 1 : 0);
                });
            } else {
                const evenShare = Math.floor(deficit / rowDescriptors.length);
                const compactAddEach = Math.min(6, Math.max(0, Math.floor(evenShare * 0.35)));
                const totalCompactUsed = compactAddEach * compactRowIndices.length;
                const remForDays = Math.max(0, deficit - totalCompactUsed);
                const dayBaseAdd = Math.floor(remForDays / dayRowIndices.length);
                const dayRem = remForDays % dayRowIndices.length;

                compactRowIndices.forEach((rIdx) => {
                    rowDescriptors[rIdx].h = rowDescriptors[rIdx].naturalH + compactAddEach;
                });
                dayRowIndices.forEach((rIdx, dPos) => {
                    rowDescriptors[rIdx].h = rowDescriptors[rIdx].naturalH + dayBaseAdd + (dPos < dayRem ? 1 : 0);
                });
            }
        }

        const finalTableH = rowDescriptors.reduce((s, r) => s + r.h, 0);
        const finalPageH = topHeaderH + finalTableH + footerH;

        const scale = isSmallFormat ? 2.5 : 2;
        canvas.width = Math.ceil(logicalW * scale);
        canvas.height = Math.ceil(finalPageH * scale);

        const ctx = canvas.getContext('2d');
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, logicalW, finalPageH);

        const drawStyledText = (lines, centerX, centerY, color = '#000000', customFont = null, align = 'center') => {
            ctx.save();
            ctx.font = customFont || tableFont;
            ctx.fillStyle = color;
            ctx.textAlign = align;
            ctx.textBaseline = 'middle';
            const totalTextH = lines.length * lineHeightPx;
            const startY = centerY - totalTextH / 2 + lineHeightPx / 2;
            for (let i = 0; i < lines.length; i++) {
                const lineStr = lines[i];
                const ly = startY + i * lineHeightPx;
                if (strokePx > 0 && !customFont) {
                    ctx.strokeStyle = color;
                    ctx.lineWidth = strokePx;
                    ctx.strokeText(lineStr, centerX, ly);
                }
                ctx.fillText(lineStr, centerX, ly);
                if (!isCustomSize && isUnderline && !customFont && lineStr) {
                    const tw = ctx.measureText(lineStr).width;
                    const ux = align === 'center' ? centerX - tw / 2 : centerX;
                    ctx.beginPath();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1;
                    ctx.moveTo(ux, ly + fontSizePx * 0.45);
                    ctx.lineTo(ux + tw, ly + fontSizePx * 0.45);
                    ctx.stroke();
                }
            }
            ctx.restore();
        };

        // 1. Draw Top Header Block
        if (showTopHdr) {
            const rightW = 160;
            const tBoxW = 55;
            const centerW = logicalW - tBoxW - rightW;

            // Row 1: T box
            ctx.fillStyle = '#00b050';
            ctx.fillRect(0, 0, tBoxW, hdrRow1H);
            drawStyledText([String(tLabel || 'T')], tBoxW / 2, hdrRow1H / 2, '#ffffff', 'bold 30px Georgia, "Times New Roman", serif');

            // Row 1: Center Title
            const titleText = `REAL LIFE LEADERSHIP TRAINING - ${planToUse.headerSubtitle || ''}`;
            drawStyledText(
                [titleText],
                tBoxW + centerW / 2,
                hdrRow1H / 2,
                '#ff0000',
                `bold ${isSmallFormat ? 15 : 18}px "Times New Roman", Times, serif`
            );

            // Row 1: Right 160px Date/Time + PH Grid
            const rightX = logicalW - rightW;
            const halfR1 = hdrRow1H / 2;
            ctx.fillStyle = '#00b050';
            ctx.fillRect(rightX + 100, 0, 60, hdrRow1H);

            drawStyledText(
                [(planToUse.selectedDateText || '').replace(/\//g, '-')],
                rightX + 50,
                halfR1 / 2,
                '#000000',
                'bold 12px Inter, Arial, sans-serif'
            );
            drawStyledText(['PH'], rightX + 130, halfR1 / 2, '#ffffff', '900 14px Inter, Arial, sans-serif');
            drawStyledText(
                [planToUse.selectedTimeText || ''],
                rightX + 50,
                halfR1 + halfR1 / 2,
                '#000000',
                'bold 12px Inter, Arial, sans-serif'
            );
            drawStyledText(
                [String(planToUse.phs ?? 1)],
                rightX + 130,
                halfR1 + halfR1 / 2,
                '#ffffff',
                'bold 16px Inter, Arial, sans-serif'
            );

            // Row 2: 3 Logo Boxes (85px each)
            const logoBoxW = 85;
            for (let lIdx = 0; lIdx < 3; lIdx++) {
                const lx = lIdx * logoBoxW;
                const img = logoImgs[lIdx];
                if (img && img.width > 0 && img.height > 0) {
                    const pad = 4;
                    const maxW = logoBoxW - pad * 2;
                    const maxH = hdrRow2H - pad * 2;
                    const ratio = Math.min(maxW / img.width, maxH / img.height);
                    const dw = img.width * ratio;
                    const dh = img.height * ratio;
                    ctx.drawImage(img, lx + (logoBoxW - dw) / 2, hdrRow1H + (hdrRow2H - dh) / 2, dw, dh);
                }
            }

            // Row 2: Orange Banner Box
            const bannerX = logoBoxW * 3;
            const bannerW = logicalW - bannerX - rightW;
            ctx.save();
            ctx.strokeStyle = '#e47636';
            ctx.lineWidth = 4;
            ctx.strokeRect(bannerX + 4, hdrRow1H + 4, bannerW - 8, hdrRow2H - 8);
            ctx.restore();
            drawStyledText(
                [String(bannerText || '').toUpperCase()],
                bannerX + bannerW / 2,
                hdrRow1H + hdrRow2H / 2,
                '#000000',
                `bold ${isSmallFormat ? 16 : 20}px Inter, Arial, sans-serif`
            );

            // Row 2: Right 160px BK - AR Block
            const halfR2 = hdrRow2H / 2;
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(rightX, hdrRow1H, rightW, hdrRow2H);
            drawStyledText(
                ['B K - A R'],
                rightX + rightW / 2,
                hdrRow1H + halfR2 / 2,
                '#000000',
                '900 17px Georgia, serif'
            );
            drawStyledText(
                [`${planToUse.bkArBks || '6 6'} - ${planToUse.bkArArt || '4 0 +'}`],
                rightX + rightW / 2,
                hdrRow1H + halfR2 + halfR2 / 2,
                '#000000',
                '900 15px Inter, Arial, sans-serif'
            );

            // Header Borders
            ctx.save();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, logicalW - 2, topHeaderH - 1);
            // Row 1 bottom line
            ctx.beginPath();
            ctx.moveTo(0, hdrRow1H);
            ctx.lineTo(logicalW, hdrRow1H);
            // T box right line
            ctx.moveTo(tBoxW, 0);
            ctx.lineTo(tBoxW, hdrRow1H);
            // Right block left line
            ctx.moveTo(rightX, 0);
            ctx.lineTo(rightX, topHeaderH);
            // Right Row 1 inner grid lines
            ctx.moveTo(rightX + 100, 0);
            ctx.lineTo(rightX + 100, hdrRow1H);
            ctx.moveTo(rightX, halfR1);
            ctx.lineTo(logicalW, halfR1);
            // Logo vertical dividers
            ctx.moveTo(logoBoxW, hdrRow1H);
            ctx.lineTo(logoBoxW, topHeaderH);
            ctx.moveTo(logoBoxW * 2, hdrRow1H);
            ctx.lineTo(logoBoxW * 2, topHeaderH);
            ctx.moveTo(logoBoxW * 3, hdrRow1H);
            ctx.lineTo(logoBoxW * 3, topHeaderH);
            // BK-AR horizontal divider
            ctx.moveTo(rightX, hdrRow1H + halfR2);
            ctx.lineTo(logicalW, hdrRow1H + halfR2);
            ctx.stroke();
            ctx.restore();
        }

        // 2. Compute Y coordinates for each table row
        const rowY = [];
        let curY = topHeaderH;
        for (let i = 0; i < rowDescriptors.length; i++) {
            rowY.push(curY);
            curY += rowDescriptors[i].h;
        }

        const cellBorderWidth = isSmallFormat ? 1.75 : 1.5;
        const drawCellRect = (x, y, w, h) => {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = cellBorderWidth;
            ctx.strokeRect(x, y, w, h);
        };

        // Draw Table Rows
        const verticalSpanTasks = [];

        for (let rIdx = 0; rIdx < rowDescriptors.length; rIdx++) {
            const row = rowDescriptors[rIdx];
            const ry = rowY[rIdx];
            const rh = row.h;

            if (row.type === 'promises') {
                const { chunk } = row;
                let curColIdx = 0;
                if (hasTeamCol) {
                    drawCellRect(colX[0], ry, colWidths[0], rh);
                    curColIdx = 1;
                }
                if (promisesColSpan > 0) {
                    const b = getSpanBounds(curColIdx, promisesColSpan);
                    drawCellRect(b.x, ry, b.w, rh);
                    const prefixStr = [chunk.promises, chunk.promiseNote]
                        .map((s) => String(s || '').trim())
                        .filter(Boolean)
                        .join(' ');
                    const bodyStr = String(chunk.promiseInput || '').trim();
                    const combined = [prefixStr, bodyStr].filter(Boolean).join('   ');
                    const lines = wrapTextLines(combined, b.w - cellPadX * 2);
                    drawStyledText(lines, b.x + b.w / 2, ry + rh / 2, '#000000');
                    curColIdx += promisesColSpan;
                }
                if (colorBoxColSpan > 0) {
                    const b = getSpanBounds(curColIdx, colorBoxColSpan);
                    drawCellRect(b.x, ry, b.w, rh);
                    ctx.save();
                    ctx.strokeStyle = chunk.borderColor || '#00b0f0';
                    ctx.lineWidth = 3.5;
                    ctx.strokeRect(b.x + 2.5, ry + 2.5, Math.max(4, b.w - 5), Math.max(4, rh - 5));
                    ctx.restore();
                    if (chunk.colorBoxText) {
                        const txtColor = chunk.colorBoxTextColor || '#000000';
                        drawStyledText(
                            wrapTextLines(chunk.colorBoxText, b.w - 10, true),
                            b.x + b.w / 2,
                            ry + rh / 2,
                            txtColor
                        );
                    }
                }
            } else if (row.type === 'weekHeader') {
                const { chunk } = row;
                cols.forEach((col, cIdx) => {
                    const cx = colX[cIdx];
                    const cw = colWidths[cIdx];
                    if (col.key === 'team') {
                        const endR = row.teamEndRowIdx ?? rIdx;
                        const spanH = rowY[endR] + rowDescriptors[endR].h - ry;
                        verticalSpanTasks.push({
                            x: cx,
                            y: ry,
                            w: cw,
                            h: spanH,
                            text: String(chunk.teamLabel ?? `${chunk.teamPrefix || 'TEAM / WEEK - '}${chunk.weekNumber}`).toUpperCase()
                        });
                    } else if (col.key === 'phaseSide') {
                        const endR = row.phaseEndRowIdx ?? rIdx;
                        const spanH = rowY[endR] + rowDescriptors[endR].h - ry;
                        verticalSpanTasks.push({
                            x: cx,
                            y: ry,
                            w: cw,
                            h: spanH,
                            text: `MDL ${planToUse.mdl}: FCT ${planToUse.fct}: PHS - ${planToUse.phs}`
                        });
                    } else {
                        drawCellRect(cx, ry, cw, rh);
                        let label = '';
                        if (col.key === 'date') label = 'DATE';
                        else if (col.key === 'reg1Book') label = chunk.h1 || '';
                        else if (col.key === 'reg1Time') label = 'TIME';
                        else if (col.key === 'reg2Book') label = chunk.h2 || '';
                        else if (col.key === 'reg2Time') label = 'TIME';
                        else if (col.key === 'otherBooks') label = chunk.h3 || '';
                        else if (col.key === 'otherTime') label = 'TIME';
                        else if (col.key === 'chap') label = 'CHAP';
                        else if (col.key === 'verse') label = 'VERSE';
                        else if (col.key === 'art') label = 'ART';
                        else if (col.key === 'day') label = 'DAY';
                        if (label) {
                            drawStyledText([String(label).toUpperCase()], cx + cw / 2, ry + rh / 2, '#000000');
                        }
                    }
                });
            } else if (row.type === 'day') {
                const d = row.day;
                cols.forEach((col, cIdx) => {
                    if (col.key === 'team' || col.key === 'phaseSide') return;
                    const cx = colX[cIdx];
                    const cw = colWidths[cIdx];
                    drawCellRect(cx, ry, cw, rh);

                    if (col.key === 'date') {
                        drawStyledText(wrapTextLines(d.dateLabel, cw - cellPadX * 2), cx + cw / 2, ry + rh / 2, '#000000');
                    } else if (col.key === 'reg1Book') {
                        drawStyledText(wrapTextLines(d.m1b, cw - cellPadX * 2), cx + cw / 2, ry + rh / 2, greenColor);
                    } else if (col.key === 'reg1Time') {
                        drawStyledText(wrapTextLines(d.m1t, cw - cellPadX * 2), cx + cw / 2, ry + rh / 2, '#000000');
                    } else if (col.key === 'reg2Book') {
                        drawStyledText(wrapTextLines(d.m2b, cw - cellPadX * 2), cx + cw / 2, ry + rh / 2, greenColor);
                    } else if (col.key === 'reg2Time') {
                        drawStyledText(wrapTextLines(d.m2t, cw - cellPadX * 2), cx + cw / 2, ry + rh / 2, '#000000');
                    } else if (col.key === 'otherBooks') {
                        const halfW = cw / 2;
                        ctx.beginPath();
                        ctx.strokeStyle = '#000000';
                        ctx.lineWidth = cellBorderWidth;
                        ctx.moveTo(cx + halfW, ry);
                        ctx.lineTo(cx + halfW, ry + rh);
                        ctx.stroke();
                        drawStyledText(
                            wrapTextLines(d.m3b_morning, halfW - cellPadX * 2),
                            cx + halfW / 2,
                            ry + rh / 2,
                            greenColor
                        );
                        drawStyledText(
                            wrapTextLines(d.m3b_evening, halfW - cellPadX * 2),
                            cx + halfW + halfW / 2,
                            ry + rh / 2,
                            blueColor
                        );
                    } else if (col.key === 'otherTime') {
                        const halfW = cw / 2;
                        ctx.beginPath();
                        ctx.strokeStyle = '#000000';
                        ctx.lineWidth = cellBorderWidth;
                        ctx.moveTo(cx + halfW, ry);
                        ctx.lineTo(cx + halfW, ry + rh);
                        ctx.stroke();
                        drawStyledText(
                            wrapTextLines(d.m3t_morning, halfW - cellPadX * 2),
                            cx + halfW / 2,
                            ry + rh / 2,
                            greenColor
                        );
                        drawStyledText(
                            wrapTextLines(d.m3t_evening, halfW - cellPadX * 2),
                            cx + halfW + halfW / 2,
                            ry + rh / 2,
                            blueColor
                        );
                    } else if (col.key === 'chap') {
                        drawStyledText([String(d.chap ?? '')], cx + cw / 2, ry + rh / 2, '#000000');
                    } else if (col.key === 'verse') {
                        drawStyledText([String(d.verse ?? '')], cx + cw / 2, ry + rh / 2, '#000000');
                    } else if (col.key === 'art') {
                        drawStyledText(wrapTextLines(d.art, cw - cellPadX * 2), cx + cw / 2, ry + rh / 2, '#000000');
                    }
                });
            } else if (row.type === 'subtotal') {
                const { chunk } = row;
                if (checkColVisible('team')) {
                    const idx = colIndexByKey.team;
                    drawCellRect(colX[idx], ry, colWidths[idx], rh);
                }
                if (checkColVisible('date')) {
                    const idx = colIndexByKey.date;
                    drawCellRect(colX[idx], ry, colWidths[idx], rh);
                }
                const reg1Cols = ['reg1Book', 'reg1Time'].filter(checkColVisible);
                if (reg1Cols.length > 0) {
                    const b = getSpanBounds(colIndexByKey[reg1Cols[0]], reg1Cols.length);
                    drawCellRect(b.x, ry, b.w, rh);
                    drawStyledText(wrapTextLines(chunk.m1TotalStr, b.w - cellPadX * 2), b.x + b.w / 2, ry + rh / 2, '#000000');
                }
                const reg2Cols = ['reg2Book', 'reg2Time'].filter(checkColVisible);
                if (reg2Cols.length > 0) {
                    const b = getSpanBounds(colIndexByKey[reg2Cols[0]], reg2Cols.length);
                    drawCellRect(b.x, ry, b.w, rh);
                    drawStyledText(wrapTextLines(chunk.m2TotalStr, b.w - cellPadX * 2), b.x + b.w / 2, ry + rh / 2, '#000000');
                }
                const otherCols = ['otherBooks', 'otherTime'].filter(checkColVisible);
                if (otherCols.length > 0) {
                    const b = getSpanBounds(colIndexByKey[otherCols[0]], otherCols.length);
                    drawCellRect(b.x, ry, b.w, rh);
                    drawStyledText(wrapTextLines(chunk.m3TotalStr, b.w - cellPadX * 2), b.x + b.w / 2, ry + rh / 2, '#000000');
                }
                if (checkColVisible('chap')) {
                    const idx = colIndexByKey.chap;
                    drawCellRect(colX[idx], ry, colWidths[idx], rh);
                    drawStyledText([String(chunk.chapTotal ?? '')], colX[idx] + colWidths[idx] / 2, ry + rh / 2, '#000000');
                }
                if (checkColVisible('verse')) {
                    const idx = colIndexByKey.verse;
                    drawCellRect(colX[idx], ry, colWidths[idx], rh);
                    drawStyledText([String(chunk.verseTotal ?? '')], colX[idx] + colWidths[idx] / 2, ry + rh / 2, '#000000');
                }
                const artDayCols = ['art', 'day'].filter(checkColVisible);
                if (artDayCols.length > 0) {
                    const b = getSpanBounds(colIndexByKey[artDayCols[0]], artDayCols.length);
                    drawCellRect(b.x, ry, b.w, rh);
                    drawStyledText(wrapTextLines(chunk.artTotalStr, b.w - cellPadX * 2), b.x + b.w / 2, ry + rh / 2, '#000000');
                }

                // Bold 2px bottom border for week separation
                ctx.save();
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, ry + rh);
                ctx.lineTo(logicalW, ry + rh);
                ctx.stroke();
                ctx.restore();
            } else if (row.type === 'grandTotal') {
                const leftKeys = ['team', 'date', 'reg1Book', 'reg1Time', 'reg2Book', 'reg2Time', 'otherBooks', 'otherTime'].filter(
                    checkColVisible
                );
                const rightKeys = ['art', 'day', 'phaseSide'].filter(checkColVisible);
                const totalLabel = `TOTAL AVERAGE READING TIME    ${planToUse.grandTotalArtHrMins || ''}`;
                if (leftKeys.length > 0) {
                    const bLeft = getSpanBounds(0, leftKeys.length);
                    drawCellRect(bLeft.x, ry, bLeft.w, rh);
                    drawStyledText(wrapTextLines(totalLabel, bLeft.w - 8), bLeft.x + bLeft.w / 2, ry + rh / 2, '#000000');
                    if (checkColVisible('chap')) {
                        const idx = colIndexByKey.chap;
                        drawCellRect(colX[idx], ry, colWidths[idx], rh);
                        drawStyledText([String(planToUse.grandTotalChapters ?? '')], colX[idx] + colWidths[idx] / 2, ry + rh / 2, '#000000');
                    }
                    if (checkColVisible('verse')) {
                        const idx = colIndexByKey.verse;
                        drawCellRect(colX[idx], ry, colWidths[idx], rh);
                        drawStyledText([String(planToUse.grandTotalVerses ?? '')], colX[idx] + colWidths[idx] / 2, ry + rh / 2, '#000000');
                    }
                    if (rightKeys.length > 0) {
                        const bRight = getSpanBounds(colIndexByKey[rightKeys[0]], rightKeys.length);
                        drawCellRect(bRight.x, ry, bRight.w, rh);
                        drawStyledText(
                            wrapTextLines(planToUse.grandTotalArtCompact || '', bRight.w - 4),
                            bRight.x + bRight.w / 2,
                            ry + rh / 2,
                            '#000000'
                        );
                    }
                } else {
                    drawCellRect(0, ry, logicalW, rh);
                    drawStyledText(wrapTextLines(totalLabel, logicalW - 12), logicalW / 2, ry + rh / 2, '#000000');
                }
            } else if (row.type === 'quote') {
                drawCellRect(0, ry, logicalW, rh);
                const quoteFont = `italic ${fontWeightStr} ${fontSizePx}px "Arial Narrow", "Oswald", Arial, sans-serif`;
                drawStyledText(
                    wrapTextLines(row.quoteText, logicalW - 16),
                    logicalW / 2,
                    ry + rh / 2,
                    '#000000',
                    quoteFont
                );
            }
        }

        // Draw Vertical Spanned Cells (TEAM / WEEK and MDL:FCT:PHS)
        verticalSpanTasks.forEach((task) => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(task.x + 1, task.y + 1, Math.max(0, task.w - 2), Math.max(0, task.h - 2));
            drawCellRect(task.x, task.y, task.w, task.h);
            ctx.save();
            ctx.translate(task.x + task.w / 2, task.y + task.h / 2);
            ctx.rotate(-Math.PI / 2);
            drawStyledText([task.text], 0, 0, '#000000');
            ctx.restore();
        });

        // Outer 2px Table Border
        ctx.save();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, topHeaderH + 1, logicalW - 2, finalTableH - 2);
        ctx.restore();

        // 3. Draw Bottom Footer Bar
        const footerY = topHeaderH + finalTableH + footerH / 2;
        drawStyledText(
            [String(planToUse.footerPhaseText || '').toUpperCase()],
            logicalW / 2,
            footerY,
            '#000000'
        );

        return canvas.toDataURL('image/jpeg', 0.92);
    };

    const capturePaginatedA4Pages = async (
        sizeConfig = PRINT_SIZE_OPTIONS[0],
        planOverride = null,
        onPageRendered = null
    ) => {
        const activePlan = planOverride || generatedPlan;
        if (!activePlan) return [];

        const pagesToRender = getExportPagesData(activePlan, sizeConfig);
        if (!pagesToRender.length) return [];

        const logoImgs = await Promise.all([
            loadLogoImageElement(logo1),
            loadLogoImageElement(logo2),
            loadLogoImageElement(logo3)
        ]);

        const offscreenCanvas = document.createElement('canvas');
        const wrapCache = new Map();
        const capturedPages = [];
        const totalPages = pagesToRender.length;

        for (let i = 0; i < totalPages; i++) {
            setExportProgress({
                current: i + 1,
                total: totalPages,
                percent: Math.round(((i + 1) / totalPages) * 100)
            });

            // Yield every 4 pages so the browser UI & progress indicator stay smooth even for 200+ weeks
            if (i > 0 && i % 4 === 0) {
                await new Promise((r) => setTimeout(r, 0));
            }

            const isLastPage = i === totalPages - 1;
            const dataUrl = renderReadingPlanPageToCanvas(
                offscreenCanvas,
                pagesToRender[i],
                isLastPage,
                activePlan,
                sizeConfig,
                logoImgs,
                wrapCache
            );

            if (onPageRendered) {
                onPageRendered(dataUrl, i, totalPages);
            } else {
                capturedPages.push(dataUrl);
            }
        }

        return capturedPages;
    };

    const handlePrintReadingPlan = async (planOverride = null, sizeKey = 'a4') => {
        const activePlan = planOverride || generatedPlan;
        if (!activePlan || isPrintingChart) return;
        const sizeConfig = PRINT_SIZE_OPTIONS.find((opt) => opt.key === sizeKey) || PRINT_SIZE_OPTIONS[0];

        setActiveColorBoxPopupId(null);
        setIsPrintingChart(true);

        const printWindow = window.open('', '_blank', 'width=1100,height=850');
        if (!printWindow) {
            setIsPrintingChart(false);
            setExportProgress(null);
            window.print();
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>RLLT Reading Plan (${sizeConfig.label} - ${sizeConfig.dimLabel}) - ${activePlan.headerSubtitle}</title>
                <style>
                    body {
                        margin: 0;
                        padding: 40px;
                        font-family: Arial, sans-serif;
                        text-align: center;
                        color: #0B2149;
                    }
                </style>
            </head>
            <body>
                <h3>Preparing ${sizeConfig.label} (${sizeConfig.dimLabel}) Reading Plan Chart for Print...</h3>
            </body>
            </html>
        `);

        try {
            const pageDataUrls = await capturePaginatedA4Pages(sizeConfig, activePlan);
            if (!pageDataUrls.length) {
                printWindow.close();
                window.print();
                return;
            }

            const contentWidthMm = sizeConfig.pageWidthMm - sizeConfig.marginXMm * 2;
            const contentHeightMm = sizeConfig.pageHeightMm - sizeConfig.marginYMm * 2 - 1;

            const pagesHtml = pageDataUrls
                .map(
                    (url, idx) => `
                    <div class="a4-print-sheet">
                        <img src="${url}" alt="Reading Plan Page ${idx + 1}" />
                    </div>
                `
                )
                .join('');

            printWindow.document.open();
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8" />
                    <title>RLLT Reading Plan (${sizeConfig.label} - ${sizeConfig.dimLabel}) - ${activePlan.headerSubtitle}</title>
                    <style>
                        @page {
                            size: ${sizeConfig.cssPageSize};
                            margin: ${sizeConfig.marginYMm}mm ${sizeConfig.marginXMm}mm;
                        }
                        * {
                            box-sizing: border-box !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                            width: 100% !important;
                            background: #ffffff !important;
                        }
                        .a4-print-sheet {
                            width: ${contentWidthMm}mm !important;
                            height: ${contentHeightMm}mm !important;
                            margin: 0 auto !important;
                            padding: 0 !important;
                            page-break-after: always !important;
                            break-after: page !important;
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                            display: flex !important;
                            align-items: stretch !important;
                            justify-content: center !important;
                        }
                        .a4-print-sheet:last-child {
                            page-break-after: auto !important;
                            break-after: auto !important;
                        }
                        .a4-print-sheet img {
                            width: 100% !important;
                            height: 100% !important;
                            object-fit: fill !important;
                            display: block !important;
                        }
                    </style>
                </head>
                <body>
                    ${pagesHtml}
                    <script>
                        (function() {
                            var imgs = Array.prototype.slice.call(document.images || []);
                            Promise.all(imgs.map(function(img) {
                                if (img.complete) return Promise.resolve();
                                return new Promise(function(res) {
                                    img.onload = res;
                                    img.onerror = res;
                                });
                            })).then(function() {
                                setTimeout(function() {
                                    window.focus();
                                    window.print();
                                }, 150);
                            });
                        })();
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        } catch (err) {
            console.error('Error preparing print chart:', err);
            printWindow.close();
        } finally {
            setIsPrintingChart(false);
            setExportProgress(null);
        }
    };

    const openCustomPrintModal = (sizeKey) => {
        if (!generatedPlan || !Array.isArray(generatedPlan.chunks)) return;
        const chunkIdSet = new Set(generatedPlan.chunks.map((c) => c.id));
        const validExisting = printSelectedWeekIds.filter((id) => chunkIdSet.has(id));
        if (validExisting.length === 0) {
            setPrintSelectedWeekIds(generatedPlan.chunks.map((c) => c.id));
        } else {
            setPrintSelectedWeekIds(validExisting);
        }
        setWeekRangeFrom('1');
        setWeekRangeTo(String(generatedPlan.chunks.length));
        setPrintModalSizeKey(sizeKey);
    };

    const selectWeekRange = () => {
        if (!generatedPlan || !Array.isArray(generatedPlan.chunks)) return;
        const total = generatedPlan.chunks.length;
        const start = Math.max(1, Math.min(total, parseInt(weekRangeFrom, 10) || 1));
        const end = Math.max(start, Math.min(total, parseInt(weekRangeTo, 10) || total));
        const selected = generatedPlan.chunks.slice(start - 1, end).map((c) => c.id);
        setPrintSelectedWeekIds(selected);
    };

    const togglePrintWeekSelection = (chunkId) => {
        setPrintSelectedWeekIds((prev) =>
            prev.includes(chunkId) ? prev.filter((id) => id !== chunkId) : [...prev, chunkId]
        );
    };

    const toggleSelectAllWeeks = () => {
        if (!generatedPlan || !Array.isArray(generatedPlan.chunks)) return;
        const allIds = generatedPlan.chunks.map((c) => c.id);
        const allSelected = allIds.length > 0 && allIds.length === printSelectedWeekIds.length && allIds.every((id) => printSelectedWeekIdSet.has(id));
        setPrintSelectedWeekIds(allSelected ? [] : allIds);
    };

    const togglePrintColumnSelection = (colKey) => {
        setPrintSelectedCols((prev) => ({
            ...prev,
            [colKey]: !prev[colKey]
        }));
    };

    const toggleSelectAllColumns = () => {
        const allSelected = TABLE_COLUMN_DEFINITIONS.every((col) => Boolean(printSelectedCols[col.key]));
        if (allSelected) {
            const cleared = {};
            TABLE_COLUMN_DEFINITIONS.forEach((col) => {
                cleared[col.key] = false;
            });
            setPrintSelectedCols(cleared);
        } else {
            setPrintSelectedCols({ ...DEFAULT_SELECTED_COLUMNS });
        }
    };

    const handleDownloadReadingPlan = async (sizeKeyOverride = 'a4') => {
        if (!generatedPlan || isDownloadingChart) return;

        const sizeConfig = PRINT_SIZE_OPTIONS.find((opt) => opt.key === sizeKeyOverride) || PRINT_SIZE_OPTIONS[0];

        setIsDownloadingChart(true);
        setActiveColorBoxPopupId(null);

        try {
            const isLandscape = sizeConfig.pageWidthMm > sizeConfig.pageHeightMm;
            const pdf = new jsPDF({
                orientation: isLandscape ? 'landscape' : 'portrait',
                unit: 'mm',
                format: [sizeConfig.pageWidthMm, sizeConfig.pageHeightMm],
                compress: true
            });

            const pageWidthMm = sizeConfig.pageWidthMm;
            const pageHeightMm = sizeConfig.pageHeightMm;
            const marginXMm = sizeConfig.marginXMm;
            const marginYMm = sizeConfig.marginYMm;
            const maxContentWidthMm = pageWidthMm - marginXMm * 2;
            const maxContentHeightMm = pageHeightMm - marginYMm * 2;

            let renderedCount = 0;
            await capturePaginatedA4Pages(sizeConfig, generatedPlan, (dataUrl, pageIdx) => {
                if (pageIdx > 0) {
                    pdf.addPage([pageWidthMm, pageHeightMm], isLandscape ? 'landscape' : 'portrait');
                }
                pdf.addImage(
                    dataUrl,
                    'JPEG',
                    marginXMm,
                    marginYMm,
                    maxContentWidthMm,
                    maxContentHeightMm,
                    undefined,
                    'FAST'
                );
                renderedCount++;
            });

            if (renderedCount === 0) return;

            const rawTitle = (bannerText || `MAIN_CHART_${generatedPlan.numDays || 30}_DAYS`).trim();
            const sizeSuffix = sizeConfig.key !== 'a4' ? `_${sizeConfig.key.toUpperCase()}` : '';
            const safeFileName =
                (rawTitle
                    .replace(/[^a-zA-Z0-9-_ ]/g, '')
                    .trim()
                    .replace(/\s+/g, '_') || 'Reading_Plan_Chart') + sizeSuffix;

            pdf.save(`${safeFileName}.pdf`);

            toast.current?.show({
                severity: 'success',
                summary: 'Chart Downloaded',
                detail: `Downloaded "${safeFileName}.pdf" (${renderedCount} ${renderedCount === 1 ? 'page' : 'pages'}).`,
                life: 3000
            });
        } catch (err) {
            console.error('Error downloading Reading Plan PDF:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Download Failed',
                detail: 'Could not generate the PDF file for this chart.',
                life: 3500
            });
        } finally {
            setIsDownloadingChart(false);
            setExportProgress(null);
        }
    };

    const baseRoute = userRole === 'student' ? '/dashboard/student' : '/admin';
    const wrapCls = wrapText ? 'whitespace-normal break-words' : 'whitespace-nowrap overflow-hidden text-ellipsis';

    const isCustomFilterActive = Boolean(printModalSizeKey);
    const activeModalSizeConfig = PRINT_SIZE_OPTIONS.find((opt) => opt.key === printModalSizeKey) || null;

    const selectedColCount = TABLE_COLUMN_DEFINITIONS.filter((c) => Boolean(printSelectedCols[c.key])).length;
    const allWeeksSelected = Boolean(
        generatedPlan?.chunks?.length &&
            generatedPlan.chunks.length === printSelectedWeekIds.length &&
            generatedPlan.chunks.every((c) => printSelectedWeekIdSet.has(c.id))
    );
    const allColsSelected = selectedColCount === TABLE_COLUMN_DEFINITIONS.length;

    const isColVisible = (colKey) => {
        if (!isCustomFilterActive) return true;
        if (selectedColCount === 0) return colKey === 'date';
        return Boolean(printSelectedCols[colKey]);
    };

    const activeCols = TABLE_COLUMN_DEFINITIONS.filter((c) => isColVisible(c.key));
    const totalActiveCols = activeCols.length;
    const totalActiveColWeight = activeCols.reduce((sum, c) => sum + c.weight, 0) || 100;

    const effectiveShowTopHeader = !isCustomFilterActive || printShowTopHeader;
    const effectiveShowPromisesRow = !isCustomFilterActive || printShowPromisesRow;
    const effectiveShowSubtotalRow = !isCustomFilterActive || printShowSubtotalRow;
    const effectiveShowGrandTotalRow = !isCustomFilterActive || printShowGrandTotalRow;

    const paginatedWeekPages = useMemo(() => {
        const pages = [];
        if (generatedPlan && Array.isArray(generatedPlan.chunks)) {
            const filteredChunks = isCustomFilterActive
                ? generatedPlan.chunks.filter((c) => printSelectedWeekIdSet.has(c.id))
                : generatedPlan.chunks;
            const chunksToPaginate = filteredChunks.length > 0 ? filteredChunks : generatedPlan.chunks.slice(0, 1);
            const weeksPerPage = isCustomFilterActive
                ? printWeeksPerPage > 0
                    ? printWeeksPerPage
                    : Math.max(1, chunksToPaginate.length)
                : 5;

            for (let i = 0; i < chunksToPaginate.length; i += weeksPerPage) {
                pages.push(chunksToPaginate.slice(i, i + weeksPerPage));
            }
        }
        return pages;
    }, [generatedPlan, isCustomFilterActive, printSelectedWeekIdSet, printWeeksPerPage]);

    const totalChartPages = paginatedWeekPages.length;
    const totalScreenGroups = pagesPerScreen > 0 ? Math.max(1, Math.ceil(totalChartPages / pagesPerScreen)) : 1;
    const safeScreenPage = Math.min(Math.max(1, currentScreenPage), totalScreenGroups);
    const screenStartPageIdx = pagesPerScreen > 0 ? (safeScreenPage - 1) * pagesPerScreen : 0;
    const screenEndPageIdx = pagesPerScreen > 0 ? Math.min(totalChartPages, screenStartPageIdx + pagesPerScreen) : totalChartPages;
    const visibleWeekPages = useMemo(
        () => paginatedWeekPages.slice(screenStartPageIdx, screenEndPageIdx),
        [paginatedWeekPages, screenStartPageIdx, screenEndPageIdx]
    );

    return (
        <div className="min-h-screen bg-gray-100 p-2 sm:p-4 font-sans select-none">
            <Toast ref={toast} />

            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&display=swap');
                    .rllt-condensed {
                        font-family: "Arial Narrow", "Oswald", Arial, sans-serif !important;
                    }
                    .rllt-pdf-table, .rllt-pdf-table td, .rllt-pdf-table th {
                        border: var(--cell-border, 1.5px solid #000) !important;
                        border-collapse: collapse !important;
                        position: relative !important;
                        box-sizing: border-box !important;
                    }
                    .rllt-pdf-table {
                        border: 2px solid #000000 !important;
                    }
                    .rllt-pdf-table tr > *:last-child {
                        border-right: 2px solid #000000 !important;
                    }
                    .rllt-pdf-table tr > *:first-child {
                        border-left: 2px solid #000000 !important;
                    }
                    .rllt-pdf-table tr:last-child > * {
                        border-bottom: 2px solid #000000 !important;
                    }
                    .rllt-split-cell {
                        position: relative !important;
                    }
                    .rllt-split-cell::after {
                        content: "";
                        position: absolute;
                        top: 0;
                        bottom: 0;
                        left: 50%;
                        width: 1.5px;
                        background-color: #000000;
                        transform: translateX(-50%);
                        pointer-events: none;
                    }
                    .rllt-uniform-text,
                    .rllt-pdf-table,
                    .rllt-pdf-table th,
                    .rllt-pdf-table td,
                    .rllt-pdf-table input,
                    .rllt-pdf-table span,
                    .rllt-pdf-table div {
                        font-size: var(--chart-font-size, 12px) !important;
                        font-weight: var(--chart-font-weight, 800) !important;
                        -webkit-text-stroke: var(--chart-text-stroke, 0px) !important;
                        font-style: var(--chart-font-style, normal) !important;
                        text-decoration: var(--chart-text-decoration, none) !important;
                        line-height: 1.2 !important;
                    }
                    .rllt-small-print-capture,
                    .rllt-small-print-capture .rllt-uniform-text,
                    .rllt-small-print-capture .rllt-pdf-table,
                    .rllt-small-print-capture .rllt-pdf-table th,
                    .rllt-small-print-capture .rllt-pdf-table td,
                    .rllt-small-print-capture .rllt-pdf-table input,
                    .rllt-small-print-capture .rllt-pdf-table span,
                    .rllt-small-print-capture .rllt-pdf-table div {
                        font-weight: var(--chart-font-weight, 900) !important;
                        -webkit-text-stroke: var(--chart-text-stroke, 0.55px currentColor) !important;
                        line-height: 1.12 !important;
                    }
                    .rllt-small-print-capture .rllt-pdf-table td,
                    .rllt-small-print-capture .rllt-pdf-table th {
                        padding: 1px 1.5px !important;
                        border-width: 1.75px !important;
                        border-color: #000000 !important;
                    }
                    .rllt-small-print-capture .text-\\[\\#00b050\\] {
                        color: #007a33 !important;
                    }
                    .rllt-small-print-capture .rllt-hdr-row-1 {
                        height: 44px !important;
                    }
                    .rllt-small-print-capture .rllt-hdr-row-2 {
                        height: 48px !important;
                    }
                `}
            </style>

            {/* Top Control Bar */}
            <div className="max-w-[1300px] mx-auto mb-4 bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-3 print:hidden">
                {/* First Row: Navigation, Text Size, Bold/Italic/Underline, Wrap Text, Save & Download */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate(`${baseRoute}/reading-plan`)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-gray-300 bg-gray-50 hover:bg-gray-100 text-[#0B2149] text-xs sm:text-sm font-bold transition-colors shadow-sm cursor-pointer"
                        >
                            <i className="pi pi-arrow-left text-xs"></i>
                            <span>Back to Calculator</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(`${baseRoute}/chart-listing/reading-plan`)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#0B2149]/30 bg-blue-50 hover:bg-blue-100 text-[#0B2149] text-xs sm:text-sm font-bold transition-colors shadow-sm cursor-pointer"
                        >
                            <i className="pi pi-list text-xs"></i>
                            <span>Reading Plan List</span>
                        </button>
                    </div>

                    {generatedPlan && (
                        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                            {/* Uniform Text Size Controls */}
                            <div className="flex items-center bg-gray-100 border border-gray-300 rounded-md p-0.5 shadow-inner">
                                <span className="px-2 text-[11px] sm:text-xs font-extrabold text-[#0B2149] uppercase tracking-wide">
                                    Text Size:
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setChartFontSize(s => Math.max(9, s - 1))}
                                    className="px-2.5 py-1 rounded bg-white hover:bg-gray-200 text-[#0B2149] font-black text-xs sm:text-sm border border-gray-300 transition-colors cursor-pointer"
                                    title="Decrease Text Size"
                                >
                                    A-
                                </button>
                                <span className="px-2.5 text-xs sm:text-sm font-black text-[#0B2149] min-w-[44px] text-center">
                                    {chartFontSize}px
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setChartFontSize(s => Math.min(22, s + 1))}
                                    className="px-2.5 py-1 rounded bg-white hover:bg-gray-200 text-[#0B2149] font-black text-xs sm:text-sm border border-gray-300 transition-colors cursor-pointer"
                                    title="Increase Text Size"
                                >
                                    A+
                                </button>
                            </div>

                            {/* Bold, Italic, Underline Controls */}
                            <div className="flex items-center bg-gray-100 border border-gray-300 rounded-md p-0.5 gap-1 shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => setIsBold(b => !b)}
                                    className={`w-8 h-7 rounded font-black text-xs sm:text-sm border transition-colors cursor-pointer flex items-center justify-center ${
                                        isBold
                                            ? 'bg-[#0B2149] text-white border-[#0B2149]'
                                            : 'bg-white hover:bg-gray-200 text-[#0B2149] border-gray-300'
                                    }`}
                                    title="Toggle Bold"
                                >
                                    B
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsItalic(i => !i)}
                                    className={`w-8 h-7 rounded italic font-serif font-bold text-xs sm:text-sm border transition-colors cursor-pointer flex items-center justify-center ${
                                        isItalic
                                            ? 'bg-[#0B2149] text-white border-[#0B2149]'
                                            : 'bg-white hover:bg-gray-200 text-[#0B2149] border-gray-300'
                                    }`}
                                    title="Toggle Italic"
                                >
                                    I
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsUnderline(u => !u)}
                                    className={`w-8 h-7 rounded underline font-bold text-xs sm:text-sm border transition-colors cursor-pointer flex items-center justify-center ${
                                        isUnderline
                                            ? 'bg-[#0B2149] text-white border-[#0B2149]'
                                            : 'bg-white hover:bg-gray-200 text-[#0B2149] border-gray-300'
                                    }`}
                                    title="Toggle Underline"
                                >
                                    U
                                </button>
                            </div>

                            {/* Wrap Text Toggle */}
                            <button
                                type="button"
                                onClick={() => setWrapText(w => !w)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-md border text-xs sm:text-sm font-bold transition-colors shadow-sm cursor-pointer ${
                                    wrapText
                                        ? 'bg-[#0B2149] text-white border-[#0B2149]'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                                title="Toggle Wrap Text"
                            >
                                <i className="pi pi-align-left text-xs"></i>
                                <span>Wrap Text: {wrapText ? 'ON' : 'OFF'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={saveReadingPlanChart}
                                disabled={isSavingChart}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs sm:text-sm font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                            >
                                <i className={`pi ${isSavingChart ? 'pi-spin pi-spinner' : 'pi-save'} text-xs sm:text-sm`}></i>
                                <span>{isSavingChart ? 'Saving...' : 'Save Chart'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDownloadReadingPlan('a4')}
                                disabled={isDownloadingChart || isPrintingChart}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs sm:text-sm font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                            >
                                <i className={`pi ${isDownloadingChart ? 'pi-spin pi-spinner' : 'pi-download'} text-xs sm:text-sm`}></i>
                                <span>
                                    {isDownloadingChart
                                        ? exportProgress
                                            ? `Downloading (${exportProgress.current}/${exportProgress.total})...`
                                            : 'Downloading...'
                                        : 'Download Chart'}
                                </span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Second Row (Next Line): Print Size Buttons (Print A4, Print A5, Print A6, Print A7, Print Visa, Print DL Size) */}
                {generatedPlan && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                            {exportProgress && (
                                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-[#0B2149] px-3 py-1.5 rounded-md text-xs font-extrabold">
                                    <i className="pi pi-spin pi-spinner text-xs text-blue-600"></i>
                                    <span>
                                        Processing Page {exportProgress.current} of {exportProgress.total} ({exportProgress.percent}%)...
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            {PRINT_SIZE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.key}
                                    type="button"
                                    disabled={isPrintingChart || isDownloadingChart}
                                    onClick={() => {
                                        if (opt.key === 'a4') {
                                            handlePrintReadingPlan(null, 'a4');
                                        } else {
                                            openCustomPrintModal(opt.key);
                                        }
                                    }}
                                    title={`${opt.label} (${opt.dimLabel})`}
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#007020] hover:bg-[#008a28] disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition-colors shadow-sm cursor-pointer"
                                >
                                    <i className={`pi ${isPrintingChart && opt.key === 'a4' ? 'pi-spin pi-spinner' : 'pi-print'} text-xs`}></i>
                                    <span>
                                        {isPrintingChart && opt.key === 'a4' && exportProgress
                                            ? `Print A4 (${exportProgress.current}/${exportProgress.total})...`
                                            : opt.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Print Configuration Modal for A5, A6, A7, Visa (89×51 mm), and DL Size (99×210 mm) */}
            {printModalSizeKey && activeModalSizeConfig && generatedPlan && (
                <div
                    className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-3 sm:p-5 print:hidden"
                    onClick={() => setPrintModalSizeKey(null)}
                >
                    <div
                        className="bg-white rounded-xl w-full max-w-[820px] max-h-[90vh] shadow-2xl border-2 border-[#0B2149] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="bg-[#0B2149] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2.5">
                                <i className="pi pi-print text-lg text-[#4ade80]"></i>
                                <div>
                                    <h3 className="text-sm sm:text-base font-black uppercase tracking-wider">
                                        {activeModalSizeConfig.label} Options ({activeModalSizeConfig.dimLabel})
                                    </h3>
                                    <p className="text-[11px] text-blue-200 font-semibold">
                                        Select which Weeks / Teams and Table Columns to include in your {activeModalSizeConfig.label.replace('Print ', '')} printout
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPrintModalSizeKey(null)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                                title="Close"
                            >
                                <i className="pi pi-times text-xs"></i>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-5 bg-gray-50 flex-1">
                            {/* 1. Team / Week-Wise Selection */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-100">
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-black text-[#0B2149] uppercase tracking-wide">
                                            1. Select Weeks / Teams to Print ({printSelectedWeekIds.length} of {generatedPlan.chunks.length} Selected)
                                        </h4>
                                        <p className="text-[11px] text-gray-500 font-medium">
                                            Check or uncheck the weeks (teams) you want to print
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {generatedPlan.chunks.length > 10 && (
                                            <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-300 rounded-md px-2 py-1 text-xs font-bold text-[#0B2149]">
                                                <span>Week</span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={generatedPlan.chunks.length}
                                                    value={weekRangeFrom}
                                                    onChange={(e) => setWeekRangeFrom(e.target.value)}
                                                    className="w-14 h-6 px-1 text-center rounded border border-gray-300 bg-white font-black text-xs"
                                                />
                                                <span>to</span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={generatedPlan.chunks.length}
                                                    value={weekRangeTo}
                                                    onChange={(e) => setWeekRangeTo(e.target.value)}
                                                    className="w-14 h-6 px-1 text-center rounded border border-gray-300 bg-white font-black text-xs"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={selectWeekRange}
                                                    className="px-2 py-0.5 rounded bg-[#0B2149] hover:bg-[#16376b] text-white text-[11px] font-extrabold uppercase cursor-pointer"
                                                >
                                                    Select Range
                                                </button>
                                            </div>
                                        )}
                                        <label className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-extrabold uppercase cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={allWeeksSelected}
                                                onChange={toggleSelectAllWeeks}
                                                className="accent-[#00b050] w-4 h-4 cursor-pointer"
                                            />
                                            <span>Select All</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="max-h-[190px] overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {generatedPlan.chunks.map((chunk) => {
                                        const isChecked = printSelectedWeekIdSet.has(chunk.id);
                                        const labelStr = chunk.teamLabel || `${chunk.teamPrefix || 'TEAM / WEEK - '}${chunk.weekNumber}`;
                                        return (
                                            <label
                                                key={chunk.id}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-extrabold uppercase cursor-pointer transition-all select-none ${
                                                    isChecked
                                                        ? 'bg-[#0B2149] text-white border-[#0B2149] shadow-sm'
                                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => togglePrintWeekSelection(chunk.id)}
                                                    className="accent-[#00b050] w-3.5 h-3.5 cursor-pointer"
                                                />
                                                <span className="truncate">{labelStr}</span>
                                            </label>
                                        );
                                    })}
                                </div>

                                {/* Weeks per Page selector */}
                                <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-gray-700">
                                        Weeks per Printed Page:
                                    </span>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {[
                                            { val: 0, label: 'Fit Selected on 1 Page' },
                                            { val: 1, label: '1 Week / Page' },
                                            { val: 2, label: '2 Weeks / Page' },
                                            { val: 3, label: '3 Weeks / Page' },
                                            { val: 5, label: '5 Weeks / Page' }
                                        ].map(item => (
                                            <button
                                                key={item.val}
                                                type="button"
                                                onClick={() => setPrintWeeksPerPage(item.val)}
                                                className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                                                    printWeeksPerPage === item.val
                                                        ? 'bg-[#007020] text-white border-[#007020]'
                                                        : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'
                                                }`}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 2. Column-Wise Selection */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-100">
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-black text-[#0B2149] uppercase tracking-wide">
                                            2. Select Columns to Include ({selectedColCount} of {TABLE_COLUMN_DEFINITIONS.length} Columns)
                                        </h4>
                                        <p className="text-[11px] text-gray-500 font-medium">
                                            Check or uncheck the columns you want in the printed table
                                        </p>
                                    </div>
                                    <label className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-extrabold uppercase cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={allColsSelected}
                                            onChange={toggleSelectAllColumns}
                                            className="accent-[#00b050] w-4 h-4 cursor-pointer"
                                        />
                                        <span>Select All</span>
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {TABLE_COLUMN_DEFINITIONS.map((col) => {
                                        const isChecked = Boolean(printSelectedCols[col.key]);
                                        return (
                                            <label
                                                key={col.key}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-bold cursor-pointer transition-all select-none ${
                                                    isChecked
                                                        ? 'bg-[#0B2149] text-white border-[#0B2149] shadow-sm'
                                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => togglePrintColumnSelection(col.key)}
                                                    className="accent-[#00b050] w-3.5 h-3.5 cursor-pointer"
                                                />
                                                <span className="truncate">{col.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>

                                {/* Optional Row / Header Toggles */}
                                <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap items-center gap-3">
                                    <span className="text-xs font-bold text-gray-700">Include Sections:</span>
                                    {[
                                        { label: 'Top Header Block', state: printShowTopHeader, setter: setPrintShowTopHeader },
                                        { label: "God's Promises Row", state: printShowPromisesRow, setter: setPrintShowPromisesRow },
                                        { label: 'Weekly Subtotal Row', state: printShowSubtotalRow, setter: setPrintShowSubtotalRow },
                                        { label: 'Grand Total Row', state: printShowGrandTotalRow, setter: setPrintShowGrandTotalRow }
                                    ].map((sec, idx) => (
                                        <label
                                            key={idx}
                                            className="flex items-center gap-1.5 text-xs font-bold text-[#0B2149] cursor-pointer select-none"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={sec.state}
                                                onChange={() => sec.setter(v => !v)}
                                                className="accent-[#0B2149] w-3.5 h-3.5 cursor-pointer"
                                            />
                                            <span>{sec.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Text Boldness & Size Control */}
                            {(() => {
                                const currentBoldObj =
                                    BOLDNESS_LEVEL_OPTIONS.find(b => b.level === printBoldnessLevel) || BOLDNESS_LEVEL_OPTIONS[3];
                                return (
                                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-100">
                                            <div>
                                                <h4 className="text-xs sm:text-sm font-black text-[#0B2149] uppercase tracking-wide">
                                                    3. Text Boldness & Size Control ({currentBoldObj.label} • {printFontSize}px)
                                                </h4>
                                                <p className="text-[11px] text-gray-500 font-medium">
                                                    Control how bold and large the text appears in {activeModalSizeConfig.label.replace('Print ', '')} PDF and Print
                                                </p>
                                            </div>

                                            {/* Text Size Stepper in Modal */}
                                            <div className="flex items-center bg-gray-100 border border-gray-300 rounded-md p-0.5 shadow-inner">
                                                <span className="px-2 text-[11px] font-extrabold text-[#0B2149] uppercase tracking-wide">
                                                    Print Text Size:
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setPrintFontSize(s => Math.max(10, s - 1))}
                                                    className="px-2.5 py-1 rounded bg-white hover:bg-gray-200 text-[#0B2149] font-black text-xs border border-gray-300 transition-colors cursor-pointer"
                                                    title="Decrease Print Text Size"
                                                >
                                                    A-
                                                </button>
                                                <span className="px-2.5 text-xs font-black text-[#0B2149] min-w-[42px] text-center">
                                                    {printFontSize}px
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setPrintFontSize(s => Math.min(24, s + 1))}
                                                    className="px-2.5 py-1 rounded bg-white hover:bg-gray-200 text-[#0B2149] font-black text-xs border border-gray-300 transition-colors cursor-pointer"
                                                    title="Increase Print Text Size"
                                                >
                                                    A+
                                                </button>
                                            </div>
                                        </div>

                                        {/* Boldness Level Controls */}
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setPrintBoldnessLevel(l => Math.max(1, l - 1))}
                                                    disabled={printBoldnessLevel <= 1}
                                                    className="px-2.5 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-[#0B2149] font-black text-xs border border-gray-300 transition-colors cursor-pointer"
                                                    title="Decrease Boldness"
                                                >
                                                    B-
                                                </button>

                                                {BOLDNESS_LEVEL_OPTIONS.map((bOpt) => {
                                                    const isSelected = printBoldnessLevel === bOpt.level;
                                                    return (
                                                        <button
                                                            key={bOpt.level}
                                                            type="button"
                                                            onClick={() => setPrintBoldnessLevel(bOpt.level)}
                                                            style={{
                                                                fontWeight: bOpt.weight,
                                                                WebkitTextStroke:
                                                                    bOpt.strokePx > 0
                                                                        ? `${Math.min(0.6, bOpt.strokePx)}px currentColor`
                                                                        : '0px'
                                                            }}
                                                            className={`px-3 py-1.5 rounded-md text-xs border transition-all cursor-pointer ${
                                                                isSelected
                                                                    ? 'bg-[#0B2149] text-white border-[#0B2149] shadow-sm'
                                                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-300'
                                                            }`}
                                                        >
                                                            {bOpt.label}
                                                        </button>
                                                    );
                                                })}

                                                <button
                                                    type="button"
                                                    onClick={() => setPrintBoldnessLevel(l => Math.min(5, l + 1))}
                                                    disabled={printBoldnessLevel >= 5}
                                                    className="px-2.5 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-[#0B2149] font-black text-xs border border-gray-300 transition-colors cursor-pointer"
                                                    title="Increase Boldness"
                                                >
                                                    B+
                                                </button>
                                            </div>

                                            {/* Live Boldness & Size Preview Box */}
                                            <div
                                                className="px-3 py-1.5 rounded border-2 border-black bg-white text-black rllt-condensed flex items-center gap-2"
                                                style={{
                                                    fontSize: `${printFontSize}px`,
                                                    fontWeight: currentBoldObj.weight,
                                                    WebkitTextStroke:
                                                        currentBoldObj.strokePx > 0
                                                            ? `${currentBoldObj.strokePx}px currentColor`
                                                            : '0px'
                                                }}
                                            >
                                                <span>5-T</span>
                                                <span className="text-[#007a33]">PRO 1</span>
                                                <span>3.05</span>
                                                <span className="text-[#007a33]">GEN 1-10</span>
                                                <span className="text-[#002060]">GEN 11-21</span>
                                                <span>1H 20m</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-100 border-t border-gray-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
                            <span className="text-xs font-bold text-gray-600">
                                Ready to print <strong>{printSelectedWeekIds.length}</strong> {printSelectedWeekIds.length === 1 ? 'week' : 'weeks'} with <strong>{selectedColCount}</strong> {selectedColCount === 1 ? 'column' : 'columns'} on <strong>{activeModalSizeConfig.dimLabel}</strong>
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPrintModalSizeKey(null)}
                                    className="px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (printSelectedWeekIds.length === 0 || selectedColCount === 0) {
                                            toast.current?.show({
                                                severity: 'warn',
                                                summary: 'Selection Required',
                                                detail: 'Please select at least 1 week and 1 column to download.',
                                                life: 3000
                                            });
                                            return;
                                        }
                                        const targetKey = printModalSizeKey;
                                        await handleDownloadReadingPlan(targetKey);
                                        setPrintModalSizeKey(null);
                                    }}
                                    disabled={isDownloadingChart || printSelectedWeekIds.length === 0 || selectedColCount === 0}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition-colors shadow-sm cursor-pointer"
                                >
                                    <i className="pi pi-download text-xs"></i>
                                    <span>Download {activeModalSizeConfig.label.replace('Print ', '')} PDF</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (printSelectedWeekIds.length === 0 || selectedColCount === 0) {
                                            toast.current?.show({
                                                severity: 'warn',
                                                summary: 'Selection Required',
                                                detail: 'Please select at least 1 week and 1 column to print.',
                                                life: 3000
                                            });
                                            return;
                                        }
                                        const targetKey = printModalSizeKey;
                                        await handlePrintReadingPlan(null, targetKey);
                                        setPrintModalSizeKey(null);
                                    }}
                                    disabled={printSelectedWeekIds.length === 0 || selectedColCount === 0}
                                    className="flex items-center gap-1.5 px-5 py-2 rounded-md bg-[#007020] hover:bg-[#008a28] disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition-colors shadow-sm cursor-pointer"
                                >
                                    <i className="pi pi-print text-xs"></i>
                                    <span>{activeModalSizeConfig.label} Now</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart Content */}
            {isLoadingChart ? (
                <div className="max-w-[1300px] mx-auto bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
                    <i className="pi pi-spin pi-spinner text-3xl text-[#0B2149] mb-3"></i>
                    <p className="text-gray-600 font-bold">Loading Reading Plan Chart...</p>
                </div>
            ) : generatedPlan ? (
                <div className="w-full max-w-[1300px] mx-auto mb-12 bg-white shadow-xl border border-gray-300 rounded-md overflow-hidden print:shadow-none print:border-none">
                    {/* Summary Info Bar */}
                    <div className="flex flex-wrap justify-between items-center gap-2 px-4 py-2.5 bg-[#102a4c] text-white print:hidden">
                        <div className="font-bold text-xs sm:text-sm tracking-wider uppercase">
                            {generatedPlan.chunks.length} {generatedPlan.chunks.length === 1 ? 'WEEK' : 'WEEKS'} ({generatedPlan.rows.length} DAYS • 5 DAYS/WEEK) • {generatedPlan.headerSubtitle}
                            {generatedPlan.selectedDateText ? ` • START: ${generatedPlan.selectedDateText} ${generatedPlan.selectedTimeText || ''}` : ''}
                            {generatedPlan.durationText ? ` • DURATION: ${generatedPlan.durationText}` : ''}
                        </div>
                        <div className="text-xs font-semibold text-blue-200">
                            Single-click colored box for 7 Transformation Colors • Double-click to enter text
                        </div>
                    </div>

                    {/* On-Screen Pagination Bar (keeps DOM fast when viewing 200+ weeks; Print & Download always include all pages) */}
                    {totalChartPages > 5 && (
                        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-100 border-b border-gray-300 text-xs font-bold text-[#0B2149] print:hidden">
                            <div className="flex items-center gap-2">
                                <span>
                                    Viewing Chart Pages <strong>{screenStartPageIdx + 1}–{screenEndPageIdx}</strong> of <strong>{totalChartPages}</strong>
                                    {' '}({generatedPlan.chunks.length} Total Weeks • Print & Download include all pages)
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-gray-600 mr-1">Pages per view:</span>
                                {[
                                    { val: 5, label: '5 Pages (25 Wks)' },
                                    { val: 10, label: '10 Pages (50 Wks)' },
                                    { val: 20, label: '20 Pages (100 Wks)' },
                                    { val: 0, label: `Show All (${totalChartPages})` }
                                ].map((opt) => (
                                    <button
                                        key={opt.val}
                                        type="button"
                                        onClick={() => {
                                            setPagesPerScreen(opt.val);
                                            setCurrentScreenPage(1);
                                        }}
                                        className={`px-2 py-1 rounded border text-[11px] font-extrabold transition-colors cursor-pointer ${
                                            pagesPerScreen === opt.val
                                                ? 'bg-[#0B2149] text-white border-[#0B2149]'
                                                : 'bg-white hover:bg-gray-200 text-[#0B2149] border-gray-300'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                                {pagesPerScreen > 0 && totalScreenGroups > 1 && (
                                    <div className="flex items-center gap-1 ml-2">
                                        <button
                                            type="button"
                                            disabled={safeScreenPage <= 1}
                                            onClick={() => setCurrentScreenPage(1)}
                                            className="px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-200 disabled:opacity-40 cursor-pointer"
                                        >
                                            First
                                        </button>
                                        <button
                                            type="button"
                                            disabled={safeScreenPage <= 1}
                                            onClick={() => setCurrentScreenPage((p) => Math.max(1, p - 1))}
                                            className="px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-200 disabled:opacity-40 cursor-pointer"
                                        >
                                            Prev
                                        </button>
                                        <span className="px-2 font-black">
                                            {safeScreenPage} / {totalScreenGroups}
                                        </span>
                                        <button
                                            type="button"
                                            disabled={safeScreenPage >= totalScreenGroups}
                                            onClick={() => setCurrentScreenPage((p) => Math.min(totalScreenGroups, p + 1))}
                                            className="px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-200 disabled:opacity-40 cursor-pointer"
                                        >
                                            Next
                                        </button>
                                        <button
                                            type="button"
                                            disabled={safeScreenPage >= totalScreenGroups}
                                            onClick={() => setCurrentScreenPage(totalScreenGroups)}
                                            className="px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-200 disabled:opacity-40 cursor-pointer"
                                        >
                                            Last
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Printable RLLT Chart Area (Paginated at 5 Weeks per Page, with Full Header on Each Page) */}
                    <div className="overflow-x-auto p-2 sm:p-4 bg-gray-100 print:p-0 print:bg-white">
                        <div
                            id="reading-plan-printable-area"
                            style={{
                                '--chart-font-size': `${chartFontSize}px`,
                                '--chart-font-weight': isBold ? '800' : '400',
                                '--chart-font-style': isItalic ? 'italic' : 'normal',
                                '--chart-text-decoration': isUnderline ? 'underline' : 'none'
                            }}
                            className="w-full min-w-[1000px] rllt-condensed select-text flex flex-col gap-6 print:block print:gap-0"
                        >
                            {visibleWeekPages.map((pageChunks, localIdx) => {
                                const pageIdx = screenStartPageIdx + localIdx;
                                const isLastPage = pageIdx === paginatedWeekPages.length - 1;

                                return (
                                    <div
                                        key={`page_${pageIdx + 1}`}
                                        style={{
                                            '--chart-font-size': `${chartFontSize}px`,
                                            '--chart-font-weight': isBold ? '800' : '400',
                                            '--chart-font-style': isItalic ? 'italic' : 'normal',
                                            '--chart-text-decoration': isUnderline ? 'underline' : 'none'
                                        }}
                                        className="rllt-print-page w-full bg-white text-black shadow-md print:shadow-none"
                                    >
                                        {/* Unified Top RLLT Header Block (Rendered on Every Page when enabled) */}
                                        {effectiveShowTopHeader && (
                                        <div className="rllt-top-header relative w-full border-[2px] border-b-0 border-black bg-white flex flex-col box-border" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                                            {/* ROW 1: T (55px) | CENTER TITLE (flex-1) | DATE & TIME (100px) + PH (60px) = 160px */}
                                            <div className="rllt-hdr-row-1 w-full h-[54px] border-b-[2px] border-black flex items-stretch bg-white">
                                                {/* T BLOCK */}
                                                <div className="w-[55px] shrink-0 bg-[#00b050] border-r-[2px] border-black flex items-center justify-center">
                                                    <input
                                                        type="text"
                                                        className="w-full h-full text-center bg-transparent text-white font-serif text-[30px] leading-none border-none outline-none p-0 m-0"
                                                        value={tLabel}
                                                        onChange={(e) => setTLabel(e.target.value)}
                                                    />
                                                </div>

                                                {/* CENTER TITLE */}
                                                <div className="flex-1 min-w-0 px-2 flex items-center justify-center text-center bg-white">
                                                    <span
                                                        className="text-[#ff0000] font-bold text-[19px] leading-tight tracking-wide uppercase"
                                                        style={{ fontFamily: '"Times New Roman", Times, serif' }}
                                                    >
                                                        REAL LIFE LEADERSHIP TRAINING - <span className="text-[15px] font-bold">{generatedPlan.headerSubtitle}</span>
                                                    </span>
                                                </div>

                                                {/* RIGHT 160px BLOCK: DATE/TIME (100px) + PH (60px) */}
                                                <div className="w-[160px] shrink-0 border-l-[2px] border-black grid grid-cols-[100px_60px] grid-rows-2 bg-white">
                                                    <div className="border-r-[2px] border-b-[2px] border-black px-1.5 flex items-center justify-center bg-white">
                                                        <span className="text-[12px] font-bold text-black uppercase whitespace-nowrap leading-none">
                                                            {(generatedPlan.selectedDateText || '').replace(/\//g, '-')}
                                                        </span>
                                                    </div>
                                                    <div className="border-b-[2px] border-black bg-[#00b050] flex items-center justify-center">
                                                        <span className="text-white font-black text-[14px] tracking-tighter leading-none">
                                                            PH
                                                        </span>
                                                    </div>
                                                    <div className="border-r-[2px] border-black px-1.5 flex items-center justify-center bg-white">
                                                        <span className="text-[12px] font-bold text-black uppercase whitespace-nowrap leading-none">
                                                            {generatedPlan.selectedTimeText || ''}
                                                        </span>
                                                    </div>
                                                    <div className="bg-[#00b050] flex items-center justify-center">
                                                        <span className="text-white font-bold text-[16px] leading-none">
                                                            {generatedPlan.phs}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ROW 2: 3 LOGO BOXES (85px each) | ORANGE BANNER (flex-1) | BK-AR (160px) */}
                                            <div className="rllt-hdr-row-2 w-full h-[62px] flex items-stretch bg-white">
                                                {/* IMAGE BOX 1 */}
                                                <div className="w-[85px] shrink-0 border-r-[2px] border-black p-1 overflow-hidden flex items-center justify-center bg-white">
                                                    <ImageUploadPlaceholder state={logo1} setState={setLogo1} label="" />
                                                </div>
                                                {/* IMAGE BOX 2 */}
                                                <div className="w-[85px] shrink-0 border-r-[2px] border-black p-1 overflow-hidden flex items-center justify-center bg-white">
                                                    <ImageUploadPlaceholder state={logo2} setState={setLogo2} label="" />
                                                </div>
                                                {/* IMAGE BOX 3 */}
                                                <div className="w-[85px] shrink-0 border-r-[2px] border-black p-1 overflow-hidden flex items-center justify-center bg-white">
                                                    <ImageUploadPlaceholder state={logo3} setState={setLogo3} label="" />
                                                </div>

                                                {/* ORANGE BANNER BOX */}
                                                <div className="flex-1 min-w-0 p-1 flex items-center justify-center bg-white relative">
                                                    <div className="absolute inset-[3px] border-[4px] border-[#e47636] pointer-events-none"></div>
                                                    <input
                                                        type="text"
                                                        value={bannerText}
                                                        onChange={(e) => setBannerText(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.currentTarget.blur();
                                                                saveReadingPlanChart();
                                                            }
                                                        }}
                                                        className="w-full h-full outline-none text-black font-bold px-3 text-center text-[20px] leading-none uppercase bg-transparent relative z-10"
                                                        placeholder="MAIN CHART - 30 DAYS"
                                                    />
                                                </div>

                                                {/* RIGHT 160px BK-AR BLOCK */}
                                                <div className="w-[160px] shrink-0 border-l-[2px] border-black grid grid-rows-2 bg-[#ffff00]">
                                                    <div className="border-b-[2px] border-black flex items-center justify-center px-1">
                                                        <span
                                                            className="text-black font-black text-[18px] leading-none whitespace-nowrap"
                                                            style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.14em' }}
                                                        >
                                                            B K - A R
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-center px-1">
                                                        <span
                                                            className="text-black font-black text-[16px] leading-none whitespace-nowrap"
                                                            style={{ letterSpacing: '0.14em' }}
                                                        >
                                                            {generatedPlan.bkArBks} - {generatedPlan.bkArArt}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pointer-events-none absolute inset-0 border-[2px] border-b-0 border-black z-[25] box-border"></div>
                                        </div>
                                        )}

                                        {/* Main Weekly Table (Up to 5 Weeks on This Page) */}
                                        <div className="rllt-table-container relative w-full flex-1 flex flex-col box-border bg-white">
                                            <table className="rllt-pdf-table w-full flex-1 border-collapse text-center table-fixed">
                                                <colgroup>
                                                    {activeCols.map((col) => (
                                                        <col
                                                            key={col.key}
                                                            style={{
                                                                width: `${((col.weight / totalActiveColWeight) * 100).toFixed(2)}%`
                                                            }}
                                                        />
                                                    ))}
                                                </colgroup>

                                                <tbody className="rllt-uniform-text">
                                                {pageChunks.map((chunk) => {
                                                    const hasTeamCol = isColVisible('team');
                                                    const remAfterTeam = Math.max(0, totalActiveCols - (hasTeamCol ? 1 : 0));
                                                    let promisesColSpan = remAfterTeam;
                                                    let colorBoxColSpan = 0;
                                                    if (remAfterTeam >= 3) {
                                                        colorBoxColSpan = Math.min(4, Math.max(1, Math.round(remAfterTeam / 3)));
                                                        promisesColSpan = remAfterTeam - colorBoxColSpan;
                                                    } else if (remAfterTeam === 2) {
                                                        promisesColSpan = 1;
                                                        colorBoxColSpan = 1;
                                                    }

                                                    const subReg1Span = (isColVisible('reg1Book') ? 1 : 0) + (isColVisible('reg1Time') ? 1 : 0);
                                                    const subReg2Span = (isColVisible('reg2Book') ? 1 : 0) + (isColVisible('reg2Time') ? 1 : 0);
                                                    const subOtherSpan = (isColVisible('otherBooks') ? 1 : 0) + (isColVisible('otherTime') ? 1 : 0);
                                                    const subArtDaySpan = (isColVisible('art') ? 1 : 0) + (isColVisible('day') ? 1 : 0);

                                                    return (
                                                    <React.Fragment key={chunk.id}>
                                                        {/* Row 1: GOD'S PROMISES Bar */}
                                                        {effectiveShowPromisesRow && (
                                                        <tr className="rllt-promises-row min-h-[26px] h-[26px] font-bold">
                                                            {hasTeamCol && <td className="border border-black bg-white"></td>}
                                                            {promisesColSpan > 0 && (
                                                            <td colSpan={promisesColSpan} className={`border border-black px-2 py-0.5 align-middle bg-white font-extrabold uppercase tracking-wide text-black ${wrapCls}`}>
                                                                <div className="flex items-center w-full h-full gap-1">
                                                                    <span className="whitespace-nowrap shrink-0">{chunk.promises}</span>
                                                                    <input
                                                                        type="text"
                                                                        value={chunk.promiseNote || ''}
                                                                        onChange={(e) =>
                                                                            updateChunkColorBox(chunk.id, {
                                                                                promiseNote: e.target.value
                                                                            })
                                                                        }
                                                                        style={{
                                                                            width: `${Math.max(36, ((chunk.promiseNote || '').length + 1) * 8)}px`
                                                                        }}
                                                                        className="shrink-0 h-full bg-transparent border-none outline-none font-extrabold uppercase tracking-wide text-black text-left px-1 focus:bg-yellow-50/70 rounded"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={chunk.promiseInput ?? ''}
                                                                        onChange={(e) =>
                                                                            updateChunkColorBox(chunk.id, {
                                                                                promiseInput: e.target.value
                                                                            })
                                                                        }
                                                                        className="flex-1 min-w-0 h-full bg-transparent border-none outline-none font-extrabold uppercase tracking-wide text-black text-center px-1 focus:bg-yellow-50/70 rounded"
                                                                    />
                                                                </div>
                                                            </td>
                                                            )}
                                                            {colorBoxColSpan > 0 && (
                                                            <td
                                                                colSpan={colorBoxColSpan}
                                                                className="border border-black p-0 align-middle bg-white relative min-h-[26px] h-[26px] overflow-visible"
                                                                style={{
                                                                    zIndex: activeColorBoxPopupId === chunk.id ? 300 : 1
                                                                }}
                                                            >
                                                                {/* 7 Transformation Colors Pop-up (matching SMT page) */}
                                                                {activeColorBoxPopupId === chunk.id && (
                                                                    <div
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        onDoubleClick={(e) => {
                                                                            e.stopPropagation();
                                                                            enableColorBoxEditing(chunk.id);
                                                                        }}
                                                                        className="color-box-popup print:hidden absolute bottom-full right-0 mb-1.5 flex gap-[6px] items-center bg-[#f8f5ed] p-2 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.3)] border border-[#d2b48c] z-[300] w-max"
                                                                    >
                                                                        {TRANSFORMATION_PALETTE_COLORS.map((item, idx) => (
                                                                            <button
                                                                                key={idx}
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    updateChunkColorBox(chunk.id, {
                                                                                        borderColor: item.color,
                                                                                        colorBoxTextColor: item.color
                                                                                    });
                                                                                    setActiveColorBoxPopupId(null);
                                                                                }}
                                                                                className="w-[22px] h-[22px] rounded-full cursor-pointer hover:scale-125 transition-transform shadow-sm border-[2px] border-black/80 hover:border-black shrink-0"
                                                                                style={{ backgroundColor: item.color }}
                                                                                title={item.label}
                                                                            />
                                                                        ))}
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setActiveColorBoxPopupId(null);
                                                                            }}
                                                                            className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-red-600 hover:bg-red-100 transition-colors ml-1 shrink-0"
                                                                            title="Close"
                                                                        >
                                                                            <i className="pi pi-times text-[12px] font-bold"></i>
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                <div
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (editingColorBoxId !== chunk.id) {
                                                                            setActiveColorBoxPopupId((prev) =>
                                                                                prev === chunk.id ? null : chunk.id
                                                                            );
                                                                        }
                                                                    }}
                                                                    onDoubleClick={(e) => {
                                                                        e.stopPropagation();
                                                                        enableColorBoxEditing(chunk.id);
                                                                    }}
                                                                    className="promise-color-box absolute inset-[1px] right-[2px] box-border flex items-center justify-center cursor-pointer"
                                                                    style={{
                                                                        border: `3.5px solid ${chunk.borderColor}`
                                                                    }}
                                                                >
                                                                    <input
                                                                        id={`color-box-input-${chunk.id}`}
                                                                        type="text"
                                                                        readOnly={editingColorBoxId !== chunk.id}
                                                                        value={chunk.colorBoxText || ''}
                                                                        onChange={(e) =>
                                                                            updateChunkColorBox(chunk.id, {
                                                                                colorBoxText: e.target.value
                                                                            })
                                                                        }
                                                                        onBlur={() => {
                                                                            if (editingColorBoxId === chunk.id) {
                                                                                setEditingColorBoxId(null);
                                                                            }
                                                                        }}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter' || e.key === 'Escape') {
                                                                                setEditingColorBoxId(null);
                                                                                e.currentTarget.blur();
                                                                            }
                                                                        }}
                                                                        className={`w-full h-full bg-transparent outline-none border-none text-center font-extrabold px-1 ${
                                                                            editingColorBoxId === chunk.id
                                                                                ? 'cursor-text pointer-events-auto'
                                                                                : 'cursor-pointer pointer-events-none select-none'
                                                                        }`}
                                                                        style={{
                                                                            color: chunk.colorBoxTextColor || '#000000',
                                                                            textShadow:
                                                                                (chunk.colorBoxTextColor || '').toUpperCase() === '#FAFA33'
                                                                                    ? '0px 0px 1px #000'
                                                                                    : 'none'
                                                                        }}
                                                                    />
                                                                </div>
                                                            </td>
                                                            )}
                                                        </tr>
                                                        )}

                                                        {/* Row 2: Week Column Headers */}
                                                        <tr className="rllt-week-header-row font-extrabold bg-white min-h-[24px] h-[24px] text-black">
                                                            {isColVisible('team') && (
                                                            <th
                                                                rowSpan={chunk.days.length + 1}
                                                                onClick={() => document.getElementById(`team-input-${chunk.id}`)?.focus()}
                                                                className="border border-black p-0 align-middle bg-white relative cursor-text"
                                                            >
                                                                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                                                    <input
                                                                        id={`team-input-${chunk.id}`}
                                                                        type="text"
                                                                        value={chunk.teamLabel ?? `${chunk.teamPrefix || 'TEAM / WEEK - '}${chunk.weekNumber}`}
                                                                        onChange={(e) =>
                                                                            updateChunkColorBox(chunk.id, {
                                                                                teamLabel: e.target.value
                                                                            })
                                                                        }
                                                                        style={{ transform: 'rotate(-90deg)' }}
                                                                        className="w-[140px] bg-transparent border-none outline-none text-center font-extrabold tracking-wider uppercase text-black p-0 m-0"
                                                                    />
                                                                </div>
                                                            </th>
                                                            )}
                                                            {isColVisible('date') && <th className="border border-black px-1 py-1 align-middle">DATE</th>}
                                                            {isColVisible('reg1Book') && (
                                                            <th className="border border-black p-0 align-middle">
                                                                <input
                                                                    type="text"
                                                                    value={chunk.h1 || ''}
                                                                    onChange={(e) =>
                                                                        updateChunkColorBox(chunk.id, {
                                                                            h1: e.target.value
                                                                        })
                                                                    }
                                                                    className="w-full h-full bg-transparent border-none outline-none text-center font-extrabold uppercase text-black px-1"
                                                                />
                                                            </th>
                                                            )}
                                                            {isColVisible('reg1Time') && <th className="border border-black px-1 py-1 align-middle">TIME</th>}
                                                            {isColVisible('reg2Book') && (
                                                            <th className="border border-black p-0 align-middle">
                                                                <input
                                                                    type="text"
                                                                    value={chunk.h2 || ''}
                                                                    onChange={(e) =>
                                                                        updateChunkColorBox(chunk.id, {
                                                                            h2: e.target.value
                                                                        })
                                                                    }
                                                                    className="w-full h-full bg-transparent border-none outline-none text-center font-extrabold uppercase text-black px-1"
                                                                />
                                                            </th>
                                                            )}
                                                            {isColVisible('reg2Time') && <th className="border border-black px-1 py-1 align-middle">TIME</th>}
                                                            {isColVisible('otherBooks') && (
                                                            <th className="border border-black p-0 align-middle">
                                                                <input
                                                                    type="text"
                                                                    value={chunk.h3 || ''}
                                                                    onChange={(e) =>
                                                                        updateChunkColorBox(chunk.id, {
                                                                            h3: e.target.value
                                                                        })
                                                                    }
                                                                    className="w-full h-full bg-transparent border-none outline-none text-center font-extrabold uppercase text-black px-1"
                                                                />
                                                            </th>
                                                            )}
                                                            {isColVisible('otherTime') && <th className="border border-black px-1 py-1 align-middle">TIME</th>}
                                                            {isColVisible('chap') && <th className="border border-black px-1 py-1 align-middle">CHAP</th>}
                                                            {isColVisible('verse') && <th className="border border-black px-1 py-1 align-middle">VERSE</th>}
                                                            {isColVisible('art') && <th className="border border-black px-1 py-1 align-middle">ART</th>}
                                                            {isColVisible('day') && <th className="border border-black px-1 py-1 align-middle">DAY</th>}
                                                            {isColVisible('phaseSide') && (
                                                            <th
                                                                rowSpan={chunk.days.length + 1 + (effectiveShowSubtotalRow ? 1 : 0)}
                                                                className="border border-black border-r-[2px] border-r-black p-0 align-middle bg-white relative"
                                                            >
                                                                <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                                                                    <div
                                                                        style={{ transform: 'rotate(-90deg)' }}
                                                                        className="whitespace-nowrap font-extrabold tracking-wider text-black uppercase flex items-center justify-center"
                                                                    >
                                                                        {`MDL ${generatedPlan.mdl}: FCT ${generatedPlan.fct}: PHS - ${generatedPlan.phs}`}
                                                                    </div>
                                                                </div>
                                                            </th>
                                                            )}
                                                        </tr>

                                                        {/* Rows 3..7: 5 Daily Rows for the Week */}
                                                        {chunk.days.map((d) => (
                                                            <tr key={d.id} className="rllt-day-row min-h-[24px] font-extrabold bg-white">
                                                                {isColVisible('date') && (
                                                                <td className={`border border-black px-1 py-1 align-middle text-black ${wrapCls}`}>
                                                                    {d.dateLabel}
                                                                </td>
                                                                )}

                                                                {/* Regular Book 1 (e.g. PRO) */}
                                                                {isColVisible('reg1Book') && (
                                                                <td className={`border border-black px-1 py-1 align-middle text-[#00b050] ${wrapCls}`}>
                                                                    {d.m1b}
                                                                </td>
                                                                )}
                                                                {isColVisible('reg1Time') && (
                                                                <td className={`border border-black px-1 py-1 align-middle text-black ${wrapCls}`}>
                                                                    {d.m1t}
                                                                </td>
                                                                )}

                                                                {/* Regular Book 2 (e.g. PSA) */}
                                                                {isColVisible('reg2Book') && (
                                                                <td className={`border border-black px-1 py-1 align-middle text-[#00b050] ${wrapCls}`}>
                                                                    {d.m2b}
                                                                </td>
                                                                )}
                                                                {isColVisible('reg2Time') && (
                                                                <td className={`border border-black px-1 py-1 align-middle text-black ${wrapCls}`}>
                                                                    {d.m2t}
                                                                </td>
                                                                )}

                                                                {/* Other Books: 50/50 Morning (Green) & Evening (Blue) */}
                                                                {isColVisible('otherBooks') && (
                                                                <td className="rllt-split-cell border border-black p-0 align-middle">
                                                                    <div className="grid grid-cols-2 w-full h-full min-h-[24px] items-center">
                                                                        <div className={`px-1 py-1 flex items-center justify-center text-center text-[#00b050] ${wrapCls}`}>
                                                                            {d.m3b_morning}
                                                                        </div>
                                                                        <div className={`px-1 py-1 flex items-center justify-center text-center text-[#002060] ${wrapCls}`}>
                                                                            {d.m3b_evening}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                )}

                                                                {/* Other Books TIME: 50/50 Morning (Green) & Evening (Blue) */}
                                                                {isColVisible('otherTime') && (
                                                                <td className="rllt-split-cell border border-black p-0 align-middle">
                                                                    <div className="grid grid-cols-2 w-full h-full min-h-[24px] items-center">
                                                                        <div className={`px-1 py-1 flex items-center justify-center text-center text-[#00b050] ${wrapCls}`}>
                                                                            {d.m3t_morning}
                                                                        </div>
                                                                        <div className={`px-1 py-1 flex items-center justify-center text-center text-[#002060] ${wrapCls}`}>
                                                                            {d.m3t_evening}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                )}

                                                                {/* CHAP, VERSE, ART, DAY */}
                                                                {isColVisible('chap') && (
                                                                <td className={`border border-black px-1 py-1 align-middle text-black ${wrapCls}`}>
                                                                    {d.chap}
                                                                </td>
                                                                )}
                                                                {isColVisible('verse') && (
                                                                <td className={`border border-black px-1 py-1 align-middle text-black ${wrapCls}`}>
                                                                    {d.verse}
                                                                </td>
                                                                )}
                                                                {isColVisible('art') && (
                                                                <td className={`border border-black px-1 py-1 align-middle text-black ${wrapCls}`}>
                                                                    {d.art}
                                                                </td>
                                                                )}
                                                                {isColVisible('day') && (
                                                                <td className="border border-black px-1 py-1 align-middle text-black">
                                                                    &nbsp;
                                                                </td>
                                                                )}
                                                            </tr>
                                                        ))}

                                                        {/* Row 8: Weekly Subtotal Row */}
                                                        {effectiveShowSubtotalRow && (
                                                        <tr className="rllt-subtotal-row min-h-[24px] h-[24px] font-extrabold bg-white text-black border-b-[2px] border-black">
                                                            {isColVisible('team') && <td className="border border-black bg-white"></td>}
                                                            {isColVisible('date') && <td className="border border-black bg-white"></td>}
                                                            {subReg1Span > 0 && (
                                                            <td colSpan={subReg1Span} className={`border border-black px-1 py-1 align-middle text-center ${wrapCls}`}>
                                                                {chunk.m1TotalStr}
                                                            </td>
                                                            )}
                                                            {subReg2Span > 0 && (
                                                            <td colSpan={subReg2Span} className={`border border-black px-1 py-1 align-middle text-center ${wrapCls}`}>
                                                                {chunk.m2TotalStr}
                                                            </td>
                                                            )}
                                                            {subOtherSpan > 0 && (
                                                            <td colSpan={subOtherSpan} className={`border border-black px-1 py-1 align-middle text-center ${wrapCls}`}>
                                                                {chunk.m3TotalStr}
                                                            </td>
                                                            )}
                                                            {isColVisible('chap') && (
                                                            <td className={`border border-black px-1 py-1 align-middle text-center ${wrapCls}`}>
                                                                {chunk.chapTotal}
                                                            </td>
                                                            )}
                                                            {isColVisible('verse') && (
                                                            <td className={`border border-black px-1 py-1 align-middle text-center ${wrapCls}`}>
                                                                {chunk.verseTotal}
                                                            </td>
                                                            )}
                                                            {subArtDaySpan > 0 && (
                                                            <td colSpan={subArtDaySpan} className={`border border-black px-1 py-1 align-middle text-center ${wrapCls}`}>
                                                                {chunk.artTotalStr}
                                                            </td>
                                                            )}
                                                        </tr>
                                                        )}
                                                    </React.Fragment>
                                                    );
                                                })}

                                                {/* Grand Totals & Isaiah 55:11 Summary Block on the Final Page */}
                                                {isLastPage && effectiveShowGrandTotalRow && (() => {
                                                    const leftSpan = ['team', 'date', 'reg1Book', 'reg1Time', 'reg2Book', 'reg2Time', 'otherBooks', 'otherTime'].filter(isColVisible).length;
                                                    const rightSpan = ['art', 'day', 'phaseSide'].filter(isColVisible).length;
                                                    return (
                                                    <React.Fragment>
                                                        <tr className="rllt-grandtotal-row min-h-[24px] h-[24px] bg-white font-extrabold text-black">
                                                            {leftSpan > 0 ? (
                                                                <React.Fragment>
                                                                    <td colSpan={leftSpan} className={`border border-black px-2 py-1 align-middle text-center tracking-wide uppercase ${wrapCls}`}>
                                                                        TOTAL AVERAGE READING TIME &nbsp;&nbsp; {generatedPlan.grandTotalArtHrMins}
                                                                    </td>
                                                                    {isColVisible('chap') && (
                                                                    <td className={`border border-black px-1 py-1 align-middle text-center ${wrapCls}`}>
                                                                        {generatedPlan.grandTotalChapters}
                                                                    </td>
                                                                    )}
                                                                    {isColVisible('verse') && (
                                                                    <td className={`border border-black px-1 py-1 align-middle text-center ${wrapCls}`}>
                                                                        {generatedPlan.grandTotalVerses}
                                                                    </td>
                                                                    )}
                                                                    {rightSpan > 0 && (
                                                                    <td colSpan={rightSpan} className={`border border-black px-1 py-1 align-middle text-center ${wrapCls}`}>
                                                                        {generatedPlan.grandTotalArtCompact}
                                                                    </td>
                                                                    )}
                                                                </React.Fragment>
                                                            ) : (
                                                                <td colSpan={totalActiveCols} className={`border border-black px-2 py-1 align-middle text-center tracking-wide uppercase ${wrapCls}`}>
                                                                    TOTAL AVERAGE READING TIME &nbsp;&nbsp; {generatedPlan.grandTotalArtHrMins}
                                                                </td>
                                                            )}
                                                        </tr>
                                                        <tr className="rllt-grandtotal-row min-h-[24px] h-[24px] bg-white font-extrabold text-black">
                                                            <td colSpan={totalActiveCols} className={`border border-black px-2 py-1 align-middle text-center italic font-bold text-black ${wrapCls}`}>
                                                                It is the same with my word. I send it out, and it always produces fruit. It will accomplish all I want it to, and it will prosper everywhere I send it. Isaiah 55:11
                                                            </td>
                                                        </tr>
                                                    </React.Fragment>
                                                    );
                                                })()}
                                                </tbody>
                                            </table>
                                            <div className="pointer-events-none absolute inset-0 border-[2px] border-black z-[25] box-border"></div>
                                        </div>

                                        {/* Bottom Module - Facet: Phase Footer Text (No Outer Border) */}
                                        <div className="rllt-footer-bar py-1 px-2 text-center font-extrabold tracking-wider uppercase bg-white text-black rllt-uniform-text">
                                            {generatedPlan.footerPhaseText}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom On-Screen Pagination Bar */}
                    {totalChartPages > 5 && pagesPerScreen > 0 && totalScreenGroups > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-100 border-t border-gray-300 text-xs font-bold text-[#0B2149] print:hidden">
                            <span>
                                Viewing Chart Pages <strong>{screenStartPageIdx + 1}–{screenEndPageIdx}</strong> of <strong>{totalChartPages}</strong>
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    disabled={safeScreenPage <= 1}
                                    onClick={() => {
                                        setCurrentScreenPage(1);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-200 disabled:opacity-40 cursor-pointer"
                                >
                                    First
                                </button>
                                <button
                                    type="button"
                                    disabled={safeScreenPage <= 1}
                                    onClick={() => {
                                        setCurrentScreenPage((p) => Math.max(1, p - 1));
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-200 disabled:opacity-40 cursor-pointer"
                                >
                                    Prev
                                </button>
                                <span className="px-2.5 font-black">
                                    {safeScreenPage} / {totalScreenGroups}
                                </span>
                                <button
                                    type="button"
                                    disabled={safeScreenPage >= totalScreenGroups}
                                    onClick={() => {
                                        setCurrentScreenPage((p) => Math.min(totalScreenGroups, p + 1));
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-200 disabled:opacity-40 cursor-pointer"
                                >
                                    Next
                                </button>
                                <button
                                    type="button"
                                    disabled={safeScreenPage >= totalScreenGroups}
                                    onClick={() => {
                                        setCurrentScreenPage(totalScreenGroups);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-200 disabled:opacity-40 cursor-pointer"
                                >
                                    Last
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="max-w-[1300px] mx-auto bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
                    <i className="pi pi-book text-4xl text-gray-400 mb-3"></i>
                    <p className="text-gray-600 font-bold mb-4">No Reading Plan chart is currently loaded.</p>
                    <button
                        type="button"
                        onClick={() => navigate(`${baseRoute}/reading-plan`)}
                        className="px-4 py-2 rounded-md bg-[#0B2149] hover:bg-[#132f63] text-white text-xs sm:text-sm font-bold transition-colors"
                    >
                        Go to Reading Plan Calculator to Generate Chart
                    </button>
                </div>
            )}
        </div>
    );
};

export default ReadingPlanView;
