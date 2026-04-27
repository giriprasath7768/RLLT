import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { splitS3Data, parseTime, formatHrMinDetailed } from '../../utils/chartDataSplitter';

const formatSum = (totalMins, formatType) => {
    const rawMins = Math.round(totalMins);
    if (rawMins === 0) return '';
    if (formatType === 'HrMins') return rawMins >= 60 ? `${Math.floor(rawMins / 60)}h${rawMins % 60}m` : `${rawMins}m`;
    if (formatType === 'Hm') return `${Math.floor(rawMins / 60)}H ${rawMins % 60}m`;
    return `${rawMins} Mins`;
};

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
            daysArray.push({ id: (c * 5) + d, day: (c * 5) + d, m1b: '', m1t: '', m2b: '', m2t: '', m3b: '', m3t: '', m3b_morning: '', m3b_evening: '', m3t_morning: '', m3t_evening: '', chap: 0, verse: 0, art: '', yes: false });
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
            days: daysArray
        });
    }
    return defaultData;
};

const DLSizeChart = () => {
    const toast = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const [chunks, setChunks] = useState(generateInitialData());
    
    // Header States
    const [headerSubtitle, setHeaderSubtitle] = useState("NO CHART SELECTED");
    const [headerTitle, setHeaderTitle] = useState("DL Size Chart");
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
    
    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);

    // Aesthetic & UX Scaling
    const [tableFontSize, setTableFontSize] = useState(10); 
    const getFS = (base) => (base + (tableFontSize - 10)) + 'px';

    const fetchChartList = () => {
                axios.get('http://' + window.location.hostname + ':8000/api/charts/list', { withCredentials: true })
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

    // Load Data
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
            : axios.get(`http://${window.location.hostname}:8000/api/charts/sync/${selectedChart.module}/${selectedChart.facet}/${selectedChart.phase}`, { withCredentials: true });

        fetchPromise.then(res => {
                const data = res.data;
            const module = selectedChart?.module || location.state?.assignment?.module || '1';
            const facet = selectedChart?.facet || location.state?.assignment?.facet || '1';
            const phase = selectedChart?.phase || location.state?.assignment?.phase || '1';
                setBannerText(data.banner_text || "");
                setTLabel(data.t_label || "T");
                setLogoUrl(data.logo_url ? `http://${window.location.hostname}:8000${data.logo_url}` : null);
                setHeaderSubtitle(`MODULE${module}:FACET${facet}:PHASE-${phase}`);
                setPhaseLabel(String(phase));
                
                if (data.state_payload) {
                    try {
                        const parsed = JSON.parse(data.state_payload);
                        if (Array.isArray(parsed)) {
                            const { morningEveningChunks } = splitS3Data(parsed, booksDB, chaptersDB);
                            setChunks(morningEveningChunks);
                            
                            if (parsed.length === 8) {
                                setHeaderTitle("DL Size Chart - 40 Days View");
                            } else {
                                setHeaderTitle("DL Size Chart - 30 Days View");
                            }
                        } else {
                            setChunks(generateInitialData());
                        }
                    } catch(e) {
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
            message: 'Are you sure you want to delete this specific chart?',
            header: 'Delete Confirmation',
            icon: 'pi pi-info-circle',
            acceptClassName: 'p-button-danger',
            accept: () => {
                const { module, facet, phase } = selectedChart;
                axios.delete(`http://${window.location.hostname}:8000/api/charts/sync/${module}/${facet}/${phase}`, { withCredentials: true })
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
            pdf.save(`RLLT_DLSizeChart_Mod${selectedChart?.module}_Fct${selectedChart?.facet}_Phase${selectedChart?.phase}.pdf`);
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

    // Calculate splits
    const renderMainHeaderBlock = () => {
        return (
            <div className="flex flex-col w-full mb-2">
                {/* ROW 1 */}
                <table className="w-full bg-white table-fixed border-collapse border-2 border-black" style={{ borderSpacing: 0 }}>
                    <tbody>
                        <tr className="h-[45px]">
                            <td className="w-[45px] bg-[#00b050] border-r-2 border-black p-0 align-middle">
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-white font-serif text-[28px] leading-none">{tLabel}</span>
                                </div>
                            </td>
                            <td className="p-0 align-middle text-center bg-white">
                                <span className="text-[#ff0000] font-bold text-[18px] tracking-wide uppercase" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                    REAL LIFE LEADERSHIP TRAINING - <span className="text-[14px] font-bold">{headerSubtitle}</span>
                                </span>
                            </td>
                            <td className="w-[50px] bg-[#00b050] border-l-2 border-black p-0 h-[45px]">
                                <div className="flex flex-col h-full w-full">
                                    <div className="flex-1 flex items-center justify-center border-b-2 border-black">
                                        <span className="text-white font-black text-[13px] tracking-tighter">PH</span>
                                    </div>
                                    <div className="flex-1 flex items-center justify-center">
                                        <span className="text-white font-bold text-[15px]">{phaseLabel}</span>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                
                {/* ROW 2 */}
                <table className="w-full bg-white table-fixed border-collapse border-b-2 border-l-2 border-r-2 border-black" style={{ borderSpacing: 0 }}>
                    <tbody>
                        <tr className="h-[55px]">
                            <td className="w-[70px] border-r-2 border-black p-0 bg-white"><ImageBox url={logoUrl} label="" /></td>
                            <td className="w-[70px] border-r-2 border-black p-0 bg-white"><ImageBox url={logoUrl} label="" /></td>
                            <td className="w-[70px] border-r-2 border-black p-0 bg-white"><ImageBox url={logoUrl} label="" /></td>
                            <td className="border-r-2 border-black p-1 align-middle bg-white relative">
                                <div className="absolute inset-[2px] border-[3px] border-[#e47636] pointer-events-none"></div>
                                <div className="w-full h-full flex items-center px-4 relative z-10">
                                    <span className="text-black font-bold text-[18px] uppercase">{bannerText}</span>
                                </div>
                            </td>
                            <td className="w-[120px] bg-[#ffff00] p-0 h-[55px]">
                                <div className="flex flex-col h-full w-full">
                                    <div className="flex-1 flex items-center justify-center border-b-2 border-black">
                                        <span className="text-black font-black tracking-widest text-[16px] whitespace-nowrap">B K - A R</span>
                                    </div>
                                    <div className="flex-1 flex items-center justify-center">
                                        <span className="text-black font-black tracking-widest text-[14px]">6 6 - 4 0 +</span>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    const splitIndex = Math.ceil(chunks.length / 2);
    const leftChunks = chunks.slice(0, splitIndex);
    const rightChunks = chunks.slice(splitIndex);

    const renderChunkTable = (chunkArray, offset = 0) => {
        return chunkArray.map((chunk, cIdx) => {
            const globalIdx = cIdx + offset;
            const promiseColors = ['#00b050', '#ed7d31', '#ff0000', '#00b0f0', '#002060', '#ffff00', '#c000c0', '#c45911'];
            const currentBorderColor = promiseColors[globalIdx % promiseColors.length];

            const m1Total = chunk.days.reduce((acc, curr) => acc + parseTime(curr.m1t), 0);
            const m2Total = chunk.days.reduce((acc, curr) => acc + parseTime(curr.m2t), 0);
            const mornArtTotal = chunk.days.reduce((acc, curr) => acc + parseTime(curr.m3t_morning), 0);
            const eveArtTotal = chunk.days.reduce((acc, curr) => acc + parseTime(curr.m3t_evening), 0);

            const greenColor = "#2ed573";
            const blueColor = "#0033CC";
            
            return (
                <div key={chunk.id} className="mb-0">
                    <table className="w-full bg-white pdf-table table-fixed border-collapse" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
                        <colgroup>
                            <col style={{ width: '8%' }} /> {/* DAY */}
                            <col style={{ width: '17%' }} /> {/* PRO */}
                            <col style={{ width: '17%' }} /> {/* PSA */}
                            <col style={{ width: '36%' }} /> {/* GEN */}
                            <col style={{ width: '16%' }} /> {/* ART */}
                            <col style={{ width: '6%' }} /> {/* YES */}
                        </colgroup>
                        <tbody className="text-black font-bold text-xs rllt-condensed">
                            {/* GOD'S PROMISES HEADER */}
                            <tr className="bg-white h-[32px]">
                                <td colSpan={6} className="border-2 border-black px-1 align-middle overflow-hidden">
                                    <div className="flex items-center w-full h-full gap-2">
                                        <span className="font-extrabold text-black text-[12px] whitespace-nowrap">GOD'S PROMISES :</span>
                                        <div className="flex-1 text-center px-2">
                                            <span className="font-bold text-black text-[11px] uppercase tracking-tighter truncate">{chunk.promises}</span>
                                        </div>
                                        {/* COLORFUL BOX ON THE RIGHT */}
                                        <div className="w-[180px] h-[24px] border-[3px] bg-white flex-shrink-0" style={{ borderColor: currentBorderColor }}>
                                            <input 
                                                type="text" 
                                                className="w-full h-full border-none focus:outline-none p-1 font-bold text-center bg-transparent" 
                                                placeholder=""
                                            />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            
                            {/* COLUMN HEADERS */}
                            <tr className="bg-white text-center font-bold h-[20px]">
                                <th className="border-2 border-black p-0" style={{ fontSize: getFS(10) }}>DAY</th>
                                <th colSpan={3} className="border-2 border-black p-0 bg-white"></th>
                                <th className="border-2 border-black p-0" style={{ fontSize: getFS(10) }}>ART</th>
                                <th className="border-2 border-black p-0" style={{ fontSize: getFS(10) }}>YES</th>
                            </tr>

                            {/* DAILY ROWS */}
                            {chunk.days.map(d => (
                                <tr key={d.id} className="bg-white text-center border-b-2 border-black h-[22px]">
                                    <td className="border-2 border-black p-0 font-extrabold bg-white leading-none text-black" style={{ fontSize: getFS(11) }}>{d.day}</td>
                                    
                                    {/* M1 TEXT (Green) */}
                                    <td className="border-2 border-black p-0 px-1 bg-white text-left font-bold leading-tight" style={{ color: greenColor, fontSize: getFS(10) }}>
                                        {d.m1b}
                                    </td>
                                    
                                    {/* M2 TEXT (Green) */}
                                    <td className="border-2 border-black p-0 px-1 bg-white text-left font-bold leading-tight" style={{ color: greenColor, fontSize: getFS(10) }}>
                                        {d.m2b}
                                    </td>
                                    
                                    {/* M3 TEXT (Split Green / Blue) */}
                                    <td className="border-2 border-black p-0 bg-white" style={{ fontSize: getFS(10) }}>
                                        <div className="flex w-full h-full text-left leading-tight">
                                            <div className="w-1/2 px-1 font-bold border-r border-gray-200 h-full flex items-center" style={{ color: greenColor }}>
                                                {d.m3b_morning}
                                            </div>
                                            <div className="w-1/2 px-1 font-bold h-full flex items-center" style={{ color: blueColor }}>
                                                {d.m3b_evening}
                                            </div>
                                        </div>
                                    </td>
                                    
                                    {/* ART TIME (Split Green / Blue) */}
                                    <td className="border-2 border-black p-0 bg-white font-bold text-center" style={{ fontSize: getFS(9) }}>
                                        <div className="flex w-full h-full items-center">
                                            <div className="w-1/2" style={{ color: greenColor }}>
                                                {d.m3t_morning}
                                            </div>
                                            <div className="w-1/2" style={{ color: blueColor }}>
                                                {d.m3t_evening}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="border-2 border-black p-0 text-center" style={{ fontSize: getFS(10) }}>
                                        {d.yes ? '✔️' : ''}
                                    </td>
                                </tr>
                            ))}

                            {/* CHUNK TOTALS */}
                            <tr className="bg-white text-center font-extrabold h-[22px]">
                                <td colSpan={2} className="border-2 border-black bg-white" style={{ fontSize: getFS(10) }}>{formatSum(m1Total, 'HrMins')}</td>
                                <td className="border-2 border-black bg-white text-center" style={{ fontSize: getFS(10) }}>{formatSum(m2Total, 'HrMins')}</td>
                                
                                <td className="border-2 border-black bg-white p-0">
                                   <div className="w-full text-center tracking-widest uppercase font-bold text-gray-500" style={{ fontSize: getFS(10) }}>
                                        TOTAL
                                   </div>
                                </td>
                                
                                <td className="border-2 border-black bg-white p-0">
                                    <div className="flex w-full h-full items-center">
                                        <div className="w-1/2 font-bold" style={{ color: greenColor, fontSize: getFS(9) }}>
                                            {formatHrMinDetailed(mornArtTotal)}
                                        </div>
                                        <div className="w-1/2 font-bold" style={{ color: blueColor, fontSize: getFS(9) }}>
                                            {formatHrMinDetailed(eveArtTotal)}
                                        </div>
                                    </div>
                                </td>
                                <td className="border-2 border-black bg-white"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            );
        });
    };

    return (
        <div className="p-8 w-full max-w-full overflow-x-auto bg-gray-50 min-h-screen print:bg-white print:p-0 print:m-0 print:overflow-visible">
            <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700&display=swap" rel="stylesheet" />
            <style>{`
                @media print {
                    @page { size: landscape; margin: 5mm; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    body { background-color: transparent !important; }
                }
                .rllt-condensed { font-family: 'Roboto Condensed', 'Arial Narrow', sans-serif !important; }
                .pdf-table, .pdf-table td, .pdf-table th { 
                    border: var(--cell-border, 1px solid #000) !important; 
                    border-collapse: collapse !important; 
                    box-sizing: border-box !important; 
                }
            `}</style>
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden mb-6 print:hidden">
                <div className="bg-gradient-to-r from-[#051220] to-[#0A1F35] py-3 px-6 flex flex-col xl:flex-row justify-between items-center text-white border-b-2 border-gray-100 gap-2">
                    <div className="flex-shrink-0 text-center xl:text-left mb-2 xl:mb-0">
                        <h1 className="text-2xl font-black tracking-tight mb-0.5 text-[#c8a165] whitespace-nowrap">{headerTitle}</h1>
                        <p className="text-[14px] font-medium text-gray-300 uppercase tracking-widest mb-1.5">Compact Mode (Read-Only)</p>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-1.5 px-3 rounded-lg shadow-inner">
                        <span className="text-black font-semibold text-sm whitespace-nowrap px-1">Chart:</span>
                        <Dropdown 
                            value={selectedChart} 
                            options={chartsList} 
                            optionLabel="label" 
                            placeholder="Select a chart..." 
                            className="bg-gray-100 border border-gray-300 w-64 h-[36px] flex items-center" 
                            pt={{
                                input: { className: 'text-black font-bold' },
                                label: { className: 'text-black font-bold' },
                                item: { className: 'text-black font-semibold' }
                            }}
                            onChange={(e) => setSelectedChart(e.value)} 
                        />
                    </div>

                    {/* Font Size Scaling Controls */}
                    <div className="flex gap-2 items-center bg-white/10 px-2 py-1 rounded-lg border border-white/20 shadow-inner inline-flex">
                        <span className="text-[10px] uppercase font-black text-gray-300 mr-2">Scale</span>
                        <Button 
                            icon="pi pi-minus" 
                            className="p-button-rounded p-button-text text-white h-7 w-7 min-w-[28px] p-0 hover:bg-white/20 transition-all border border-transparent hover:border-white/30" 
                            onClick={() => setTableFontSize(prev => Math.max(7, prev - 1))}
                            tooltip="Decrease Font Size"
                            tooltipOptions={{ position: 'bottom' }}
                        />
                        <span className="font-black text-base w-6 text-center text-[#c8a165] drop-shadow-sm">{tableFontSize}</span>
                        <Button 
                            icon="pi pi-plus" 
                            className="p-button-rounded p-button-text text-white h-7 w-7 min-w-[28px] p-0 hover:bg-white/20 transition-all border border-transparent hover:border-white/30" 
                            onClick={() => setTableFontSize(prev => Math.min(18, prev + 1))}
                            tooltip="Increase Font Size"
                            tooltipOptions={{ position: 'bottom' }}
                        />
                    </div>

                    {selectedChart && (
                        <div className="flex gap-2">
                            <Button icon="pi pi-file-pdf" tooltip="Export PDF" className="bg-orange-500 text-white border-none w-9 h-9 p-0 rounded-full" onClick={handleExportPdf} />
                            <Button icon="pi pi-print" tooltip="Print" className="bg-slate-500 text-white border-none w-9 h-9 p-0 rounded-full" onClick={handlePrint} />
                            <Button icon="pi pi-pencil" tooltip="Edit Chart" className="bg-blue-500 text-white border-none w-9 h-9 p-0 rounded-full" onClick={handleEdit} />
                            <Button icon="pi pi-trash" tooltip="Delete Chart" className="bg-red-500 text-white border-none w-9 h-9 p-0 rounded-full" onClick={confirmDelete} />
                        </div>
                    )}
                </div>
            </div>

            <div id="printable-chart-area" className="w-full bg-white pb-4 rounded-b-2xl pt-4 px-4 overflow-hidden">
                {/* OUTER BORDER WRAPPER */}
                <div className="w-full border-[2px] border-black p-2 flex flex-col bg-white">
                    {/* TWO COLUMN DL SIZE DATA WRAPPER */}
                    <div className="flex flex-row w-full gap-[6px]">
                        {/* LEFT COLUMN */}
                        <div className="flex-1 flex flex-col w-[49.5%] overflow-hidden">
                            {renderMainHeaderBlock()}
                            {renderChunkTable(leftChunks, 0)}
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="flex-1 flex flex-col w-[49.5%] overflow-hidden">
                            {renderMainHeaderBlock()}
                            {renderChunkTable(rightChunks, splitIndex)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DLSizeChart;
