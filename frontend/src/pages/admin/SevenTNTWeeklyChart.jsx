import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { splitS4Data, parseTime, parseDayForOilChart } from '../../utils/chartDataSplitter';

const formatSum = (totalMins, formatType) => {
    const rawMins = Math.round(totalMins);
    if (rawMins === 0) return '';
    if (formatType === 'HrMins') return rawMins >= 60 ? `${Math.floor(rawMins / 60)}h${rawMins % 60}m` : `${rawMins}m`;
    if (formatType === 'Hm') return `${Math.floor(rawMins / 60)}H ${rawMins % 60}m`;
    return `${rawMins}m`;
};

// View-only Image Box
const ImageBox = ({ url, label }) => {
    return (
        <div className="w-full h-full flex items-center justify-center bg-white overflow-hidden relative group">
            {url ? (
                <img src={url} className="w-full h-full object-contain" alt="Chart Logo" />
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 p-1 text-center w-full h-full">
                    {label && <span className="text-[10px] font-bold leading-tight mt-1">{label}</span>}
                </div>
            )}
        </div>
    );
};

const generateInitialData = (totalDays = 30) => {
    const numChunks = totalDays / 5;
    const defaultData = [];
    for (let c = 0; c < numChunks; c++) {
        const daysArray = [];
        for (let d = 1; d <= 5; d++) {
            daysArray.push({ id: (c * 5) + d, day: (c * 5) + d, m1b: '', m1t: '', m2b: '', m2t: '', m3b: '', m3t: '', m4b: '', m4t: '', chap: 0, verse: 0, art: '', yes: false });
        }
        defaultData.push({
            id: `chunk_${c + 1}`,
            team: `TEAM -${c + 1}`,
            phase: 'PHASE - 1/1',
            promises: "ENTER GOD'S PROMISSES HERE",
            promiseInput: "",
            days: daysArray
        });
    }
    return defaultData;
};

