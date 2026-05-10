import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { StudentService } from '../../services/studentService';
import { Dropdown } from 'primereact/dropdown';

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
    
    const [selectedModule, setSelectedModule] = useState('MODULE 1');
    const [selectedFacet, setSelectedFacet] = useState('FACET 1');
    const [selectedPhase, setSelectedPhase] = useState('1PHASE');

    const [assignments, setAssignments] = useState([]);
    const [rlltDB, setRlltDB] = useState([]);
    const [chartsList, setChartsList] = useState([]);

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

    const moduleOptions = React.useMemo(() => {
        if (assignedCharts.length === 0) return [{ label: 'NONE', value: '' }];
        const uniqueModules = Array.from(new Set(assignedCharts.map(c => c.module).filter(Boolean))).sort((a,b) => a-b);
        return uniqueModules.length > 0
            ? uniqueModules.map(m => ({ label: `MODULE ${m}`, value: `MODULE ${m}` }))
            : [{ label: 'NONE', value: '' }];
    }, [assignedCharts]);

    const facetOptions = React.useMemo(() => {
        if (assignedCharts.length === 0) return [{ label: 'NONE', value: '' }];
        const modMatch = String(selectedModule).match(/\d+/);
        const moduleNum = modMatch ? parseInt(modMatch[0]) : null;
        
        const relevantCharts = moduleNum ? assignedCharts.filter(c => c.module === moduleNum) : assignedCharts;
        const uniqueFacets = Array.from(new Set(relevantCharts.map(c => c.facet).filter(Boolean))).sort((a,b) => a-b);
        return uniqueFacets.length > 0
            ? uniqueFacets.map(f => ({ label: `FACET ${f}`, value: `FACET ${f}` }))
            : [{ label: 'NONE', value: '' }];
    }, [assignedCharts, selectedModule]);

    const countryCoordinates = {
        'US': { top: '35%', left: '26%' },
        'USA': { top: '35%', left: '26%' },
        'United States': { top: '35%', left: '26%' },
        'UK': { top: '25%', left: '46%' },
        'United Kingdom': { top: '25%', left: '46%' },
        'India': { top: '48%', left: '59%' },
        'Australia': { top: '75%', left: '72%' },
        'Canada': { top: '22%', left: '26%' },
        'Brazil': { top: '65%', left: '34%' },
        'South Africa': { top: '75%', left: '52%' },
        'Germany': { top: '26%', left: '49%' },
        'France': { top: '28%', left: '47%' },
        'China': { top: '35%', left: '68%' },
        'Japan': { top: '35%', left: '76%' },
        'Russia': { top: '20%', left: '62%' },
        'Israel': { top: '40%', left: '52%' }
    };

    const getStudentLocation = (student) => {
        if (!student) return { top: '45%', left: '50%' }; // Default center
        const searchStr = `${student.country || ''} ${student.location_name || ''} ${student.address || ''}`.toLowerCase();
        const countryMatch = Object.keys(countryCoordinates).find(c => searchStr.includes(c.toLowerCase()));
        return countryMatch ? countryCoordinates[countryMatch] : { top: '45%', left: '50%' };
    };

    const phaseOptions = React.useMemo(() => {
        if (assignedCharts.length === 0) return [{ label: 'NONE', value: '' }];
        const modMatch = String(selectedModule).match(/\d+/);
        const moduleNum = modMatch ? parseInt(modMatch[0]) : null;
        const facetMatch = String(selectedFacet).match(/\d+/);
        const facetNum = facetMatch ? parseInt(facetMatch[0]) : null;

        const relevantCharts = assignedCharts.filter(c => 
            (!moduleNum || c.module === moduleNum) && 
            (!facetNum || c.facet === facetNum)
        );
        const uniquePhases = Array.from(new Set(relevantCharts.map(c => c.phase).filter(Boolean))).sort((a,b) => a-b);
        return uniquePhases.length > 0
            ? uniquePhases.map(p => ({ label: `${p}PHASE`, value: `${p}PHASE` }))
            : [{ label: 'NONE', value: '' }];
    }, [assignedCharts, selectedModule, selectedFacet]);

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

    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const formattedDate = `${days[currentTime.getDay()]} ${currentTime.getDate().toString().padStart(2, '0')} ${months[currentTime.getMonth()]} ${currentTime.getFullYear()}`;
    const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();

    const studentOptions = students.map((student) => ({
        label: (student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.username || `Student ${student.id}`).toUpperCase(),
        value: student.id,
        email: student.email || '',
        mobile: student.mobile_number || student.mobile || student.phone || student.phone_number || ''
    }));

    const studentOptionTemplate = (option) => {
        return (
            <div className="flex flex-col">
                <span className="font-bold">{option.label}</span>
                {(option.mobile || option.email) && (
                    <span className="text-xs text-gray-500 mt-0.5">
                        {option.mobile} {option.mobile && option.email ? '|' : ''} {option.email}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white min-h-screen p-6 flex justify-center items-start font-sans">
            <div className="w-full max-w-[1250px] bg-white rounded-[16px] shadow-2xl overflow-hidden border-4 border-gray-400">

                {/* Top Title Bar */}
                <div className="bg-[#0b172a] text-white text-center py-3 text-xl font-bold tracking-widest uppercase">
                    REAL LIFE LEADERSHIP TRAINING - SUCCESS ROAD MAP - HONEYCOMB CHART
                </div>

                {/* Top Info Bar */}
                <div className="flex border-b border-gray-300 h-[72px] bg-white">
                    <div className="flex-[1.5] flex items-center p-3 px-4 border-r border-gray-300">
                        <i className="pi pi-building text-green-600 text-3xl mr-3"></i>
                        <div className="leading-tight">
                            <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">ORGANIZATION</div>
                            <div className="text-sm font-black text-gray-900">NAME</div>
                        </div>
                    </div>
                    <div className="flex-[1.5] flex items-center p-3 px-4 border-r border-gray-300">
                        <i className="pi pi-user text-purple-500 text-3xl mr-3 bg-purple-100 rounded-full p-1.5"></i>
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
                    <div className="flex-[1.5] flex items-center p-3 px-4 border-r border-gray-300">
                        <i className="pi pi-calendar text-[#6366f1] text-3xl mr-3"></i>
                        <div className="font-black text-gray-800 text-sm tracking-wide">{formattedDate}</div>
                    </div>
                    <div className="flex-1 flex items-center p-3 px-4 border-r border-gray-300">
                        <i className="pi pi-clock text-gray-700 text-3xl mr-3"></i>
                        <div className="font-black text-gray-800 text-sm tracking-wide">{formattedTime}</div>
                    </div>
                    <div className="w-32 bg-[#22c55e] flex items-center justify-center text-white text-[56px] font-bold border-r border-gray-300 shadow-[inset_0_-4px_0_rgba(0,0,0,0.15)] leading-none">
                        66
                    </div>
                    <div className="w-40 bg-[#fbbf24] flex flex-col items-center justify-center">
                        <div className="font-extrabold text-[15px] border-b-2 border-[#b45309]/30 w-full text-center pb-1 text-[#78350f]">BK - AR</div>
                        <div className="font-extrabold text-2xl pt-1 text-[#78350f]">66 - 40+</div>
                    </div>
                </div>

                {/* Sub Title Bar */}
                <div className="bg-[#0f172a] text-white flex justify-between px-6 py-2 text-[11px] font-bold items-center border-b-[6px] border-gray-300">
                    <div className="flex gap-2 items-center tracking-widest uppercase">
                        <Dropdown 
                            value={selectedModule} 
                            options={moduleOptions} 
                            onChange={(e) => setSelectedModule(e.value)} 
                            className="bg-transparent border-none shadow-none p-0 cursor-pointer hover:opacity-80" 
                            pt={{ root: { className: 'bg-transparent border-none shadow-none' }, input: { className: 'text-white text-[11px] font-bold p-0 cursor-pointer' }, trigger: { className: 'hidden' } }} 
                        />
                        <span className="text-white">-</span>
                        <Dropdown 
                            value={selectedFacet} 
                            options={facetOptions} 
                            onChange={(e) => setSelectedFacet(e.value)} 
                            className="bg-transparent border-none shadow-none p-0 cursor-pointer hover:opacity-80" 
                            pt={{ root: { className: 'bg-transparent border-none shadow-none' }, input: { className: 'text-white text-[11px] font-bold p-0 cursor-pointer' }, trigger: { className: 'hidden' } }} 
                        />
                        <span className="text-white">:</span>
                        <Dropdown 
                            value={selectedPhase} 
                            options={phaseOptions} 
                            onChange={(e) => setSelectedPhase(e.value)} 
                            className="bg-transparent border-none shadow-none p-0 cursor-pointer hover:opacity-80" 
                            pt={{ root: { className: 'bg-transparent border-none shadow-none' }, input: { className: 'text-white text-[11px] font-bold p-0 cursor-pointer' }, trigger: { className: 'hidden' } }} 
                        />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] tracking-wider uppercase font-extrabold">
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
                <div className="flex border-b-[6px] border-gray-200 bg-white">
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
                            { label: 'FCT', icon: 'pi pi-users text-[#a855f7] bg-[#f3e8ff] rounded-full p-2', value: val('facet') },
                            { label: 'DAY/PPL', icon: 'pi pi-calendar text-[#ec4899]', value: val('day') },
                            { label: 'O.T BKS', icon: 'pi pi-clock text-[#3b82f6] border border-[#3b82f6] rounded-full p-1', value: val('ot_bks') },
                            { label: 'N.T BKS', icon: 'pi pi-book text-[#a855f7]', value: val('nt_bks') },
                            { label: 'PHS', icon: 'pi pi-users text-[#a855f7] bg-[#f3e8ff] rounded-full p-2', value: val('phase') },
                            { label: 'WE5', icon: 'pi pi-calendar-plus text-[#22c55e]', value: val('we5') },
                            { label: 'PRO', icon: 'pi pi-file text-[#60a5fa]', value: val('pro') },
                            { label: 'PSA', icon: 'pi pi-megaphone text-[#ef4444]', value: val('psa') },
                            { label: 'CHP', icon: 'pi pi-list text-[#06b6d4]', value: val('chp') },
                            { label: 'VER', icon: 'pi pi-book text-[#ec4899]', value: val('ver') },
                            { label: 'ART', icon: 'pi pi-palette text-[#7e22ce]', value: val('art') },
                            { label: 'PPL', icon: 'pi pi-user text-[#f97316] rounded-full border-2 border-[#f97316] p-1', value: val('ppl') },
                        ].map((item, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center justify-between pt-3 pb-4 px-1 border-r border-gray-200 last:border-0 bg-white">
                                <div className="text-[9px] font-extrabold text-gray-700 uppercase mb-3 h-6 flex items-center justify-center text-center leading-tight whitespace-nowrap overflow-hidden text-ellipsis w-full px-1">{item.label}</div>
                                <i className={`${item.icon} text-2xl mb-3`}></i>
                                <div className="font-extrabold text-base text-gray-900">{item.value}</div>
                            </div>
                        ));
                    })()}
                </div>

                {/* Middle Scrolls Section */}
                <div className="flex px-4 py-5 gap-4 bg-white border-b-[6px] border-gray-200">
                    {/* Books Overview */}
                    <div className="flex-1 border border-gray-300 rounded-[12px] overflow-hidden flex bg-white shadow-sm relative min-h-[160px] cursor-pointer hover:shadow-md transition-shadow">
                        <div className="w-24 border-r border-gray-200 flex flex-col items-center justify-center p-2 bg-white z-0 pt-8 pb-2">
                            <i className="pi pi-book text-[#1d4ed8] text-[36px] mb-1"></i>
                            <div className="text-[10px] font-bold text-center leading-tight px-1 text-gray-800">BOOKS<br />OVERVIEW</div>
                            <div className="text-[30px] font-black mt-1 text-gray-900">66</div>
                        </div>
                        {/* Map Image container */}
                        <div className="flex-1 bg-white relative pl-2 overflow-hidden">
                            <div className="absolute inset-y-0 right-0 w-[calc(100%-0.5rem)] flex items-center justify-center">
                                {/* Map Image - using the exact image provided by the user */}
                                <img src="/map_scroll.png" alt="Map Scroll" className="w-full h-full object-cover" />
                                {/* Student Location Marker */}
                                {isAssigned && currentStudentData && (
                                    <div 
                                        className="absolute z-20 pointer-events-none" 
                                        style={{ 
                                            ...getStudentLocation(currentStudentData),
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
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Authors Biography */}
                    <div className="flex-[1.2] border border-gray-300 rounded-[12px] overflow-hidden flex bg-white shadow-sm relative cursor-pointer hover:shadow-md transition-shadow">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#c2410c] text-white text-[11px] font-black tracking-widest px-10 py-1.5 rounded-b-lg z-10 shadow-md">AUTHERS BIOGRAPHY</div>
                        <div className="w-32 border-r border-gray-200 flex flex-col items-center justify-center p-2 bg-white z-0 pt-10">
                            <i className="pi pi-user text-[#ea580c] text-[44px] mb-2"></i>
                            <div className="text-[11px] font-bold text-center leading-tight px-2 text-gray-800">AUTHERS<br />BIOGRAPHY</div>
                            <div className="text-[34px] font-black mt-1 text-gray-900">40+</div>
                        </div>
                        <div className="flex-1 bg-white relative flex items-center justify-center p-2">
                            <div className="w-[95%] h-full flex items-center justify-center relative bg-contain bg-center bg-no-repeat" style={{ backgroundImage: "url('/mothertoung.png')" }}>
                                <div className="font-black text-[#4a2e15] tracking-[0.2em] text-lg uppercase mt-2">MOTHER TONGUE</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Stats Box */}
                    <div className="w-40 border border-gray-300 rounded-[12px] flex flex-col bg-white shadow-sm overflow-hidden cursor-pointer">
                        <div className="flex-1 flex items-center justify-between px-5 border-b border-gray-200 hover:bg-purple-50 transition-colors">
                            <i className="pi pi-palette text-[#7e22ce] text-3xl"></i>
                            <span className="font-black text-[15px] text-gray-800">1189</span>
                        </div>
                        <div className="flex-1 flex items-center justify-between px-5 border-b border-gray-200 hover:bg-blue-50 transition-colors">
                            <i className="pi pi-list text-[#3b82f6] text-3xl"></i>
                            <span className="font-black text-[15px] text-gray-800">31102</span>
                        </div>
                        <div className="flex-1 flex items-center justify-between px-5 hover:bg-green-50 transition-colors">
                            <i className="pi pi-users text-[#16a34a] text-3xl"></i>
                            <span className="font-black text-[15px] text-gray-800">70H.11M</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="flex px-4 py-5 gap-4 bg-white">

                    {/* Col 1: TRANSFORMATION */}
                    <div className="w-[32%] flex flex-col bg-white border border-gray-300 rounded-[8px] shadow-sm">
                        <div className="bg-[#16a34a] text-white py-2 px-3 flex justify-between items-center text-[12px] font-bold uppercase border-b-[4px] border-[#14532d] rounded-t-[8px]">
                            <span className="tracking-widest">TRANSFORMATION</span>
                            <div className="flex gap-2 text-[10px] font-black items-center">
                                <span className="bg-[#14532d] px-2 py-0.5 rounded border border-[#16a34a] shadow-inner" title="Total Touch Count (Pencils + Wisdom)">
                                    TOUCH COUNT: {currentStudentData?.touch_counts ? currentStudentData.touch_counts.transformation?.toLocaleString() || 0 : 0}
                                </span>
                            </div>
                        </div>

                        {/* Pencils Area */}
                        <div className="flex px-1 gap-[2px] h-[190px] pt-[4px] pb-[4px] w-full justify-between items-stretch mt-1">
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
                        <div className="flex-1 px-4 py-4 text-[12px] font-extrabold space-y-[8px]">
                            <div className="flex items-center group cursor-pointer"><span className="text-[#3b82f6] w-5 text-right pr-1">1.</span> <span className="text-[#3b82f6] text-[15px] font-serif w-4 text-center">W</span> <span className="text-[#1e293b] tracking-wider ml-1">ISDOM OF GOD</span></div>
                            <div className="flex items-center group cursor-pointer"><span className="text-[#3b82f6] w-5 text-right pr-1">2.</span> <span className="text-[#3b82f6] text-[15px] font-serif w-4 text-center">I</span> <span className="text-[#1e293b] tracking-wider ml-1">MAGINATION</span></div>
                            <div className="flex items-center group cursor-pointer"><span className="text-[#3b82f6] w-5 text-right pr-1">3.</span> <span className="text-[#3b82f6] text-[15px] font-serif w-4 text-center">S</span> <span className="text-[#1e293b] tracking-wider ml-1">CRIPTURES TO PRAYER</span></div>
                            <div className="flex items-center group cursor-pointer"><span className="text-[#22c55e] w-5 text-right pr-1">4.</span> <span className="text-[#22c55e] text-[15px] font-serif w-4 text-center">D</span> <span className="text-[#22c55e] tracking-wider ml-1">AILY GROWING IN GODLINESS</span></div>
                            <div className="flex items-center border-2 border-red-500 bg-red-50 -mx-1 px-1 py-0.5 group cursor-pointer"><span className="text-red-600 w-4 text-right pr-1">5.</span> <span className="text-red-600 text-[15px] font-serif w-4 text-center">O</span> <span className="text-red-600 tracking-wider ml-1">BEDIENCE TO GOD IN ACTION</span></div>
                            <div className="flex items-center group cursor-pointer"><span className="text-[#3b82f6] w-5 text-right pr-1">6.</span> <span className="text-[#3b82f6] text-[15px] font-serif w-4 text-center">M</span> <span className="text-[#1e293b] tracking-wider ml-1">EDITATING ON GOD'S CHARACTER</span></div>
                        </div>

                        {/* Audio Player */}
                        <div className="bg-[#4ade80] border-[4px] border-[#ea580c] m-3 mt-auto rounded flex items-center justify-between px-4 py-2 shadow-inner cursor-pointer hover:bg-[#22c55e] transition-colors">
                            <i className="pi pi-play text-2xl text-gray-900 drop-shadow"></i>
                            <span className="text-xs font-bold text-gray-900">0:00</span>
                            <span className="font-extrabold text-[14px] tracking-[0.2em] text-gray-900">PROVERBS 1</span>
                            <span className="text-xs font-bold text-gray-900">3:03</span>
                            <i className="pi pi-cog text-xl text-gray-900 hover:rotate-90 transition-transform"></i>
                        </div>
                    </div>

                    {/* Col 2: TEAM TRANSFORMATION */}
                    <div className="flex-[1.1] flex flex-col bg-white border border-gray-300 rounded-[8px] shadow-sm">
                        <div className="bg-[#312e81] text-white py-2 px-3 flex justify-between items-center text-[12px] font-bold uppercase border-b-[4px] border-[#1e1b4b] rounded-t-[8px]">
                            <span className="tracking-widest">TEAM TRANSFORMATION</span>
                            <div className="flex gap-2 text-[10px] font-black items-center">
                                <span className="bg-[#1e1b4b] px-2 py-0.5 rounded border border-[#312e81] shadow-inner" title="Team Transformation Touch Count">
                                    TOUCH COUNT: {currentStudentData?.touch_counts ? currentStudentData.touch_counts.team_transformation?.toLocaleString() || 0 : 0}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center p-2 cursor-pointer">
                            <div className="w-[95%] h-[95%] flex items-center justify-center relative bg-contain bg-center bg-no-repeat" style={{ backgroundImage: "url('/scrolltext.png')" }}>
                            </div>
                        </div>
                    </div>

                    {/* Col 3: R.L.L.T READING PLAN */}
                    <div className="flex-[1.2] flex flex-col bg-white border border-gray-300 rounded-[8px] shadow-sm">
                        <div className="bg-[#1e3a8a] text-white py-2 px-3 flex justify-between items-center text-[12px] font-bold border-b border-blue-900 leading-tight rounded-t-[8px]">
                            <div className="flex flex-col text-left">
                                <span className="tracking-widest">R.L.L.T - READING PLAN</span>
                            </div>
                            <div className="flex gap-2 text-[10px] font-black items-center">
                                <span className="bg-[#172554] px-2 py-0.5 rounded border border-[#1e3a8a] shadow-inner" title="Reading Plan Touch Count">
                                    TOUCH COUNT: {currentStudentData?.touch_counts ? currentStudentData.touch_counts.klt_reading_plan?.toLocaleString() || 0 : 0}
                                </span>
                            </div>
                        </div>
                        <div className="bg-[#60a5fa] text-white text-center py-1.5 text-[11px] font-bold tracking-[0.15em] border-b border-blue-400">
                            DAY 01 | {formattedDate} {formattedTime}
                        </div>

                        <div className="flex p-4 border-b-2 border-gray-200 cursor-pointer">
                            <div className="flex-1 flex flex-col space-y-[8px] text-[11px] font-extrabold pl-2 pt-1 tracking-wider text-gray-800">
                                <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[#8b5cf6]"></div> PROVERBS 1</div>
                                <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[#10b981]"></div> PSALMS 24</div>
                                <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[#06b6d4]"></div> JOB 1</div>
                                <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div> ECCLESIASTES 1-5</div>
                            </div>
                            <div className="w-[150px] bg-black rounded flex flex-col items-center overflow-hidden border border-gray-300 shadow-md">
                                <div className="w-full h-20 bg-[#b45309] relative overflow-hidden flex items-center justify-center">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&q=80&w=400')] bg-cover bg-center opacity-80 mix-blend-luminosity"></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                                </div>
                                <div className="bg-[#1f2937] text-white w-full text-center text-[12px] font-bold py-1 tracking-[0.3em] z-10 border-t border-gray-600">ART</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex items-center px-5 py-2 bg-[#f8fafc] border-b-2 border-gray-200 text-[11px] font-bold text-[#1e3a8a] cursor-pointer">
                            <i className="pi pi-caret-right mr-3 text-lg"></i>
                            <span className="text-blue-600 mr-auto text-sm">50%</span>
                            <span className="tracking-[0.2em] mr-auto">PROGRESS</span>
                            <span className="mr-4 text-sm text-gray-900">25/50</span>
                            <i className="pi pi-refresh cursor-pointer text-lg text-gray-700 hover:rotate-180 transition-transform hover:text-blue-600"></i>
                        </div>

                        {/* Number Grid */}
                        <div className="grid grid-cols-5 p-4 px-8 gap-y-[4px] text-center text-[13px] font-black flex-1 bg-white items-center">
                            {[...Array(40)].map((_, i) => {
                                const n = i + 1;
                                let colorClass = "text-gray-900";
                                if (n % 5 === 1) colorClass = "text-[#6b21a8]";
                                if (n % 5 === 2) colorClass = "text-[#b45309]";
                                if (n === 24) colorClass = "text-[#ef4444]";
                                return (
                                    <div key={i} className={`${colorClass} hover:bg-gray-100 py-1.5 rounded cursor-pointer transition-colors`}>{n}</div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default StudentReport;
