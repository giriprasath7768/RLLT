import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';

const parseTime = (t) => {
    if (!t) return 0;
    t = t.toString().trim().toLowerCase();
    if (t.includes('h')) {
        const match = t.match(/(\d+)h\.?(\d+)m?/);
        if (match) {
            return (parseInt(match[1] || 0) * 60) + parseInt(match[2] || 0);
        }
    } else if (t.includes('.')) {
        const parts = t.split('.');
        let sStr = parts[1] || "0";
        if (sStr.length === 1) sStr += '0'; // Handle '3.3' meaning 3 minutes 30 seconds
        return parseInt(parts[0] || 0) + (parseInt(sStr.substring(0, 2)) / 60);
    } else {
        return parseInt(t) || 0;
    }
    return 0;
};

const formatSum = (totalMins, formatType) => {
    const rawMins = Math.round(totalMins);
    if (rawMins === 0) return '';
    if (formatType === 'HrMins') return rawMins >= 60 ? `${Math.floor(rawMins / 60)} Hr ${rawMins % 60} Mins` : `${rawMins} Mins`;
    if (formatType === 'Hm') return `${Math.floor(rawMins / 60)}H ${rawMins % 60}m`;
    return `${rawMins} Mins`;
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

const generateInitialData = (count = 7) => {
    return Array.from({ length: count }).map((_, i) => ({
        id: i + 1,
        day: i + 1,
        book_id: null,
        chFrom: null,
        chTo: null,
        time: '',
        m1b: '', m1t: '', m2b: '', m2t: '', m3b: '', m3t: '',
        chap: 0, verse: 0, art: 0, yes: false
    }));
};

const SevenTNTDayCycleChartView = () => {
    const toast = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Data State
    const [rowsData, setRowsData] = useState(generateInitialData(30));

    // Header States
    const [headerSubtitle, setHeaderSubtitle] = useState("NO CHART SELECTED");
    const [headerTitle, setHeaderTitle] = useState("7TNT Day Cycle Chart Viewer");
    const [bannerText, setBannerText] = useState("");
    const [totalDays, setTotalDays] = useState(1);

    // Day cycle specific styles
    const [tLabel, setTLabel] = useState("T");
    const [logo1, setLogo1] = useState(null);
    const [logo2, setLogo2] = useState(null);
    const [logo3, setLogo3] = useState(null);
    const [phaseLabel, setPhaseLabel] = useState("1");
    const [h1, setH1] = useState("");
    const [h2, setH2] = useState("");
    const [h3, setH3] = useState("");
    const [promiseLabel, setPromiseLabel] = useState("GOD'S PROMISES :");
    const [promises, setPromises] = useState("ENTER GOD'S PROMISSES HERE");
    const [promiseInput, setPromiseInput] = useState("");

    // Listing States
    const [chartsList, setChartsList] = useState([]);
    const [selectedChart, setSelectedChart] = useState(null);

    // Aesthetic & UX Scaling
    const [tableFontSize, setTableFontSize] = useState(12);
    const getFS = (base) => (base + (tableFontSize - 12)) + 'px';

    const fetchChartList = () => {
        axios.get('http://localhost:8000/api/seven_tnt_daycycle_charts/list', { withCredentials: true })
            .then(res => setChartsList(res.data))
            .catch(err => console.error("Could not fetch charts list", err));
    };

    useEffect(() => {
        fetchChartList();
    }, []);

    // Load Data when selection changes
    useEffect(() => {
        const preloadData = location.state?.chartData;
        if ((!preloadData && !selectedChart)) {
            setRowsData(generateInitialData(30));
            setTotalDays(30);
            setBannerText("7TNT DAY CYCLE CHART");
            setHeaderSubtitle("NO CHART SELECTED");
            setTLabel("T");
            setPhaseLabel("1");
            return;
        }

        const fetchPromise = preloadData
            ? Promise.resolve({ data: preloadData })
            : axios.get(`http://localhost:8000/api/seven_tnt_daycycle_charts/sync/${selectedChart.module}/${selectedChart.facet}/${selectedChart.phase}`, { withCredentials: true });

        fetchPromise.then(res => {
            const data = res.data;
            const module = selectedChart?.module || location.state?.assignment?.module || data.module || '1';
            const facet = selectedChart?.facet || location.state?.assignment?.facet || data.facet || '1';
            const phase = selectedChart?.phase || location.state?.assignment?.phase || data.phase || '1';

            setBannerText(data.banner_text || "7TNT DAY CYCLE CHART");
            setTLabel(data.t_label || "T");
            // In creation, there are 3 logos technically, but DB usually keeps 1 for MainChart. 
            // We set logo1 here if needed.
            if (data.logo_url) setLogo1(`http://localhost:8000${data.logo_url}`);

            setPhaseLabel(String(phase));

            let loadedRows = [];
            try {
                loadedRows = JSON.parse(data.state_payload || "[]");
            } catch (e) {
                console.error("Payload parse error", e);
            }

            setRowsData(loadedRows);
            setTotalDays(loadedRows.length);
            setHeaderSubtitle(`MODULE${module}:FACET${facet}:PHASE-${phase}`);
            toast.current?.show({ severity: 'success', summary: 'Loaded', detail: 'Chart configuration loaded.', life: 2000 });
        }).catch(err => {
            console.error("Failed to fetch chart data:", err);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not load chart contents', life: 3000 });
        });
    }, [selectedChart, location.state]);

    const confirmDelete = () => {
        if (!selectedChart) return;
        confirmDialog({
            message: 'Are you sure you want to delete this specific chart?',
            header: 'Delete Confirmation',
            icon: 'pi pi-info-circle',
            acceptClassName: 'p-button-danger',
            accept: () => {
                const { module, facet, phase } = selectedChart;
                axios.delete(`http://localhost:8000/api/seven_tnt_daycycle_charts/sync/${module}/${facet}/${phase}`, { withCredentials: true })
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
        navigate(`/admin/chart-creation/7tnt-day-cycle?editMod=${module}&editFct=${facet}&editPhs=${phase}`);
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
                    clonedElement.style.minWidth = `${EXACT_WIDTH}px`;
                    clonedElement.style.maxWidth = `${EXACT_WIDTH}px`;
                    clonedElement.style.margin = '0';
                }
            });

            if (returnCanvasOnly) return canvas;

            const imgData = canvas.toDataURL('image/png');
            let pdfOrientation = totalDays > 10 ? 'portrait' : 'landscape';

            const pdf = new jsPDF({
                orientation: pdfOrientation,
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
            const fileName = `DayCycleChart_Mod${selectedChart?.module}_Fct${selectedChart?.facet}_Phase${selectedChart?.phase}.pdf`;
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
            const fileName = `DayCycleChart_Mod${selectedChart?.module}_Fct${selectedChart?.facet}_Phase${selectedChart?.phase}.pdf`;
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
                    title: 'RLLT Chart Target',
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

    const isStudentRoute = location.pathname.includes('/student/');

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
                /* Dropdown Styling matching MainChartViewer */
                .custom-white-dropdown .p-dropdown-label,
                .custom-white-dropdown .p-inputtext { color: #000 !important; }
                .p-dropdown-panel.custom-white-panel .p-dropdown-item { color: #000 !important; background-color: #fff !important; }
                .p-dropdown-panel.custom-white-panel .p-dropdown-item:hover,
                .p-dropdown-panel.custom-white-panel .p-dropdown-item.p-highlight { background-color: #e2e8f0 !important; color: #000 !important; }
                .custom-white-dropdown .p-placeholder { color: #4b5563 !important; }
            `}</style>

            <Toast ref={toast} />
            <ConfirmDialog />

            {/* SYNCHRONOUS GESTURE MODAL FOR WEB SHARE API */}
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
                    <Button label="Cancel" icon="pi pi-times" severity="secondary" outlined className="flex-1 font-bold tracking-wide rounded-xl border-gray-300 text-gray-600 hover:bg-gray-100" onClick={() => setShowShareModal(false)} />
                    <Button label="Share Now" icon="pi pi-send" className="flex-[2] font-black tracking-wider shadow-lg bg-green-600 border-none hover:bg-green-700 rounded-xl" onClick={executeNativeShare} autoFocus />
                </div>
            </Dialog>

            {/* Header Block matching MainChartViewer */}
            <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden mb-6 print:hidden">
                <div className="bg-gradient-to-r from-[#051220] to-[#0A1F35] py-3 px-6 flex flex-col xl:flex-row justify-between items-center text-white border-b-2 border-gray-100 gap-2">
                    <div className="flex-shrink-0 text-center xl:text-left mb-2 xl:mb-0">
                        <h1 className="text-xl font-black tracking-tight mb-0.5 text-[#c8a165] whitespace-nowrap">{headerTitle}</h1>
                        <p className="text-[11px] font-medium text-gray-300 uppercase tracking-widest mb-1.5">Administrative Day Cycle Chart Database</p>

                        <div className="flex gap-2 items-center bg-white/10 px-2 py-1 rounded-lg border border-white/20 shadow-inner inline-flex">
                            <span className="text-[10px] uppercase font-black text-gray-300 mr-2">Scale</span>
                            <Button icon="pi pi-minus" className="p-button-rounded p-button-text text-white h-7 w-7 min-w-[28px] p-0 hover:bg-white/20 hover:border-white/30" onClick={() => setTableFontSize(prev => Math.max(8, prev - 1))} />
                            <span className="font-black text-base w-6 text-center text-[#c8a165] drop-shadow-sm">{tableFontSize}</span>
                            <Button icon="pi pi-plus" className="p-button-rounded p-button-text text-white h-7 w-7 min-w-[28px] p-0 hover:bg-white/20 hover:border-white/30" onClick={() => setTableFontSize(prev => Math.min(20, prev + 1))} />
                        </div>
                    </div>

                    <div className="flex flex-col items-center xl:items-end flex-wrap justify-center xl:justify-end gap-2 w-full xl:w-auto mt-3 xl:mt-0">
                        {!location.state?.chartData && !isStudentRoute && (
                            <div className="flex items-center gap-3 bg-white p-1.5 px-3 rounded-lg shadow-inner w-full md:w-auto overflow-x-auto text-black">
                                <span className="font-semibold text-sm whitespace-nowrap px-1">Select Chart:</span>
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
                        {(location.state?.chartData || selectedChart || isStudentRoute) && (
                            <div className="flex gap-2 justify-center xl:justify-end w-full">
                                <Button icon="pi pi-file-pdf" tooltip="Export to PDF" loading={isProcessingPdf} className="bg-orange-500 text-white border-none w-9 h-9 p-0 flex justify-center items-center rounded-full shadow-md hover:bg-orange-600 transition-colors" onClick={handleExportPdf} />
                                <Button icon="pi pi-print" tooltip="Browser Print" loading={isProcessingPdf} className="bg-slate-500 text-white border-none w-9 h-9 p-0 flex justify-center items-center rounded-full shadow-md hover:bg-slate-600 transition-colors" onClick={handlePrint} />
                                {!(location.state?.chartData || isStudentRoute) && (
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
            </div>

            {/* CHART RENDER BLOCK EXACTLY MATCHING DAYCYCLECHART CREATION */}
            {rowsData && rowsData.length > 0 && selectedChart ? (
                <div id="printable-chart-area" className="w-full bg-white pb-6 rounded-b-2xl pt-6 px-6 relative mx-auto" style={{ maxWidth: '1300px' }}>
                    <div className="w-full border-[3px] border-black p-3 flex flex-col bg-white">

                        {/* CORE HEADERS */}
                        <div className="flex flex-col w-full mb-2">
                            <table className="w-full bg-white table-fixed border-collapse border-2 border-black" style={{ borderSpacing: 0 }}>
                                <tbody>
                                    <tr className="h-[55px]">
                                        <td className="w-[55px] bg-[#00b050] border-r-2 border-black p-0 align-middle">
                                            <input className="w-full h-full text-center text-white bg-transparent outline-none font-serif text-[32px] font-normal leading-none"
                                                value={tLabel} onChange={e => setTLabel(e.target.value)} placeholder="T" />
                                        </td>
                                        <td className="p-0 align-middle text-center bg-white relative">
                                            <div className="flex items-center justify-center">
                                                <span className="text-[#ff0000] font-bold text-[20px] tracking-wide uppercase mr-2" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                                    REAL LIFE LEADERSHIP TRAINING -
                                                </span>
                                                <input className="text-[#ff0000] bg-transparent outline-none font-bold text-[16px] tracking-wide uppercase min-w-[200px]"
                                                    value={headerSubtitle} onChange={e => setHeaderSubtitle(e.target.value)} placeholder="ENTER TITLE" />
                                            </div>
                                        </td>
                                        <td className="w-[60px] bg-[#00b050] border-l-2 border-black p-0 h-[55px]">
                                            <div className="flex flex-col h-[55px] w-full">
                                                <div className="flex-1 flex items-center justify-center border-b-2 border-black">
                                                    <span className="text-white font-black text-[15px] tracking-tighter">PH</span>
                                                </div>
                                                <div className="flex-1 flex items-center justify-center">
                                                    <input className="w-full text-center text-white bg-transparent outline-none font-bold text-[18px]"
                                                        value={phaseLabel} onChange={e => setPhaseLabel(e.target.value)} placeholder="1" />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <table className="w-full bg-white table-fixed border-collapse border-b-2 border-l-2 border-r-2 border-black" style={{ borderSpacing: 0 }}>
                                <tbody>
                                    <tr className="h-[65px]">
                                        <td className="w-[85px] border-r-2 border-black p-0 align-middle bg-white overflow-hidden">
                                            <ImageBox url={logo1} label="Logo 1" />
                                        </td>
                                        <td className="w-[85px] border-r-2 border-black p-0 align-middle bg-white overflow-hidden">
                                            <ImageBox url={logo2} label="Logo 2" />
                                        </td>
                                        <td className="w-[85px] border-r-2 border-black p-0 align-middle bg-white overflow-hidden">
                                            <ImageBox url={logo3} label="Logo 3" />
                                        </td>
                                        <td className="border-r-2 border-black p-1 align-middle bg-white relative">
                                            <div className="absolute inset-[3px] border-[4px] border-[#e47636] pointer-events-none"></div>
                                            <div className="w-full h-full min-h-[50px] flex items-center px-4 relative z-10">
                                                <input className="w-full text-black font-bold text-[22px] uppercase bg-transparent outline-none"
                                                    value={bannerText} onChange={e => setBannerText(e.target.value)} placeholder="ENTER BANNER TITLE" />
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

                        {/* DAY CYCLE TABLE FORMAT REPLICATED */}
                        <div className="w-full mt-2 mb-2 relative">
                            <table className="w-full bg-white table-fixed border-collapse" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
                                <colgroup>
                                    <col className="w-[28px]" />   {/* TEA Side */}
                                    <col className="w-[35px]" />   {/* DAY */}
                                    <col className="w-[16%]" />      {/* WIDE 1 */}
                                    <col className="w-[45px]" />   {/* TIME 1 */}
                                    <col className="w-[16%]" />      {/* WIDE 2 */}
                                    <col className="w-[45px]" />   {/* TIME 2 */}
                                    <col className="w-auto" />      {/* WIDE 3 */}
                                    <col className="w-[45px]" />   {/* TIME 3 */}
                                    <col className="w-[35px]" />   {/* CHAP */}
                                    <col className="w-[40px]" />   {/* VERSE */}
                                    <col className="w-[35px]" />   {/* ART */}
                                    <col className="w-[35px]" />   {/* YES */}
                                    <col className="w-[28px]" />  {/* MODULE Side */}
                                </colgroup>
                                <tbody>
                                    <tr className="bg-white border-2 border-black h-[35px]">
                                        <td className="border-2 border-black bg-white"></td>
                                        <td colSpan={10} className="border-2 border-l-0 border-black px-2 align-middle bg-white">
                                            <div className="flex w-full items-center">
                                                <input
                                                    value={promises}
                                                    onChange={(e) => setPromises(e.target.value)}
                                                    className="w-full h-full flex-1 outline-none font-bold bg-transparent text-black font-serif tracking-tight text-left uppercase pl-2"
                                                    style={{ fontSize: getFS(15) }}
                                                    placeholder="GOD'S PROMISES : ENTER GOD'S PROMISES HERE"
                                                />
                                            </div>
                                        </td>
                                        <td colSpan={2} className="border-2 border-black p-0 align-middle bg-white border-t-[3.5px] border-r-[3.5px] border-[#00b0f0]">
                                            <div className="w-full h-full min-h-[35px] flex items-center justify-center p-1">
                                                <input
                                                    className="w-full h-full text-center font-bold text-black focus:outline-none bg-transparent"
                                                    style={{ fontSize: getFS(14) }}
                                                    value={promiseInput}
                                                    onChange={(e) => setPromiseInput(e.target.value)}
                                                />
                                            </div>
                                        </td>
                                    </tr>

                                    <tr className="bg-white border-2 border-black text-center font-bold h-[25px]" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
                                        <th rowSpan={totalDays + 3} className="border-2 border-black p-0 align-middle bg-white relative overflow-hidden" style={{ fontSize: getFS(10) }}>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div style={{ transform: 'rotate(-90deg)', fontSize: getFS(12) }} className="whitespace-nowrap tracking-widest font-extrabold text-black uppercase">
                                                    TEA
                                                </div>
                                            </div>
                                        </th>
                                        <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-black">DAY</th>
                                        <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white">
                                            <input className="w-full text-center bg-transparent outline-none font-bold block" value={h1} onChange={(e) => setH1(e.target.value)} />
                                        </th>
                                        <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-black">TIME</th>
                                        <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white">
                                            <input className="w-full text-center bg-transparent outline-none font-bold block" value={h2} onChange={(e) => setH2(e.target.value)} />
                                        </th>
                                        <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-black">TIME</th>
                                        <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white">
                                            <input className="w-full text-center bg-transparent outline-none font-bold block" value={h3} onChange={(e) => setH3(e.target.value)} />
                                        </th>
                                        <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-black">TIME</th>
                                        <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-black">CHAP</th>
                                        <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-black">VERSE</th>
                                        <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-black">ART</th>
                                        <th style={{ fontSize: getFS(11) }} className="border-2 border-black p-0 bg-white text-black">YES</th>
                                        <th rowSpan={totalDays + 1} className="border-2 border-black p-0 align-middle bg-white relative overflow-hidden" style={{ fontSize: getFS(10) }}>
                                            <div className="absolute inset-0 flex items-center justify-center w-full h-full bg-white z-[5]">
                                                <div style={{ transform: 'rotate(-90deg)', fontSize: getFS(11) }} className="whitespace-nowrap font-extrabold text-black origin-center">
                                                    <input className="bg-transparent text-center outline-none border-none uppercase font-extrabold" value={headerSubtitle} onChange={(e) => setHeaderSubtitle(e.target.value)} style={{ width: `${(totalDays * 35) + 105}px` }} placeholder="MODULE1:FACET1:PHASE-1/1" />
                                                </div>
                                            </div>
                                        </th>
                                    </tr>

                                    {rowsData.slice(0, totalDays).map((d, dIdx) => (
                                        <tr key={`row-${dIdx}`} className="bg-white text-center border-b-2 border-black h-[35px] hover:bg-gray-50">
                                            <td className="border-2 border-black p-0 font-extrabold bg-white text-black" style={{ fontSize: getFS(15) }}>{d.day}</td>

                                            <td className="border-2 border-black p-0 bg-white">
                                                <input className="w-[95%] text-left ml-[5%] outline-none bg-transparent font-bold uppercase leading-tight" style={{ fontSize: getFS(14) }} value={d.m1b} onChange={(e) => {
                                                    const newData = [...rowsData];
                                                    if (newData[dIdx]) newData[dIdx].m1b = e.target.value;
                                                    setRowsData(newData);
                                                }} />
                                            </td>
                                            <td className="border-2 border-black p-0 bg-white">
                                                <input className="w-full text-center outline-none bg-transparent font-bold" style={{ fontSize: getFS(13) }} value={d.m1t} onChange={(e) => {
                                                    const newData = [...rowsData];
                                                    if (newData[dIdx]) newData[dIdx].m1t = e.target.value;
                                                    setRowsData(newData);
                                                }} />
                                            </td>

                                            <td className="border-2 border-black p-0 bg-white">
                                                <input className="w-[95%] text-left ml-[5%] outline-none bg-transparent font-bold uppercase leading-tight" style={{ fontSize: getFS(14) }} value={d.m2b} onChange={(e) => {
                                                    const newData = [...rowsData];
                                                    if (newData[dIdx]) newData[dIdx].m2b = e.target.value;
                                                    setRowsData(newData);
                                                }} />
                                            </td>
                                            <td className="border-2 border-black p-0 bg-white">
                                                <input className="w-full text-center outline-none bg-transparent font-bold" style={{ fontSize: getFS(13) }} value={d.m2t} onChange={(e) => {
                                                    const newData = [...rowsData];
                                                    if (newData[dIdx]) newData[dIdx].m2t = e.target.value;
                                                    setRowsData(newData);
                                                }} />
                                            </td>

                                            <td className="border-2 border-black p-0 bg-white">
                                                <input className="w-[95%] text-left ml-[5%] outline-none bg-transparent font-bold uppercase leading-tight" style={{ fontSize: getFS(14) }} value={d.m3b} onChange={(e) => {
                                                    const newData = [...rowsData];
                                                    if (newData[dIdx]) newData[dIdx].m3b = e.target.value;
                                                    setRowsData(newData);
                                                }} />
                                            </td>
                                            <td className="border-2 border-black p-0 bg-white">
                                                <input className="w-full text-center outline-none bg-transparent font-bold" style={{ fontSize: getFS(13) }} value={d.m3t} onChange={(e) => {
                                                    const newData = [...rowsData];
                                                    if (newData[dIdx]) newData[dIdx].m3t = e.target.value;
                                                    setRowsData(newData);
                                                }} />
                                            </td>

                                            <td className="border-2 border-black p-0 bg-white">
                                                <input className="w-full text-center outline-none bg-transparent font-extrabold text-black" style={{ fontSize: getFS(13) }} value={d.chap} onChange={(e) => {
                                                    const newData = [...rowsData];
                                                    if (newData[dIdx]) newData[dIdx].chap = e.target.value;
                                                    setRowsData(newData);
                                                }} />
                                            </td>
                                            <td className="border-2 border-black p-0 bg-white">
                                                <input className="w-full text-center outline-none bg-transparent font-extrabold text-black" style={{ fontSize: getFS(13) }} value={d.verse} onChange={(e) => {
                                                    const newData = [...rowsData];
                                                    if (newData[dIdx]) newData[dIdx].verse = e.target.value;
                                                    setRowsData(newData);
                                                }} />
                                            </td>
                                            <td className="border-2 border-black p-0 bg-white">
                                                <input className="w-full text-center outline-none bg-transparent font-extrabold text-black" style={{ fontSize: getFS(13) }} value={d.art} onChange={(e) => {
                                                    const newData = [...rowsData];
                                                    if (newData[dIdx]) newData[dIdx].art = e.target.value;
                                                    setRowsData(newData);
                                                }} />
                                            </td>
                                            <td className="border-2 border-black p-0 text-center bg-white">
                                                <div className="w-full h-full flex items-center justify-center p-[2px]">
                                                    <div
                                                        className="w-[18px] h-[18px] border-[1.5px] border-black cursor-pointer bg-white rounded-[2px] relative flex items-center justify-center hover:bg-gray-100"
                                                        onClick={() => {
                                                            const newData = [...rowsData];
                                                            if (newData[dIdx]) newData[dIdx].yes = !newData[dIdx].yes;
                                                            setRowsData(newData);
                                                        }}
                                                    >
                                                        {d.yes && <i className="pi pi-check text-[14px] text-gray-700 font-extrabold stroke-2"></i>}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-white">
                                    <tr className="text-black font-extrabold tracking-wide uppercase h-[35px]" style={{ fontSize: getFS(14) }}>
                                        <td colSpan={7} className="border-2 border-black p-1 text-center font-extrabold uppercase tracking-wide bg-white">
                                            TOTAL AVERAGE READING TIME {formatSum(
                                                rowsData.slice(0, totalDays).reduce((acc, current) => acc + parseTime(current.art), 0),
                                                'HrMins'
                                            )}
                                        </td>
                                        <td className="border-2 border-black p-1 text-center font-extrabold bg-white text-black">
                                            {rowsData.slice(0, totalDays).reduce((acc, current) => acc + (parseInt(current.chap) || 0), 0)}
                                        </td>
                                        <td className="border-2 border-black p-1 text-center font-extrabold bg-white text-blue-900">
                                            {rowsData.slice(0, totalDays).reduce((acc, current) => acc + (parseInt(current.verse) || 0), 0)}
                                        </td>
                                        <td className="border-2 border-black p-1 text-center font-extrabold bg-white">
                                            {formatSum(
                                                rowsData.slice(0, totalDays).reduce((acc, current) => acc + parseTime(current.art), 0),
                                                'Hm'
                                            )}
                                        </td>
                                        <td colSpan={2} className="border-2 border-black p-1 text-center font-extrabold bg-white"></td>
                                    </tr>
                                    <tr className="bg-white text-black text-center font-bold italic h-[25px]" style={{ fontSize: getFS(11) }}>
                                        <td colSpan={12} className="border-2 border-black p-0 align-middle">
                                            <input
                                                className="w-full text-center outline-none bg-transparent whitespace-nowrap overflow-hidden text-ellipsis italic font-bold"
                                                style={{ fontSize: getFS(11) }}
                                                defaultValue={"It is the same with my word. I send it out, and it always produces fruit. It will accomplish all I want it to, and it will prosper everywhere I send it. Isaiah 55:11"}
                                            />
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-gray-200 shadow-sm print:hidden mt-6">
                    <i className="pi pi-table text-6xl text-gray-300 mb-6"></i>
                    <h2 className="text-2xl font-black text-gray-800">No Chart Loaded</h2>
                    <p className="text-gray-500 mt-2 text-center max-w-md">Please select a validated chart from the dropdown to visualize the active print layout bounds.</p>
                </div>
            )
            }
        </div >
    );
};
export default SevenTNTDayCycleChartView;
