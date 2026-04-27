import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { splitS4Data, parseTime } from '../../utils/chartDataSplitter';

const formatSum = (totalMins, formatType) => {
    const rawMins = Math.round(totalMins);
    if (rawMins === 0) return '';
    if (formatType === 'HrMins') return rawMins >= 60 ? `${Math.floor(rawMins / 60)} Hr ${rawMins % 60} Mins` : `${rawMins} Mins`;
    if (formatType === 'Hm') return `${Math.floor(rawMins / 60)}H ${rawMins % 60}m`;
    return `${rawMins} Mins`;
};

const CHUNK_COLORS = ['#00a8ff', '#2ed573', '#0A1F35', '#f1c40f', '#9b59b6', '#d35400', '#e74c3c'];

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
            daysArray.push({ id: (c * 5) + d, day: (c * 5) + d, m1b: '', m1t: '', m2b: '', m2t: '', m3b: '', m3t: '', m4b: '', m4t: '', m4b_morning: '', m4t_morning: '', m4b_evening: '', m4t_evening: '', chap: 0, verse: 0, art: '', yes: false });
        }
        defaultData.push({
            id: `chunk_${c + 1}`,
            team: `TEAM -${c + 1}`,
            phase: 'PHASE - 1/1',
            promises: "ENTER GOD'S PROMISSES HERE",
            promiseInput: "",
            h1: "",
            h2: "",
            h3: "",
            h4: "",
            days: daysArray
        });
    }
    return defaultData;
};

