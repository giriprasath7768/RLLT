import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';

const DividerBox = ({ letter, letterColor, num }) => {
    const hexColor = letterColor.match(/\[(.*?)\]/)[1];
    return (
        <div
            className="flex flex-col items-center justify-start min-w-0 border-[2px] bg-white shadow-sm pt-1 pb-1"
            style={{ flex: 1.0, borderColor: hexColor }}
        >
            <span className={`font-serif font-black text-xs sm:text-sm md:text-base leading-none drop-shadow-sm pb-1 ${letterColor}`}>
                {letter}
            </span>
            <span className="font-black text-[9px] pt-1 pb-1 leading-none text-black">
                {num}
            </span>
        </div>
    );
};

const Pencil = ({ label, baseNum, bodyColorClass, tipColorClass }) => {
    return (
        <div
            className="flex flex-col items-center min-w-0 bg-gray-500 border-[2px] border-black relative h-full drop-shadow-md pb-0"
            style={{ flex: 1.0 }}
        >
            <div className={`w-full h-[20%] relative flex justify-center items-end ${tipColorClass}`}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-[97%] h-full">
                    <polygon points="50,0 0,100 100,100" fill="#f4d1a6" />
                    <polygon points="50,0 25,50 75,50" fill="currentColor" />
                </svg>
            </div>

            <div className={`w-[97%] h-[60%] flex relative ${bodyColorClass} overflow-hidden border-t-2 border-black/10`}>
                <div className="w-[25%] h-full bg-black/20 border-r border-black/10"></div>
                <div className="w-[50%] h-full relative z-10">
                    <span
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 text-[9px] sm:text-[10px] font-black text-white uppercase whitespace-nowrap"
                        style={{
                            textShadow: '-0.5px 0.5px 0px #a39b8c, -1px 1px 0px #8b8374, -2px 2px 0px #635b4c, -3px 3px 0px #4a4336, -4px 4px 4px rgba(0,0,0,0.8)',
                            letterSpacing: label.length > 8 ? '0px' : '1px'
                        }}
                    >
                        {label}
                    </span>
                </div>
                <div className="w-[25%] h-full bg-black/40 border-l border-white/10"></div>
            </div>

            <div className="w-[100%] h-[8%] bg-gradient-to-r from-gray-500 via-gray-200 to-gray-600 flex flex-col justify-between py-[1px] relative shadow-lg z-10 border-t-2 border-black/20 overflow-hidden">
                <div className="w-full h-[1px] bg-black/20 shadow-sm"></div>
                <div className="w-full h-[1px] bg-white/50"></div>
                <div className="w-full h-[1px] bg-black/20 shadow-sm"></div>
                <div className="w-full h-[1px] bg-white/50"></div>
            </div>

            <div className={`w-[97%] h-[12%] flex items-center justify-center relative rounded-b-sm shadow-md z-10 overflow-hidden ${bodyColorClass} border-t border-black/50`}>
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/30"></div>
                <span className="font-extrabold text-[11px] sm:text-[13px] text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-10 relative">
                    {baseNum}
                </span>
            </div>
        </div>
    );
};

const countryCoordinates = {
    'United States of America': { top: '34%', left: '25%', radius: '7%' },
    'United States': { top: '34%', left: '25%', radius: '7%' },
    'USA': { top: '34%', left: '25%', radius: '7%' },
    'US': { top: '34%', left: '25%', radius: '7%' },
    'Canada': { top: '23%', left: '25%', radius: '7.5%' },
    'Mexico': { top: '44%', left: '24%', radius: '5.5%' },
    'Brazil': { top: '63%', left: '34%', radius: '7%' },
    'Argentina': { top: '76%', left: '32%', radius: '6%' },
    'United Kingdom': { top: '28%', left: '46.5%', radius: '5%' },
    'UK': { top: '28%', left: '46.5%', radius: '5%' },
    'France': { top: '31%', left: '48%', radius: '5%' },
    'Germany': { top: '28%', left: '50%', radius: '5%' },
    'Spain': { top: '34%', left: '46.5%', radius: '5%' },
    'Italy': { top: '34%', left: '50.5%', radius: '5%' },
    'Russia': { top: '22%', left: '66%', radius: '8%' },
    'Israel': { top: '40%', left: '55.5%', radius: '4.5%' },
    'Palestine State': { top: '40%', left: '55.5%', radius: '4.5%' },
    'Egypt': { top: '43%', left: '54%', radius: '5.5%' },
    'Saudi Arabia': { top: '44%', left: '58%', radius: '5.5%' },
    'United Arab Emirates': { top: '45%', left: '60%', radius: '4.5%' },
    'Nigeria': { top: '52%', left: '49%', radius: '5.5%' },
    'Kenya': { top: '56%', left: '55.5%', radius: '5.5%' },
    'South Africa': { top: '71%', left: '52.5%', radius: '6%' },
    'India': { top: '46%', left: '65.5%', radius: '6.5%' },
    'Sri Lanka': { top: '53%', left: '66.5%', radius: '4.5%' },
    'China': { top: '36%', left: '72%', radius: '7.5%' },
    'Singapore': { top: '55%', left: '73.5%', radius: '4.5%' },
    'Malaysia': { top: '55%', left: '73.5%', radius: '5%' },
    'Indonesia': { top: '59%', left: '76%', radius: '6.5%' },
    'Japan': { top: '36%', left: '81.5%', radius: '5.5%' },
    'Australia': { top: '72%', left: '76.5%', radius: '7.5%' },
    'New Zealand': { top: '81%', left: '84.5%', radius: '5%' }
};

