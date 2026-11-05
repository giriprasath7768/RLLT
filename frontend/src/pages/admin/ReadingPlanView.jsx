import React, { useState, useEffect, useRef } from 'react';
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
    const [isLoadingChart, setIsLoadingChart] = useState(false);
    const [chartFontSize, setChartFontSize] = useState(12);
    const [isBold, setIsBold] = useState(true);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [wrapText, setWrapText] = useState(true);

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
            sessionStorage.setItem('latest_reading_plan', JSON.stringify(plan));
        }
        if (data.id) {
            setReadingPlanId(data.id);
        }
        if (data.banner_text) {
            setBannerText(data.banner_text);
            sessionStorage.setItem('latest_reading_plan_banner', data.banner_text);
        } else if (plan) {
            const defaultHeading = `MAIN CHART - ${plan.numDays} DAYS`;
            setBannerText(defaultHeading);
            sessionStorage.setItem('latest_reading_plan_banner', defaultHeading);
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
                sessionStorage.setItem('latest_reading_plan', JSON.stringify(incomingPlan));
                sessionStorage.setItem('latest_reading_plan_banner', incomingBanner);

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
                        sessionStorage.setItem('latest_reading_plan', JSON.stringify(cachedPlan));
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
            sessionStorage.setItem('latest_reading_plan', JSON.stringify(updated));
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
            sessionStorage.setItem('latest_reading_plan', JSON.stringify(generatedPlan));
            sessionStorage.setItem('latest_reading_plan_banner', resolvedChartName);

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

    const capturePaginatedA4Pages = async (sizeConfig = PRINT_SIZE_OPTIONS[0]) => {
        const chartEl = document.getElementById('reading-plan-printable-area');
        if (!chartEl) return [];

        chartEl.querySelectorAll('input').forEach(inp => {
            if (inp.type !== 'file') {
                inp.setAttribute('value', inp.value);
            }
        });

        const pageElements = Array.from(chartEl.querySelectorAll('.rllt-print-page'));
        const targets = pageElements.length > 0 ? pageElements : [chartEl];

        const pageWidthMm = sizeConfig?.pageWidthMm || 210;
        const pageHeightMm = sizeConfig?.pageHeightMm || 297;
        const marginXMm = sizeConfig?.marginXMm ?? 6;
        const marginYMm = sizeConfig?.marginYMm ?? 6;
        const maxContentWidthMm = pageWidthMm - marginXMm * 2;
        const maxContentHeightMm = pageHeightMm - marginYMm * 2;
        const a4ContentAspectRatio = maxContentHeightMm / maxContentWidthMm;

        const isCustomPrintSize = sizeConfig?.key && sizeConfig.key !== 'a4';
        const isSmallFormat = ['a6', 'a7', 'visa', 'dl'].includes(sizeConfig?.key);
        const activeBoldnessConfig =
            BOLDNESS_LEVEL_OPTIONS.find(b => b.level === printBoldnessLevel) || BOLDNESS_LEVEL_OPTIONS[3];
        const capturedPages = [];

        for (let i = 0; i < targets.length; i++) {
            const pageNode = targets[i];
            const tableContainer = pageNode.querySelector('.rllt-table-container');
            const tableEl = pageNode.querySelector('.rllt-pdf-table');
            const trElements = tableEl ? Array.from(tableEl.querySelectorAll('tr')) : [];

            const prevPageStyles = {
                boxSizing: pageNode.style.boxSizing,
                width: pageNode.style.width,
                minWidth: pageNode.style.minWidth,
                maxWidth: pageNode.style.maxWidth,
                height: pageNode.style.height,
                minHeight: pageNode.style.minHeight,
                maxHeight: pageNode.style.maxHeight,
                paddingRight: pageNode.style.paddingRight,
                display: pageNode.style.display,
                flexDirection: pageNode.style.flexDirection,
                justifyContent: pageNode.style.justifyContent,
                chartFontSize: pageNode.style.getPropertyValue('--chart-font-size'),
                chartFontWeight: pageNode.style.getPropertyValue('--chart-font-weight'),
                chartTextStroke: pageNode.style.getPropertyValue('--chart-text-stroke')
            };
            const prevContainerStyles = tableContainer
                ? {
                      flex: tableContainer.style.flex,
                      height: tableContainer.style.height
                  }
                : null;
            const prevTableStyles = tableEl
                ? {
                      height: tableEl.style.height,
                      flex: tableEl.style.flex
                  }
                : null;
            const prevTrHeights = trElements.map(tr => tr.style.height);

            const activeColDomCount = tableEl ? tableEl.querySelectorAll('colgroup col').length || 13 : 13;
            const captureWidth = isSmallFormat
                ? activeColDomCount <= 6
                    ? 640
                    : activeColDomCount <= 10
                    ? 700
                    : 760
                : 1000;
            const targetA4Height = Math.round(captureWidth * a4ContentAspectRatio);

            try {
                if (isSmallFormat) {
                    pageNode.classList.add('rllt-small-print-capture');
                }
                if (isCustomPrintSize) {
                    const effectiveSizePx =
                        isSmallFormat && activeColDomCount <= 6
                            ? Math.max(printFontSize + 2, 16)
                            : printFontSize;
                    pageNode.style.setProperty('--chart-font-size', `${effectiveSizePx}px`);
                    pageNode.style.setProperty('--chart-font-weight', activeBoldnessConfig.weight);
                    pageNode.style.setProperty(
                        '--chart-text-stroke',
                        activeBoldnessConfig.strokePx > 0 ? `${activeBoldnessConfig.strokePx}px currentColor` : '0px'
                    );
                }

                // Step 1: Set fixed capture width (+4px right buffer) and auto height so we can measure natural row & page heights
                pageNode.style.boxSizing = 'border-box';
                pageNode.style.width = `${captureWidth + 4}px`;
                pageNode.style.minWidth = `${captureWidth + 4}px`;
                pageNode.style.maxWidth = `${captureWidth + 4}px`;
                pageNode.style.paddingRight = '4px';
                pageNode.style.height = 'auto';
                pageNode.style.minHeight = '0px';
                pageNode.style.maxHeight = 'none';
                pageNode.style.display = 'flex';
                pageNode.style.flexDirection = 'column';
                pageNode.style.justifyContent = 'flex-start';

                if (tableContainer) {
                    tableContainer.style.flex = '0 0 auto';
                    tableContainer.style.height = 'auto';
                }
                if (tableEl) {
                    tableEl.style.height = 'auto';
                }
                trElements.forEach(tr => {
                    tr.style.height = 'auto';
                });

                // Step 2: Measure natural height of the page and each individual row (accounting for wrapped 2-line text)
                const naturalPageH = Math.ceil(pageNode.getBoundingClientRect().height);
                const naturalRowHeights = trElements.map(tr => Math.ceil(tr.getBoundingClientRect().height));

                // Step 3: Distribute remaining vertical space (deficit) across rows so page fills target height without clipping
                const safeTargetHeight = targetA4Height - 6;
                let deficit = Math.max(0, safeTargetHeight - naturalPageH);
                if (deficit > 0 && trElements.length > 0) {
                    const applyDeficit = (totalExtraPx) => {
                        const dayRowIndices = [];
                        const compactRowIndices = [];
                        trElements.forEach((tr, idx) => {
                            if (tr.classList.contains('rllt-day-row')) {
                                dayRowIndices.push(idx);
                            } else {
                                compactRowIndices.push(idx);
                            }
                        });

                        if (dayRowIndices.length === 0) {
                            const baseAdd = Math.floor(totalExtraPx / trElements.length);
                            const remainder = totalExtraPx % trElements.length;
                            trElements.forEach((tr, idx) => {
                                const addPx = baseAdd + (idx < remainder ? 1 : 0);
                                tr.style.height = `${naturalRowHeights[idx] + addPx}px`;
                            });
                            return;
                        }

                        // Give compact rows (God's Promises, Week Header, Subtotal, Grand Total) at most +6px so they stay sleek & aligned
                        const evenShare = Math.floor(totalExtraPx / trElements.length);
                        const compactAddEach = Math.min(6, Math.max(0, Math.floor(evenShare * 0.35)));
                        const totalCompactUsed = compactAddEach * compactRowIndices.length;
                        const remainingForDays = Math.max(0, totalExtraPx - totalCompactUsed);

                        const dayBaseAdd = Math.floor(remainingForDays / dayRowIndices.length);
                        const dayRemainder = remainingForDays % dayRowIndices.length;

                        compactRowIndices.forEach((rIdx) => {
                            trElements[rIdx].style.height = `${naturalRowHeights[rIdx] + compactAddEach}px`;
                        });
                        dayRowIndices.forEach((rIdx, dPos) => {
                            const addPx = dayBaseAdd + (dPos < dayRemainder ? 1 : 0);
                            trElements[rIdx].style.height = `${naturalRowHeights[rIdx] + addPx}px`;
                        });
                    };

                    applyDeficit(deficit);

                    // If subpixel border-collapse rounding pushed height over safeTargetHeight, trim excess
                    const measuredAfter = Math.ceil(pageNode.getBoundingClientRect().height);
                    if (measuredAfter > safeTargetHeight) {
                        const excess = measuredAfter - safeTargetHeight;
                        deficit = Math.max(0, deficit - excess);
                        applyDeficit(deficit);
                    }
                }

                // Step 4: Capture with a 6px bottom buffer and 4px right buffer so SVG foreignObject rendering never clips the bottom or right border
                const finalCaptureHeight = Math.ceil(pageNode.getBoundingClientRect().height) + 6;

                const dataUrl = await htmlToImage.toPng(pageNode, {
                    quality: 1.0,
                    width: captureWidth + 4,
                    height: finalCaptureHeight,
                    pixelRatio: isSmallFormat ? 3 : 2,
                    backgroundColor: '#ffffff',
                    cacheBust: true,
                    filter: (node) => {
                        if (node?.classList) {
                            if (
                                node.classList.contains('print-hide-empty-camera') ||
                                node.classList.contains('color-box-popup')
                            ) {
                                return false;
                            }
                        }
                        return true;
                    }
                });

                capturedPages.push(dataUrl);
            } finally {
                pageNode.classList.remove('rllt-small-print-capture');
                pageNode.style.boxSizing = prevPageStyles.boxSizing;
                pageNode.style.width = prevPageStyles.width;
                pageNode.style.minWidth = prevPageStyles.minWidth;
                pageNode.style.maxWidth = prevPageStyles.maxWidth;
                pageNode.style.paddingRight = prevPageStyles.paddingRight;
                pageNode.style.height = prevPageStyles.height;
                pageNode.style.minHeight = prevPageStyles.minHeight;
                pageNode.style.maxHeight = prevPageStyles.maxHeight;
                pageNode.style.display = prevPageStyles.display;
                pageNode.style.flexDirection = prevPageStyles.flexDirection;
                pageNode.style.justifyContent = prevPageStyles.justifyContent;
                if (prevPageStyles.chartFontSize) {
                    pageNode.style.setProperty('--chart-font-size', prevPageStyles.chartFontSize);
                } else {
                    pageNode.style.removeProperty('--chart-font-size');
                }
                if (prevPageStyles.chartFontWeight) {
                    pageNode.style.setProperty('--chart-font-weight', prevPageStyles.chartFontWeight);
                } else {
                    pageNode.style.removeProperty('--chart-font-weight');
                }
                if (prevPageStyles.chartTextStroke) {
                    pageNode.style.setProperty('--chart-text-stroke', prevPageStyles.chartTextStroke);
                } else {
                    pageNode.style.removeProperty('--chart-text-stroke');
                }

                if (tableContainer && prevContainerStyles) {
                    tableContainer.style.flex = prevContainerStyles.flex;
                    tableContainer.style.height = prevContainerStyles.height;
                }
                if (tableEl && prevTableStyles) {
                    tableEl.style.height = prevTableStyles.height;
                    tableEl.style.flex = prevTableStyles.flex;
                }
                trElements.forEach((tr, idx) => {
                    tr.style.height = prevTrHeights[idx];
                });
            }
        }

        return capturedPages;
    };

    const handlePrintReadingPlan = async (planOverride = null, sizeKey = 'a4') => {
        const activePlan = planOverride || generatedPlan;
        if (!activePlan) return;
        const sizeConfig = PRINT_SIZE_OPTIONS.find(opt => opt.key === sizeKey) || PRINT_SIZE_OPTIONS[0];
        const chartEl = document.getElementById('reading-plan-printable-area');
        if (!chartEl) {
            window.print();
            return;
        }

        setActiveColorBoxPopupId(null);

        const printWindow = window.open('', '_blank', 'width=1100,height=850');
        if (!printWindow) {
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
            const pageDataUrls = await capturePaginatedA4Pages(sizeConfig);
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
                        window.onload = function() {
                            setTimeout(function() {
                                window.focus();
                                window.print();
                            }, 250);
                        };
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        } catch (err) {
            console.error('Error preparing print chart:', err);
            printWindow.close();
        }
    };

    const openCustomPrintModal = (sizeKey) => {
        if (!generatedPlan || !Array.isArray(generatedPlan.chunks)) return;
        const validExisting = printSelectedWeekIds.filter(id =>
            generatedPlan.chunks.some(c => c.id === id)
        );
        if (validExisting.length === 0) {
            setPrintSelectedWeekIds(generatedPlan.chunks.map(c => c.id));
        } else {
            setPrintSelectedWeekIds(validExisting);
        }
        setPrintModalSizeKey(sizeKey);
    };

    const togglePrintWeekSelection = (chunkId) => {
        setPrintSelectedWeekIds(prev =>
            prev.includes(chunkId)
                ? prev.filter(id => id !== chunkId)
                : [...prev, chunkId]
        );
    };

    const toggleSelectAllWeeks = () => {
        if (!generatedPlan || !Array.isArray(generatedPlan.chunks)) return;
        const allIds = generatedPlan.chunks.map(c => c.id);
        const allSelected = allIds.length > 0 && allIds.every(id => printSelectedWeekIds.includes(id));
        setPrintSelectedWeekIds(allSelected ? [] : allIds);
    };

    const togglePrintColumnSelection = (colKey) => {
        setPrintSelectedCols(prev => ({
            ...prev,
            [colKey]: !prev[colKey]
        }));
    };

    const toggleSelectAllColumns = () => {
        const allSelected = TABLE_COLUMN_DEFINITIONS.every(col => Boolean(printSelectedCols[col.key]));
        if (allSelected) {
            const cleared = {};
            TABLE_COLUMN_DEFINITIONS.forEach(col => {
                cleared[col.key] = false;
            });
            setPrintSelectedCols(cleared);
        } else {
            setPrintSelectedCols({ ...DEFAULT_SELECTED_COLUMNS });
        }
    };

    const handleDownloadReadingPlan = async (sizeKeyOverride = 'a4') => {
        if (!generatedPlan) return;
        const chartEl = document.getElementById('reading-plan-printable-area');
        if (!chartEl) return;

        const sizeConfig = PRINT_SIZE_OPTIONS.find(opt => opt.key === sizeKeyOverride) || PRINT_SIZE_OPTIONS[0];

        setIsDownloadingChart(true);
        setActiveColorBoxPopupId(null);

        try {
            const pageDataUrls = await capturePaginatedA4Pages(sizeConfig);
            if (!pageDataUrls.length) return;

            const isLandscape = sizeConfig.pageWidthMm > sizeConfig.pageHeightMm;
            const pdf = new jsPDF({
                orientation: isLandscape ? 'landscape' : 'portrait',
                unit: 'mm',
                format: [sizeConfig.pageWidthMm, sizeConfig.pageHeightMm]
            });

            const pageWidthMm = sizeConfig.pageWidthMm;
            const pageHeightMm = sizeConfig.pageHeightMm;
            const marginXMm = sizeConfig.marginXMm;
            const marginYMm = sizeConfig.marginYMm;
            const maxContentWidthMm = pageWidthMm - marginXMm * 2;
            const maxContentHeightMm = pageHeightMm - marginYMm * 2;

            for (let i = 0; i < pageDataUrls.length; i++) {
                if (i > 0) {
                    pdf.addPage([pageWidthMm, pageHeightMm], isLandscape ? 'landscape' : 'portrait');
                }
                pdf.addImage(
                    pageDataUrls[i],
                    'PNG',
                    marginXMm,
                    marginYMm,
                    maxContentWidthMm,
                    maxContentHeightMm,
                    undefined,
                    'FAST'
                );
            }

            const rawTitle = (bannerText || `MAIN_CHART_${generatedPlan.numDays || 30}_DAYS`).trim();
            const sizeSuffix = sizeConfig.key !== 'a4' ? `_${sizeConfig.key.toUpperCase()}` : '';
            const safeFileName = (rawTitle
                .replace(/[^a-zA-Z0-9-_ ]/g, '')
                .trim()
                .replace(/\s+/g, '_') || 'Reading_Plan_Chart') + sizeSuffix;

            pdf.save(`${safeFileName}.pdf`);

            toast.current?.show({
                severity: 'success',
                summary: 'Chart Downloaded',
                detail: `Downloaded "${safeFileName}.pdf".`,
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
        }
    };

    const baseRoute = userRole === 'student' ? '/dashboard/student' : '/admin';
    const wrapCls = wrapText ? 'whitespace-normal break-words' : 'whitespace-nowrap overflow-hidden text-ellipsis';

    const isCustomFilterActive = Boolean(printModalSizeKey);
    const activeModalSizeConfig = PRINT_SIZE_OPTIONS.find(opt => opt.key === printModalSizeKey) || null;

    const selectedColCount = TABLE_COLUMN_DEFINITIONS.filter(c => Boolean(printSelectedCols[c.key])).length;
    const allWeeksSelected = Boolean(
        generatedPlan?.chunks?.length &&
        generatedPlan.chunks.every(c => printSelectedWeekIds.includes(c.id))
    );
    const allColsSelected = selectedColCount === TABLE_COLUMN_DEFINITIONS.length;

    const isColVisible = (colKey) => {
        if (!isCustomFilterActive) return true;
        if (selectedColCount === 0) return colKey === 'date';
        return Boolean(printSelectedCols[colKey]);
    };

    const activeCols = TABLE_COLUMN_DEFINITIONS.filter(c => isColVisible(c.key));
    const totalActiveCols = activeCols.length;
    const totalActiveColWeight = activeCols.reduce((sum, c) => sum + c.weight, 0) || 100;

    const effectiveShowTopHeader = !isCustomFilterActive || printShowTopHeader;
    const effectiveShowPromisesRow = !isCustomFilterActive || printShowPromisesRow;
    const effectiveShowSubtotalRow = !isCustomFilterActive || printShowSubtotalRow;
    const effectiveShowGrandTotalRow = !isCustomFilterActive || printShowGrandTotalRow;

    const paginatedWeekPages = [];
    if (generatedPlan && Array.isArray(generatedPlan.chunks)) {
        const filteredChunks = isCustomFilterActive
            ? generatedPlan.chunks.filter(c => printSelectedWeekIds.includes(c.id))
            : generatedPlan.chunks;
        const chunksToPaginate = filteredChunks.length > 0 ? filteredChunks : generatedPlan.chunks.slice(0, 1);
        const weeksPerPage = isCustomFilterActive
            ? (printWeeksPerPage > 0 ? printWeeksPerPage : Math.max(1, chunksToPaginate.length))
            : 5;

        for (let i = 0; i < chunksToPaginate.length; i += weeksPerPage) {
            paginatedWeekPages.push(chunksToPaginate.slice(i, i + weeksPerPage));
        }
    }

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
                                disabled={isDownloadingChart}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs sm:text-sm font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                            >
                                <i className={`pi ${isDownloadingChart ? 'pi-spin pi-spinner' : 'pi-download'} text-xs sm:text-sm`}></i>
                                <span>{isDownloadingChart ? 'Downloading...' : 'Download Chart'}</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Second Row (Next Line): Print Size Buttons (Print A4, Print A5, Print A6, Print A7, Print Visa, Print DL Size) */}
                {generatedPlan && (
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2.5 border-t border-gray-200">
                        {PRINT_SIZE_OPTIONS.map((opt) => (
                            <button
                                key={opt.key}
                                type="button"
                                onClick={() => {
                                    if (opt.key === 'a4') {
                                        handlePrintReadingPlan(null, 'a4');
                                    } else {
                                        openCustomPrintModal(opt.key);
                                    }
                                }}
                                title={`${opt.label} (${opt.dimLabel})`}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#007020] hover:bg-[#008a28] text-white text-xs sm:text-sm font-bold transition-colors shadow-sm cursor-pointer"
                            >
                                <i className="pi pi-print text-xs"></i>
                                <span>{opt.label}</span>
                            </button>
                        ))}
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

                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {generatedPlan.chunks.map((chunk) => {
                                        const isChecked = printSelectedWeekIds.includes(chunk.id);
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
                            {paginatedWeekPages.map((pageChunks, pageIdx) => {
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