const TwentyFourSevenMorningEveningChart = () => {
    const toast = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const [chunks, setChunks] = useState(generateInitialData());

    // Header States
    const [headerSubtitle, setHeaderSubtitle] = useState("NO CHART SELECTED");
    const [headerTitle, setHeaderTitle] = useState("24x7 Morning & Evening Chart");
    const [bannerText, setBannerText] = useState("");
    const [tLabel, setTLabel] = useState("T");
    const [logoUrl, setLogoUrl] = useState(null);
    const [phaseLabel, setPhaseLabel] = useState("1");

    // Listing States
    const [chartsList, setChartsList] = useState([]);
    const [selectedChart, setSelectedChart] = useState(null);

    // Dynamic Footer States
    const [rlltDB, setRlltDB] = useState([]);
    const [maxFacets, setMaxFacets] = useState(1);
    const [maxPhases, setMaxPhases] = useState(1);

    // Lookup DB fields
    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);

    // Aesthetic & UX Scaling
    const [tableFontSize, setTableFontSize] = useState(14);
    const getFS = (base) => (base + (tableFontSize - 14)) + 'px';

    const fetchChartList = () => {
        axios.get('http://localhost:8000/api/charts/list', { withCredentials: true })
            .then(res => setChartsList(res.data))
            .catch(err => console.error("Could not fetch charts list", err));

        axios.get('http://localhost:8000/api/rllt_lookup', { withCredentials: true })
            .then(res => setRlltDB(res.data))
            .catch(err => console.error("Could not fetch RLLT db", err));

        axios.get('http://localhost:8000/api/books', { withCredentials: true })
            .then(res => setBooksDB(res.data));

        axios.get('http://localhost:8000/api/chapters', { withCredentials: true })
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

    // Load Data when selection changes
    useEffect(() => {
        const preloadData = location.state?.chartData;
        if ((!preloadData && !selectedChart) || booksDB.length === 0 || chaptersDB.length === 0) {
            setChunks(generateInitialData());
            setBannerText("");
            setTLabel("T");
            setLogoUrl(null);
            setHeaderSubtitle("NO CHART SELECTED");
            setPhaseLabel("1");
            return;
        }

        const __fixedPreload = location.state?.chartData;
        const fetchPromise = __fixedPreload
            ? Promise.resolve({ data: __fixedPreload })
            : axios.get(`http://localhost:8000/api/charts/sync/${selectedChart.module}/${selectedChart.facet}/${selectedChart.phase}`, { withCredentials: true });

        fetchPromise.then(res => {
            const data = res.data;
            const module = selectedChart?.module || location.state?.assignment?.module || '1';
            const facet = selectedChart?.facet || location.state?.assignment?.facet || '1';
            const phase = selectedChart?.phase || location.state?.assignment?.phase || '1';
            setBannerText(data.banner_text || "");
            setTLabel(data.t_label || "T");
            setLogoUrl(data.logo_url ? `http://localhost:8000${data.logo_url}` : null);
            setHeaderSubtitle(`MODULE${module}:FACET${facet}:PHASE-${phase}`);
            setPhaseLabel(String(phase));

            if (data.state_payload) {
                try {
                    const parsed = JSON.parse(data.state_payload);
                    if (Array.isArray(parsed)) {
                        // Integrate Data Splitter Over Parsed Dataset
                        const { morningEveningChunks } = splitS4Data(parsed, booksDB, chaptersDB);
                        setChunks(morningEveningChunks);

                        if (parsed.length === 8) {
                            setHeaderTitle("24x7 Morning & Evening Chart - 40 Days");
                        } else {
                            setHeaderTitle("24x7 Morning & Evening Chart - 30 Days");
                        }
                    } else {
                        setChunks(generateInitialData());
                    }
                } catch (e) {
                    setChunks(generateInitialData());
                }
            }
            toast.current?.show({ severity: 'success', summary: 'Loaded', detail: 'Chart configuration loaded.', life: 2000 });
        })
            .catch(err => {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not load chart details.', life: 3000 });
                setChunks(generateInitialData());
            });
    }, [selectedChart, booksDB, chaptersDB, location.state]);

    const confirmDelete = () => {
        if (!selectedChart) return;
        confirmDialog({
            message: 'Are you sure you want to delete this specific chart and all of its configurations?',
            header: 'Delete Confirmation',
            icon: 'pi pi-info-circle',
            acceptClassName: 'p-button-danger',
            accept: () => {
                const { module, facet, phase } = selectedChart;
                axios.delete(`http://localhost:8000/api/charts/sync/${module}/${facet}/${phase}`, { withCredentials: true })
                    .then(res => {
                        toast.current?.show({ severity: 'success', summary: 'Deleted', detail: 'Chart deleted successfully.', life: 3000 });
                        setSelectedChart(null);
                        fetchChartList();
                    })
                    .catch(err => {
                        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not delete the chart.', life: 3000 });
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
    const [showShareModal, setShowShareModal] = useState(false);
    const [readyShareFile, setReadyShareFile] = useState(null);

    const generatePdfBlob = async (returnCanvasOnly = false) => {
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
            const tableWrapper = document.getElementById('data-table-wrapper');

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
                    const clonedWrapper = clonedDoc.getElementById('data-table-wrapper');
                    clonedElement.style.position = 'absolute';
                    clonedElement.style.left = '0px';
                    clonedElement.style.top = '0px';
                    clonedElement.style.width = `${EXACT_WIDTH}px`;
                    clonedElement.style.minWidth = `${EXACT_WIDTH}px`;
                    clonedElement.style.maxWidth = `${EXACT_WIDTH}px`;
                    clonedElement.style.margin = '0';
                    if (clonedWrapper) clonedWrapper.style.overflowX = 'visible';
                }
            });

            if (returnCanvasOnly) {
                return canvas;
            }

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
            toast.current?.show({ severity: 'info', summary: 'Processing', detail: 'Generating PDF display...', life: 2000 });
            const pdf = await generatePdfBlob();
            const fileName = `RLLT_24x7MorningEvening_Chart_Mod${selectedChart?.module}_Fct${selectedChart?.facet}_Phase${selectedChart?.phase}.pdf`;
            pdf.save(fileName);
            toast.current?.show({ severity: 'success', summary: 'Exported', detail: 'PDF generated successfully.', life: 2000 });
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Export Failed', detail: 'Failed to generate PDF.', life: 3000 });
        }
    };

    const handleShare = async () => {
        try {
            toast.current?.show({ severity: 'info', summary: 'Processing', detail: 'Preparing chart file for sharing...', life: 2000 });
            const pdf = await generatePdfBlob();
            const fileName = `RLLT_24x7MorningEvening_Chart_Mod${selectedChart?.module}_Fct${selectedChart?.facet}_Phase${selectedChart?.phase}.pdf`;
            const blob = pdf.output('blob');
            const file = new File([blob], fileName, { type: 'application/pdf' });

            setReadyShareFile([file]);
            setShowShareModal(true);

        } catch (e) {
            console.error(e);
            toast.current?.show({ severity: 'error', summary: 'Action Failed', detail: 'Could not process PDF document.', life: 3000 });
        }
    };

    const executeNativeShare = async () => {
        if (!readyShareFile) return;
        setShowShareModal(false);
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'RLLT 24/7 Morning/Evening Chart',
                    text: 'Please find the RLLT chart attached.',
                    files: readyShareFile
                });
                toast.current?.show({ severity: 'success', summary: 'Shared Successfully', detail: 'Chart OS Sharing launched!', life: 3000 });
            } else {
                throw new Error("Share API missing");
            }
        } catch (shareErr) {
            console.warn("Share API failed or rejected, falling back to direct download.", shareErr);
            const a = document.createElement('a');
            a.href = URL.createObjectURL(readyShareFile[0]);
            a.download = readyShareFile[0].name;
            a.click();
            toast.current?.show({ severity: 'warn', summary: 'File Downloaded', detail: 'Native Desktop Share API blocked the file. Falling back to native download.', life: 5000 });
        }
    };

    const handlePrint = async () => {
        try {
            toast.current?.show({ severity: 'info', summary: 'Processing', detail: 'Preparing high-quality print layout...', life: 2000 });
            const pdf = await generatePdfBlob();

            pdf.autoPrint();

            const blobUrl = pdf.output('bloburl');
            const printWindow = window.open(blobUrl, '_blank');
            if (!printWindow) {
                toast.current?.show({ severity: 'warn', summary: 'Popup Blocked', detail: 'Please allow popups for this site to view the print format.', life: 5000 });
            }
        } catch (e) {
            console.error(e);
            toast.current?.show({ severity: 'error', summary: 'Print Failed', detail: 'Could not prepare perfect document for printing.', life: 3000 });
        }
    };

    return (
        <div className="p-8 w-full max-w-full overflow-x-auto bg-gray-50 min-h-screen print:bg-white print:p-0 print:overflow-visible">
            <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700&display=swap" rel="stylesheet" />
            <style>{`
                @media print {
                    @page {
                        size: landscape;
                        margin: 10mm;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body {
                        background-color: transparent !important;
                    }
                    .print\\:overflow-visible {
                        overflow: visible !important;
                    }
                }

                .rllt-condensed {
                    font-family: 'Roboto Condensed', 'Arial Narrow', sans-serif !important;
                }

                .custom-white-dropdown .p-dropdown-label,
                .custom-white-dropdown .p-inputtext {
                    color: #000 !important;
                }
                
                .p-dropdown-panel.custom-white-panel .p-dropdown-item {
                    color: #000 !important;
                    background-color: #fff !important;
                }

                .p-dropdown-panel.custom-white-panel .p-dropdown-item:hover,
                .p-dropdown-panel.custom-white-panel .p-dropdown-item.p-highlight {
                    background-color: #e2e8f0 !important;
                    color: #000 !important;
                }

                .custom-white-dropdown .p-placeholder {
                    color: #4b5563 !important;
                }
            `}</style>
            <Toast ref={toast} />
            <ConfirmDialog />

            <Dialog
                header={
                    <div className="flex items-center gap-2 text-indigo-900 border-b border-gray-200 pb-2">
                        <i className="pi pi-share-alt text-xl"></i>
                        <span className="font-bold">Ready to Share</span>
                    </div>
                }
                visible={showShareModal}
                onHide={() => setShowShareModal(false)}
                className="w-[90vw] md:w-[400px] shadow-2xl rounded-2xl overflow-hidden"
                contentClassName="p-6 bg-gray-50 flex flex-col items-center justify-center text-center gap-6"
                headerClassName="bg-gray-50 pt-6 px-6 pb-2"
                showHeader={true}
                dismissableMask={true}
                closable={false}
            >
                <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4 animate-bounce">
                        <i className="pi pi-file-pdf text-4xl"></i>
                    </div>
                    <h2 className="text-xl font-black text-gray-800 mb-2">PDF Generated!</h2>
                    <p className="text-gray-500 font-medium leading-relaxed px-4">
                        Your chart file is ready. Due to browser security on Desktop Chrome, please click below to launch the final native Share panel!
                    </p>
                </div>
                <div className="w-full flex gap-3 mt-2">
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        severity="secondary"
                        outlined
                        className="flex-1 font-bold tracking-wide rounded-xl border-gray-300 text-gray-600 hover:bg-gray-100"
                        onClick={() => setShowShareModal(false)}
                    />
                    <Button
                        label="Share Now"
                        icon="pi pi-send"
                        className="flex-[2] font-black tracking-wider shadow-lg bg-green-600 border-none hover:bg-green-700 rounded-xl"
                        onClick={executeNativeShare}
                        autoFocus
                    />
                </div>
            </Dialog>

            <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden mb-6 print:border-none print:shadow-none print:overflow-visible">
                <div className="bg-gradient-to-r from-[#051220] to-[#0A1F35] py-3 px-6 flex flex-col xl:flex-row justify-between items-center text-white border-b-2 border-gray-100 gap-2 print:hidden">
                    <div className="flex-shrink-0 text-center xl:text-left mb-2 xl:mb-0">
                        <h1 className="text-xl font-black tracking-tight mb-0.5 text-[#c8a165] whitespace-nowrap">{headerTitle}</h1>
                        <p className="text-[11px] font-medium text-gray-300 uppercase tracking-widest mb-1.5">24x7 Morning & Evening Split (Read-Only)</p>

                        <div className="flex gap-2 items-center bg-white/10 px-2 py-1 rounded-lg border border-white/20 shadow-inner inline-flex">
                            <span className="text-[10px] uppercase font-black text-gray-300 mr-2">Scale</span>
                            <Button
                                icon="pi pi-minus"
                                className="p-button-rounded p-button-text text-white h-7 w-7 min-w-[28px] p-0 hover:bg-white/20 transition-all border border-transparent hover:border-white/30"
                                onClick={() => setTableFontSize(prev => Math.max(8, prev - 1))}
                            />
                            <span className="font-black text-base w-6 text-center text-[#c8a165] drop-shadow-sm">{tableFontSize}</span>
                            <Button
                                icon="pi pi-plus"
                                className="p-button-rounded p-button-text text-white h-7 w-7 min-w-[28px] p-0 hover:bg-white/20 transition-all border border-transparent hover:border-white/30"
                                onClick={() => setTableFontSize(prev => Math.min(20, prev + 1))}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col items-center xl:items-end flex-wrap justify-center xl:justify-end gap-2 w-full xl:w-auto">
                        {!(location.state?.chartData) && (
                            <div className="flex items-center gap-3 bg-white p-1.5 px-3 rounded-lg shadow-inner w-full md:w-auto overflow-x-auto">
                                <span className="text-black font-semibold text-sm whitespace-nowrap px-1">Select Chart:</span>
                                <Dropdown
                                    value={selectedChart}
                                    options={chartsList}
                                    optionLabel="label"
                                    placeholder="Select a saved chart..."
                                    className="bg-gray-100 text-black border border-gray-300 shadow-sm w-72 md:w-80 h-[36px] flex items-center custom-white-dropdown"
                                    panelClassName="bg-white text-black custom-white-panel"
                                    onChange={(e) => setSelectedChart(e.value)}
                                />
                            </div>
                        )}
                        {(location.state?.chartData || selectedChart) && (
                            <div className="flex gap-2 justify-center xl:justify-end w-full">
                                <Button icon="pi pi-file-pdf" tooltip="Export to PDF" loading={isProcessingPdf} className="bg-orange-500 text-white border-none w-9 h-9 p-0 flex justify-center items-center rounded-full shadow-md hover:bg-orange-600 transition-colors" onClick={handleExportPdf} />
                                <Button icon="pi pi-print" tooltip="Browser Print" loading={isProcessingPdf} className="bg-slate-500 text-white border-none w-9 h-9 p-0 flex justify-center items-center rounded-full shadow-md hover:bg-slate-600 transition-colors" onClick={handlePrint} />
                                {!(location.state?.chartData) && (
                                    <>
                                        <Button icon="pi pi-share-alt" tooltip="Share Chart PDF" loading={isProcessingPdf} className="bg-emerald-500 text-white border-none w-9 h-9 p-0 flex justify-center items-center rounded-full shadow-md hover:bg-emerald-600 transition-colors" onClick={handleShare} />
                                        <Button icon="pi pi-pencil" tooltip="Edit Chart" className="bg-blue-500 text-white border-none w-9 h-9 p-0 flex justify-center items-center rounded-full shadow-md hover:bg-blue-600 transition-colors" onClick={handleEdit} />
                                        <Button icon="pi pi-trash" tooltip="Delete Chart" className="bg-red-500 text-white border-none w-9 h-9 p-0 flex justify-center items-center rounded-full shadow-md hover:bg-red-600 transition-colors" onClick={confirmDelete} />
                                    </>
                                )}



                            </div>
                        )}
                    </div>
                </div>

                <div id="printable-chart-area" className="w-full bg-white pb-6 rounded-b-2xl pt-6 px-6">
                    <div className="w-full border-[3px] border-black p-3 flex flex-col bg-white">
                        <div className="flex flex-col w-full mb-2">
                            <table className="w-full bg-white table-fixed border-collapse border-2 border-black" style={{ borderSpacing: 0 }}>
                                <tbody>
                                    <tr className="h-[55px]">
                                        <td className="w-[55px] bg-[#00b050] border-r-2 border-black p-0 align-middle">
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-white font-serif text-[32px] font-normal leading-none" style={{ transform: 'translateY(-2px)' }}>{tLabel}</span>
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
                                        <td className="w-[85px] border-r-2 border-black p-0 align-middle bg-white">
                                            <div className="w-[85px] h-[65px] p-1 overflow-hidden flex items-center justify-center">
                                                <ImageBox url={logoUrl} label="" />
                                            </div>
                                        </td>
                                        <td className="w-[85px] border-r-2 border-black p-0 align-middle bg-white">
                                            <div className="w-[85px] h-[65px] p-1 overflow-hidden flex items-center justify-center">
                                                <ImageBox url={logoUrl} label="" />
                                            </div>
                                        </td>
                                        <td className="w-[85px] border-r-2 border-black p-0 align-middle bg-white">
                                            <div className="w-[85px] h-[65px] p-1 overflow-hidden flex items-center justify-center">
                                                <ImageBox url={logoUrl} label="" />
                                            </div>
                                        </td>

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

                        <div id="data-table-wrapper" className="pb-1 overflow-x-auto print:overflow-visible">
                            <style>{`
                        .pdf-table, .pdf-table td, .pdf-table th { 
                            border: var(--cell-border, 1px solid #000) !important; 
                            border-collapse: collapse !important; 
                            position: relative !important;
                            top: 0 !important;
                            left: 0 !important;
                            box-sizing: border-box !important;
                        }
                        .pdf-table {
                            table-layout: fixed !important;
                        }
                    `}</style>
                            <div className="bg-black p-0 mt-0.5">
                                {(() => {
                                    return (
                                        <table className="w-full bg-white pdf-table table-fixed border-collapse" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
                                            <colgroup>
                                                <col style={{ width: '2%' }} />
                                                <col style={{ width: '2%' }} />
                                                <col style={{ width: '12%' }} />
                                                <col style={{ width: '4%' }} />
                                                <col style={{ width: '12%' }} />
                                                <col style={{ width: '4%' }} />
                                                <col style={{ width: '12%' }} />
                                                <col style={{ width: '4%' }} />
                                                <col style={{ width: '24%' }} />
                                                <col style={{ width: '4%' }} />
                                                <col style={{ width: '4%' }} />
                                                <col style={{ width: '4%' }} />
                                                <col style={{ width: '5%' }} />
                                                <col style={{ width: '3%' }} />
                                                <col style={{ width: '4%' }} />
                                            </colgroup>
                                            {chunks.map((chunk, cIdx) => {
                                                const m1Total = chunk.days.reduce((acc, curr) => acc + parseTime(curr.m1t), 0);
                                                const m2Total = chunk.days.reduce((acc, curr) => acc + parseTime(curr.m2t), 0);
                                                const m3Total = chunk.days.reduce((acc, curr) => acc + parseTime(curr.m3t), 0);
                                                const m4Total = chunk.days.reduce((acc, curr) => acc + parseTime(curr.m4t), 0);
                                                const chapTotal = chunk.days.reduce((acc, curr) => acc + (parseInt(curr.chap) || 0), 0);
                                                const verseTotal = chunk.days.reduce((acc, curr) => acc + (parseInt(curr.verse) || 0), 0);
                                                const artTotal = chunk.days.reduce((acc, curr) => acc + parseTime(curr.art), 0);

                                                const promiseColors = ['#00b0f0', '#00b050', '#002060', '#ffff00', '#c000c0', '#c45911', '#ff0000', '#00b050'];
                                                const currentBorderColor = promiseColors[cIdx % promiseColors.length];

                                                return (
                                                    <tbody key={chunk.id} className="text-black font-bold text-sm rllt-condensed">
                                                        <tr className="bg-white h-[35px]">
                                                            <td className="border-2 border-black bg-white"></td>
                                                            <td colSpan={9} className="border-2 border-black px-2 align-middle bg-white">
                                                                <div className="flex h-full w-full items-center">
                                                                    <span className="w-full flex-1 font-bold text-left uppercase text-black leading-none tracking-tight pl-2" style={{ fontSize: getFS(14) }}>{chunk.promises}</span>
                                                                </div>
                                                            </td>
                                                            <td colSpan={5} className="bg-white p-0 align-middle" style={{ '--cell-border': `3.5px solid ${currentBorderColor}` }}>
                                                                <div className="w-full h-full flex items-center justify-center p-1 text-center font-bold text-black px-2 block" style={{ fontSize: getFS(14) }}>
                                                                    {chunk.promiseInput}
                                                                </div>
                                                            </td>
                                                        </tr>

                                                        <tr className="bg-white text-center font-bold h-[30px]" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
                                                            <th rowSpan={6} className="border-2 border-black p-0 align-middle bg-white overflow-hidden relative" style={{ fontSize: getFS(10) }}>
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <div style={{ transform: 'rotate(-90deg)', fontSize: getFS(11) }} className="whitespace-nowrap tracking-widest font-extrabold text-black uppercase origin-center">
                                                                        {chunk.team}
                                                                    </div>
                                                                </div>
                                                            </th>
                                                            <th style={{ fontSize: getFS(10) }} className="border-2 border-black p-0 bg-white text-black">DAY</th>
                                                            <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-left pl-1 leading-none">{chunk.h1}</th>
                                                            <th style={{ fontSize: getFS(10) }} className="border-2 border-black p-0 bg-white text-black">TIME</th>
                                                            <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-left pl-1 leading-none">{chunk.h2}</th>
                                                            <th style={{ fontSize: getFS(10) }} className="border-2 border-black p-0 bg-white text-black">TIME</th>
                                                            <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-left pl-1 leading-none">{chunk.h3}</th>
                                                            <th style={{ fontSize: getFS(10) }} className="border-2 border-black p-0 bg-white text-black">TIME</th>
                                                            <th style={{ fontSize: getFS(14) }} className="border-2 border-black p-1 bg-white text-left pl-2 leading-none">{chunk.h4}</th>
                                                            <th style={{ fontSize: getFS(10) }} className="border-2 border-black p-0 bg-white text-black">TIME</th>
                                                            <th style={{ fontSize: getFS(10) }} className="border-2 border-black p-0 bg-white text-black">CHAP</th>
                                                            <th style={{ fontSize: getFS(10) }} className="border-2 border-black p-0 bg-white text-black">VERSE</th>
                                                            <th style={{ fontSize: getFS(10) }} className="border-2 border-black p-0 bg-white text-black">ART</th>
                                                            <th style={{ fontSize: getFS(10) }} className="border-2 border-black p-0 bg-white text-black">YES</th>
                                                            <th rowSpan={7} className="border-2 border-black p-0 align-middle bg-white relative overflow-hidden" style={{ fontSize: getFS(10) }}>
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <div style={{ transform: 'rotate(-90deg)' }} className="whitespace-nowrap tracking-widest font-extrabold text-black uppercase origin-center">
                                                                        {headerSubtitle}
                                                                    </div>
                                                                </div>
                                                            </th>
                                                        </tr>

                                                        {chunk.days.map((d, dIdx) => (
                                                            <tr key={d.id} className="bg-white text-center border-b-2 border-black h-[38px]">
                                                                <td className="border-2 border-black p-0 font-extrabold bg-white leading-none text-black" style={{ fontSize: getFS(12) }}>{d.day}</td>

                                                                {/* M1 TEXT (Light Green) */}
                                                                <td className="border-2 border-black p-0 bg-white uppercase font-bold leading-tight align-middle text-[#2ed573]" style={{ fontSize: getFS(12) }}>{d.m1b}</td>
                                                                <td className="border-2 border-black p-0 bg-white font-bold text-black align-middle" style={{ fontSize: getFS(11) }}>{d.m1t}</td>

                                                                {/* M2 TEXT (Light Green) */}
                                                                <td className="border-2 border-black p-0 bg-white uppercase font-bold leading-tight align-middle text-[#2ed573]" style={{ fontSize: getFS(12) }}>{d.m2b}</td>
                                                                <td className="border-2 border-black p-0 bg-white font-bold text-black align-middle" style={{ fontSize: getFS(11) }}>{d.m2t}</td>

                                                                {/* M3 TEXT (Light Green) */}
                                                                <td className="border-2 border-black p-0 bg-white uppercase font-bold leading-tight align-middle text-[#2ed573]" style={{ fontSize: getFS(12) }}>{d.m3b}</td>
                                                                <td className="border-2 border-black p-0 bg-white font-bold text-black align-middle" style={{ fontSize: getFS(11) }}>{d.m3t}</td>

                                                                {/* COMBINED M4 TEXT (Light Green + Deep Blue in 50/50 grid) */}
                                                                <td className="border-2 border-black p-0 bg-white text-center uppercase font-bold leading-tight align-middle" style={{ fontSize: getFS(13) }}>
                                                                    <div className="flex w-full h-full items-center">
                                                                        <div className="w-1/2 text-center text-[#2ed573] whitespace-normal break-words px-1">
                                                                            {d.m4b_morning}
                                                                        </div>
                                                                        <div className="w-1/2 text-center text-[#0033CC] whitespace-normal break-words px-1">
                                                                            {d.m4b_evening}
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* COMBINED M4 TIME (Light Green + Deep Blue in 50/50 grid) */}
                                                                <td className="border-2 border-black p-0 bg-white font-bold text-black align-middle" style={{ fontSize: getFS(11) }}>
                                                                    <div className="flex w-full h-full items-center">
                                                                        <div className="w-1/2 text-center text-[#2ed573] whitespace-nowrap">
                                                                            {d.m4t_morning}
                                                                        </div>
                                                                        <div className="w-1/2 text-center text-[#0033CC] whitespace-nowrap">
                                                                            {d.m4t_evening}
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                <td className="border-2 border-black p-0 font-bold leading-none align-middle" style={{ fontSize: getFS(11) }}>{d.chap}</td>
                                                                <td className="border-2 border-black p-0 font-bold leading-none align-middle" style={{ fontSize: getFS(11) }}>{d.verse}</td>
                                                                <td className="border-2 border-black p-0 font-bold leading-none align-middle" style={{ fontSize: getFS(11) }}>{d.art}</td>

                                                                <td className="border-2 border-black p-0 text-center align-middle">
                                                                    {d.yes ? '✔️' : ''}
                                                                </td>
                                                            </tr>
                                                        ))}

                                                        <tr className="bg-white text-center font-extrabold tracking-wide h-[35px]" style={{ fontSize: getFS(13) }}>
                                                            <td className="border-2 border-black bg-white"></td>
                                                            <td className="border-2 border-black bg-white"></td>
                                                            <td colSpan={2} className="border-2 border-black bg-white">{formatSum(m1Total, 'HrMins')}</td>
                                                            <td colSpan={2} className="border-2 border-black bg-white">{formatSum(m2Total, 'HrMins')}</td>
                                                            <td colSpan={2} className="border-2 border-black bg-white">{formatSum(m3Total, 'HrMins')}</td>
                                                            <td colSpan={2} className="border-2 border-black bg-white">{formatSum(m4Total, 'HrMins')}</td>
                                                            <td className="border-2 border-black p-1 bg-white font-bold text-black" style={{ fontSize: getFS(13) }}>{chapTotal}</td>
                                                            <td className="border-2 border-black p-1 bg-white font-bold text-black" style={{ fontSize: getFS(13) }}>{verseTotal}</td>
                                                            <td colSpan={2} className="border-2 border-black p-1 bg-white font-bold text-black" style={{ fontSize: getFS(13) }}>{formatSum(artTotal, 'Hm')}</td>
                                                        </tr>
                                                    </tbody>
                                                );
                                            })}
                                            <tfoot className="pb-4 rllt-condensed">
                                                <tr className="bg-white text-black font-extrabold tracking-wide text-center uppercase" style={{ fontSize: getFS(11) }}>
                                                    <td colSpan={10} className="border-2 border-black p-1 text-center font-extrabold uppercase tracking-wide bg-white" style={{ fontSize: getFS(14) }}>
                                                        TOTAL AVERAGE READING TIME {formatSum(
                                                            chunks.reduce((acc, chunk) => acc + chunk.days.reduce((dAcc, day) => dAcc + parseTime(day.art), 0), 0),
                                                            'HrMins'
                                                        )}
                                                    </td>
                                                    <td className="border-2 border-black p-1 text-center font-extrabold" style={{ fontSize: getFS(14) }}>
                                                        {chunks.reduce((acc, chunk) => acc + chunk.days.reduce((dAcc, day) => dAcc + (parseInt(day.chap) || 0), 0), 0)}
                                                    </td>
                                                    <td className="border-2 border-black p-1 text-center font-extrabold font-black text-blue-900" style={{ fontSize: getFS(14) }}>
                                                        {chunks.reduce((acc, chunk) => acc + chunk.days.reduce((dAcc, day) => dAcc + (parseInt(day.verse) || 0), 0), 0)}
                                                    </td>
                                                    <td colSpan={3} className="border-2 border-black p-1 text-center font-extrabold bg-white" style={{ fontSize: getFS(14) }}>
                                                        {formatSum(
                                                            chunks.reduce((acc, chunk) => acc + chunk.days.reduce((dAcc, day) => dAcc + parseTime(day.art), 0), 0),
                                                            'Hm'
                                                        )}
                                                    </td>
                                                </tr>
                                                <tr className="bg-white text-black text-center font-medium italic" style={{ fontSize: getFS(11) }}>
                                                    <td colSpan={15} className="border-2 border-black p-1 text-center font-semibold tracking-wide">
                                                        It is the same with my word. I send it out, and it always produces fruit. It will accomplish all I want it to, and it will prosper everywhere I send it. Isaiah 55:11
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    );
                                })()}
                            </div>

                            <div className="flex items-center w-full px-2 pt-2 pb-2 bg-transparent mt-1 uppercase">
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
            </div>
        </div>
    );
};

export default TwentyFourSevenMorningEveningChart;
