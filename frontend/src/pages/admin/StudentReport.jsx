import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { StudentService } from '../../services/studentService';
import { Dropdown } from 'primereact/dropdown';
import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';
import MotherTongueScroll from '../../components/admin/MotherTongueScroll';

const DividerBox = ({ letter, letterColor, num, onClick }) => {
    const hexColor = letterColor.match(/\[(.*?)\]/)[1];
    return (
        <div
            className="flex flex-col items-center justify-start min-w-0 border-[2px] bg-white shadow-sm pt-1 pb-1 cursor-pointer hover:bg-gray-100 transition-colors"
            style={{ flex: 1.0, borderColor: hexColor }}
            onClick={onClick}
        >
            <span className={`font-serif font-black text-xs sm:text-sm md:text-base leading-none drop-shadow-sm pb-1 ${letterColor}`}>
                {letter}
            </span>
            <span className={`font-black text-[9px] pt-1 pb-1 leading-none text-black`}>
                {num}
            </span>
        </div>
    );
};

const Pencil = ({ label, baseNum, bodyColorClass, tipColorClass, textColor, onClick }) => {
    return (
        <div
            className="flex flex-col items-center min-w-0 bg-gray-500 border-[2px] border-black cursor-pointer hover:-translate-y-1 transition-transform relative h-full drop-shadow-md pb-0 group"
            style={{ flex: 1.0 }}
            onClick={onClick}
        >
            {/* Wooden Tip (Top 20%) */}
            <div className={`w-full h-[20%] relative flex justify-center items-end ${tipColorClass}`}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-[97%] h-full">
                    <polygon points="50,0 0,100 100,100" fill="#f4d1a6" />
                    <polygon points="50,0 25,50 75,50" fill="currentColor" />
                </svg>
            </div>

            {/* Hexagonal Color Body (Middle 60%) */}
            <div className={`w-[97%] h-[60%] flex relative ${bodyColorClass} overflow-hidden border-t-2 border-black/10`}>
                <div className="w-[25%] h-full bg-black/20 border-r border-black/10"></div>
                <div className="w-[50%] h-full relative z-10">
                    <span
                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 text-[9px] sm:text-[10px] font-black text-white uppercase whitespace-nowrap`}
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

            {/* Metal Ferrule Base (Bottom 8%) */}
            <div className="w-[100%] h-[8%] bg-gradient-to-r from-gray-500 via-gray-200 to-gray-600 flex flex-col justify-between py-[1px] relative shadow-lg z-10 border-t-2 border-black/20 overflow-hidden">
                <div className="w-full h-[1px] bg-black/20 shadow-sm"></div>
                <div className="w-full h-[1px] bg-white/50"></div>
                <div className="w-full h-[1px] bg-black/20 shadow-sm"></div>
                <div className="w-full h-[1px] bg-white/50"></div>
            </div>

            {/* Colored Base Cap & Number (Bottom 12%) */}
            <div className={`w-[97%] h-[12%] flex items-center justify-center relative rounded-b-sm shadow-md z-10 overflow-hidden ${bodyColorClass} border-t border-black/50`}>
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/30"></div>
                <span className="font-extrabold text-[11px] sm:text-[13px] text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-10 relative">
                    {baseNum}
                </span>
            </div>
        </div>
    );
};

const StudentReport = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [organizationName, setOrganizationName] = useState(() => localStorage.getItem('rllt_organization_name') || 'NAME');
    const [motherTongue, setMotherTongue] = useState(() => localStorage.getItem('rllt_mother_tongue') || 'MOTHER TONGUE');
    
    const [selectedModule, setSelectedModule] = useState('MODULE 1');
    const [selectedFacet, setSelectedFacet] = useState('FACET 1');
    const [selectedPhase, setSelectedPhase] = useState('1PHASE');

    const [assignments, setAssignments] = useState([]);
    const [rlltDB, setRlltDB] = useState([]);
    const [chartsList, setChartsList] = useState([]);

    // Date & Time Range Filters
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [fromTime, setFromTime] = useState('');
    const [toTime, setToTime] = useState('');
    const [dateFilterOpen, setDateFilterOpen] = useState(false);
    const [timeFilterOpen, setTimeFilterOpen] = useState(false);
    const [reportTouchCounts, setReportTouchCounts] = useState(null);

    const dateFilterRef = useRef(null);
    const timeFilterRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dateFilterRef.current && !dateFilterRef.current.contains(e.target)) {
                setDateFilterOpen(false);
            }
            if (timeFilterRef.current && !timeFilterRef.current.contains(e.target)) {
                setTimeFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!selectedStudent) {
            setReportTouchCounts(null);
            return;
        }
        const params = new URLSearchParams();
        params.set('student_id', String(selectedStudent));
        if (fromDate) params.set('from_date', fromDate);
        if (toDate) params.set('to_date', toDate);
        if (fromTime) params.set('from_time', fromTime);
        if (toTime) params.set('to_time', toTime);
        params.set('tz_offset', String(new Date().getTimezoneOffset()));

        axios.get(`http://${window.location.hostname}:8000/api/students/touch-counts/report?${params.toString()}`, { withCredentials: true })
            .then(res => {
                if (res.data) {
                    setReportTouchCounts(res.data);
                }
            })
            .catch(console.error);
    }, [selectedStudent, fromDate, toDate, fromTime, toTime]);

    useEffect(() => {
        StudentService.getAvailableCharts()
            .then(data => setChartsList(Array.isArray(data) ? data : []))
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (selectedStudent) {
            axios.get(`http://${window.location.hostname}:8000/api/assignments`, { withCredentials: true })
                .then(res => {
                    const studentAssignments = res.data.filter(a => a.user_id === selectedStudent);
                    setAssignments(studentAssignments);
                })
                .catch(console.error);

            // Get latest touch counts
            StudentService.getStudents()
                .then(data => setStudents(Array.isArray(data) ? data : data.students || []))
                .catch(console.error);
        } else {
            setAssignments([]);
        }

        // Fetch RLLT lookup for metrics table
        axios.get(`http://${window.location.hostname}:8000/api/rllt_lookup`, { withCredentials: true })
            .then(res => setRlltDB(Array.isArray(res.data) ? res.data : []))
            .catch(console.error);
    }, [selectedStudent]);

    const assignedCharts = React.useMemo(() => {
        return assignments.map(a => chartsList.find(c => c.id === a.chart_id)).filter(Boolean);
    }, [assignments, chartsList]);

    const modMatch = String(selectedModule).match(/\d+/);
    const moduleNum = modMatch ? parseInt(modMatch[0], 10) : 1;

    const facetMatch = String(selectedFacet).match(/\d+/);
    const facetNum = facetMatch ? parseInt(facetMatch[0], 10) : 1;

    const phaseMatch = String(selectedPhase).match(/\d+/);
    const phaseNum = phaseMatch ? parseInt(phaseMatch[0], 10) : 1;

    const totalModules = React.useMemo(() => {
        const unique = new Set(rlltDB.map(d => Number(d.module)).filter(m => !isNaN(m) && m > 0));
        [1, 2, 3, 4, 5].forEach(m => unique.add(m));
        return unique.size > 0 ? Math.max(...Array.from(unique)) : 5;
    }, [rlltDB]);

    const totalFacetsForModule = React.useMemo(() => {
        const modRecords = rlltDB.filter(d => Number(d.module) === moduleNum);
        const facetsSet = new Set(modRecords.map(d => Number(d.facet)).filter(f => !isNaN(f) && f > 0));
        return facetsSet.size > 0 ? Math.max(...Array.from(facetsSet)) : (moduleNum === 5 ? 5 : 12);
    }, [rlltDB, moduleNum]);

    const totalPhasesForFacet = React.useMemo(() => {
        const fctRecords = rlltDB.filter(d => Number(d.module) === moduleNum && Number(d.facet) === facetNum);
        const phasesSet = new Set(fctRecords.map(d => Number(d.phase)).filter(p => !isNaN(p) && p > 0));
        return phasesSet.size > 0 ? Math.max(...Array.from(phasesSet)) : (moduleNum === 5 ? (facetNum === 1 ? 4 : 5) : 12);
    }, [rlltDB, moduleNum, facetNum]);

    const moduleOptions = React.useMemo(() => {
        if (assignedCharts.length === 0) return [{ label: 'NONE', value: '' }];
        const uniqueModules = Array.from(new Set(assignedCharts.map(c => c.module).filter(Boolean))).sort((a,b) => a-b);
        return uniqueModules.length > 0
            ? uniqueModules.map(m => ({ label: `MODULE ${m}/${totalModules}`, value: `MODULE ${m}` }))
            : [{ label: 'NONE', value: '' }];
    }, [assignedCharts, totalModules]);

    const facetOptions = React.useMemo(() => {
        if (assignedCharts.length === 0) return [{ label: 'NONE', value: '' }];
        const relevantCharts = moduleNum ? assignedCharts.filter(c => c.module === moduleNum) : assignedCharts;
        const uniqueFacets = Array.from(new Set(relevantCharts.map(c => c.facet).filter(Boolean))).sort((a,b) => a-b);
        return uniqueFacets.length > 0
            ? uniqueFacets.map(f => ({ label: `FACET ${f}/${totalFacetsForModule}`, value: `FACET ${f}` }))
            : [{ label: 'NONE', value: '' }];
    }, [assignedCharts, moduleNum, totalFacetsForModule]);

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

    const getStudentLocation = (student) => {
        if (!student) return countryCoordinates['India'];
        const searchStr = `${student.country || ''} ${student.location_name || ''} ${student.address || ''}`.toLowerCase();
        const countryMatch = Object.keys(countryCoordinates).find(c => searchStr.includes(c.toLowerCase()));
        return countryMatch ? countryCoordinates[countryMatch] : countryCoordinates['India'];
    };

    const phaseOptions = React.useMemo(() => {
        if (assignedCharts.length === 0) return [{ label: 'NONE', value: '' }];
        const relevantCharts = assignedCharts.filter(c => 
            (!moduleNum || c.module === moduleNum) && 
            (!facetNum || c.facet === facetNum)
        );
        const uniquePhases = Array.from(new Set(relevantCharts.map(c => c.phase).filter(Boolean))).sort((a,b) => a-b);
        return uniquePhases.length > 0
            ? uniquePhases.map(p => ({ label: `PHASE ${p}/${totalPhasesForFacet}`, value: `${p}PHASE` }))
            : [{ label: 'NONE', value: '' }];
    }, [assignedCharts, moduleNum, facetNum, totalPhasesForFacet]);

    useEffect(() => {
        if (moduleOptions.length > 0 && !moduleOptions.some(o => o.value === selectedModule)) {
            setSelectedModule(moduleOptions[0].value);
        }
    }, [moduleOptions, selectedModule]);

    useEffect(() => {
        if (facetOptions.length > 0 && !facetOptions.some(o => o.value === selectedFacet)) {
            setSelectedFacet(facetOptions[0].value);
        }
    }, [facetOptions, selectedFacet]);

    useEffect(() => {
        if (phaseOptions.length > 0 && !phaseOptions.some(o => o.value === selectedPhase)) {
            setSelectedPhase(phaseOptions[0].value);
        }
    }, [phaseOptions, selectedPhase]);

    const isAssigned = selectedStudent !== '' && assignments.length > 0;

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Touch count increments are handled by the player pages (TTomTPlayer, SMTPlayer),
    // NOT from this report page. This page is display-only.

    useEffect(() => {
        StudentService.getStudents()
            .then(data => setStudents(Array.isArray(data) ? data : data.students || []))
            .catch(console.error);
    }, []);

    const currentStudentData = React.useMemo(() => {
        return students.find(s => s.id === selectedStudent);
    }, [students, selectedStudent]);

    const studentTouchCounts = React.useMemo(() => {
        if (!selectedStudent) {
            return {
                transformation: 0,
                team_transformation: 0,
                klt_reading_plan: 0,
                word_editor: 0
            };
        }
        if (reportTouchCounts) {
            return {
                transformation: reportTouchCounts.transformation || 0,
                team_transformation: reportTouchCounts.team_transformation || 0,
                klt_reading_plan: reportTouchCounts.klt_reading_plan || 0,
                word_editor: reportTouchCounts.word_editor || 0
            };
        }
        return {
            transformation: currentStudentData?.touch_counts?.transformation || 0,
            team_transformation: currentStudentData?.touch_counts?.team_transformation || 0,
            klt_reading_plan: currentStudentData?.touch_counts?.klt_reading_plan || 0,
            word_editor: currentStudentData?.touch_counts?.word_editor || 0
        };
    }, [selectedStudent, reportTouchCounts, currentStudentData]);

    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const formattedDate = `${days[currentTime.getDay()]} ${currentTime.getDate().toString().padStart(2, '0')} ${months[currentTime.getMonth()]} ${currentTime.getFullYear()}`;
    const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();

    const formatShortDate = (isoDate) => {
        if (!isoDate) return '';
        const parts = isoDate.split('-');
        if (parts.length !== 3) return isoDate;
        const mIdx = parseInt(parts[1], 10) - 1;
        return `${parts[2]} ${months[mIdx] || parts[1]} ${parts[0]}`;
    };

    const format12HourTime = (hhmm) => {
        if (!hhmm) return '';
        const [hStr, mStr] = hhmm.split(':');
        let h = parseInt(hStr, 10);
        if (isNaN(h)) return hhmm;
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        return `${h}:${mStr || '00'} ${ampm}`;
    };

    const studentOptions = students.map((student) => ({
        label: (student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.username || `Student ${student.id}`).toUpperCase(),
        value: student.id,
        email: student.email || '',
        mobile: student.mobile_number || student.mobile || student.phone || student.phone_number || '',
        country: student.country || '',
        locationName: student.location_name || ''
    }));

    const studentOptionTemplate = (option) => {
        const locLabel = [option.country, option.locationName].filter(Boolean).join(' - ');
        return (
            <div className="flex flex-col">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">{option.label}</span>
                    {locLabel && (
                        <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded uppercase">
                            {locLabel}
                        </span>
                    )}
                </div>
                {(option.mobile || option.email) && (
                    <span className="text-xs text-gray-500 mt-0.5">
                        {option.mobile} {option.mobile && option.email ? '|' : ''} {option.email}
                    </span>
                )}
            </div>
        );
    };

    const handleExportPDF = async () => {
        const node = document.querySelector('.print-container');
        if (!node) return;
        try {
            const dataUrl = await htmlToImage.toJpeg(node, { 
                quality: 1.0,
                backgroundColor: '#ffffff',
                pixelRatio: 2
            });
            const pdf = new jsPDF('landscape', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const ratio = Math.min(pageWidth / node.offsetWidth, pageHeight / node.offsetHeight);
            const pdfWidth = node.offsetWidth * ratio;
            const pdfHeight = node.offsetHeight * ratio;
            const xOffset = (pageWidth - pdfWidth) / 2;
            const yOffset = (pageHeight - pdfHeight) / 2;
            pdf.addImage(dataUrl, 'JPEG', xOffset, yOffset, pdfWidth, pdfHeight);
            pdf.save('Student_Report.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert("Could not generate PDF. Please try the Print option and 'Save as PDF'.");
        }
    };

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
            {/* Actions Bar */}
            <div className="w-full max-w-[1250px] flex justify-end gap-3 mb-4 print-hide">
                <button 
                    onClick={() => window.print()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-bold text-sm flex items-center gap-2 transition-colors shadow-md"
                >
                    <i className="pi pi-print text-lg"></i> PRINT
                </button>
                <button 
                    onClick={handleExportPDF}
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded font-bold text-sm flex items-center gap-2 transition-colors shadow-md"
                >
                    <i className="pi pi-file-pdf text-lg"></i> EXPORT TO PDF
                </button>
            </div>

            <div className="w-full max-w-[1250px] bg-white rounded-[16px] shadow-2xl overflow-hidden border-4 border-gray-400 print-container">

                {/* Top Title Bar */}
                <div className="bg-[#0b172a] text-white text-center py-3 px-4 text-xs sm:text-sm md:text-xl font-bold tracking-widest uppercase relative">
                    REAL LIFE LEADERSHIP TRAINING - SUCCESS ROAD MAP - STUDENT REPORT
                </div>

                {/* Top Info Bar */}
                <div className="flex flex-col md:flex-row border-b border-gray-300 h-auto md:h-[72px] bg-white">
                    <div className="flex-[1.5] flex items-center p-3 px-4 border-b md:border-b-0 md:border-r border-gray-300">
                        <i className="pi pi-building text-green-600 text-2xl md:text-3xl mr-3"></i>
                        <div className="leading-tight w-full">
                            <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">ORGANIZATION</div>
                            <input
                                type="text"
                                value={organizationName}
                                onChange={(e) => {
                                    setOrganizationName(e.target.value);
                                    localStorage.setItem('rllt_organization_name', e.target.value);
                                }}
                                placeholder="NAME"
                                className="text-sm font-black text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0 w-full uppercase placeholder-gray-400"
                            />
                        </div>
                    </div>
                    <div className="flex-[1.5] flex items-center p-3 px-4 border-b md:border-b-0 md:border-r border-gray-300">
                        <i className="pi pi-user text-purple-500 text-2xl md:text-3xl mr-3 bg-purple-100 rounded-full p-1.5"></i>
                        <div className="font-black text-gray-800 text-sm tracking-wide w-full">
                            <Dropdown 
                                value={selectedStudent} 
                                onChange={(e) => setSelectedStudent(e.value)} 
                                options={studentOptions} 
                                optionLabel="label" 
                                placeholder="SELECT STUDENT"
                                filter 
                                filterBy="label,email,mobile"
                                itemTemplate={studentOptionTemplate}
                                className="w-full bg-transparent border-none shadow-none font-black text-gray-800 text-sm tracking-wide p-0"
                                pt={{
                                    root: { className: 'w-full shadow-none border-none bg-transparent' },
                                    input: { className: 'font-black text-gray-800 text-sm tracking-wide p-0' },
                                    trigger: { className: 'w-8' }
                                }}
                            />
                        </div>
                    </div>
                    {/* Date Range Filter Cell */}
                    <div ref={dateFilterRef} className="flex-[1.5] flex items-center p-3 px-4 border-b md:border-b-0 md:border-r border-gray-300 relative">
                        <i className="pi pi-calendar text-[#6366f1] text-2xl md:text-3xl mr-3 shrink-0"></i>
                        <div
                            onClick={() => {
                                setDateFilterOpen(prev => !prev);
                                setTimeFilterOpen(false);
                            }}
                            className="cursor-pointer w-full flex items-center justify-between gap-1 select-none"
                            title="Click to filter by From Date and To Date"
                        >
                            <div className="leading-tight min-w-0">
                                <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                                    {(fromDate && toDate && fromDate !== toDate) ? 'DATE RANGE' : (fromDate || toDate) ? 'SELECTED DATE' : 'ALL DATES (CURRENT)'}
                                </div>
                                <div className="font-black text-gray-800 text-xs md:text-sm tracking-wide truncate">
                                    {(fromDate && toDate && fromDate !== toDate)
                                        ? `${formatShortDate(fromDate)} - ${formatShortDate(toDate)}`
                                        : fromDate
                                            ? formatShortDate(fromDate)
                                            : toDate
                                                ? formatShortDate(toDate)
                                                : formattedDate}
                                </div>
                            </div>
                            <i className={`pi ${dateFilterOpen ? 'pi-chevron-up' : 'pi-chevron-down'} text-gray-500 text-xs print-hide shrink-0`}></i>
                        </div>

                        {dateFilterOpen && (
                            <div className="absolute left-0 top-full mt-1 w-72 bg-white border-2 border-gray-300 rounded-lg shadow-2xl z-50 p-3 print-hide">
                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200">
                                    <span className="text-[11px] font-extrabold text-gray-600 uppercase">Filter By Date / Range</span>
                                    {(fromDate || toDate) && (
                                        <button
                                            type="button"
                                            onClick={() => { setFromDate(''); setToDate(''); }}
                                            className="text-[11px] font-bold text-red-600 hover:text-red-800 uppercase"
                                        >
                                            All Dates
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Date / From Date</label>
                                        <input
                                            type="date"
                                            value={fromDate}
                                            max={toDate || undefined}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            className="w-full text-xs font-bold text-gray-800 border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">To Date (Optional for Range)</label>
                                        <input
                                            type="date"
                                            value={toDate}
                                            min={fromDate || undefined}
                                            onChange={(e) => setToDate(e.target.value)}
                                            className="w-full text-xs font-bold text-gray-800 border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Time Range Filter Cell */}
                    <div ref={timeFilterRef} className="flex-1 flex items-center p-3 px-4 border-b md:border-b-0 md:border-r border-gray-300 relative">
                        <i className="pi pi-clock text-gray-700 text-2xl md:text-3xl mr-3 shrink-0"></i>
                        <div
                            onClick={() => {
                                setTimeFilterOpen(prev => !prev);
                                setDateFilterOpen(false);
                            }}
                            className="cursor-pointer w-full flex items-center justify-between gap-1 select-none"
                            title="Click to filter by Time or Time Range"
                        >
                            <div className="leading-tight min-w-0">
                                <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                                    {(fromTime && toTime && fromTime !== toTime) ? 'TIME RANGE' : (fromTime || toTime) ? 'SELECTED TIME' : 'ALL TIMES (NOW)'}
                                </div>
                                <div className="font-black text-gray-800 text-xs md:text-sm tracking-wide truncate">
                                    {(fromTime && toTime && fromTime !== toTime)
                                        ? `${format12HourTime(fromTime)} - ${format12HourTime(toTime)}`
                                        : fromTime
                                            ? format12HourTime(fromTime)
                                            : toTime
                                                ? format12HourTime(toTime)
                                                : formattedTime}
                                </div>
                            </div>
                            <i className={`pi ${timeFilterOpen ? 'pi-chevron-up' : 'pi-chevron-down'} text-gray-500 text-xs print-hide shrink-0`}></i>
                        </div>

                        {timeFilterOpen && (
                            <div className="absolute right-0 md:left-0 top-full mt-1 w-64 bg-white border-2 border-gray-300 rounded-lg shadow-2xl z-50 p-3 print-hide">
                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200">
                                    <span className="text-[11px] font-extrabold text-gray-600 uppercase">Filter By Time / Range</span>
                                    {(fromTime || toTime) && (
                                        <button
                                            type="button"
                                            onClick={() => { setFromTime(''); setToTime(''); }}
                                            className="text-[11px] font-bold text-red-600 hover:text-red-800 uppercase"
                                        >
                                            All Times
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Time / From Time</label>
                                        <input
                                            type="time"
                                            value={fromTime}
                                            onChange={(e) => setFromTime(e.target.value)}
                                            className="w-full text-xs font-bold text-gray-800 border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">To Time (Optional for Range)</label>
                                        <input
                                            type="time"
                                            value={toTime}
                                            onChange={(e) => setToTime(e.target.value)}
                                            className="w-full text-xs font-bold text-gray-800 border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-row md:flex-none md:w-72 h-16 md:h-full">
                        <div className="flex-1 md:w-32 bg-[#22c55e] flex items-center justify-center text-white text-3xl md:text-[56px] font-bold border-r border-gray-300 shadow-[inset_0_-4px_0_rgba(0,0,0,0.15)] leading-none">
                            66
                        </div>
                        <div className="flex-1 md:w-40 bg-[#fbbf24] flex flex-col items-center justify-center py-1">
                            <div className="font-extrabold text-xs md:text-[15px] border-b-2 border-[#b45309]/30 w-full text-center pb-0.5 md:pb-1 text-[#78350f]">BK - AR</div>
                            <div className="font-extrabold text-base md:text-2xl pt-0.5 md:pt-1 text-[#78350f]">66 - 40+</div>
                        </div>
                    </div>
                </div>

                {/* Sub Title Bar */}
                <div className="bg-[#0f172a] text-white flex flex-col lg:flex-row justify-between lg:pl-0 lg:pr-6 text-[11px] font-bold items-center gap-2 border-b-[6px] border-gray-300">
                    <div className="flex flex-row w-full lg:w-80 h-14 border-b lg:border-b-0 lg:border-r border-gray-300 shrink-0">
                        <div className="flex-1 lg:w-36 bg-[#22c55e] flex items-center justify-center text-white text-sm lg:text-base font-extrabold border-r border-gray-300 shadow-[inset_0_-4px_0_rgba(0,0,0,0.15)] leading-none px-2">
                            <Dropdown 
                                value={selectedModule} 
                                options={moduleOptions} 
                                valueTemplate={() => selectedModule ? `MODULE ${moduleNum}/${totalModules}` : `MODULE 0/${totalModules}`}
                                onChange={(e) => setSelectedModule(e.value)} 
                                className="bg-transparent border-none shadow-none p-0 cursor-pointer hover:opacity-90 w-full flex justify-center" 
                                pt={{ root: { className: 'bg-transparent border-none shadow-none w-full flex justify-center' }, input: { className: 'text-white text-sm lg:text-base font-extrabold p-0 cursor-pointer text-center tracking-wider' }, trigger: { className: 'hidden' } }} 
                            />
                        </div>
                        <div className="flex-1 lg:w-44 bg-[#fbbf24] flex flex-col items-center justify-center py-1">
                            <div className="font-extrabold text-xs lg:text-sm border-b-2 border-[#b45309]/30 w-full text-center pb-0.5 text-[#78350f] flex justify-center">
                                <Dropdown 
                                    value={selectedFacet} 
                                    options={facetOptions} 
                                    valueTemplate={() => selectedFacet ? `FACET ${facetNum}/${totalFacetsForModule}` : `FACET 0/${totalFacetsForModule}`}
                                    onChange={(e) => setSelectedFacet(e.value)} 
                                    className="bg-transparent border-none shadow-none p-0 cursor-pointer hover:opacity-80 w-full flex justify-center" 
                                    pt={{ root: { className: 'bg-transparent border-none shadow-none w-full flex justify-center' }, input: { className: 'text-[#78350f] text-xs lg:text-sm font-extrabold p-0 cursor-pointer text-center tracking-wider' }, trigger: { className: 'hidden' } }} 
                                />
                            </div>
                            <div className="font-extrabold text-xs lg:text-sm pt-0.5 text-[#78350f] w-full text-center flex justify-center">
                                <Dropdown 
                                    value={selectedPhase} 
                                    options={phaseOptions} 
                                    valueTemplate={() => selectedPhase ? `PHASE ${phaseNum}/${totalPhasesForFacet}` : `PHASE 0/${totalPhasesForFacet}`}
                                    onChange={(e) => setSelectedPhase(e.value)} 
                                    className="bg-transparent border-none shadow-none p-0 cursor-pointer hover:opacity-80 w-full flex justify-center" 
                                    pt={{ root: { className: 'bg-transparent border-none shadow-none w-full flex justify-center' }, input: { className: 'text-[#78350f] text-xs lg:text-sm font-extrabold p-0 cursor-pointer text-center tracking-wider' }, trigger: { className: 'hidden' } }} 
                                />
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
                    {(() => {
                        const modMatch = String(selectedModule).match(/\d+/);
                        const moduleNum = modMatch ? parseInt(modMatch[0]) : 1;

                        const facetMatch = String(selectedFacet).match(/\d+/);
                        const facetNum = facetMatch ? parseInt(facetMatch[0]) : 1;

                        const phaseMatch = String(selectedPhase).match(/\d+/);
                        const phaseNum = phaseMatch ? parseInt(phaseMatch[0]) : 1;

                        // Try to find exact match, otherwise fallback to first matching module, or first item
                        let currentRow = rlltDB.find(r => r.module === moduleNum && r.facet === facetNum && r.phase === phaseNum);
                        if (!currentRow) currentRow = rlltDB.find(r => r.module === moduleNum);
                        if (!currentRow && rlltDB.length > 0) currentRow = rlltDB[0];
                        if (!currentRow) currentRow = {};

                        const val = (key) => isAssigned && currentRow[key] !== undefined && currentRow[key] !== null && currentRow[key] !== '' ? currentRow[key] : '-';

                        return [
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
                        ));
                    })()}
                </div>

                {/* Middle Scrolls Section */}
                <div className="flex flex-col lg:flex-row px-4 py-5 gap-4 bg-white border-b-[6px] border-gray-200">
                    {/* Books Overview */}
                    <div className="flex-1 lg:flex-[1.2] border border-gray-300 rounded-[12px] overflow-hidden flex bg-white shadow-sm relative min-h-[160px] cursor-pointer hover:shadow-md transition-shadow">
                        <div className="w-24 border-r border-gray-200 flex flex-col items-center justify-center p-2 bg-white z-0 pt-8 pb-2">
                            <i className="pi pi-book text-[#1d4ed8] text-[36px] mb-1"></i>
                            <div className="text-[10px] font-bold text-center leading-tight px-1 text-gray-800">BOOKS<br />OVERVIEW</div>
                            <div className="text-[30px] font-black mt-1 text-gray-900">66</div>
                        </div>
                        {/* Map Image container */}
                        <div className="flex-1 bg-white relative overflow-hidden">
                            <div className="relative w-full h-full bg-[url('/map_scroll_no_compass.png')] bg-[length:100%_100%] bg-center bg-no-repeat">
                                {/* Student Zoomed Country Map & Location Marker */}
                                {isAssigned && currentStudentData && (() => {
                                    const loc = getStudentLocation(currentStudentData);
                                    return (
                                        <>
                                            <div
                                                className="absolute inset-0 z-10 pointer-events-none bg-[url('/map_continents_layer.png')] bg-[length:100%_100%] bg-center bg-no-repeat"
                                                style={{
                                                    clipPath: `circle(${loc.radius || '6.5%'} at ${loc.left} ${loc.top})`,
                                                    transformOrigin: `${loc.left} ${loc.top}`,
                                                    transform: 'scale(1.65)',
                                                    filter: 'brightness(1.12) saturate(1.25) drop-shadow(0 6px 10px rgba(0,0,0,0.7)) drop-shadow(0 0 2px #fbbf24)'
                                                }}
                                            />
                                            <div 
                                                className="absolute z-20 pointer-events-none" 
                                                style={{ 
                                                    top: loc.top,
                                                    left: loc.left,
                                                    transform: 'translate(-50%, -100%)' 
                                                }}
                                            >
                                                <div className="flex flex-col items-center justify-center animate-bounce">
                                                    <i className="pi pi-map-marker text-red-600 text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"></i>
                                                    <span className="text-[8px] font-black bg-white/95 px-1.5 py-0.5 rounded shadow mt-0.5 text-black border border-gray-300 uppercase whitespace-nowrap">
                                                        {currentStudentData.first_name || currentStudentData.username || currentStudentData.name || 'STUDENT'}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Mother Tongue */}
                    <div className="flex-1 border border-gray-300 rounded-[12px] flex bg-white shadow-sm relative min-h-[160px] hover:shadow-md transition-shadow">
                        <MotherTongueScroll
                            value={motherTongue}
                            onChange={(val) => {
                                setMotherTongue(val);
                                localStorage.setItem('rllt_mother_tongue', val);
                            }}
                        />

                        <div className="w-24 border-l border-gray-200 flex flex-col items-center justify-center p-2 bg-white z-0 py-3 rounded-r-[11px]">
                            <i className="pi pi-file-word text-[#ea580c] text-[36px] mb-1"></i>
                            <div className="text-[10px] font-bold text-center leading-tight px-1 text-gray-800">7 TNT<br />WORD COUNT</div>
                            <div className="text-[24px] font-black mt-1 text-gray-900">
                                {studentTouchCounts.word_editor.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Right Stats Box */}
                    <div className="w-full lg:w-40 border border-gray-300 rounded-[12px] flex flex-row lg:flex-col bg-white shadow-sm overflow-hidden cursor-pointer py-1">
                        <div className="flex-1 lg:flex-none h-12 lg:h-auto lg:flex-1 flex items-center justify-between px-5 border-r lg:border-r-0 lg:border-b border-gray-200 hover:bg-orange-50 transition-colors">
                            <i className="pi pi-user text-[#ea580c] text-2xl"></i>
                            <span className="font-black text-[13px] text-gray-800">40+</span>
                        </div>
                        <div className="flex-1 lg:flex-none h-12 lg:h-auto lg:flex-1 flex items-center justify-between px-5 border-r lg:border-r-0 lg:border-b border-gray-200 hover:bg-purple-50 transition-colors">
                            <i className="pi pi-palette text-[#7e22ce] text-2xl"></i>
                            <span className="font-black text-[13px] text-gray-800">1189</span>
                        </div>
                        <div className="flex-1 lg:flex-none h-12 lg:h-auto lg:flex-1 flex items-center justify-between px-5 border-r lg:border-r-0 lg:border-b border-gray-200 hover:bg-blue-50 transition-colors">
                            <i className="pi pi-list text-[#3b82f6] text-2xl"></i>
                            <span className="font-black text-[13px] text-gray-800">31102</span>
                        </div>
                        <div className="flex-1 lg:flex-none h-12 lg:h-auto lg:flex-1 flex items-center justify-between px-5 hover:bg-green-50 transition-colors">
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
                            <div className="w-full flex text-[13px] font-black items-center justify-center">
                                <span className="bg-[#172554] px-3.5 py-1 rounded border border-[#1e3a8a] shadow-inner inline-flex items-center gap-1.5 tracking-wider" title="Total Touch Count (Pencils + Wisdom)">
                                    <span>TC</span>
                                    <span>:</span>
                                    <span>{studentTouchCounts.transformation.toLocaleString()}</span>
                                </span>
                            </div>
                        </div>

                        {/* Pencils Area */}
                        <div className="flex px-1 gap-[2px] h-[180px] pt-[4px] pb-[4px] w-full justify-between items-stretch mt-1">
                            <Pencil label="FAMILY" baseNum="1" bodyColorClass="bg-[#00BFFF]" tipColorClass="text-[#00BFFF]" textColor="text-black" />
                            <DividerBox letter="W" letterColor="text-[#8e2b8c]" num="1" />
                            <Pencil label="FINANCE" baseNum="2" bodyColorClass="bg-[#228B22]" tipColorClass="text-[#228B22]" textColor="text-white" />
                            <DividerBox letter="I" letterColor="text-[#294291]" num="2" />
                            <Pencil label="GOVERNMENT" baseNum="3" bodyColorClass="bg-[#3340cd]" tipColorClass="text-[#3340cd]" textColor="text-white" />
                            <DividerBox letter="S" letterColor="text-[#86c5f7]" num="3" />
                            <Pencil label="SPIRITUALITY" baseNum="4" bodyColorClass="bg-[#fafa33]" tipColorClass="text-[#fafa33]" textColor="text-black" />
                            <DividerBox letter="D" letterColor="text-[#38b948]" num="4" />
                            <Pencil label="TALENTS" baseNum="5" bodyColorClass="bg-[#bb43b1]" tipColorClass="text-[#bb43b1]" textColor="text-white" />
                            <DividerBox letter="O" letterColor="text-[#e3242b]" num="5" />
                            <Pencil label="TRAINING" baseNum="6" bodyColorClass="bg-[#fe6d01]" tipColorClass="text-[#fe6d01]" textColor="text-black" />
                            <DividerBox letter="M" letterColor="text-[#ed9b26]" num="6" />
                            <Pencil label="SERVICE" baseNum="7" bodyColorClass="bg-[#fe0005]" tipColorClass="text-[#fe0005]" textColor="text-white" />
                        </div>

                        {/* TRANSFORMATION BAR */}
                        <div className="bg-[#0b172a] text-white text-[11px] font-black flex justify-between px-5 py-1 mx-2 shadow-sm">
                            {"TRANSFORMATION".split('').map((c, i) => <span key={i} className="tracking-widest">{c}</span>)}
                        </div>

                        {/* List */}
                        <div className="flex-1 flex flex-col justify-between px-4 py-2.5 text-[12px] font-extrabold space-y-[5px]">
                            <div className="flex items-center group cursor-pointer"><span className="text-black w-5 text-right pr-1">1.</span> <span className="text-[#8e2b8c] text-[15px] font-serif w-4 text-center">W</span> <span className="text-black tracking-wider ml-1">ISDOM OF GOD</span></div>
                            <div className="flex items-center group cursor-pointer"><span className="text-black w-5 text-right pr-1">2.</span> <span className="text-[#294291] text-[15px] font-serif w-4 text-center">I</span> <span className="text-black tracking-wider ml-1">MAGINATION</span></div>
                            <div className="flex items-center group cursor-pointer"><span className="text-black w-5 text-right pr-1">3.</span> <span className="text-[#86c5f7] text-[15px] font-serif w-4 text-center">S</span> <span className="text-black tracking-wider ml-1">CRIPTURES TO PRAYER</span></div>
                            <div className="flex items-center group cursor-pointer"><span className="text-black w-5 text-right pr-1">4.</span> <span className="text-[#38b948] text-[15px] font-serif w-4 text-center">D</span> <span className="text-black tracking-wider ml-1">AILY GROWING IN GODLINESS</span></div>
                            <div className="flex items-center group cursor-pointer"><span className="text-black w-5 text-right pr-1">5.</span> <span className="text-[#e3242b] text-[15px] font-serif w-4 text-center">O</span> <span className="text-black tracking-wider ml-1">BEDIENCE TO GOD IN ACTION</span></div>
                            <div className="flex items-center group cursor-pointer"><span className="text-black w-5 text-right pr-1">6.</span> <span className="text-[#ed9b26] text-[15px] font-serif w-4 text-center">M</span> <span className="text-black tracking-wider ml-1">EDITATING ON GOD'S CHARACTER</span></div>
                        </div>

                        {/* Audio Player */}
                        <div className="bg-[#228B22] border-[4px] border-[#ea580c] m-2.5 mt-auto rounded flex items-center justify-between px-4 py-1.5 shadow-inner cursor-pointer hover:bg-[#1e7b1e] transition-colors">
                            <i className="pi pi-play text-2xl text-gray-900 drop-shadow"></i>
                            <span className="text-xs font-bold text-gray-900">0:00</span>
                            <span className="font-extrabold text-[14px] tracking-[0.2em] text-gray-900">PROVERBS 1</span>
                            <span className="text-xs font-bold text-gray-900">3:03</span>
                            <i className="pi pi-cog text-xl text-gray-900 hover:rotate-90 transition-transform"></i>
                        </div>
                    </div>

                    {/* Col 2: TEAM TRANSFORMATION */}
                    <div className="w-full lg:flex-1 flex flex-col bg-white border border-gray-300 rounded-[8px] shadow-sm overflow-hidden">
                        <div className="bg-[#1e3a8a] text-white py-2 px-3 flex flex-col justify-center items-center gap-1.5 text-[12px] font-bold uppercase border-b border-blue-900 leading-tight rounded-t-[8px] text-center">
                            <span className="tracking-widest">TEAM TRANSFORMATION</span>
                            <div className="w-full flex text-[13px] font-black items-center justify-center">
                                <span className="bg-[#172554] px-3.5 py-1 rounded border border-[#1e3a8a] shadow-inner inline-flex items-center gap-1.5 tracking-wider" title="Team Transformation Touch Count">
                                    <span>TC</span>
                                    <span>:</span>
                                    <span>{studentTouchCounts.team_transformation.toLocaleString()}</span>
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 relative flex items-stretch justify-center cursor-pointer min-h-[380px]">
                            <img
                                src="/team_transformation_scroll.png"
                                alt="Team Transformation Scroll"
                                className="w-full h-full lg:absolute lg:inset-0 object-fill block p-1"
                            />
                        </div>
                    </div>

                    {/* Col 3: RLLT TtomT */}
                    <div className="w-full lg:w-[28%] flex flex-col bg-white border border-gray-300 rounded-[8px] shadow-sm overflow-hidden">
                        <div className="bg-[#1e3a8a] text-white py-2 px-3 flex flex-col justify-center items-center gap-1.5 text-[12px] font-bold border-b border-blue-900 leading-tight rounded-t-[8px] text-center">
                            <span className="tracking-widest">RLLT TtomT</span>
                            <div className="w-full flex text-[13px] font-black items-center justify-center">
                                <span className="bg-[#172554] px-3.5 py-1 rounded border border-[#1e3a8a] shadow-inner inline-flex items-center gap-1.5 tracking-wider" title="Reading Plan Touch Count">
                                    <span>TC</span>
                                    <span>:</span>
                                    <span>{studentTouchCounts.klt_reading_plan.toLocaleString()}</span>
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 relative flex items-stretch justify-center bg-white overflow-hidden rounded-b-[8px] min-h-[380px]">
                            <img
                                src="/rllt_ttomt_player.png?v=3"
                                alt="RLLT TtomT"
                                className="w-full h-full lg:absolute lg:inset-0 object-fill block"
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default StudentReport;