const SevenTNTWeeklyChart = () => {
    const toast = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const [chunks, setChunks] = useState(generateInitialData());

    const [headerSubtitle, setHeaderSubtitle] = useState("NO CHART SELECTED");
    const [headerTitle, setHeaderTitle] = useState("7TNT Weekly Chart");
    const [bannerText, setBannerText] = useState("");
    const [tLabel, setTLabel] = useState("T");
    const [logoUrl, setLogoUrl] = useState(null);
    const [logo1, setLogo1] = useState(null);
    const [logo2, setLogo2] = useState(null);
    const [logo3, setLogo3] = useState(null);
    const [phaseLabel, setPhaseLabel] = useState("1");

    const [chartsList, setChartsList] = useState([]);
    const [selectedChart, setSelectedChart] = useState(null);
    const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

    const weekOptions = chunks.map((_, i) => ({ label: `Week ${i + 1}`, value: i }));

    const [rlltDB, setRlltDB] = useState([]);
    const [maxFacets, setMaxFacets] = useState(1);
    const [maxPhases, setMaxPhases] = useState(1);

    // Historical Period Editable Input mappings
    // Format: chunkId_dayId -> string, chunkId_dayId_promise -> string
    const [periodInputs, setPeriodInputs] = useState({});

    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);

    const [tableFontSize, setTableFontSize] = useState(12);
    const getFS = (base) => (base + (tableFontSize - 12)) + 'px';

    const dayNames = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'];

    const fetchChartList = () => {
        axios.get('http://' + window.location.hostname + ':8000/api/seven_tnt_charts/list', { withCredentials: true })
            .then(res => setChartsList(res.data))
            .catch(err => console.error("Could not fetch charts list", err));

        axios.get('http://' + window.location.hostname + ':8000/api/rllt_lookup', { withCredentials: true })
            .then(res => setRlltDB(res.data))
            .catch(err => console.error("Could not fetch RLLT db", err));

        axios.get('http://' + window.location.hostname + ':8000/api/books', { withCredentials: true })
            .then(res => setBooksDB(res.data));

        axios.get('http://' + window.location.hostname + ':8000/api/chapters', { withCredentials: true })
            .then(res => setChaptersDB(res.data));
    };

    useEffect(() => {
        fetchChartList();
    }, []);

    useEffect(() => {
        if (!selectedChart || rlltDB.length === 0) return;
        const m = selectedChart.module;
        const f = selectedChart.facet;

        const availableFacets = rlltDB.filter(d => d.module === m);
        const uniqueFacets = [...new Set(availableFacets.map(d => d.facet))];
        setMaxFacets(uniqueFacets.length > 0 ? Math.max(...uniqueFacets) : 1);

        const availablePhases = rlltDB.filter(d => d.module === m && d.facet === f);
        const uniquePhases = [...new Set(availablePhases.map(d => d.phase))];
        setMaxPhases(uniquePhases.length > 0 ? Math.max(...uniquePhases) : 1);
    }, [selectedChart, rlltDB]);

    useEffect(() => {
        const preloadData = location.state?.chartData;
        if ((!preloadData && !selectedChart) || booksDB.length === 0 || chaptersDB.length === 0) {
            setChunks(generateInitialData());
            return;
        }

        const __fixedPreload = location.state?.chartData;
        const fetchPromise = __fixedPreload
            ? Promise.resolve({ data: __fixedPreload })
            : axios.get(`http://${window.location.hostname}:8000/api/seven_tnt_charts/sync/${selectedChart.module}/${selectedChart.facet}/${selectedChart.phase}`, { withCredentials: true });

        fetchPromise.then(res => {
            const data = res.data;
            const module = selectedChart?.module || location.state?.assignment?.module || '1';
            const facet = selectedChart?.facet || location.state?.assignment?.facet || '1';
            const phase = selectedChart?.phase || location.state?.assignment?.phase || '1';
            setBannerText(data.banner_text || "");
            setTLabel(data.t_label || "T");
            setLogo1(data.logo_url ? `http://${window.location.hostname}:8000${data.logo_url}` : null);
            setLogo2(data.logo_url ? `http://${window.location.hostname}:8000${data.logo_url}` : null);
            setLogo3(data.logo_url ? `http://${window.location.hostname}:8000${data.logo_url}` : null);
            setHeaderSubtitle(`MODULE${module}:FACET${facet}:PHASE-${phase}`);
            setPhaseLabel(String(phase));

            if (data.state_payload) {
                try {
                    const parsed = JSON.parse(data.state_payload);
                    if (Array.isArray(parsed)) {
                        // Using standard chunks for weeks
                        setChunks(parsed);
                        if (parsed.length === 8) {
                            setHeaderTitle("7TNT Weekly Chart - 40 Days View");
                        } else {
                            setHeaderTitle("7TNT Weekly Chart - 30 Days View");
                        }
                    } else {
                        setChunks(generateInitialData());
                    }
                } catch (e) {
                    setChunks(generateInitialData());
                }
            }
            toast.current?.show({ severity: 'success', summary: 'Loaded', detail: 'Chart loaded.', life: 2000 });
        })
            .catch(err => {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not load chart details.', life: 3000 });
                setChunks(generateInitialData());
            });
    }, [selectedChart, booksDB, chaptersDB, location.state]);

    // Handle Period Input Changes locally
    const handlePeriodChange = (chunkIndex, dayIndex, val) => {
        setPeriodInputs(prev => ({
            ...prev,
            [`${chunkIndex}_${dayIndex}`]: val
        }));
    };

    const confirmDelete = () => {
        if (!selectedChart) return;
        confirmDialog({
            message: 'Are you sure you want to delete this specific chart and all of its configurations?',
            header: 'Delete Confirmation',
            icon: 'pi pi-info-circle',
            acceptClassName: 'p-button-danger',
            accept: () => {
                const { module, facet, phase } = selectedChart;
                axios.delete(`http://${window.location.hostname}:8000/api/seven_tnt_charts/sync/${module}/${facet}/${phase}`, { withCredentials: true })
                    .then(res => {
                        toast.current?.show({ severity: 'success', summary: 'Deleted', detail: 'Chart deleted.', life: 3000 });
                        setSelectedChart(null);
                        fetchChartList();
                    })
                    .catch(err => {
                        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not delete.', life: 3000 });
                    });
            }
        });
    };

    const handleEdit = () => {
        if (!selectedChart) return;
        const { module, facet, phase } = selectedChart;
        navigate(`/admin/charts?editMod=${module}&editFct=${facet}&editPhs=${phase}`);
    };

    const [isProcessingPdf, setIsProcessingPdf] = useState(false);

    const generatePdfBlob = async () => {
        setIsProcessingPdf(true);
        try {
            if (!window.html2canvas) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }
            const element = document.getElementById('printable-chart-area');
            const EXACT_WIDTH = 1220;

            const canvas = await window.html2canvas(element, {
                scale: 1,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: EXACT_WIDTH,
                windowWidth: EXACT_WIDTH,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById('printable-chart-area');
                    clonedElement.style.position = 'absolute';
                    clonedElement.style.left = '0px';
                    clonedElement.style.top = '0px';
                    clonedElement.style.width = `${EXACT_WIDTH}px`;
                    clonedElement.style.margin = '0';
                    const inputs = clonedElement.querySelectorAll('textarea, input');
                    inputs.forEach(el => {
                        if (el.tagName.toLowerCase() === 'textarea') {
                            el.style.resize = 'none';
                            el.style.overflow = 'hidden';
                        }
                    });
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;

            const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
            const width = canvasWidth * ratio;
            const height = canvasHeight * ratio;

            const marginX = (pdfWidth - width) / 2;
            const marginY = (pdfHeight - height) / 2;

            pdf.addImage(imgData, 'PNG', marginX, marginY, width, height);
            return pdf;
        } catch (e) {
            console.error('PDF generation error', e);
            throw e;
        } finally {
            setIsProcessingPdf(false);
        }
    };

    const handleExportPdf = async () => {
        try {
            toast.current?.show({ severity: 'info', summary: 'Processing', detail: 'Generating PDF...', life: 2000 });
            const pdf = await generatePdfBlob();
            pdf.save(`RLLT_Weekly_Chart_Mod${selectedChart?.module || ''}_Fct${selectedChart?.facet || ''}.pdf`);
            toast.current?.show({ severity: 'success', summary: 'Exported', detail: 'PDF generated.', life: 2000 });
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Export Failed', detail: 'Failed to generate PDF.', life: 3000 });
        }
    };

    const handlePrint = async () => {
        try {
            toast.current?.show({ severity: 'info', summary: 'Processing', detail: 'Preparing print layout...', life: 2000 });
            const pdf = await generatePdfBlob();
            pdf.autoPrint();
            const blobUrl = pdf.output('bloburl');
            window.open(blobUrl, '_blank');
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Print Failed', detail: 'Could not prepare print document.', life: 3000 });
        }
    };

    return (
        <div className="p-8 w-full max-w-full overflow-x-auto bg-gray-50 min-h-screen print:bg-white print:p-0 print:overflow-visible">
            <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700&display=swap" rel="stylesheet" />
            <style>{`
                @media print {
                    @page { size: landscape; margin: 10mm; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    body { background-color: transparent !important; }
                    .print\\:overflow-visible { overflow: visible !important; }
                }
                .rllt-condensed { font-family: 'Roboto Condensed', 'Arial Narrow', sans-serif !important; }
                .pdf-table, .pdf-table td, .pdf-table th { 
                    border: 2px solid #000 !important; 
                    border-collapse: collapse !important; 
                    box-sizing: border-box !important;
                }
                .text-vertical {
                    writing-mode: vertical-rl;
                    transform: scale(-1);
                    text-align: center;
                }
            `}</style>
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden mb-6 print:hidden">
                <div className="bg-gradient-to-r from-[#051220] to-[#0A1F35] py-3 px-6 flex flex-col xl:flex-row justify-between items-center text-white border-b-2 border-gray-100 gap-2">
                    <div className="flex-shrink-0 text-center xl:text-left mb-2 xl:mb-0">
                        <h1 className="text-xl font-black tracking-tight mb-0.5 text-[#c8a165] whitespace-nowrap">{headerTitle}</h1>
                        <p className="text-[11px] font-medium text-gray-300 uppercase tracking-widest mb-1.5">Weekly Segment View</p>

                        <div className="flex gap-2 items-center bg-white/10 px-2 py-1 rounded-lg border border-white/20 shadow-inner inline-flex">
                            <span className="text-[10px] uppercase font-black text-gray-300 mr-2">Scale</span>
                            <Button icon="pi pi-minus" className="p-button-rounded p-button-text text-white h-7 w-7 min-w-[28px] p-0 hover:bg-white/20 transition-all border border-transparent hover:border-white/30" onClick={() => setTableFontSize(prev => Math.max(8, prev - 1))} />
                            <span className="font-black text-base w-6 text-center text-[#c8a165] drop-shadow-sm">{tableFontSize}</span>
                            <Button icon="pi pi-plus" className="p-button-rounded p-button-text text-white h-7 w-7 min-w-[28px] p-0 hover:bg-white/20 transition-all border border-transparent hover:border-white/30" onClick={() => setTableFontSize(prev => Math.min(20, prev + 1))} />
                        </div>
                    </div>

                    <div className="flex flex-col items-center xl:items-end flex-wrap gap-2 w-full xl:w-auto">
                        <div className="flex items-center gap-3 bg-white p-1.5 px-3 rounded-lg shadow-inner w-full md:w-auto">
                            <span className="text-black font-semibold text-sm whitespace-nowrap px-1">Select Chart:</span>
                            <Dropdown
                                value={selectedChart} options={chartsList} optionLabel="label" placeholder="Select a saved chart..."
                                className="bg-gray-100 text-black border border-gray-300 w-72 h-[36px] flex items-center"
                                pt={{ input: { className: 'text-black font-bold' }, label: { className: 'text-black' }, item: { className: 'text-black' } }}
                                onChange={(e) => {
                                    setSelectedChart(e.value);
                                    setSelectedWeekIndex(0);
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-3 bg-white p-1.5 px-3 rounded-lg shadow-inner w-full md:w-auto">
                            <span className="text-black font-semibold text-sm whitespace-nowrap px-1">Select Week:</span>
                            <Dropdown
                                value={selectedWeekIndex} options={weekOptions} optionLabel="label" placeholder="Week 1"
                                className="bg-gray-100 text-black border border-gray-300 w-32 h-[36px] flex items-center"
                                pt={{ input: { className: 'text-black font-bold' }, label: { className: 'text-black' }, item: { className: 'text-black' } }}
                                onChange={(e) => setSelectedWeekIndex(e.value)}
                            />
                        </div>
                        {selectedChart && (
                            <div className="flex gap-2 w-full justify-center xl:justify-end">
                                <Button icon="pi pi-file-pdf" tooltip="Export PDF" className="bg-orange-500 text-white border-none w-9 h-9 p-0 rounded-full" onClick={handleExportPdf} />
                                <Button icon="pi pi-print" tooltip="Print" className="bg-slate-500 text-white border-none w-9 h-9 p-0 rounded-full" onClick={handlePrint} />
                                <Button icon="pi pi-pencil" tooltip="Edit Chart" className="bg-blue-500 text-white border-none w-9 h-9 p-0 rounded-full" onClick={handleEdit} />
                                <Button icon="pi pi-trash" tooltip="Delete Chart" className="bg-red-500 text-white border-none w-9 h-9 p-0 rounded-full" onClick={confirmDelete} />
                            </div>
                        )}
                    </div>
                </div>

                <div id="printable-chart-area" className="w-full bg-white pb-6 rounded-b-2xl pt-6 px-6 relative">
                    <div className="w-full border-[3px] border-black p-3 flex flex-col bg-white">

                        <div className="flex flex-col w-full mb-2">
                            <table className="w-full bg-white table-fixed border-collapse border-2 border-black" style={{ borderSpacing: 0 }}>
                                <tbody>
                                    <tr className="h-[55px]">
                                        <td className="w-[55px] bg-[#00b050] border-r-2 border-black p-0 align-middle">
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-white font-serif text-[32px] font-normal leading-none">{tLabel}</span>
                                            </div>
                                        </td>
                                        <td className="p-0 align-middle text-center bg-white">
                                            <span className="text-[#ff0000] font-bold text-[20px] tracking-wide uppercase" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                                REAL LIFE LEADERSHIP TRAINING - <span className="text-[16px] font-bold">{headerSubtitle}</span>
                                            </span>
                                        </td>
                                        <td className="w-[60px] bg-[#00b050] border-l-2 border-black p-0 h-[55px]">
                                            <div className="flex flex-col h-[55px] w-full">
                                                <div className="flex-1 flex items-center justify-center border-b-2 border-black">
                                                    <span className="text-white font-black text-[15px] tracking-tighter">PH</span>
                                                </div>
                                                <div className="flex-1 flex items-center justify-center">
                                                    <span className="text-white font-bold text-[18px]">{phaseLabel}</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <table className="w-full bg-white table-fixed border-collapse border-b-2 border-l-2 border-r-2 border-black" style={{ borderSpacing: 0 }}>
                                <tbody>
                                    <tr className="h-[65px]">
                                        <td className="w-[85px] border-r-2 border-black p-0 align-middle bg-white"><ImageBox url={logo1} label="" /></td>
                                        <td className="w-[85px] border-r-2 border-black p-0 align-middle bg-white"><ImageBox url={logo2} label="" /></td>
                                        <td className="w-[85px] border-r-2 border-black p-0 align-middle bg-white"><ImageBox url={logo3} label="" /></td>
                                        <td className="border-r-2 border-black p-1 align-middle bg-white relative">
                                            <div className="absolute inset-[3px] border-[4px] border-[#e47636] pointer-events-none"></div>
                                            <div className="w-full h-full min-h-[50px] flex items-center px-4 relative z-10">
                                                <span className="text-black font-bold text-[22px] uppercase">{bannerText}</span>
                                            </div>
                                        </td>
                                        <td className="w-[140px] bg-[#ffff00] p-0 h-[65px] align-middle">
                                            <div className="flex flex-col h-[65px] w-full">
                                                <div className="flex-1 flex items-center justify-center border-b-2 border-black pt-1">
                                                    <span className="text-black font-black tracking-widest text-[20px] drop-shadow-sm whitespace-nowrap" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.15em' }}>B K - A R</span>
                                                </div>
                                                <div className="flex-1 flex items-center justify-center pb-1">
                                                    <span className="text-black font-black tracking-widest text-[18px] drop-shadow-sm whitespace-nowrap" style={{ letterSpacing: '0.15em' }}>6 6 - 4 0 +</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* WEEKLY DATA TABLES GRID (0 PADDING BETWEEN BLOCKS) */}
                        <div className="w-full relative">
                            <table className="w-full pdf-table bg-white table-fixed border-collapse" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
                                <colgroup>
                                    <col className="w-[4%]" />
                                    <col className="w-[10%]" />
                                    <col className="w-[45%]" />
                                    <col className="w-[8%]" />
                                    <col className="w-[8%]" />
                                    <col className="w-[6%]" />
                                    <col className="w-[6%]" />
                                    <col className="w-[8%]" />
                                    <col className="w-[5%]" />
                                </colgroup>
                                {[chunks[selectedWeekIndex] || chunks[0]].filter(Boolean).map((chunk) => {
                                    const chunkIndex = selectedWeekIndex;
                                    return chunk.days.map((day, dayIndex) => {
                                        // 7TNT native payload format: verses are stored in day.content separated by newlines
                                        const rawVerses = (day.content || '').split('\n').map(v => v.trim()).filter(v => v);
                                        const paddedRows = Array(5).fill().map((_, i) => ({ books: rawVerses[i] || '' }));

                                        // The book name is stored natively at the chunk level in 7TNT Main Chart
                                        const bookName = chunk.bookNameHeader || "";

                                        const periodInputKey = `${chunkIndex}_${dayIndex}`;
                                        const currentPeriod = periodInputs[periodInputKey] !== undefined ? periodInputs[periodInputKey] : "";

                                        const renderInput = (keySuffix) => {
                                            const v = periodInputs[`${chunkIndex}_${dayIndex}_${keySuffix}`] || '';
                                            const isMorning = parseInt(keySuffix.split('_')[1]) < 3;
                                            const color = keySuffix.startsWith('p_') ? 'black' : (isMorning ? '#00b050' : '#002060');
                                            return (
                                                <input
                                                    className="w-full text-center bg-transparent border-none focus:outline-none font-bold placeholder-gray-300 placeholder-opacity-50"
                                                    style={{ fontSize: getFS(13), color: color }}
                                                    value={v}
                                                    onChange={(e) => handlePeriodChange(chunkIndex, `${dayIndex}_${keySuffix}`, e.target.value)}
                                                />
                                            );
                                        };

                                        return (
                                            <tbody key={`chunk${chunkIndex}_day${dayIndex}`} className="text-black font-bold text-sm rllt-condensed w-full print:page-break-inside-avoid">

                                                {/* HASH ROW & BLUE BOX ROW */}
                                                <tr className="bg-white h-[35px]">
                                                    <td colSpan={3} className="border-2 border-black bg-white">
                                                        <input
                                                            className="w-full text-center font-extrabold tracking-widest bg-transparent border-none focus:outline-none text-black uppercase"
                                                            style={{ fontSize: getFS(14) }}
                                                            value={periodInputs[`${chunkIndex}_${dayIndex}_hash`] !== undefined ? periodInputs[`${chunkIndex}_${dayIndex}_hash`] : "########"}
                                                            onChange={(e) => handlePeriodChange(chunkIndex, `${dayIndex}_hash`, e.target.value)}
                                                        />
                                                    </td>
                                                    <td colSpan={6} className="border-2 border-black p-1 align-middle text-center bg-white">
                                                        <div className="w-[80%] mx-auto h-[24px] border-2 border-[#00b0f0] bg-white flex items-center justify-center">
                                                            <input
                                                                className="w-full h-full text-center font-bold text-black focus:outline-none bg-transparent"
                                                                style={{ fontSize: getFS(14) }}
                                                                value={periodInputs[`${chunkIndex}_${dayIndex}_blueBox`] || ""}
                                                                onChange={(e) => handlePeriodChange(chunkIndex, `${dayIndex}_blueBox`, e.target.value)}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* HEADER ROW */}
                                                <tr className="bg-white text-center font-bold h-[25px]">
                                                    <th className="border-2 border-black bg-white"></th>
                                                    <th className="border-2 border-black p-1 align-middle bg-white" style={{ fontSize: getFS(13) }}>DATE</th>
                                                    <th className="border-2 border-black bg-white text-center uppercase" style={{ fontSize: getFS(12) }}>{bookName}</th>
                                                    <th className="border-2 border-black text-center bg-white" style={{ fontSize: getFS(11) }}>PAGES</th>
                                                    <th className="border-2 border-black text-center bg-white" style={{ fontSize: getFS(11) }}>TIME</th>
                                                    <th className="border-2 border-black text-center bg-white" style={{ fontSize: getFS(11) }}>CHAP</th>
                                                    <th className="border-2 border-black text-center bg-white" style={{ fontSize: getFS(11) }}>PAGE</th>
                                                    <th className="border-2 border-black text-center bg-white" style={{ fontSize: getFS(11) }}>ART</th>
                                                    <th className="border-2 border-black text-center bg-white" style={{ fontSize: getFS(11) }}>DAY</th>
                                                </tr>

                                                {/* ONE DAY PER TEAM ROW (5 SUB ROWS) */}
                                                {[0, 1, 2, 3, 4].map((rIdx) => {
                                                    return (
                                                        <tr key={`chunk${chunkIndex}_day${dayIndex}_r${rIdx}`} className="bg-white h-[32px]">

                                                            {rIdx === 0 && (
                                                                <td rowSpan={5} className="border-2 border-black p-0 align-middle bg-white relative overflow-hidden">
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-white z-10 w-full h-full">
                                                                        <div className="whitespace-nowrap tracking-widest font-extrabold text-black uppercase text-vertical" style={{ fontSize: getFS(14) }}>
                                                                            TEAM / WEEK - <span className="text-[#cc0000] font-black">{chunkIndex + 1}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            )}

                                                            {rIdx === 0 && (
                                                                <td rowSpan={5} className="border-2 border-black p-0 text-center align-middle whitespace-normal leading-tight bg-white">
                                                                    <div className="flex flex-col items-center justify-center h-full w-full py-1">
                                                                        <div className="font-extrabold mb-1 uppercase" style={{ fontSize: getFS(12) }}>{dayNames[dayIndex % 6]}</div>
                                                                        <div className="font-black text-red-600 mb-1" style={{ fontSize: getFS(26), lineHeight: '1' }}>{day.day}</div>
                                                                    </div>
                                                                </td>
                                                            )}

                                                            {/* Text Area Replaced By Editable Reading Rows */}
                                                            <td className="border-2 border-black px-2 py-0 bg-white align-middle w-full h-[32px] relative">
                                                                <textarea
                                                                    spellCheck="false"
                                                                    className={`w-full overflow-hidden leading-tight resize-none bg-transparent border-none focus:outline-none font-extrabold uppercase absolute inset-0 py-1.5 px-2 ${rIdx < 3 ? 'text-[#00b050]' : 'text-[#002060]'}`}
                                                                    style={{ fontSize: getFS(13) }}
                                                                    defaultValue={(() => {
                                                                        if (!paddedRows[rIdx] || !paddedRows[rIdx].books) return '';
                                                                        let b = paddedRows[rIdx].books;
                                                                        if (bookName && b.toUpperCase().includes(bookName.toUpperCase())) {
                                                                            b = b.replace(new RegExp(`^[\\d\\s]*${bookName}`, 'i'), '').trim();
                                                                        }
                                                                        return `${rIdx + 1}. ${b}`;
                                                                    })()}
                                                                />
                                                            </td>

                                                            <td className={`border-2 border-black px-1 pb-0 bg-white align-middle text-center`} style={{ fontSize: getFS(13) }}>
                                                                {renderInput(`p_${rIdx}`)}
                                                            </td>

                                                            <td className={`border-2 border-black px-1 pb-0 align-middle bg-white text-center`} style={{ fontSize: getFS(13) }}>
                                                                {renderInput(`t_${rIdx}`)}
                                                            </td>

                                                            {rIdx === 0 && (
                                                                <>
                                                                    <td rowSpan={2} className="border-2 border-black text-center align-middle font-bold bg-white" style={{ fontSize: getFS(14) }}>{day.chap || ''}</td>
                                                                    <td rowSpan={2} className="border-2 border-black text-center align-middle font-bold bg-white" style={{ fontSize: getFS(14) }}>{day.pages || ''}</td>
                                                                    <td rowSpan={2} className="border-2 border-black text-center align-middle font-bold bg-white" style={{ fontSize: getFS(14) }}>{day.art || ''}</td>
                                                                    <td rowSpan={2} className="border-2 border-black text-center align-middle font-extrabold bg-white" style={{ fontSize: getFS(16) }}>{day.day || ''}</td>
                                                                </>
                                                            )}
                                                            {rIdx === 2 && (
                                                                <td colSpan={4} rowSpan={3} className="border-2 border-black text-center align-middle font-black tracking-widest bg-white" style={{ fontSize: getFS(14) }}>
                                                                    BOOKS OVERVIEW
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        );
                                    });
                                })}
                            </table>
                        </div>

                    </div>
                    {/* FOOTER BAR */}
                    <div className="flex items-center w-full px-2 pt-2 bg-transparent mt-1 uppercase justify-between">
                        <span className="font-extrabold text-[15px] text-[#c8a165]">1</span>
                        <div className="flex-1 text-center">
                            <span className="font-extrabold text-[14px] tracking-widest text-black mr-4" style={{ fontFamily: 'Arial, sans-serif' }}>
                                MODULE {selectedChart?.module || '1'} - FACET {selectedChart?.facet || '1'}/{maxFacets}: PHASE - {selectedChart?.phase || '1'}/{maxPhases}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SevenTNTWeeklyChart;
