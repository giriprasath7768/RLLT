import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Tooltip } from 'primereact/tooltip';
import { Toast } from 'primereact/toast';

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

const formatSum = (totalMins) => {
    const rawMins = Math.round(totalMins);
    if (rawMins === 0) return '0 Mins';
    return rawMins >= 60 ? `${Math.floor(rawMins / 60)} Hr ${rawMins % 60} Mins` : `${rawMins} Mins`;
};

const STANDARD_BOOKS = [
    "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", 
    "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO", 
    "ECC", "SOS", "ISA", "JER", "LAM", "EZE", "DAN", "HOS", "JOE", "AMO", 
    "OBA", "JON", "MIC", "NAH", "HAB", "ZEP", "HAG", "ZEC", "MAL",
    "MAT", "MAR", "LUK", "JOH", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", 
    "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAM", 
    "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV"
];

const getBookColorConfig = (index) => {
    const id = index + 1;
    // Old Testament
    if (id >= 1 && id <= 5) return { text: 'text-[#d32f2f]', border: 'border-[#d32f2f]', bg: 'bg-[#d32f2f]' };
    if (id >= 6 && id <= 17) return { text: 'text-[#f57c00]', border: 'border-[#f57c00]', bg: 'bg-[#f57c00]' };
    if (id >= 18 && id <= 22) return { text: 'text-[#388e3c]', border: 'border-[#388e3c]', bg: 'bg-[#388e3c]' };
    if (id >= 23 && id <= 27) return { text: 'text-[#1976d2]', border: 'border-[#1976d2]', bg: 'bg-[#1976d2]' };
    if (id >= 28 && id <= 39) return { text: 'text-[#7b1fa2]', border: 'border-[#7b1fa2]', bg: 'bg-[#7b1fa2]' };
    
    // New Testament
    if (id >= 40 && id <= 43) return { text: 'text-[#d32f2f]', border: 'border-[#d32f2f]', bg: 'bg-[#d32f2f]' };
    if (id === 44) return { text: 'text-[#f57c00]', border: 'border-[#f57c00]', bg: 'bg-[#f57c00]' };
    if (id >= 45 && id <= 56) return { text: 'text-[#388e3c]', border: 'border-[#388e3c]', bg: 'bg-[#388e3c]' };
    if (id >= 57 && id <= 64) return { text: 'text-[#1976d2]', border: 'border-[#1976d2]', bg: 'bg-[#1976d2]' };
    if (id >= 65 && id <= 66) return { text: 'text-[#7b1fa2]', border: 'border-[#7b1fa2]', bg: 'bg-[#7b1fa2]' };
    
    return { text: 'text-gray-700', border: 'border-gray-200', bg: 'bg-gray-700' };
};

const isBookMatch = (bookCode, book) => {
    if (book.short_form && book.short_form.toUpperCase() === bookCode) return true;
    
    // Some databases use full names like "1st John", "I John", "Song of Songs"
    const nameStr = book.name.toUpperCase().replace(/\s+/g, ''); // keep numbers and letters
    const rawName = book.name.toUpperCase();
    const code = bookCode.toUpperCase();
    
    if (code === "JDG" && (nameStr.startsWith("JUDG") || nameStr.startsWith("JDG"))) return true;
    if (code === "SOS" && (nameStr.startsWith("SONG") || nameStr.startsWith("CANTICLES") || nameStr.startsWith("SOS"))) return true;
    if (code === "PHP" && (nameStr.startsWith("PHILIP") || nameStr.startsWith("PHP"))) return true;
    if (code === "PHM" && (nameStr.startsWith("PHILEM") || nameStr.startsWith("PHM"))) return true;
    
    // John Epistles variations
    if (code === "1JN" && (nameStr.startsWith("1JO") || nameStr.startsWith("1STJO") || nameStr.startsWith("IJO") || nameStr.startsWith("1JN"))) return true;
    if (code === "2JN" && (nameStr.startsWith("2JO") || nameStr.startsWith("2NDJO") || nameStr.startsWith("IIJO") || nameStr.startsWith("2JN"))) return true;
    if (code === "3JN" && (nameStr.startsWith("3JO") || nameStr.startsWith("3RDJO") || nameStr.startsWith("IIIJO") || nameStr.startsWith("3JN"))) return true;

    // Standard map fallback
    const map = {
        "1SA": "1SAM", "2SA": "2SAM",
        "1KI": "1KIN", "2KI": "2KIN",
        "1CH": "1CHR", "2CH": "2CHR",
        "1TH": "1THE", "2TH": "2THE",
        "1TI": "1TIM", "2TI": "2TIM",
        "1PE": "1PET", "2PE": "2PET",
        "PSA": "PSALM", "NAM": "NAHUM", "NAH": "NAHUM"
    };
    
    if (map[code] && nameStr.startsWith(map[code])) return true;
    
    // Also try matching standard index if IDs are 1-66
    const standardIndex = STANDARD_BOOKS.indexOf(code) + 1;
    if (book.id === standardIndex) return true;

    return nameStr.startsWith(code.replace(/[^A-Z0-9]/g, ''));
};

