import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { jsPDF } from 'jspdf';
import { splitS3Data, parseTime } from '../../utils/chartDataSplitter';

const formatSum = (totalMins, formatType) => {
    const rawMins = Math.round(totalMins);
    if (rawMins === 0) return '';
    if (formatType === 'HrMins') return rawMins >= 60 ? `${Math.floor(rawMins / 60)} Hr ${rawMins % 60} Mins` : `${rawMins} Mins`;
    if (formatType === 'Hm') return `${Math.floor(rawMins / 60)}H ${rawMins % 60}m`;
    return `${rawMins} Mins`;
};

const generateInitialData = (totalDays = 30) => {
    const numChunks = totalDays / 5;
    const defaultData = [];
    for (let c = 0; c < numChunks; c++) {
        const daysArray = [];
        for (let d = 1; d <= 5; d++) {
            daysArray.push({ id: (c * 5) + d, day: (c * 5) + d, m1b: '', m1t: '', m2b: '', m2t: '', m3b: '', m3t: '', chap: 0, verse: 0, art: '', yes: false });
        }
        defaultData.push({
            id: `chunk_${c + 1}`,
            team: `TEAM -${c + 1}`,
            h1: "MORNING",
            h2: "MORNING",
            h3: "MORNING",
            days: daysArray
        });
    }
    return defaultData;
};