const resolveCountryMatch = (text) => {
    if (!text) return null;
    const lower = text.toLowerCase();
    return Object.keys(countryCoordinates).find(c => lower.includes(c.toLowerCase()));
};

const OfflineReports = () => {
    const [savedReports, setSavedReports] = useState([]);
    const [activeReport, setActiveReport] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadNotice, setUploadNotice] = useState(null);
    const [rlltDB, setRlltDB] = useState([]);
    const [locationsList, setLocationsList] = useState([]);
    const fileInputRef = useRef(null);

    const fetchSavedOfflineReports = async () => {
        try {
            const res = await axios.get(`http://${window.location.hostname}:8000/api/students/offline-reports`, { withCredentials: true });
            const list = Array.isArray(res.data) ? res.data : [];
            setSavedReports(list);
        } catch (err) {
            console.error('Failed to load offline reports:', err);
        }
    };

    const handleRefreshReport = () => {
        setActiveReport(null);
        setSavedReports([]);
        setUploadNotice(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    useEffect(() => {
        axios.get(`http://${window.location.hostname}:8000/api/rllt_lookup`, { withCredentials: true })
            .then(res => setRlltDB(Array.isArray(res.data) ? res.data : []))
            .catch(console.error);
        axios.get(`http://${window.location.hostname}:8000/api/locations`, { withCredentials: true })
            .then(res => setLocationsList(Array.isArray(res.data) ? res.data : []))
            .catch(console.error);
    }, []);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            setUploadNotice({
                type: 'error',
                text: 'Please upload a valid PDF (.pdf) Honeycomb Report file.'
            });
            return;
        }

        setUploading(true);
        setUploadNotice(null);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post(
                `http://${window.location.hostname}:8000/api/students/offline-reports/upload`,
                formData,
                {
                    withCredentials: true,
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );
            const reportData = res.data;
            setActiveReport(reportData);
            setSavedReports([reportData]);
            if (reportData.is_duplicate) {
                setUploadNotice({
                    type: 'duplicate',
                    text: reportData.message || 'Duplicate report detected — avoided saving duplicate in the database, displaying the report below.'
                });
            } else {
                setUploadNotice({
                    type: 'saved',
                    text: reportData.message || 'Honeycomb Report PDF data extracted and saved to the database successfully.'
                });
            }
        } catch (err) {
            console.error('Upload error:', err);
            setUploadNotice({
                type: 'error',
                text: err.response?.data?.detail || 'Failed to extract data from the uploaded PDF.'
            });
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const activeCountries = React.useMemo(() => {
        if (!activeReport) return [];
        if (Array.isArray(activeReport.metrics?.active_countries) && activeReport.metrics.active_countries.length > 0) {
            return activeReport.metrics.active_countries;
        }
        const matched = new Map();
        const locKey = resolveCountryMatch(activeReport.location_display || '');
        if (locKey) {
            const coord = countryCoordinates[locKey];
            matched.set(`${coord.top}-${coord.left}`, { name: locKey, ...coord });
        } else {
            locationsList.forEach(loc => {
                const key = resolveCountryMatch(`${loc.country || ''} ${loc.city || ''}`);
                if (key) {
                    const coord = countryCoordinates[key];
                    matched.set(`${coord.top}-${coord.left}`, { name: loc.country || key, ...coord });
                }
            });
        }
        if (matched.size === 0) {
            const coord = countryCoordinates['India'];
            matched.set(`${coord.top}-${coord.left}`, { name: 'India', ...coord });
        }
        return Array.from(matched.values());
    }, [activeReport, locationsList]);

    const resolvedMetrics = React.useMemo(() => {
        if (!activeReport) return {};
        const m = activeReport.metrics || {};
        if (m.day !== undefined && m.day !== null && m.day !== '') {
            return m;
        }
        const modMatch = String(activeReport.module || '1').match(/\d+/);
        const modNum = modMatch ? parseInt(modMatch[0], 10) : 1;
        const facetMatch = String(activeReport.facet || '1').match(/\d+/);
        const facetNum = facetMatch ? parseInt(facetMatch[0], 10) : 1;
        const phaseMatch = String(activeReport.phase || '1').match(/\d+/);
        const phaseNum = phaseMatch ? parseInt(phaseMatch[0], 10) : 1;

        let row = rlltDB.find(r => r.module === modNum && r.facet === facetNum && r.phase === phaseNum);
        if (!row) row = rlltDB.find(r => r.module === modNum);
        if (!row && rlltDB.length > 0) row = rlltDB[0];
        return row || {};
    }, [activeReport, rlltDB]);

    const handleExportPDF = async () => {
        const node = document.querySelector('.print-container');
        if (!node || !activeReport) return;
        try {
            const dataUrl = await htmlToImage.toJpeg(node, {
                quality: 1.0,
                backgroundColor: '#ffffff',
                pixelRatio: 2
            });
            const pdf = new jsPDF('landscape', 'mm', 'a4');
            const jsonStr = JSON.stringify(activeReport);
            pdf.setProperties({
                title: 'Offline Honeycomb Report',
                subject: `RLLT_HONEYCOMB_DATA:${jsonStr}`,
                keywords: `RLLT_HONEYCOMB_DATA:${jsonStr}`
            });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const ratio = Math.min(pageWidth / node.offsetWidth, pageHeight / node.offsetHeight);
            const pdfWidth = node.offsetWidth * ratio;
            const pdfHeight = node.offsetHeight * ratio;
            const xOffset = (pageWidth - pdfWidth) / 2;
            const yOffset = (pageHeight - pdfHeight) / 2;
            pdf.addImage(dataUrl, 'JPEG', xOffset, yOffset, pdfWidth, pdfHeight);
            pdf.save('Offline_Honeycomb_Report.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    };

    const val = (key) => (resolvedMetrics[key] !== undefined && resolvedMetrics[key] !== null && resolvedMetrics[key] !== '') ? resolvedMetrics[key] : '-';

    return (
        <div className="bg-white min-h-screen p-3 sm:p-6 flex flex-col items-center font-sans print-wrapper">
            <style>
                {`
                    @media print {
                        @page { size: A4 landscape; margin: 0; }
                        body, html {
                            background-color: white !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        body * {
                            visibility: hidden;
                        }
                        .print-wrapper, .print-wrapper * {
                            visibility: visible;
                        }
                        .print-wrapper {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100vw !important;
                            height: 100vh !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            display: flex !important;
                            justify-content: center !important;
                            align-items: center !important;
                        }
                        .print-container {
                            width: 1250px !important;
                            max-width: none !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            zoom: 0.65;
                        }
                        .print-hide, .print-hide * {
                            display: none !important;
                        }
                    }
                `}
            </style>

            {/* Upload & Saved Offline Reports Control Panel */}
            <div className="w-full max-w-[1250px] mb-5 print-hide">
                <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-lg border border-slate-700">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-lg sm:text-xl font-black tracking-wider uppercase flex items-center gap-2.5">
                                <i className="pi pi-cloud-upload text-amber-400 text-2xl"></i>
                                OFFLINE HONEYCOMB REPORTS (PDF UPLOAD & EXTRACTION)
                            </h1>
                            <p className="text-xs text-slate-300 mt-1">
                                Upload a Honeycomb Report PDF to extract Location, Date, Time, Module, Facet, Phase, and Touch Counts into the database and render the Honeycomb Report. Duplicate uploads are not saved again in the database but are displayed immediately.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/pdf,.pdf"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="offline-honeycomb-pdf-input"
                            />
                            <label
                                htmlFor="offline-honeycomb-pdf-input"
                                className={`cursor-pointer bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-colors uppercase ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
                            >
                                <i className={`pi ${uploading ? 'pi-spin pi-spinner' : 'pi-upload'} text-base`}></i>
                                {uploading ? 'EXTRACTING PDF...' : 'UPLOAD HONEYCOMB PDF'}
                            </label>

                            <button
                                type="button"
                                onClick={handleRefreshReport}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-md uppercase"
                                title="Clear current view and upload another location PDF report"
                            >
                                <i className="pi pi-refresh"></i> REFRESH
                            </button>

                            {activeReport && (
                                <>
                                    <button
                                        onClick={() => window.print()}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-md"
                                    >
                                        <i className="pi pi-print"></i> PRINT
                                    </button>
                                    <button
                                        onClick={handleExportPDF}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-md"
                                    >
                                        <i className="pi pi-file-pdf"></i> EXPORT PDF
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Upload Status Banner */}
                    {uploadNotice && (
                        <div
                            className={`mt-4 px-4 py-3 rounded-lg border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 ${
                                uploadNotice.type === 'saved'
                                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                                    : uploadNotice.type === 'duplicate'
                                        ? 'bg-amber-950/80 border-amber-400 text-amber-200'
                                        : 'bg-red-950/80 border-red-500 text-red-200'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <i
                                    className={`pi text-lg ${
                                        uploadNotice.type === 'saved'
                                            ? 'pi-check-circle text-emerald-400'
                                            : uploadNotice.type === 'duplicate'
                                                ? 'pi-info-circle text-amber-400'
                                                : 'pi-exclamation-triangle text-red-400'
                                    }`}
                                ></i>
                                <span>{uploadNotice.text}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setUploadNotice(null)}
                                className="text-xs opacity-75 hover:opacity-100"
                            >
                                <i className="pi pi-times"></i>
                            </button>
                        </div>
                    )}

                    {/* Extracted Report Summary Table (Hidden on Refresh / when no report is active) */}
                    {activeReport && savedReports.length > 0 && (
                        <div className="mt-4 bg-slate-800/90 rounded-lg border border-slate-700 overflow-x-auto">
                            <div className="px-3 py-2 border-b border-slate-700 flex items-center justify-between">
                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                                    SAVED OFFLINE REPORTS IN DATABASE ({savedReports.length}) — CLICK ANY ROW TO VIEW
                                </span>
                            </div>
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-900/60 text-slate-400 uppercase text-[10px] font-extrabold border-b border-slate-700">
                                        <th className="py-2 px-3">File</th>
                                        <th className="py-2 px-3">Location</th>
                                        <th className="py-2 px-3">Date</th>
                                        <th className="py-2 px-3">Time</th>
                                        <th className="py-2 px-3">Module / Facet / Phase</th>
                                        <th className="py-2 px-3 text-right">7 TNT Word</th>
                                        <th className="py-2 px-3 text-right">Transformation</th>
                                        <th className="py-2 px-3 text-right">Team Trans.</th>
                                        <th className="py-2 px-3 text-right">RLLT TtomT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {savedReports.map(rep => {
                                        const isSelected = activeReport && activeReport.id === rep.id;
                                        return (
                                            <tr
                                                key={rep.id}
                                                onClick={() => setActiveReport(rep)}
                                                className={`cursor-pointer border-b border-slate-700/60 last:border-b-0 transition-colors ${
                                                    isSelected ? 'bg-indigo-900/60 text-white font-bold' : 'hover:bg-slate-700/50 text-slate-200'
                                                }`}
                                            >
                                                <td className="py-2 px-3 truncate max-w-[140px]">{rep.file_name}</td>
                                                <td className="py-2 px-3 uppercase">{rep.location_display}</td>
                                                <td className="py-2 px-3 uppercase">{rep.report_date}</td>
                                                <td className="py-2 px-3 uppercase">{rep.report_time}</td>
                                                <td className="py-2 px-3 uppercase">{rep.module} | {rep.facet} | {rep.phase}</td>
                                                <td className="py-2 px-3 text-right font-black text-orange-300">{(rep.touch_counts?.word_editor || 0).toLocaleString()}</td>
                                                <td className="py-2 px-3 text-right font-black text-blue-300">{(rep.touch_counts?.transformation || 0).toLocaleString()}</td>
                                                <td className="py-2 px-3 text-right font-black text-emerald-300">{(rep.touch_counts?.team_transformation || 0).toLocaleString()}</td>
                                                <td className="py-2 px-3 text-right font-black text-purple-300">{(rep.touch_counts?.klt_reading_plan || 0).toLocaleString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {!activeReport ? (
                <div className="w-full max-w-[1250px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                    <i className="pi pi-file-pdf text-5xl text-red-500 mb-3"></i>
                    <h2 className="text-lg font-extrabold text-gray-800 uppercase">No Offline Honeycomb Report Loaded Yet</h2>
                    <p className="text-xs text-gray-500 mt-1 max-w-md">
                        Click <strong>"UPLOAD HONEYCOMB PDF"</strong> above to upload a Honeycomb Report PDF. Its Location, Date, Time, Module, Facet, Phase, and Touch Counts will be extracted, saved to the database (avoiding duplicates), and rendered below.
                    </p>
                </div>
            ) : (
                <div className="w-full max-w-[1250px] bg-white rounded-[16px] shadow-2xl overflow-hidden border-4 border-gray-400 print-container">

                    {/* Top Title Bar */}
                    <div className="bg-[#0b172a] text-white text-center py-3 px-4 text-xs sm:text-sm md:text-lg lg:text-xl font-bold tracking-widest uppercase relative">
                        REAL LIFE LEADERSHIP TRAINING - MASTER HONEYCOMB CHART
                    </div>

                    {/* Top Info Bar */}
                    <div className="flex flex-col lg:flex-row border-b border-gray-300 h-auto lg:h-[72px] bg-white">
                        <div className="flex-[1.5] flex items-center p-3 px-4 border-b lg:border-b-0 lg:border-r border-gray-300">
                            <i className="pi pi-building text-green-600 text-2xl lg:text-3xl mr-3"></i>
                            <div className="leading-tight w-full">
                                <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">ORGANIZATION</div>
                                <div className="text-sm font-black text-gray-900 uppercase">
                                    {activeReport.organization_name || 'NAME'}
                                </div>
                            </div>
                        </div>

                        <div className="flex-[1.5] flex items-center p-3 px-4 border-b lg:border-b-0 lg:border-r border-gray-300">
                            <i className="pi pi-globe text-purple-500 text-2xl lg:text-3xl mr-3 bg-purple-100 rounded-full p-1.5 shrink-0"></i>
                            <div className="leading-tight min-w-0">
                                <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">COUNTRY & LOCATION</div>
                                <div className="font-black text-gray-800 text-xs lg:text-sm tracking-wide uppercase truncate">
                                    {activeReport.location_display || 'ALL LOCATIONS & STUDENTS'}
                                </div>
                            </div>
                        </div>

                        <div className="flex-[1.5] flex items-center p-3 px-4 border-b lg:border-b-0 lg:border-r border-gray-300">
                            <i className="pi pi-calendar text-[#6366f1] text-2xl lg:text-3xl mr-3 shrink-0"></i>
                            <div className="leading-tight min-w-0">
                                <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">DATE</div>
                                <div className="font-black text-gray-800 text-xs lg:text-sm tracking-wide uppercase truncate">
                                    {activeReport.report_date}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex items-center p-3 px-4 border-b lg:border-b-0 lg:border-r border-gray-300">
                            <i className="pi pi-clock text-gray-700 text-2xl lg:text-3xl mr-3 shrink-0"></i>
                            <div className="leading-tight min-w-0">
                                <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">TIME</div>
                                <div className="font-black text-gray-800 text-xs lg:text-sm tracking-wide uppercase truncate">
                                    {activeReport.report_time}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-row lg:flex-none lg:w-72 h-16 lg:h-full">
                            <div className="flex-1 lg:w-32 bg-[#22c55e] flex items-center justify-center text-white text-3xl lg:text-[56px] font-bold border-r border-gray-300 shadow-[inset_0_-4px_0_rgba(0,0,0,0.15)] leading-none">
                                66
                            </div>
                            <div className="flex-1 lg:w-40 bg-[#fbbf24] flex flex-col items-center justify-center py-1">
                                <div className="font-extrabold text-xs lg:text-[15px] border-b-2 border-[#b45309]/30 w-full text-center pb-0.5 lg:pb-1 text-[#78350f]">BK - AR</div>
                                <div className="font-extrabold text-base lg:text-2xl pt-0.5 lg:pt-1 text-[#78350f]">66 - 40+</div>
                            </div>
                        </div>
                    </div>

                    {/* Sub Title Bar */}
                    <div className="bg-[#0f172a] text-white flex flex-col lg:flex-row justify-between lg:pl-0 lg:pr-6 text-[11px] font-bold items-center gap-2 border-b-[6px] border-gray-300">
                        <div className="flex flex-row w-full lg:w-80 h-14 border-b lg:border-b-0 lg:border-r border-gray-300 shrink-0">
                            <div className="flex-1 lg:w-36 bg-[#22c55e] flex items-center justify-center text-white text-sm lg:text-base font-extrabold border-r border-gray-300 shadow-[inset_0_-4px_0_rgba(0,0,0,0.15)] leading-none px-2 uppercase">
                                {activeReport.module || 'MODULE 1/5'}
                            </div>
                            <div className="flex-1 lg:w-44 bg-[#fbbf24] flex flex-col items-center justify-center py-1">
                                <div className="font-extrabold text-xs lg:text-sm border-b-2 border-[#b45309]/30 w-full text-center pb-0.5 text-[#78350f] flex justify-center uppercase">
                                    {activeReport.facet || 'FACET 1/12'}
                                </div>
                                <div className="font-extrabold text-xs lg:text-sm pt-0.5 text-[#78350f] w-full text-center flex justify-center uppercase">
                                    {activeReport.phase || 'PHASE 1/12'}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 text-[10px] tracking-wider uppercase font-extrabold text-center py-2.5 px-4 lg:px-0">
                            <span className="text-white">TEAM - 7 Transformation Elective And Mandate -</span>
                            <span className="text-[#f87171]">FAMILY</span>
                            <span className="text-[#fbbf24]">FINANCE</span>
                            <span className="text-[#4ade80]">GOVERNMENT</span>
                            <span className="text-[#60a5fa]">SPIRITUALITY</span>
                            <span className="text-[#c084fc]">TALENT</span>
                            <span className="text-[#f472b6]">TRAINING</span>
                            <span className="text-blue-100">SERVICE</span>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:flex lg:flex-row border-b-[6px] border-gray-200 bg-white">
                        {[
                            { label: 'DAY/PPL', icon: 'pi pi-calendar text-[#ec4899]', value: val('day') },
                            { label: 'O.T BKS', icon: 'pi pi-clock text-[#3b82f6] border border-[#3b82f6] rounded-full p-1', value: val('ot_bks') },
                            { label: 'N.T BKS', icon: 'pi pi-book text-[#a855f7]', value: val('nt_bks') },
                            { label: 'WE5', icon: 'pi pi-calendar-plus text-[#22c55e]', value: val('we5') },
                            { label: 'PRO', icon: 'pi pi-file text-[#60a5fa]', value: val('pro') },
                            { label: 'PSA', icon: 'pi pi-megaphone text-[#ef4444]', value: val('psa') },
                            { label: 'CHP', icon: 'pi pi-list text-[#06b6d4]', value: val('chp') },
                            { label: 'VER', icon: 'pi pi-book text-[#ec4899]', value: val('ver') },
                            { label: 'ART', icon: 'pi pi-palette text-[#7e22ce]', value: val('art') },
                            { label: 'PPL', icon: 'pi pi-user text-[#f97316] rounded-full border-2 border-[#f97316] p-1', value: val('ppl') },
                        ].map((item, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center justify-between pt-3 pb-4 px-1 border-r border-b lg:border-b-0 border-gray-200 bg-white lg:last:border-r-0">
                                <div className="text-[9px] font-extrabold text-gray-700 uppercase mb-3 h-6 flex items-center justify-center text-center leading-tight whitespace-nowrap overflow-hidden text-ellipsis w-full px-1">{item.label}</div>
                                <i className={`${item.icon} text-2xl mb-3`}></i>
                                <div className="font-extrabold text-base text-gray-900">{item.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Middle Scrolls Section */}
                    <div className="flex flex-col lg:flex-row px-4 py-5 gap-4 bg-white border-b-[6px] border-gray-200">
                        {/* Books Overview */}
                        <div className="flex-1 lg:flex-[1.2] border border-gray-300 rounded-[12px] overflow-hidden flex bg-white shadow-sm relative min-h-[160px]">
                            <div className="w-24 border-r border-gray-200 flex flex-col items-center justify-center p-2 bg-white z-0 pt-8 pb-2">
                                <i className="pi pi-book text-[#1d4ed8] text-[36px] mb-1"></i>
                                <div className="text-[10px] font-bold text-center leading-tight px-1 text-gray-800">BOOKS<br />OVERVIEW</div>
                                <div className="text-[30px] font-black mt-1 text-gray-900">66</div>
                            </div>
                            <div className="flex-1 bg-white relative overflow-hidden">
                                <div className="relative w-full h-full bg-[url('/map_scroll_no_compass.png')] bg-[length:100%_100%] bg-center bg-no-repeat">
                                    {activeCountries.map((country, idx) => (
                                        <React.Fragment key={idx}>
                                            <div
                                                className="absolute inset-0 z-10 pointer-events-none bg-[url('/map_continents_layer.png')] bg-[length:100%_100%] bg-center bg-no-repeat"
                                                style={{
                                                    clipPath: `circle(${country.radius || '6.5%'} at ${country.left} ${country.top})`,
                                                    transformOrigin: `${country.left} ${country.top}`,
                                                    transform: 'scale(1.65)',
                                                    filter: 'brightness(1.12) saturate(1.25) drop-shadow(0 6px 10px rgba(0,0,0,0.7)) drop-shadow(0 0 2px #fbbf24)'
                                                }}
                                            />
                                            <div
                                                className="absolute z-20 pointer-events-none"
                                                style={{
                                                    top: country.top,
                                                    left: country.left,
                                                    transform: 'translate(-50%, -100%)'
                                                }}
                                            >
                                                <div className="flex flex-col items-center justify-center">
                                                    <i className="pi pi-map-marker text-red-600 text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)]"></i>
                                                    <span className="text-[7px] font-black bg-white/95 px-1 py-0.2 rounded shadow text-black border border-gray-300 uppercase whitespace-nowrap">
                                                        {country.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Mother Tongue */}
                        <div className="flex-1 border border-gray-300 rounded-[12px] overflow-hidden flex bg-white shadow-sm relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#c2410c] text-white text-[11px] font-black tracking-widest px-10 py-1.5 rounded-b-lg z-10 shadow-md">MOTHER TONGUE</div>

                            <div className="flex-1 bg-white relative flex items-center justify-center p-4 pt-8">
                                <div className="relative flex items-center justify-center w-full h-full">
                                    <img src="/mothertoung.png" alt="Mother Tongue Scroll" className="w-full h-full object-contain drop-shadow-sm" />
                                    <div className="absolute inset-0 flex items-center justify-center px-8">
                                        <span className="font-black text-[#4a2e15] tracking-widest text-[14px] lg:text-[16px] uppercase text-center mt-1">
                                            {activeReport.mother_tongue || 'MOTHER TONGUE'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-24 border-l border-gray-200 flex flex-col items-center justify-center p-2 bg-white z-0 pt-8 pb-2">
                                <i className="pi pi-file-word text-[#ea580c] text-[36px] mb-1"></i>
                                <div className="text-[10px] font-bold text-center leading-tight px-1 text-gray-800">7 TNT<br />WORD COUNT</div>
                                <div className="text-[24px] font-black mt-1 text-gray-900">
                                    {(activeReport.touch_counts?.word_editor || 0).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Right Stats Box */}
                        <div className="w-full lg:w-40 border border-gray-300 rounded-[12px] flex flex-row lg:flex-col bg-white shadow-sm overflow-hidden py-1">
                            <div className="flex-1 lg:flex-none h-12 lg:h-auto lg:flex-1 flex items-center justify-between px-5 border-r lg:border-r-0 lg:border-b border-gray-200">
                                <i className="pi pi-user text-[#ea580c] text-2xl"></i>
                                <span className="font-black text-[13px] text-gray-800">40+</span>
                            </div>
                            <div className="flex-1 lg:flex-none h-12 lg:h-auto lg:flex-1 flex items-center justify-between px-5 border-r lg:border-r-0 lg:border-b border-gray-200">
                                <i className="pi pi-palette text-[#7e22ce] text-2xl"></i>
                                <span className="font-black text-[13px] text-gray-800">1189</span>
                            </div>
                            <div className="flex-1 lg:flex-none h-12 lg:h-auto lg:flex-1 flex items-center justify-between px-5 border-r lg:border-r-0 lg:border-b border-gray-200">
                                <i className="pi pi-list text-[#3b82f6] text-2xl"></i>
                                <span className="font-black text-[13px] text-gray-800">31102</span>
                            </div>
                            <div className="flex-1 lg:flex-none h-12 lg:h-auto lg:flex-1 flex items-center justify-between px-5">
                                <i className="pi pi-users text-[#16a34a] text-2xl"></i>
                                <span className="font-black text-[13px] text-gray-800">70H.11M</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="flex flex-col lg:flex-row px-4 py-5 gap-4 bg-white">

                        {/* Col 1: TRANSFORMATION */}
                        <div className="w-full lg:w-[32%] flex flex-col bg-white border border-gray-300 rounded-[8px] shadow-sm">
                            <div className="bg-[#1e3a8a] text-white py-2 px-3 flex flex-col justify-center items-center gap-1.5 text-[12px] font-bold uppercase border-b border-blue-900 leading-tight rounded-t-[8px] text-center">
                                <span className="tracking-widest">TRANSFORMATION</span>
                                <div className="w-full flex gap-2 text-[10px] font-black items-center justify-start">
                                    <span className="bg-[#172554] px-2 py-0.5 rounded border border-[#1e3a8a] shadow-inner">
                                        TOUCH COUNT: {(activeReport.touch_counts?.transformation || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex px-1 gap-[2px] h-[190px] pt-[4px] pb-[4px] w-full justify-between items-stretch mt-1">
                                <Pencil label="FAMILY" baseNum="1" bodyColorClass="bg-[#00BFFF]" tipColorClass="text-[#00BFFF]" />
                                <DividerBox letter="W" letterColor="text-[#8e2b8c]" num="1" />
                                <Pencil label="FINANCE" baseNum="2" bodyColorClass="bg-[#228B22]" tipColorClass="text-[#228B22]" />
                                <DividerBox letter="I" letterColor="text-[#294291]" num="2" />
                                <Pencil label="GOVERNMENT" baseNum="3" bodyColorClass="bg-[#3340cd]" tipColorClass="text-[#3340cd]" />
                                <DividerBox letter="S" letterColor="text-[#86c5f7]" num="3" />
                                <Pencil label="SPIRITUALITY" baseNum="4" bodyColorClass="bg-[#fafa33]" tipColorClass="text-[#fafa33]" />
                                <DividerBox letter="D" letterColor="text-[#38b948]" num="4" />
                                <Pencil label="TALENTS" baseNum="5" bodyColorClass="bg-[#bb43b1]" tipColorClass="text-[#bb43b1]" />
                                <DividerBox letter="O" letterColor="text-[#e3242b]" num="5" />
                                <Pencil label="TRAINING" baseNum="6" bodyColorClass="bg-[#fe6d01]" tipColorClass="text-[#fe6d01]" />
                                <DividerBox letter="M" letterColor="text-[#ed9b26]" num="6" />
                                <Pencil label="SERVICE" baseNum="7" bodyColorClass="bg-[#fe0005]" tipColorClass="text-[#fe0005]" />
                            </div>

                            <div className="bg-[#0b172a] text-white text-[11px] font-black flex justify-between px-5 py-1 mx-2 shadow-sm">
                                {"TRANSFORMATION".split('').map((c, i) => <span key={i} className="tracking-widest">{c}</span>)}
                            </div>

                            <div className="flex-1 px-4 py-4 text-[12px] font-extrabold space-y-[8px]">
                                <div className="flex items-center"><span className="text-black w-5 text-right pr-1">1.</span> <span className="text-[#8e2b8c] text-[15px] font-serif w-4 text-center">W</span> <span className="text-black tracking-wider ml-1">ISDOM OF GOD</span></div>
                                <div className="flex items-center"><span className="text-black w-5 text-right pr-1">2.</span> <span className="text-[#294291] text-[15px] font-serif w-4 text-center">I</span> <span className="text-black tracking-wider ml-1">MAGINATION</span></div>
                                <div className="flex items-center"><span className="text-black w-5 text-right pr-1">3.</span> <span className="text-[#86c5f7] text-[15px] font-serif w-4 text-center">S</span> <span className="text-black tracking-wider ml-1">CRIPTURES TO PRAYER</span></div>
                                <div className="flex items-center"><span className="text-black w-5 text-right pr-1">4.</span> <span className="text-[#38b948] text-[15px] font-serif w-4 text-center">D</span> <span className="text-black tracking-wider ml-1">AILY GROWING IN GODLINESS</span></div>
                                <div className="flex items-center"><span className="text-black w-5 text-right pr-1">5.</span> <span className="text-[#e3242b] text-[15px] font-serif w-4 text-center">O</span> <span className="text-black tracking-wider ml-1">BEDIENCE TO GOD IN ACTION</span></div>
                                <div className="flex items-center"><span className="text-black w-5 text-right pr-1">6.</span> <span className="text-[#ed9b26] text-[15px] font-serif w-4 text-center">M</span> <span className="text-black tracking-wider ml-1">EDITATING ON GOD'S CHARACTER</span></div>
                            </div>

                            <div className="bg-[#228B22] border-[4px] border-[#ea580c] m-3 mt-auto rounded flex items-center justify-between px-4 py-2 shadow-inner">
                                <i className="pi pi-play text-2xl text-gray-900 drop-shadow"></i>
                                <span className="text-xs font-bold text-gray-900">0:00</span>
                                <span className="font-extrabold text-[14px] tracking-[0.2em] text-gray-900">PROVERBS 1</span>
                                <span className="text-xs font-bold text-gray-900">3:03</span>
                                <i className="pi pi-cog text-xl text-gray-900"></i>
                            </div>
                        </div>

                        {/* Col 2: TEAM TRANSFORMATION */}
                        <div className="w-full lg:flex-[1.25] flex flex-col bg-white border border-gray-300 rounded-[8px] shadow-sm overflow-hidden">
                            <div className="bg-[#1e3a8a] text-white py-2 px-3 flex flex-col justify-center items-center gap-1.5 text-[12px] font-bold uppercase border-b border-blue-900 leading-tight rounded-t-[8px] text-center">
                                <span className="tracking-widest">TEAM TRANSFORMATION</span>
                                <div className="w-full flex gap-2 text-[10px] font-black items-center justify-start">
                                    <span className="bg-[#172554] px-2 py-0.5 rounded border border-[#1e3a8a] shadow-inner">
                                        TOUCH COUNT: {(activeReport.touch_counts?.team_transformation || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1 relative flex items-stretch justify-center min-h-[420px]">
                                <img
                                    src="/team_transformation_scroll.png"
                                    alt="Team Transformation Scroll"
                                    className="w-full h-full lg:absolute lg:inset-0 object-fill block p-1"
                                />
                            </div>
                        </div>

                        {/* Col 3: RLLT TtomT */}
                        <div className="w-full lg:flex-[1.2] flex flex-col bg-white border border-gray-300 rounded-[8px] shadow-sm overflow-hidden">
                            <div className="bg-[#1e3a8a] text-white py-2 px-3 flex flex-col justify-center items-center gap-1.5 text-[12px] font-bold border-b border-blue-900 leading-tight rounded-t-[8px] text-center">
                                <span className="tracking-widest">RLLT TtomT</span>
                                <div className="w-full flex gap-2 text-[10px] font-black items-center justify-start">
                                    <span className="bg-[#172554] px-2 py-0.5 rounded border border-[#1e3a8a] shadow-inner">
                                        TOUCH COUNT: {(activeReport.touch_counts?.klt_reading_plan || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 relative flex items-stretch justify-center bg-black overflow-hidden rounded-b-[8px] min-h-[420px]">
                                <img
                                    src="/rllt_ttomt_player.png"
                                    alt="RLLT TtomT"
                                    className="w-full h-full lg:absolute lg:inset-0 object-fill block"
                                />
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default OfflineReports;
