import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { FileUpload } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { extractBooksAndAuthors } from '../../utils/bookUtils';

const ImageUploadPlaceholder = ({ state, setState, label }) => {
    const imageUrl = typeof state === 'object' && state !== null ? state.url : state;

    return (
        <label className="w-full h-full flex items-center justify-center cursor-pointer bg-white overflow-hidden relative group">
            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setState({ file, url: URL.createObjectURL(file) });
                }
            }} />
            {imageUrl ? (
                <img src={imageUrl} className="w-full h-full object-contain" />
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 p-1 text-center w-full h-full">
                    <i className="pi pi-camera text-xl group-hover:text-[#00a8ff] transition-colors"></i>
                    {label && <span className="text-[10px] font-bold leading-tight mt-1">{label}</span>}
                </div>
            )}
        </label>
    );
};


const LightChartTable = ({ moduleNum, rlltDB, tableFontSize }) => {
    const getFS = (base) => (base + (tableFontSize - 14)) + 'px';
    // Calculate totals from database or local data
    const dbRows = (rlltDB || []).filter(r => r.module === moduleNum);
    const totalFacets = dbRows.length > 0 ? dbRows.length : 10;
    const uniquePhases = new Set(dbRows.map(r => r.phase));
    const totalPhases = dbRows.length > 0 ? uniquePhases.size : 1;
    
    // Determine scheduled days intelligently
    let scheduledDays = 30;
    if (dbRows.length > 0 && dbRows[0].scheduled_value_days > 0) {
        scheduledDays = dbRows[0].scheduled_value_days;
    } else if (dbRows.length > 0 && dbRows[0].day > 0) {
        scheduledDays = dbRows[0].day;
    }

    const tableRows = dbRows.length > 0 ? dbRows.map((r, idx) => ({
        sno: idx + 1,
        fct: r.facet || '',
        dayPpl: r.day || '',
        otBks: r.ot_bks || '',
        ntBks: r.nt_bks || '',
        phs: r.phase || '',
        we5: r.we5 || '',
        pro: r.pro || '',
        psa: r.psa || '',
        chp: r.chp || '',
        ver: r.ver || '',
        art: r.art || '',
        ppl: r.ppl || ''
    })) : Array.from({ length: 10 }).map((_, idx) => ({
        sno: idx + 1,
        fct: idx + 1,
        dayPpl: '',
        otBks: '',
        ntBks: '',
        phs: '',
        we5: '',
        pro: '',
        psa: '',
        chp: '',
        ver: '',
        art: '',
        ppl: ''
    }));

    return (
        <div className="mb-2 mx-auto max-w-6xl w-full">
            <h2 className="text-center font-bold text-xs mb-1" style={{ color: '#00A859' }}>
                MODULE {moduleNum}: <span className="text-black">{totalFacets} FACETS: {totalPhases} PHASES - EACH PHASE {scheduledDays} DAYS</span>
            </h2>
            <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse border-2 border-black text-center font-bold" style={{ fontFamily: '"Arial Narrow", Arial, sans-serif', fontSize: getFS(14) }}>
                    <thead>
                        <tr className="bg-white leading-none">
                            <th className="border-2 border-black p-0 align-middle bg-black text-white w-10">
                                <div className="flex h-[22px] w-full items-center justify-center">S.NO</div>
                            </th>
                            <th className="border-2 border-black p-0 align-middle">
                                <div className="flex h-[22px] w-full items-center justify-center">FCT</div>
                            </th>
                            <th className="border-2 border-black p-0 align-middle">
                                <div className="flex h-[22px] w-full items-center justify-center">DAY/PPL</div>
                            </th>
                            <th className="border-2 border-black p-0 align-middle">
                                <div className="flex h-[22px] w-full items-center justify-center">O.T BKS</div>
                            </th>
                            <th className="border-2 border-black p-0 align-middle">
                                <div className="flex h-[22px] w-full items-center justify-center">N.T BKS</div>
                            </th>
                            <th className="border-2 border-black p-0 align-middle">
                                <div className="flex h-[22px] w-full items-center justify-center">PHS</div>
                            </th>
                            <th className="border-2 border-black p-0 align-middle">
                                <div className="flex h-[22px] w-full items-center justify-center">WE5</div>
                            </th>
                            <th className="border-2 border-black p-0 align-middle">
                                <div className="flex h-[22px] w-full items-center justify-center">PRO</div>
                            </th>
                            <th className="border-2 border-black p-0 align-middle">
                                <div className="flex h-[22px] w-full items-center justify-center">PSA</div>
                            </th>
                            <th className="border-2 border-black p-0 align-middle">
                                <div className="flex h-[22px] w-full items-center justify-center">CHP</div>
                            </th>
                            <th className="border-2 border-black p-0 align-middle">
                                <div className="flex h-[22px] w-full items-center justify-center">VER</div>
                            </th>
                            <th className="border-2 border-black p-0 align-middle">
                                <div className="flex h-[22px] w-full items-center justify-center">ART</div>
                            </th>
                            <th className="border-2 border-black p-0 align-middle">
                                <div className="flex h-[22px] w-full items-center justify-center">PPL</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableRows.map((row, idx) => {
                            // Rows 2 and 8 are green, others light blue only for the first S.NO cell.
                            const isGreenRow = row.sno === 2 || row.sno === 8;
                            const snoColor = isGreenRow ? '#00E84D' : '#BCD2E8'; // Vivid green for 2&8

                            return (
                                <tr key={idx} className="border border-black leading-none">
                                    <td className="border-2 border-black p-0 align-middle font-bold bg-white" style={{ backgroundColor: snoColor }}>
                                        <div className="flex h-[22px] w-full items-center justify-center">{row.sno}</div>
                                    </td>
                                    <td className="border-2 border-black p-0 align-middle bg-white" style={isGreenRow ? { backgroundColor: '#00E84D' } : {}}>
                                        <div className="flex h-[22px] w-full items-center justify-center">{row.fct}</div>
                                    </td>
                                    <td className="border-2 border-black p-0 align-middle bg-white">
                                        <div className="flex h-[22px] w-full items-center justify-center">{row.dayPpl}</div>
                                    </td>
                                    <td className="border-2 border-black p-0 align-middle bg-white">
                                        <div className="flex h-[22px] w-full items-center justify-center">{row.otBks}</div>
                                    </td>
                                    <td className="border-2 border-black p-0 align-middle bg-white">
                                        <div className="flex h-[22px] w-full items-center justify-center">{row.ntBks}</div>
                                    </td>
                                    <td className="border-2 border-black p-0 align-middle bg-white">
                                        <div className="flex h-[22px] w-full items-center justify-center">{row.phs}</div>
                                    </td>
                                    <td className="border-2 border-black p-0 align-middle bg-white">
                                        <div className="flex h-[22px] w-full items-center justify-center">{row.we5}</div>
                                    </td>
                                    <td className="border-2 border-black p-0 align-middle bg-white">
                                        <div className="flex h-[22px] w-full items-center justify-center">{row.pro}</div>
                                    </td>
                                    <td className="border-2 border-black p-0 align-middle bg-white">
                                        <div className="flex h-[22px] w-full items-center justify-center">{row.psa}</div>
                                    </td>
                                    <td className="border-2 border-black p-0 align-middle bg-white">
                                        <div className="flex h-[22px] w-full items-center justify-center">{row.chp}</div>
                                    </td>
                                    <td className="border-2 border-black p-0 align-middle bg-white">
                                        <div className="flex h-[22px] w-full items-center justify-center">{row.ver}</div>
                                    </td>
                                    <td className="border-2 border-black p-0 align-middle bg-white">
                                        <div className="flex h-[22px] w-full items-center justify-center">{row.art}</div>
                                    </td>
                                    <td className="border-2 border-black p-0 align-middle bg-white">
                                        <div className="flex h-[22px] w-full items-center justify-center">{row.ppl}</div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const LightChart = () => {
    const [tLabel, setTLabel] = useState("T");
    const [headerSubtitle, setHeaderSubtitle] = useState("MODULE1:FACET1:PHASE-1/1");
    const [phs, setPhs] = useState(1);
    const [logo1, setLogo1] = useState(null);
    const [bannerText, setBannerText] = useState("MAIN CHART - 30 DAYS");

    const [tableFontSize, setTableFontSize] = useState(14);

    // Feature States
    const toast = useRef(null);
    const [showPopup, setShowPopup] = useState(false);

    // DB
    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);
    const [rlltDB, setRlltDB] = useState([]);

    useEffect(() => {
        const fetchRefs = async () => {
            try {
                const baseUrl = `http://${window.location.hostname}:8000`;
                const [booksRes, chaptersRes, rlltRes] = await Promise.all([
                    axios.get(`${baseUrl}/api/books`, { withCredentials: true }),
                    axios.get(`${baseUrl}/api/chapters`, { withCredentials: true }),
                    axios.get(`${baseUrl}/api/rllt_lookup`, { withCredentials: true })
                ]);
                setBooksDB(Array.isArray(booksRes.data) ? booksRes.data : []);
                setChaptersDB(Array.isArray(chaptersRes.data) ? chaptersRes.data : []);
                setRlltDB(Array.isArray(rlltRes.data) ? rlltRes.data : []);
            } catch (err) {
                console.error("Failed to fetch references:", err);
                setBooksDB([]);
                setChaptersDB([]);
                setRlltDB([]);
            }
        };
        fetchRefs();
    }, []);

    const getBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const [isProcessingPdf, setIsProcessingPdf] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [readyShareFile, setReadyShareFile] = useState(null);

    const generatePdfBlob = async (returnCanvasOnly = false, forPrint = false) => {
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
            if (!window.jspdf && !returnCanvasOnly) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            const element = document.getElementById('light-chart-content');

            // Force a fixed width so elements render exactly the same regardless of viewport
            const EXACT_WIDTH = 1220;

            const canvas = await window.html2canvas(element, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: EXACT_WIDTH,
                windowWidth: EXACT_WIDTH,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById('light-chart-content');
                    clonedElement.style.position = 'absolute';
                    clonedElement.style.left = '0px';
                    clonedElement.style.top = '0px';
                    clonedElement.style.width = `${EXACT_WIDTH}px`;
                    clonedElement.style.minWidth = `${EXACT_WIDTH}px`;
                    clonedElement.style.maxWidth = `${EXACT_WIDTH}px`;
                    clonedElement.style.margin = '0';
                    
                    const style = clonedDoc.createElement('style');
                    style.innerHTML = `
                        #light-chart-content * {
                            font-weight: 900 !important;
                        }
                    `;
                    clonedDoc.head.appendChild(style);
                }
            });

            if (returnCanvasOnly) {
                return canvas;
            }

            const imgData = canvas.toDataURL('image/png');
            
            const CSS_SCALE = 3;
            const pdfWidthPx = canvas.width / CSS_SCALE;
            const pdfHeightPx = canvas.height / CSS_SCALE;
            
            const { jsPDF } = window.jspdf;
            
            let pdf;
            if (forPrint || true) {
                // Landscape A4
                pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'pt',
                    format: 'a4'
                });
                
                const a4Width = pdf.internal.pageSize.getWidth();
                const a4Height = pdf.internal.pageSize.getHeight();
                
                // 30pt margin
                const marginSafeW = a4Width - 60;
                let marginSafeH = (pdfHeightPx * marginSafeW) / pdfWidthPx;

                // Ensure it fits vertically as well, scale down if too tall
                if (marginSafeH > a4Height - 60) {
                    marginSafeH = a4Height - 60;
                    const adjustedWidth = (pdfWidthPx * marginSafeH) / pdfHeightPx;
                    const offsetX = 30 + (marginSafeW - adjustedWidth) / 2; // Center horizontally
                    pdf.addImage(imgData, 'PNG', offsetX, 30, adjustedWidth, marginSafeH);
                } else {
                    pdf.addImage(imgData, 'PNG', 30, 30, marginSafeW, marginSafeH);
                }
            }

            return pdf;
        } catch (e) {
            console.error('PDF generation error', e);
            throw e;
        } finally {
            setIsProcessingPdf(false);
        }
    };

    const handleExportPDF = async () => {
        try {
            toast.current?.show({ severity: 'info', summary: 'Processing', detail: 'Generating PDF display...', life: 2000 });
            const pdf = await generatePdfBlob(false, true);
            pdf.save('LightChart.pdf');
            toast.current?.show({ severity: 'success', summary: 'Exported', detail: 'PDF generated successfully.', life: 2000 });
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Export Failed', detail: 'Failed to generate PDF.', life: 3000 });
        }
    };

    const handlePrint = async () => {
        try {
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                toast.current?.show({ severity: 'warn', summary: 'Popup Blocked', detail: 'Please allow popups for this site to view the print format.', life: 5000 });
                return;
            }
            
            printWindow.document.write(`
                <html>
                <head><title>Generating Print...</title></head>
                <body style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; background:#f3f4f6;">
                    <h2>Preparing High-Quality Print Document...</h2>
                </body>
                </html>
            `);

            toast.current?.show({ severity: 'info', summary: 'Processing', detail: 'Preparing perfect print layout...', life: 2000 });
            
            const pdf = await generatePdfBlob(false, true);
            pdf.autoPrint();
            const blobUrl = pdf.output('bloburl');

            printWindow.location.href = blobUrl;

        } catch (e) {
            console.error(e);
            toast.current?.show({ severity: 'error', summary: 'Print Failed', detail: 'Could not prepare perfect document for printing.', life: 3000 });
        }
    };

    const handleShare = async () => {
        try {
            toast.current?.show({ severity: 'info', summary: 'Processing', detail: 'Preparing chart file for sharing...', life: 2000 });
            const pdf = await generatePdfBlob(false, true);
            const fileName = 'LightChart.pdf';
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
                    title: 'RLLT Light Chart',
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



    return (
        <div className="p-4 sm:p-8 w-full max-w-full overflow-x-auto bg-gray-50 min-h-screen print:bg-white print:p-0">
            <Toast ref={toast} />

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

            {/* Inject print styles for perfect A4 fitting */}
            <style>{`
                @media print {
                    @page { size: A4 landscape; margin: 5mm; }
                    body { 
                        display: block !important; 
                        height: auto !important; 
                        min-height: auto !important; 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact; 
                        background-color: white !important; 
                    }
                    #root { display: block !important; height: auto !important; }
                    .print\\:hidden { display: none !important; }
                    .print\\:p-0 { padding: 0 !important; }
                    .print\\:m-0 { margin: 0 !important; }
                    .print\\:bg-white { background: white !important; }
                    .print\\:shadow-none { box-shadow: none !important; border: none !important; }
                    .print\\:overflow-visible { overflow: visible !important; }
                }
                
                /* Custom Dropdown Overrides inside LightChart */
                .custom-white-dropdown {
                    background-color: #fff !important;
                    color: #000 !important;
                }
                .custom-white-dropdown .p-dropdown-label {
                    color: #000 !important;
                }
                .custom-white-dropdown .p-dropdown-trigger {
                    color: #000 !important;
                }
                .p-dropdown-panel.custom-white-panel {
                    background-color: #fff !important;
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

            <div className="bg-white shadow-xl rounded-2xl border border-gray-100 print:shadow-none print:border-none print:rounded-none overflow-hidden print:overflow-visible mb-6 p-0 sm:p-0 mx-auto max-w-4xl">

                <div className="bg-gradient-to-r from-[#051220] to-[#0A1F35] p-4 sm:p-6 flex flex-col xl:flex-row justify-between items-center text-white border-b-2 border-gray-100 mb-4 print:hidden gap-4">
                    <div className="flex-shrink-0 text-center xl:text-left mb-4 xl:mb-0">
                        <h1 className="text-2xl font-black tracking-tight mb-1 text-[#c8a165] whitespace-nowrap">Light Chart</h1>

                        {/* Font Size Scaling Controls */}
                        <div className="flex gap-2 items-center bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 shadow-inner inline-flex">
                            <span className="text-[11px] uppercase font-black text-gray-300 mr-2">Scale</span>
                            <Button
                                icon="pi pi-minus"
                                className="p-button-rounded p-button-text text-white h-7 w-7 min-w-[28px] p-0 hover:bg-white/20 transition-all border border-transparent hover:border-white/30"
                                onClick={() => setTableFontSize(prev => Math.max(8, prev - 1))}
                            />
                            <span className="font-black text-lg w-8 text-center text-[#c8a165] drop-shadow-sm">{tableFontSize}</span>
                            <Button
                                icon="pi pi-plus"
                                className="p-button-rounded p-button-text text-white h-7 w-7 min-w-[28px] p-0 hover:bg-white/20 transition-all border border-transparent hover:border-white/30"
                                onClick={() => setTableFontSize(prev => Math.min(20, prev + 1))}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col items-center xl:items-end w-full xl:w-auto gap-3">
                        <div className="flex items-center gap-3 justify-center w-full">
                            <Button
                                icon="pi pi-file-pdf"
                                className="p-button-rounded shadow-md w-10 h-10 p-0 flex items-center justify-center transition-transform hover:scale-105"
                                style={{ backgroundColor: '#f97316', borderColor: '#f97316', color: '#ffffff' }}
                                onClick={handleExportPDF}
                                loading={isProcessingPdf}
                                tooltip="Export to PDF"
                                tooltipOptions={{ position: 'bottom' }}
                            />
                            <Button
                                icon="pi pi-print"
                                className="p-button-rounded shadow-md w-10 h-10 p-0 flex items-center justify-center transition-transform hover:scale-105"
                                style={{ backgroundColor: '#64748b', borderColor: '#64748b', color: '#ffffff' }}
                                onClick={handlePrint}
                                loading={isProcessingPdf}
                                tooltip="Print"
                                tooltipOptions={{ position: 'bottom' }}
                            />
                            <Button
                                icon="pi pi-share-alt"
                                className="p-button-rounded shadow-md w-10 h-10 p-0 flex items-center justify-center transition-transform hover:scale-105"
                                style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: '#ffffff' }}
                                onClick={handleShare}
                                loading={isProcessingPdf}
                                tooltip="Share"
                                tooltipOptions={{ position: 'bottom' }}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 pt-0 print:pt-4" id="light-chart-content">

                    {/* Global Header Above Tables */}
                    <div className="w-full border-[2px] border-black p-1.5 flex flex-col bg-white overflow-hidden print:overflow-visible mb-3 max-w-6xl mx-auto">
                        <div className="flex flex-col w-full mb-1">
                            {/* ROW 1: T | REAL LIFE... | PH */}
                            <table className="w-full bg-white table-fixed border-collapse border-[1.5px] border-black" style={{ borderSpacing: 0 }}>
                                <tbody>
                                    <tr className="h-[35px]">
                                        {/* T BLOCK */}
                                        <td className="w-[40px] bg-[#00b050] border-r-[1.5px] border-black p-0 align-middle">
                                            <input
                                                className="w-full h-full text-center bg-transparent text-white font-serif text-[22px] border-none outline-none"
                                                value={tLabel}
                                                onChange={(e) => setTLabel(e.target.value)}
                                            />
                                        </td>

                                        {/* CENTER TEXT */}
                                        <td className="p-0 align-middle text-center bg-white">
                                            <span className="text-[#ff0000] font-bold text-[14px] sm:text-[16px] tracking-wide uppercase" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                                REAL LIFE LEADERSHIP TRAINING - <span className="text-[12px] sm:text-[14px] font-bold">{headerSubtitle}</span>
                                            </span>
                                        </td>

                                        {/* DATE & TIME BLOCK */}
                                        <td className="w-[100px] border-l-[1.5px] border-black p-0 align-middle bg-white">
                                            <div className="flex flex-col h-[55px] w-full">
                                                <div className="flex-1 flex items-center justify-start border-b-[1.5px] border-black px-2">
                                                    <span className="text-[12px] font-bold text-black uppercase">{new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
                                                </div>
                                                <div className="flex-1 flex items-center justify-start px-2">
                                                    <span className="text-[12px] font-bold text-black uppercase">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* PH BLOCK */}
                                        <td className="w-[45px] bg-[#00b050] border-l-[1.5px] border-black p-0 h-[35px]">
                                            <div className="flex flex-col h-[35px] w-full">
                                                <div className="flex-1 flex items-center justify-center border-b-[1.5px] border-black">
                                                    <span className="text-white font-black text-[11px] tracking-tighter">PH</span>
                                                </div>
                                                <div className="flex-1 flex items-center justify-center">
                                                    <span className="text-white font-bold text-[13px]">{phs}</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* ROW 2: 3 MAPS | ORANGE INPUT | BK-AR */}
                            <table className="w-full bg-white table-fixed border-collapse border-b-[1.5px] border-l-[1.5px] border-r-[1.5px] border-black" style={{ borderSpacing: 0 }}>
                                <tbody>
                                    <tr className="h-[45px]">
                                        {/* MAP 1 */}
                                        <td className="w-[60px] border-r-[1.5px] border-black p-0 align-middle bg-white">
                                            <div className="w-[60px] h-[45px] p-0.5 overflow-hidden flex items-center justify-center">
                                                <ImageUploadPlaceholder state={logo1} setState={setLogo1} label="" />
                                            </div>
                                        </td>
                                        {/* MAP 2 */}
                                        <td className="w-[60px] border-r-[1.5px] border-black p-0 align-middle bg-white">
                                            <div className="w-[60px] h-[45px] p-0.5 overflow-hidden flex items-center justify-center">
                                                <ImageUploadPlaceholder state={logo1} setState={setLogo1} label="" />
                                            </div>
                                        </td>
                                        {/* MAP 3 */}
                                        <td className="w-[60px] border-r-[1.5px] border-black p-0 align-middle bg-white">
                                            <div className="w-[60px] h-[45px] p-0.5 overflow-hidden flex items-center justify-center">
                                                <ImageUploadPlaceholder state={logo1} setState={setLogo1} label="" />
                                            </div>
                                        </td>

                                        {/* ORANGE BANNER BOX */}
                                        <td className="border-r-[1.5px] border-black p-1 align-middle bg-white relative">
                                            <div className="absolute inset-[2px] border-[2px] border-[#e47636] pointer-events-none"></div>
                                            <input
                                                type="text"
                                                value={bannerText}
                                                onChange={(e) => setBannerText(e.target.value)}
                                                className="w-full h-full min-h-[35px] outline-none text-black font-bold px-2 text-[14px] sm:text-[18px] uppercase bg-transparent relative z-10"
                                                placeholder="..."
                                            />
                                        </td>

                                        {/* BK-AR BLOCK */}
                                        <td className="w-[145px] bg-[#ffff00] p-0 h-[45px] align-middle">
                                            <div className="flex flex-col h-[45px] w-full">
                                                <div className="flex-1 flex items-center justify-center border-b-[1.5px] border-black pt-0.5">
                                                    <span className="text-black font-black tracking-widest text-[14px] sm:text-[16px] drop-shadow-sm whitespace-nowrap" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.1em' }}>B K - A R</span>
                                                </div>
                                                <div className="flex-1 flex items-center justify-center pb-0.5">
                                                    <span className="text-black font-black tracking-widest text-[13px] sm:text-[15px] drop-shadow-sm whitespace-nowrap" style={{ letterSpacing: '0.1em' }}>{extractBooksAndAuthors(typeof chunks !== 'undefined' ? chunks : (typeof mappingConfig !== 'undefined' ? mappingConfig : (typeof rlltDB !== 'undefined' ? rlltDB : null))).bks} - {extractBooksAndAuthors(typeof chunks !== 'undefined' ? chunks : (typeof mappingConfig !== 'undefined' ? mappingConfig : (typeof rlltDB !== 'undefined' ? rlltDB : null))).art}</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:gap-3 w-full items-center justify-center pt-1">
                        {[1, 2, 3, 4, 5].map((moduleNum) => (
                            <LightChartTable key={moduleNum} moduleNum={moduleNum} rlltDB={rlltDB} tableFontSize={tableFontSize} />
                        ))}
                    </div>
                </div>
            </div>



        </div>
    );
};

export default LightChart;
