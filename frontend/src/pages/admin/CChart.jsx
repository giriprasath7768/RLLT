import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { jsPDF } from 'jspdf';

const CHUNK_COLORS = ['#00a8ff', '#2ed573', '#0A1F35', '#f1c40f', '#d35400', '#9b59b6', '#ff0000'];

const formatSum = (totalMins, formatType) => {
    const rawMins = Math.round(totalMins);
    if (rawMins === 0) return '';
    if (formatType === 'HrMins') return rawMins >= 60 ? `${Math.floor(rawMins / 60)}h${rawMins % 60}m` : `${rawMins}m`;
    if (formatType === 'Hm') return `${Math.floor(rawMins / 60)}H ${rawMins % 60}m`;
    return `${rawMins} Mins`;
};

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
        if (sStr.length === 1) sStr += '0';
        return parseInt(parts[0] || 0) + (parseInt(sStr.substring(0, 2)) / 60);
    } else {
        return parseInt(t) || 0;
    }
    return 0;
};

const formatHrMinDetailed = (mins) => {
    if (!mins) return "";
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    if (h > 0 && m > 0) return `${h}h${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
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

const CChart = ({ isEmbedMode = false, onInsert = null }) => {
    const toast = useRef(null);
    const [chartsList, setChartsList] = useState([]);
    const [selectedChart, setSelectedChart] = useState(null);

    const [chunks, setChunks] = useState([]);
    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);

    // Dynamic text
    const [headerSubtitle, setHeaderSubtitle] = useState("NO CHART SELECTED");
    const [averageTime, setAverageTime] = useState(0);
    const [totalChapters, setTotalChapters] = useState(0);
    const [totalVerses, setTotalVerses] = useState(0);

    const [logoUrl, setLogoUrl] = useState(null);
    const [bannerText, setBannerText] = useState("");
    const [tLabel, setTLabel] = useState("T");
    const [phaseLabel, setPhaseLabel] = useState("1/1");
    const [rlltDB, setRlltDB] = useState([]);

    const [tableFontSize, setTableFontSize] = useState(12);
    const getFS = (base) => (base + (tableFontSize - 12)) + 'px';

    const fetchChartList = () => {
        axios.get('http://localhost:8000/api/charts/list', { withCredentials: true })
            .then(res => setChartsList(res.data))
            .catch(err => console.error("Could not fetch charts list", err));

        axios.get('http://localhost:8000/api/books', { withCredentials: true })
            .then(res => setBooksDB(res.data));

        axios.get('http://localhost:8000/api/chapters', { withCredentials: true })
            .then(res => setChaptersDB(res.data));

        axios.get('http://localhost:8000/api/rllt_lookup', { withCredentials: true })
            .then(res => setRlltDB(res.data));
    };

    useEffect(() => {
        fetchChartList();
    }, []);

    useEffect(() => {
        const preloadData = location.state?.chartData;
        if ((!preloadData && !selectedChart) || booksDB.length === 0 || chaptersDB.length === 0) {
            setChunks([]);
            setHeaderSubtitle("NO CHART SELECTED");
            setTotalChapters(0);
            setTotalVerses(0);
            setAverageTime(0);
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

            const availableFacets = rlltDB.filter(d => d.module === module) || [];
            const maxFacets = availableFacets.length > 0 ? Math.max(...availableFacets.map(d => d.facet)) : facet;

            const availablePhases = availableFacets.filter(d => d.facet === facet);
            const maxPhases = availablePhases.length > 0 ? Math.max(...availablePhases.map(d => d.phase)) : phase;

            setHeaderSubtitle(`MDL${module} FCT${facet}/${maxFacets} PHS${phase}/${maxPhases}`);
            setLogoUrl(data.logo_url ? `http://localhost:8000${data.logo_url}` : null);
            setBannerText(data.banner_text || "");
            setTLabel(data.t_label || "T");
            setPhaseLabel(`${phase}/${maxPhases}`);

            if (data.state_payload) {
                try {
                    const parsedChunks = JSON.parse(data.state_payload);
                    if (Array.isArray(parsedChunks)) {
                        setChunks(parsedChunks);
                        // Calculate global totals
                        let gChaps = 0;
                        let gVerses = 0;
                        let gArt = 0;
                        parsedChunks.forEach(chunk => {
                            chunk.days.forEach(d => {
                                gChaps += parseInt(d.chap || 0);
                                gVerses += parseInt(d.verse || 0);
                                gArt += parseTime(d.art || 0);
                            });
                        });
                        setTotalChapters(gChaps);
                        setTotalVerses(gVerses);

                        const daysCount = parsedChunks.length * 5;
                        const avgMins = daysCount > 0 ? (gArt / daysCount) : 0;
                        setAverageTime(avgMins);
                    }
                } catch (e) { console.error("Parse chunks err", e); }
            }
            toast.current?.show({ severity: 'success', summary: 'Loaded', detail: 'Chart loaded properly.', life: 2000 });
        })
            .catch(err => {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not load chart details.', life: 3000 });
                setChunks([]);
            });
    }, [selectedChart, booksDB, chaptersDB, location.state]);

    // Data parsing map
    const processDayData = useMemo(() => {
        const sortedBooks = [...booksDB].sort((a, b) => (b.short_form || '').length - (a.short_form || '').length);

        return (dayObj) => {
            const rawLines = [];
            if (dayObj.m1b) rawLines.push(...dayObj.m1b.split(','));
            if (dayObj.m2b) rawLines.push(...dayObj.m2b.split(','));
            if (dayObj.m3b) rawLines.push(...dayObj.m3b.split(','));

            return rawLines.map(line => {
                let str = line.trim();
                sortedBooks.forEach(b => {
                    if (b.short_form && b.name) {
                        const regex = new RegExp(`\\b${b.short_form}\\b`, 'gi');
                        str = str.replace(regex, b.name.toUpperCase());
                    }
                });
                return str;
            }).filter(Boolean);
        };
    }, [booksDB]);

    const handlePrint = () => {
        const printContent = document.getElementById('printable-cchart');
        if (!printContent) return;

        // Create a hidden iframe for printing to avoid layout issues in the main window
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <html>
                <head>
                    <title>Print C-Chart</title>
                    <style>
                        @page { 
                            size: portrait; 
                            margin: 3mm; 
                        }
                        body { 
                            margin: 0; 
                            padding: 0; 
                            background: white !important; 
                            font-family: Arial, sans-serif;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .print-container {
                            width: 100%;
                            height: 290mm; /* A4 height is ~297mm */
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            overflow: hidden; /* Prevent spillover to next page */
                            page-break-inside: avoid;
                        }
                        /* Core Tailwind-like utilities for the iframe */
                        .flex { display: flex; }
                        .flex-col { flex-direction: column; }
                        .flex-1 { flex: 1 1 0%; }
                        .w-full { width: 100%; }
                        .h-full { height: 100%; }
                        .items-center { align-items: center; }
                        .justify-center { justify-content: center; }
                        .text-center { text-align: center; }
                        .uppercase { text-transform: uppercase; }
                        .font-bold { font-weight: bold; }
                        .border-2 { border: 2px solid black; }
                        .border-b-2 { border-bottom: 2px solid black; }
                        .border-r-2 { border-right: 2px solid black; }
                        .border-l-2 { border-left: 2px solid black; }
                        .bg-white { background-color: white; }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        ${printContent.innerHTML}
                    </div>
                    <script>
                        window.onload = () => {
                            const images = document.getElementsByTagName('img');
                            const totalImages = images.length;
                            let loadedImages = 0;
                            
                            const doPrint = () => {
                                setTimeout(() => {
                                    window.print();
                                    setTimeout(() => {
                                        window.frameElement.remove();
                                    }, 500);
                                }, 500);
                            };
                            
                            if (totalImages === 0) {
                                doPrint();
                            } else {
                                for (let img of images) {
                                    if (img.complete) {
                                        loadedImages++;
                                    } else {
                                        img.onload = () => {
                                            loadedImages++;
                                            if (loadedImages === totalImages) doPrint();
                                        };
                                        img.onerror = () => {
                                            loadedImages++;
                                            if (loadedImages === totalImages) doPrint();
                                        };
                                    }
                                }
                                if (loadedImages === totalImages) doPrint();
                            }
                        };
                    </script>
                </body>
            </html>
        `);
        doc.close();
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'RLLT C-Chart',
                text: `Check out this RLLT C-Chart for ${headerSubtitle}`,
                url: window.location.href,
            }).catch(err => console.log('Error sharing', err));
        } else {
            toast.current?.show({ severity: 'warn', summary: 'Sharing Not Supported', detail: 'Your browser does not support the share API.', life: 3000 });
        }
    };

    const handleExportPdf = async () => {
        toast.current?.show({ severity: 'info', summary: 'Processing', detail: 'PDF generation starts...', life: 2000 });
        if (!window.html2canvas) {
            await new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
                script.onload = resolve;
                document.head.appendChild(script);
            });
        }
        const element = document.getElementById('printable-cchart');

        // Use higher scale and explicit dimensions for better clarity and alignment
        const canvas = await window.html2canvas(element, {
            scale: 3,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
            allowTaint: true,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // 10mm margins
        const margin = 10;
        const targetWidth = pdfWidth - (2 * margin);
        const targetHeight = (canvas.height * targetWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', margin, margin, targetWidth, targetHeight, undefined, 'FAST');
        pdf.save(`CChart_MDL${selectedChart?.module}_FCT${selectedChart?.facet}_PHS${selectedChart?.phase}.pdf`);
    };

    const handleInsertToEditor = async () => {
        const selectedText = window.getSelection().toString().trim();
        if (!selectedText) {
            toast.current?.show({ severity: 'warn', summary: 'No Selection', detail: 'Please highlight some text in the chart first.', life: 3000 });
            return;
        }

        if (onInsert) {
            onInsert(selectedText);
            toast.current?.show({ severity: 'success', summary: 'Inserted', detail: 'Text successfully copied to Document!', life: 2000 });
        }
    };

    const renderMainHeaderBlock = () => {
        return (
            <div className="flex flex-col w-full mb-2" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <table className="w-full bg-white table-fixed border-collapse border-2 border-black" style={{ borderSpacing: 0 }}>
                    <tbody>
                        <tr className="h-[45px]">
                            <td className="w-[45px] bg-[#00b050] border-r-2 border-black p-0 align-middle" style={{ backgroundColor: '#00b050 !important', WebkitPrintColorAdjust: 'exact' }}>
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-white font-serif text-[28px] leading-none">{tLabel}</span>
                                </div>
                            </td>
                            <td className="p-0 align-middle text-center bg-white" style={{ WebkitPrintColorAdjust: 'exact' }}>
                                <span className="text-[#ff0000] font-bold text-[18px] tracking-wide uppercase" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                    REAL LIFE LEADERSHIP TRAINING - <span className="text-[14px] font-bold">{headerSubtitle}</span>
                                </span>
                            </td>
                            <td className="w-[50px] bg-[#00b050] border-l-2 border-black p-0 h-[45px]" style={{ backgroundColor: '#00b050 !important', WebkitPrintColorAdjust: 'exact' }}>
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
                <table className="w-full bg-white table-fixed border-collapse border-b-2 border-l-2 border-r-2 border-black" style={{ borderSpacing: 0 }}>
                    <tbody>
                        <tr className="h-[55px]">
                            <td className="w-[70px] border-r-2 border-black p-0 bg-white"><ImageBox url={logoUrl} label="" /></td>
                            <td className="w-[70px] border-r-2 border-black p-0 bg-white"><ImageBox url={logoUrl} label="" /></td>
                            <td className="w-[70px] border-r-2 border-black p-0 bg-white"><ImageBox url={logoUrl} label="" /></td>
                            <td className="border-r-2 border-black p-1 align-middle bg-white relative" style={{ WebkitPrintColorAdjust: 'exact' }}>
                                <div className="absolute inset-[2px] border-[3px] border-[#e47636] pointer-events-none"></div>
                                <div className="w-full h-full flex items-center px-4 relative z-10">
                                    <span className="text-black font-bold text-[18px] uppercase">{bannerText}</span>
                                </div>
                            </td>
                            <td className="w-[120px] bg-[#ffff00] p-0 h-[55px]" style={{ backgroundColor: '#ffff00 !important', WebkitPrintColorAdjust: 'exact' }}>
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

    // Extract rendering of the data arrays directly
    const renderDataCols = (blockChunks) => {
        if (!blockChunks || blockChunks.length === 0) return null;
        const colCount = blockChunks.length;
        return (
            <div className="flex-1 flex">
                {blockChunks.map((chunk, colIndex) => {
                    return (
                        <div key={chunk.id || colIndex} className="flex-1 flex flex-col p-3 border-r-[1px] border-black last:border-r-0">
                            {chunk.days.map((d, dIndex) => {
                                const parsedLines = processDayData(d);
                                return (
                                    <div key={d.id} className={`flex ${dIndex < 4 ? 'mb-4' : ''}`}>
                                        <div className="w-[50px] flex-shrink-0 font-bold text-red-600 tracking-wider" style={{ fontSize: getFS(11) }}>
                                            DAY {d.day}
                                        </div>
                                        <div className="flex-1 flex flex-col font-black text-black leading-tight" style={{ fontSize: getFS(10) }}>
                                            {parsedLines.map((line, lIdx) => (
                                                <div key={lIdx}>{line}</div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderColors = () => {
        return (
            <div className="flex flex-col flex-1 gap-0 h-full">
                {CHUNK_COLORS.map((color, idx) => {
                    return (
                        <div
                            key={`colorbox_${idx}`}
                            className="flex-1 border-[2px] bg-white w-full"
                            style={{ borderColor: color, marginBottom: '-2px' }}
                        ></div>
                    );
                })}
            </div>
        );
    };

    const row1 = chunks.slice(0, chunks.length > 6 ? 4 : 3);
    const row2 = chunks.slice(chunks.length > 6 ? 4 : 3, chunks.length > 6 ? 8 : 6);

    return (
        <div className={`p-8 w-full max-w-full overflow-x-auto bg-gray-50 ${isEmbedMode ? 'min-h-0' : 'min-h-screen'}`}>
            <style>{`
                .pdf-font {
                    font-family: 'Arial', sans-serif !important;
                }
            `}</style>
            <Toast ref={toast} />

            <div className="bg-[#051220] shadow-2xl rounded-xl border border-white/20 overflow-hidden mb-6 print:hidden py-4 px-6 flex flex-wrap justify-between items-center gap-6">
                <div className="flex-shrink-0">
                    <h1 className="text-2xl font-black tracking-tight text-[#f1c40f] uppercase mb-0 whitespace-nowrap">C-CHART: FULL CHAPTER INDEX</h1>
                </div>

                <div className="flex items-center gap-3 bg-white/10 p-1.5 px-4 rounded-lg border border-white/20 grow max-w-md">
                    <span className="text-[#f1c40f] font-black text-xs uppercase border-r border-white/20 pr-3 whitespace-nowrap">Chart:</span>
                    <Dropdown
                        value={selectedChart}
                        options={chartsList}
                        optionLabel="label"
                        placeholder="Select a chart..."
                        className="border-none w-full h-[36px] flex items-center bg-transparent shadow-none focus:ring-0 custom-dropdown"
                        pt={{
                            input: { className: 'text-white font-bold text-sm bg-transparent' },
                            trigger: { className: 'text-white' },
                            panel: { className: 'bg-[#0a1f35] border border-white/20' },
                            item: { className: 'text-white hover:bg-white/10 font-bold' }
                        }}
                        onChange={(e) => setSelectedChart(e.value)}
                    />
                </div>

                <div className="flex items-center gap-4 bg-black/40 p-2 px-4 rounded-lg border border-white/10 min-w-[220px] shadow-inner">
                    <span className="text-[11px] font-black text-[#f1c40f] uppercase tracking-widest whitespace-nowrap">Text Scale</span>
                    <input
                        type="range"
                        min="8"
                        max="16"
                        step="0.5"
                        value={tableFontSize}
                        onChange={(e) => setTableFontSize(parseFloat(e.target.value))}
                        className="w-24 accent-[#f1c40f] cursor-pointer h-2 rounded-lg"
                    />
                    <span className="text-[12px] font-black text-white min-w-[35px] text-right">{tableFontSize}px</span>
                </div>

                <div className="flex gap-3">
                    {isEmbedMode ? (
                        <Button
                            icon="pi pi-file-import"
                            label="Move to Page"
                            className="p-button-warning border-2 h-11 bg-transparent text-[#f1c40f] border-[#f1c40f] hover:bg-[#f1c40f] hover:text-[#051220] transition-all shadow-lg font-bold px-4 tracking-wider"
                            onClick={handleInsertToEditor}
                        />
                    ) : (
                        <>
                            <Button
                                icon="pi pi-print"
                                className="p-button-rounded p-button-warning border-2 w-11 h-11 bg-transparent text-[#f1c40f] border-[#f1c40f] hover:bg-[#f1c40f] hover:text-[#051220] transition-all shadow-lg"
                                onClick={handlePrint}
                                tooltip="Print"
                            />
                            <Button
                                icon="pi pi-share-alt"
                                className="p-button-rounded p-button-warning border-2 w-11 h-11 bg-transparent text-[#f1c40f] border-[#f1c40f] hover:bg-[#f1c40f] hover:text-[#051220] transition-all shadow-lg"
                                onClick={handleShare}
                                tooltip="Share"
                            />
                            <Button
                                icon="pi pi-file-pdf"
                                className="p-button-rounded p-button-warning border-2 w-11 h-11 bg-transparent text-[#f1c40f] border-[#f1c40f] hover:bg-[#f1c40f] hover:text-[#051220] transition-all shadow-lg"
                                onClick={handleExportPdf}
                                tooltip="PDF"
                            />
                        </>
                    )}
                </div>
            </div>

            <div id="printable-cchart" className="w-full bg-white pb-4 rounded-b-2xl pt-4 px-4 overflow-hidden max-w-6xl mx-auto flex flex-col items-center" style={{ pageBreakInside: 'avoid' }}>
                {renderMainHeaderBlock()}

                <div className="w-full border-[2px] border-black flex flex-col bg-white" style={{ pageBreakInside: 'avoid' }}>
                    {/* Table Header Row */}
                    <div className="border-b-[2px] border-black py-1">
                        <h1 className="text-red-700 font-extrabold text-[28px] tracking-[0.05em] mb-0 mt-0 text-center uppercase">CO-CREATE</h1>
                    </div>

                    {/* Master Table Grid Area */}
                    {chunks.length > 0 ? (
                        <div className="flex w-full">

                            {/* COLUMN 1: Colored Boxes */}
                            <div className="w-[20px] flex flex-col border-r-[2px] border-black p-0.5 z-10 bg-white relative">
                                <div className="absolute inset-y-0 left-0 right-0 flex flex-col p-0.5 pointer-events-none">
                                    {renderColors()}
                                </div>
                                <div className="flex-1 invisible">
                                    {/* Placeholder to maintain height */}
                                    <div className="flex-1"></div>
                                    {row2.length > 0 && <div className="h-[35px]"></div>}
                                    {row2.length > 0 && <div className="flex-1"></div>}
                                </div>
                            </div>

                            {/* COLUMN 2: Data Content */}
                            <div className="flex-1 flex flex-col z-10 bg-white">
                                <div className="flex-1 flex flex-col py-2">
                                    {renderDataCols(row1)}
                                </div>
                                {row2.length > 0 && (
                                    <div className="h-[35px] flex-none border-y-[2px] border-black w-full bg-white z-0 -ml-[2px]" style={{ width: 'calc(100% + 4px)' }}></div>
                                )}
                                {row2.length > 0 && (
                                    <div className="flex-1 flex flex-col py-2">
                                        {renderDataCols(row2)}
                                    </div>
                                )}
                            </div>

                            {/* COLUMN 3: Right Sidebar */}
                            <div className="w-[40px] flex flex-col border-l-[2px] border-black bg-white z-10">
                                <div className="flex-1 flex flex-col divide-y-[2px] divide-black overflow-hidden">
                                    <div className="flex-[2] relative flex flex-col items-center justify-center bg-white py-1">
                                        <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                                            <span
                                                className="font-extrabold uppercase tracking-wider whitespace-nowrap text-black block"
                                                style={{
                                                    writingMode: 'vertical-rl',
                                                    transform: 'rotate(180deg)',
                                                    fontSize: '8.5px',
                                                    lineHeight: '1',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                {headerSubtitle}: AVERAGE READING TIME: {formatHrMinDetailed(averageTime).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1 relative flex flex-col items-center justify-center bg-white py-1">
                                        <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                                            <span
                                                className="font-extrabold uppercase tracking-widest whitespace-nowrap text-black block"
                                                style={{
                                                    writingMode: 'vertical-rl',
                                                    transform: 'rotate(180deg)',
                                                    fontSize: '8.5px',
                                                    lineHeight: '1',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                TOTAL CHAPTERS: {totalChapters}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {row2.length > 0 && (
                                    <div className="h-[35px] flex-none border-y-[2px] border-black bg-white z-0 -mx-[0px] -mt-[2px]"></div>
                                )}

                                {row2.length > 0 && (
                                    <div className="flex-1 flex flex-col divide-y-[2px] divide-black -mt-[2px] overflow-hidden">
                                        <div className="flex-[1] relative flex flex-col items-center justify-center bg-white py-1 border-t-[2px] border-black">
                                            <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                                                <span
                                                    className="font-extrabold uppercase tracking-widest whitespace-nowrap text-black block"
                                                    style={{
                                                        writingMode: 'vertical-rl',
                                                        transform: 'rotate(180deg)',
                                                        fontSize: '8.5px',
                                                        lineHeight: '1',
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    TOTAL VERSE: {totalVerses}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-[2] relative flex flex-col items-center justify-center bg-white py-1">
                                            <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                                                <span
                                                    className="font-extrabold uppercase tracking-normal whitespace-nowrap text-black block"
                                                    style={{
                                                        writingMode: 'vertical-rl',
                                                        transform: 'rotate(180deg)',
                                                        fontSize: '8px',
                                                        lineHeight: '1',
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    {headerSubtitle}: AVG READING TIME PER DAY: {formatHrMinDetailed(averageTime).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-400 py-20 text-xl font-bold text-center border-t-[2px] border-black">Please select a chart configuration.</div>
                    )}

                    {/* Integrated Footer Section (No Gap) */}
                    <div className="w-full flex flex-col items-center border-t-[2px] border-black mt-0" style={{ pageBreakInside: 'avoid' }}>
                        <div className="w-full text-center text-[11px] font-black tracking-tighter text-black py-2 bg-white border-b-[2px] border-black shadow-sm" style={{ fontFamily: 'Times New Roman, serif' }}>
                            It is the same with my word. I send it out, and it always produces fruit. It will accomplish all I want it to, and it will prosper everywhere I send it. Isaiah 55:11
                        </div>
                        {chunks.length > 0 && (
                            <div className="w-full text-center font-extrabold text-[12px] uppercase bg-gray-100 py-2.5 shadow-sm">
                                MODULE{selectedChart.module}: FACET{selectedChart.facet}: PHASE - {phaseLabel}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CChart;