const StatItem = ({ title, icon, value, color }) => (
    <div className="flex flex-col items-center justify-center flex-1 py-2">
        <div className="text-[10px] font-bold text-[#1e293b] mb-1">{title}</div>
        <i className={`${icon} ${color} text-xl mb-1`}></i>
        <div className={`${color} font-bold text-lg leading-none`}>{value}</div>
    </div>
);

const Shanaz357 = () => {
    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [rlltDB, setRlltDB] = useState([]);
    const [mdl, setMdl] = useState(1);
    const [fct, setFct] = useState(1);
    const [phs, setPhs] = useState(1);
    const [isViewing, setIsViewing] = useState(false);
    const navigate = useNavigate();
    const toast = React.useRef(null);

    useEffect(() => {
        axios.get('http://' + window.location.hostname + ':8000/api/books', { withCredentials: true })
            .then(res => setBooksDB(res.data))
            .catch(err => console.error(err));

        axios.get('http://' + window.location.hostname + ':8000/api/chapters?limit=3000', { withCredentials: true })
            .then(res => setChaptersDB(res.data))
            .catch(err => console.error(err));
            
        axios.get('http://' + window.location.hostname + ':8000/api/rllt_lookup', { withCredentials: true })
            .then(res => {
                const data = res.data;
                setRlltDB(data);
                const uniqueModules = [...new Set(data.map(d => d.module))];
                if (uniqueModules.length > 0) {
                    setMdl(Math.max(...uniqueModules)); // Default to highest module like 5
                }
            })
            .catch(err => console.error(err));
    }, []);

    const toggleBook = (id) => {
        if (selectedBooks.includes(id)) {
            setSelectedBooks(selectedBooks.filter(b => b !== id));
        } else {
            setSelectedBooks([...selectedBooks, id]);
        }
    };

    const getBookTooltip = (book) => {
        const bChaps = chaptersDB.filter(c => c.book_id === book.id);
        const count = bChaps.length;
        const totalArt = bChaps.reduce((sum, c) => sum + (typeof c.art === 'number' ? c.art : parseTime(c.art)), 0);
        return `${book.name} - ${count} Chapters - ${formatSum(totalArt)}`;
    };

    const uniqueModules = [...new Set(rlltDB.map(d => d.module))].sort((a, b) => a - b);
    
    // Derived available options based on selections (1 up to the highest recorded value)
    const availableFacets = (() => {
        const unique = [...new Set(rlltDB.filter(d => d.module === mdl).map(d => d.facet))];
        const max = unique.length > 0 ? Math.max(...unique) : 1;
        return Array.from({ length: max }, (_, i) => i + 1);
    })();

    const availablePhases = (() => {
        const unique = [...new Set(rlltDB.filter(d => d.module === mdl && d.facet === fct).map(d => d.phase))];
        const max = unique.length > 0 ? Math.max(...unique) : 1;
        return Array.from({ length: max }, (_, i) => i + 1);
    })();

    // Sync cascading defaults
    useEffect(() => {
        if (availableFacets.length > 0 && !availableFacets.includes(fct)) {
            setFct(Math.max(...availableFacets)); // Default to highest facet
        }
    }, [mdl, availableFacets, fct]);

    useEffect(() => {
        if (availablePhases.length > 0 && !availablePhases.includes(phs)) {
            setPhs(Math.max(...availablePhases)); // Default to highest phase
        }
    }, [mdl, fct, availablePhases, phs]);

    const currentPhaseData = rlltDB.find(d => d.module === mdl && d.facet === fct && d.phase === phs);
    const eachPhsDays = currentPhaseData ? currentPhaseData.scheduled_value_days : 0;

    const handleIncrement = () => {
        const currIdx = uniqueModules.indexOf(mdl);
        if (currIdx < uniqueModules.length - 1) setMdl(uniqueModules[currIdx + 1]);
    };

    const handleDecrement = () => {
        const currIdx = uniqueModules.indexOf(mdl);
        if (currIdx > 0) setMdl(uniqueModules[currIdx - 1]);
    };

    const handleFctDec = () => {
        const idx = availableFacets.indexOf(fct);
        if (idx > 0) setFct(availableFacets[idx - 1]);
    };

    const handleFctInc = () => {
        const idx = availableFacets.indexOf(fct);
        if (idx !== -1 && idx < availableFacets.length - 1) setFct(availableFacets[idx + 1]);
    };

    const handlePhsDec = () => {
        const idx = availablePhases.indexOf(phs);
        if (idx > 0) setPhs(availablePhases[idx - 1]);
    };

    const handlePhsInc = () => {
        const idx = availablePhases.indexOf(phs);
        if (idx !== -1 && idx < availablePhases.length - 1) setPhs(availablePhases[idx + 1]);
    };

    const handleViewClick = async () => {
        setIsViewing(true);
        try {
            const listRes = await axios.get(`http://${window.location.hostname}:8000/api/charts/list`, { withCredentials: true });
            const exists = listRes.data.some(c => Number(c.module) === Number(mdl) && Number(c.facet) === Number(fct) && Number(c.phase) === Number(phs));
            
            if (exists) {
                navigate('/admin/chart-listing/main-chart', {
                    state: { preselect: { module: mdl, facet: fct, phase: phs } }
                });
            } else {
                toast.current?.show({ severity: 'warn', summary: 'Not Found', detail: `No saved chart found for Module ${mdl}, Facet ${fct}, Phase ${phs}. Please create it first.`, life: 4000 });
            }
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not verify chart existence.', life: 3000 });
        } finally {
            setIsViewing(false);
        }
    };

    const renderBooks = (startIndex, endIndex) => {
        return STANDARD_BOOKS.slice(startIndex, endIndex).map((bookCode, idx) => {
            const actualIndex = startIndex + idx;
            const colors = getBookColorConfig(actualIndex);
            
            // Find the matching book in booksDB using the robust matcher
            const book = booksDB.find(b => isBookMatch(bookCode, b));
            
            const isSelected = book ? selectedBooks.includes(book.id) : false;
            
            return (
                <div 
                    key={bookCode} 
                    className={`book-tooltip-item border rounded py-2 text-center text-[11px] font-bold cursor-pointer transition-colors shadow-sm w-[calc(20%-0.4rem)] ${isSelected ? `${colors.bg} text-white border-transparent` : `${colors.text} border-gray-300 hover:bg-gray-50`}`}
                    onClick={() => book && toggleBook(book.id)}
                    data-pr-tooltip={book ? getBookTooltip(book) : ''}
                >
                    {bookCode}
                </div>
            );
        });
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8 flex justify-center items-start font-sans">
            <Toast ref={toast} />
            <Tooltip target=".book-tooltip-item" position="top" />
            <div className="bg-white rounded-xl shadow-xl w-full max-w-[480px] p-6 border border-gray-200">
                {/* Header Section */}
                <div className="text-center mb-6">
                    <p className="text-gray-500 italic text-sm font-serif">Unlocking Transformation Through</p>
                    <div className="flex items-center justify-center gap-2 my-1">
                        <div className="h-px bg-gray-300 flex-1"></div>
                        <span className="text-[10px] text-gray-500 font-bold tracking-[0.2em]">THE WORD</span>
                        <div className="h-px bg-gray-300 flex-1"></div>
                    </div>
                    <h1 className="text-5xl font-black text-[#0B2149] tracking-tight mt-2 mb-2">SHANAZ 357</h1>
                    <div className="flex items-center justify-center">
                        <div className="h-px bg-[#0B2149] w-24"></div>
                        <div className="w-2 h-2 bg-[#0B2149] rotate-45 mx-2"></div>
                        <div className="h-px bg-[#0B2149] w-24"></div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="flex justify-between border border-gray-200 rounded-xl mb-6 bg-white shadow-sm overflow-hidden">
                    <StatItem title="BKS" icon="pi pi-book" value="3" color="text-[#1976d2]" />
                    <div className="w-px bg-gray-200 my-2"></div>
                    <StatItem title="CHP" icon="pi pi-file" value="75" color="text-[#388e3c]" />
                    <div className="w-px bg-gray-200 my-2"></div>
                    <StatItem title="VRS" icon="pi pi-crown" value="200" color="text-[#f57c00]" />
                    <div className="w-px bg-gray-200 my-2"></div>
                    <StatItem title="ART" icon="pi pi-clock" value="1:30H" color="text-[#7b1fa2]" />
                    <div className="w-px bg-gray-200 my-2"></div>
                    <StatItem title="DAYS" icon="pi pi-calendar" value="60" color="text-[#d32f2f]" />
                </div>

                {/* Books Grid - Combined Scrollable Card */}
                <style>{`
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                    .scrollbar-hide {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
                <div className="border border-gray-200 rounded-xl mb-6 shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-y-auto scrollbar-hide h-[215px]">
                        <div className="bg-[#0B2149] text-white text-center font-bold py-2 text-sm tracking-wide sticky top-0 z-10">
                            OLD TESTAMENT
                        </div>
                        <div className="p-3 flex flex-wrap justify-center gap-2 bg-white">
                            {booksDB.length > 0 && renderBooks(0, 39)}
                        </div>
                        
                        <div className="bg-[#0B2149] text-white text-center font-bold py-2 text-sm tracking-wide sticky top-0 z-10 border-t border-[#0B2149]">
                            NEW TESTAMENT
                        </div>
                        <div className="p-3 flex flex-wrap justify-center gap-2 bg-white">
                            {booksDB.length > 0 && renderBooks(39, 66)}
                        </div>
                    </div>
                </div>

                {/* Middle Input Section */}
                <div className="flex gap-2 mb-4 h-14">
                    <div className="flex-1 border border-[#388e3c] rounded-xl flex items-center justify-center text-center text-[#388e3c] text-[10px] font-bold uppercase bg-[#f1f8e9]">
                        PSALMS<br/>CHP 119
                    </div>
                    <div className="flex-[1.5] border border-gray-300 rounded-xl flex justify-evenly items-center px-2">
                        <div className="h-6 w-px bg-gray-200"></div>
                        <div className="h-6 w-px bg-gray-200"></div>
                        <div className="h-6 w-px bg-gray-200"></div>
                    </div>
                    <div className="flex-1 border border-[#388e3c] rounded-xl flex items-center justify-center text-center text-[#388e3c] text-[10px] font-bold uppercase bg-[#f1f8e9]">
                        PSA OF DAVID<br/>73 CHP
                    </div>
                </div>

                {/* Numbers Grid */}
                <div className="border border-[#1976d2] rounded-xl mb-4 py-2 flex justify-evenly text-center text-sm font-bold text-[#1976d2] bg-[#f8faff]">
                    <div className="flex flex-col"><div className="mb-1">0</div><div>5</div></div>
                    <div className="w-px bg-gray-300 my-1"></div>
                    <div className="flex flex-col"><div className="mb-1">1</div><div>6</div></div>
                    <div className="w-px bg-gray-300 my-1"></div>
                    <div className="flex flex-col"><div className="mb-1">2</div><div>7</div></div>
                    <div className="w-px bg-gray-300 my-1"></div>
                    <div className="flex flex-col"><div className="mb-1">3</div><div>8</div></div>
                    <div className="w-px bg-gray-300 my-1"></div>
                    <div className="flex flex-col"><div className="mb-1">4</div><div>9</div></div>
                </div>

                {/* Plus/Minus Section */}
                <div className="flex items-center justify-between mb-4 gap-2">
                    <div className="flex-1 border border-gray-300 rounded-xl h-10 bg-gray-50"></div>
                    <button 
                        className={`font-bold text-2xl px-2 transition-colors ${uniqueModules.indexOf(mdl) > 0 ? 'text-[#f57c00] hover:text-orange-600 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
                        onClick={handleDecrement}
                        disabled={uniqueModules.indexOf(mdl) <= 0}
                    >-</button>
                    <div className="border border-[#f57c00] rounded-xl px-8 py-1 flex flex-col items-center justify-center bg-[#fff8e1]">
                        <div className="text-[10px] font-bold text-[#f57c00]">MDL</div>
                        <div className="text-xl font-bold text-[#f57c00] leading-none mt-1">{mdl}</div>
                    </div>
                    <button 
                        className={`font-bold text-2xl px-2 transition-colors ${uniqueModules.indexOf(mdl) < uniqueModules.length - 1 ? 'text-[#f57c00] hover:text-orange-600 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
                        onClick={handleIncrement}
                        disabled={uniqueModules.indexOf(mdl) >= uniqueModules.length - 1}
                    >+</button>
                    <div className="flex-1 border border-gray-300 rounded-xl h-10 bg-gray-50"></div>
                </div>

                {/* Bottom Stats Section */}
                <div className="border border-[#388e3c] rounded-xl mb-6 flex justify-between p-2 text-center text-[#388e3c] text-[10px] font-bold uppercase bg-[#f1f8e9]">
                    <div className="flex flex-col items-center justify-center flex-1">
                        <div className="mb-1">FACET</div>
                        <div className="flex items-center gap-2 text-base">
                            <button onClick={handleFctDec} disabled={availableFacets.indexOf(fct) <= 0} className={`p-1 transition-colors ${availableFacets.indexOf(fct) > 0 ? 'hover:text-green-800' : 'text-green-200 cursor-not-allowed'}`}><i className="pi pi-angle-left text-sm"></i></button>
                            <span className="w-5 text-center">{fct || '-'}</span>
                            <button onClick={handleFctInc} disabled={availableFacets.indexOf(fct) >= availableFacets.length - 1} className={`p-1 transition-colors ${availableFacets.indexOf(fct) < availableFacets.length - 1 ? 'hover:text-green-800' : 'text-green-200 cursor-not-allowed'}`}><i className="pi pi-angle-right text-sm"></i></button>
                        </div>
                    </div>
                    <div className="w-px bg-green-200 my-1"></div>
                    <div className="flex flex-col items-center justify-center flex-1">
                        <div className="mb-1">PHS</div>
                        <div className="flex items-center gap-2 text-base">
                            <button onClick={handlePhsDec} disabled={availablePhases.indexOf(phs) <= 0} className={`p-1 transition-colors ${availablePhases.indexOf(phs) > 0 ? 'hover:text-green-800' : 'text-green-200 cursor-not-allowed'}`}><i className="pi pi-angle-left text-sm"></i></button>
                            <span className="w-5 text-center">{phs || '-'}</span>
                            <button onClick={handlePhsInc} disabled={availablePhases.indexOf(phs) >= availablePhases.length - 1} className={`p-1 transition-colors ${availablePhases.indexOf(phs) < availablePhases.length - 1 ? 'hover:text-green-800' : 'text-green-200 cursor-not-allowed'}`}><i className="pi pi-angle-right text-sm"></i></button>
                        </div>
                    </div>
                    <div className="w-px bg-green-200 my-1"></div>
                    <div className="flex flex-col items-center justify-center flex-[1.5]">
                        <div className="mb-1">EACH PHS</div>
                        <div className="text-base flex items-center justify-center h-8">{eachPhsDays ? `${eachPhsDays} DAYS` : '-'}</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3">
                    <button className="flex flex-row items-center justify-center gap-2 border border-[#1976d2] text-[#1976d2] rounded-xl py-2 font-bold text-xs hover:bg-blue-50 transition-colors bg-white">
                        <i className="pi pi-print text-base"></i> PRINT
                    </button>
                    <button 
                        onClick={handleViewClick}
                        disabled={isViewing}
                        className={`flex flex-row items-center justify-center gap-2 border border-[#388e3c] text-[#388e3c] rounded-xl py-2 font-bold text-xs transition-colors bg-white ${isViewing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-50'}`}
                    >
                        <i className={`pi ${isViewing ? 'pi-spin pi-spinner' : 'pi-eye'} text-base`}></i> VIEW
                    </button>
                    <button className="flex flex-row items-center justify-center gap-2 border border-[#7b1fa2] text-[#7b1fa2] rounded-xl py-2 font-bold text-xs hover:bg-purple-50 transition-colors bg-white">
                        <i className="pi pi-send text-base"></i> SEND
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Shanaz357;