const MorningChart = () => {
    const toast = useRef(null);
    const [chunks, setChunks] = useState(generateInitialData());
    
    // Listing States
    const [chartsList, setChartsList] = useState([]);
    const [selectedChart, setSelectedChart] = useState(null);
    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);

    // Aesthetic & UX Scaling
    const [tableFontSize, setTableFontSize] = useState(14); 
    const getFS = (base) => (base + (tableFontSize - 14)) + 'px';

    const fetchChartList = () => {
        axios.get('http://localhost:8000/api/charts/list', { withCredentials: true })
            .then(res => setChartsList(res.data))
            .catch(err => console.error("Could not fetch charts list", err));
            
        axios.get('http://localhost:8000/api/books', { withCredentials: true })
            .then(res => setBooksDB(res.data));
            
        axios.get('http://localhost:8000/api/chapters', { withCredentials: true })
            .then(res => setChaptersDB(res.data));
    };

    useEffect(() => {
        fetchChartList();
    }, []);

    useEffect(() => {
        if (!selectedChart || booksDB.length === 0 || chaptersDB.length === 0) {
            setChunks(generateInitialData());
            return;
        }

        const { module, facet, phase } = selectedChart;
        axios.get(`http://localhost:8000/api/charts/sync/${module}/${facet}/${phase}`, { withCredentials: true })
            .then(res => {
                const data = res.data;
                if (data.state_payload) {
                    try {
                        const parsed = JSON.parse(data.state_payload);
                        if (Array.isArray(parsed)) {
                            const { morningChunks } = splitS3Data(parsed, booksDB, chaptersDB);
                            setChunks(morningChunks);
                        } else {
                            setChunks(generateInitialData());
                        }
                    } catch(e) {
                        setChunks(generateInitialData());
                    }
                }
                toast.current?.show({ severity: 'success', summary: 'Loaded', detail: 'Morning Chart loaded.', life: 2000 });
            })
            .catch(err => {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not load chart details.', life: 3000 });
                setChunks(generateInitialData());
            });
    }, [selectedChart, booksDB, chaptersDB]);

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
                }
            });

            if (returnCanvasOnly) return canvas;

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
            const width = canvas.width * ratio;
            const height = canvas.height * ratio;
            const marginX = (pdfWidth - width) / 2;
            const marginY = (pdfHeight - height) / 2;

            pdf.addImage(imgData, 'PNG', marginX, marginY, width, height);
            return pdf;
        } catch (e) {
            throw e;
        } finally {
            setIsProcessingPdf(false);
        }
    };

    const handleExportPdf = async () => {
        try {
            toast.current?.show({ severity: 'info', summary: 'Processing', detail: 'Generating PDF display...', life: 2000 });
            const pdf = await generatePdfBlob();
            pdf.save(`Morning_Chart.pdf`);
            toast.current?.show({ severity: 'success', summary: 'Exported', detail: 'PDF generated successfully.', life: 2000 });
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Export Failed', detail: 'Failed to generate PDF.', life: 3000 });
        }
    };

    const handleShare = async () => {
        try {
            toast.current?.show({ severity: 'info', summary: 'Processing', detail: 'Preparing chart file for sharing...', life: 2000 });
            const pdf = await generatePdfBlob();
            const blob = pdf.output('blob');
            const file = new File([blob], 'Morning_Chart.pdf', { type: 'application/pdf' });
            setReadyShareFile([file]);
            setShowShareModal(true);
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Action Failed', detail: 'Could not process PDF.', life: 3000 });
        }
    };

    const executeNativeShare = async () => {
        if (!readyShareFile) return;
        setShowShareModal(false);
        try {
            if (navigator.share) {
                await navigator.share({ title: 'Morning Chart', files: readyShareFile });
                toast.current?.show({ severity: 'success', summary: 'Shared Successfully', detail: 'Chart OS Sharing launched!', life: 3000 });
            } else {
                throw new Error("Share API missing");
            }
        } catch (shareErr) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(readyShareFile[0]);
            a.download = readyShareFile[0].name;
            a.click();
            toast.current?.show({ severity: 'warn', summary: 'File Downloaded', detail: 'Fallback to native download.', life: 5000 });
        }
    };

    const handlePrint = async () => {
        try {
            toast.current?.show({ severity: 'info', summary: 'Processing', detail: 'Preparing print layout...', life: 2000 });
            const pdf = await generatePdfBlob();
            pdf.autoPrint();
            window.open(pdf.output('bloburl'), '_blank');
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
                .custom-white-dropdown .p-dropdown-label, .custom-white-dropdown .p-inputtext, .p-dropdown-panel.custom-white-panel .p-dropdown-item { color: #000 !important; }
                .p-dropdown-panel.custom-white-panel .p-dropdown-item { background-color: #fff !important; }
                .p-dropdown-panel.custom-white-panel .p-dropdown-item:hover { background-color: #e2e8f0 !important; }
                .pdf-table, .pdf-table td, .pdf-table th { border: 1px solid #000 !important; border-collapse: collapse !important; box-sizing: border-box !important; }
                .pdf-table { table-layout: fixed !important; }
            `}</style>
            <Toast ref={toast} />

            <Dialog header={<div className="font-bold text-indigo-900 border-b pb-2">Ready to Share</div>} visible={showShareModal} onHide={() => setShowShareModal(false)} className="w-[90vw] md:w-[400px]">
                <div className="flex flex-col items-center p-6 text-center">
                    <p className="text-gray-500 mb-6">Click below to launch the final native Share panel!</p>
                    <Button label="Share Now" className="bg-green-600 w-full rounded-xl" onClick={executeNativeShare} />
                </div>
            </Dialog>

            <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden mb-6 print:border-none print:shadow-none print:overflow-visible">
                <div className="bg-gradient-to-r from-[#051220] to-[#0A1F35] p-6 flex flex-col xl:flex-row justify-between items-center text-white pb-4 gap-4 print:hidden">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight mb-1 text-[#1A73E8]">Morning Chart</h1>
                        <p className="text-xs text-gray-300 uppercase">Derived Data Split</p>
                    </div>

                    <div className="flex gap-4 items-center">
                        <Dropdown value={selectedChart} options={chartsList} optionLabel="label" placeholder="Select a saved chart..." className="bg-gray-100 w-72 custom-white-dropdown" panelClassName="custom-white-panel" onChange={(e) => setSelectedChart(e.value)} />
                        {selectedChart && (
                            <div className="flex gap-2">
                                <Button icon="pi pi-file-pdf" tooltip="Export PDF" loading={isProcessingPdf} className="bg-orange-500 rounded-full w-11 h-11 p-0 flex items-center justify-center border-none" onClick={handleExportPdf} />
                                <Button icon="pi pi-print" tooltip="Print" loading={isProcessingPdf} className="bg-slate-500 rounded-full w-11 h-11 p-0 flex items-center justify-center border-none" onClick={handlePrint} />
                                <Button icon="pi pi-share-alt" tooltip="Share" loading={isProcessingPdf} className="bg-emerald-500 rounded-full w-11 h-11 p-0 flex items-center justify-center border-none" onClick={handleShare} />
                            </div>
                        )}
                    </div>
                </div>

                <div id="printable-chart-area" className="w-full bg-white p-6">
                    <div className="w-full border-[3px] border-black p-3 bg-white">
                        <div className="pb-1 overflow-x-auto print:overflow-visible">
                            <table className="w-full bg-white pdf-table table-fixed border-collapse" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
                                <colgroup>
                                    <col style={{ width: '2%' }} />
                                    <col style={{ width: '2%' }} />
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '4%' }} />
                                    <col style={{ width: '15%' }} />
                                    <col style={{ width: '4%' }} />
                                    <col style={{ width: '36%' }} />
                                    <col style={{ width: '5%' }} />
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
                                    const chapTotal = chunk.days.reduce((acc, curr) => acc + (parseInt(curr.chap) || 0), 0);
                                    const verseTotal = chunk.days.reduce((acc, curr) => acc + (parseInt(curr.verse) || 0), 0);
                                    const artTotal = chunk.days.reduce((acc, curr) => acc + parseTime(curr.art), 0);

                                    return (
                                        <tbody key={chunk.id} className="text-black font-bold text-sm rllt-condensed">
                                            <tr className="bg-white text-center font-bold h-[30px]">
                                                <th rowSpan={6} className="border-2 border-black p-0 align-middle">
                                                    <div className="flex items-center justify-center transform -rotate-90 text-[11px] font-extrabold uppercase whitespace-nowrap">{chunk.team}</div>
                                                </th>
                                                <th className="border-2 border-black p-0 text-[10px]">DAY</th>
                                                <th className="border-2 border-black p-0 text-left pl-1 text-[11px]">{chunk.h1}</th>
                                                <th className="border-2 border-black p-0 text-[10px]">TIME</th>
                                                <th className="border-2 border-black p-0 text-left pl-1 text-[11px]">{chunk.h2}</th>
                                                <th className="border-2 border-black p-0 text-[10px]">TIME</th>
                                                <th className="border-2 border-black p-1 text-left pl-2 text-[14px]">MORNING SCRIPTURE</th>
                                                <th className="border-2 border-black p-0 text-[10px]">TIME</th>
                                                <th className="border-2 border-black p-0 text-[10px]">CHAP</th>
                                                <th className="border-2 border-black p-0 text-[10px]">VERSE</th>
                                                <th className="border-2 border-black p-0 text-[10px]">ART</th>
                                                <th className="border-2 border-black p-0 text-[10px]">YES</th>
                                                <th rowSpan={7} className="border-2 border-black p-0 align-middle">
                                                    <div className="flex items-center justify-center transform -rotate-90 text-[10px] whitespace-nowrap font-extrabold uppercase">MORNING</div>
                                                </th>
                                            </tr>

                                            {chunk.days.map((d) => (
                                                <tr key={d.id} className="bg-white text-center border-b-2 border-black h-[38px]">
                                                    <td className="border-2 border-black p-0 font-extrabold text-[12px]">{d.day}</td>
                                                    <td className="border-2 border-black p-0 uppercase text-[12px] align-middle">{d.m1b}</td>
                                                    <td className="border-2 border-black p-0 text-[11px] align-middle">{d.m1t}</td>
                                                    <td className="border-2 border-black p-0 uppercase text-[12px] align-middle">{d.m2b}</td>
                                                    <td className="border-2 border-black p-0 text-[11px] align-middle">{d.m2t}</td>
                                                    <td className="border-2 border-black p-1 text-left uppercase align-middle text-[#1A73E8] text-[13px]">{d.m3b}</td>
                                                    <td className="border-2 border-black p-0 text-[11px] align-middle">{d.m3t}</td>
                                                    <td className="border-2 border-black p-0 text-[11px] align-middle">{d.chap}</td>
                                                    <td className="border-2 border-black p-0 text-[11px] align-middle">{d.verse}</td>
                                                    <td className="border-2 border-black p-0 text-[11px] align-middle">{d.art}</td>
                                                    <td className="border-2 border-black p-0 align-middle">{d.yes ? '✔️' : ''}</td>
                                                </tr>
                                            ))}

                                            <tr className="bg-white text-center font-extrabold h-[35px] text-[13px]">
                                                <td className="border-2 border-black"></td>
                                                <td className="border-2 border-black"></td>
                                                <td colSpan={2} className="border-2 border-black">{formatSum(m1Total, 'HrMins')}</td>
                                                <td colSpan={2} className="border-2 border-black">{formatSum(m2Total, 'HrMins')}</td>
                                                <td colSpan={2} className="border-2 border-black">{formatSum(m3Total, 'HrMins')}</td>
                                                <td className="border-2 border-black p-1">{chapTotal}</td>
                                                <td className="border-2 border-black p-1">{verseTotal}</td>
                                                <td colSpan={2} className="border-2 border-black p-1">{formatSum(artTotal, 'Hm')}</td>
                                            </tr>
                                        </tbody>
                                    );
                                })}
                                <tfoot className="pb-4 rllt-condensed">
                                    <tr className="bg-white text-black font-extrabold tracking-wide text-center uppercase text-[11px]">
                                        <td colSpan={8} className="border-2 border-black p-1 bg-white text-[14px]">
                                            TOTAL AVERAGE READING TIME {formatSum(chunks.reduce((acc, c) => acc + c.days.reduce((dAcc, d) => dAcc + parseTime(d.art), 0), 0), 'HrMins')}
                                        </td>
                                        <td className="border-2 border-black p-1 text-[14px]">{chunks.reduce((acc, c) => acc + c.days.reduce((dAcc, d) => dAcc + (parseInt(d.chap) || 0), 0), 0)}</td>
                                        <td className="border-2 border-black p-1 text-blue-900 text-[14px]">{chunks.reduce((acc, c) => acc + c.days.reduce((dAcc, d) => dAcc + (parseInt(d.verse) || 0), 0), 0)}</td>
                                        <td colSpan={3} className="border-2 border-black p-1 text-[14px]">
                                            {formatSum(chunks.reduce((acc, c) => acc + c.days.reduce((dAcc, d) => dAcc + parseTime(d.art), 0), 0), 'Hm')}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MorningChart;
