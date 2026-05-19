import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Tooltip } from 'primereact/tooltip';
import axios from 'axios';

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
    if (index >= 0 && index <= 4) return { text: 'text-[#c00000]', bg: 'bg-[#c00000]', activeText: 'text-white' }; 
    if (index >= 5 && index <= 16) return { text: 'text-[#a67c00]', bg: 'bg-[#a67c00]', activeText: 'text-white' }; 
    if (index >= 17 && index <= 21) return { text: 'text-[#007020]', bg: 'bg-[#007020]', activeText: 'text-white' }; 
    if (index >= 22 && index <= 26) return { text: 'text-[#0055a4]', bg: 'bg-[#0055a4]', activeText: 'text-white' }; 
    if (index >= 27 && index <= 38) return { text: 'text-[#4b0082]', bg: 'bg-[#4b0082]', activeText: 'text-white' }; 
    if (index >= 39 && index <= 42) return { text: 'text-[#c00000]', bg: 'bg-[#c00000]', activeText: 'text-white' }; 
    if (index === 43) return { text: 'text-[#a67c00]', bg: 'bg-[#a67c00]', activeText: 'text-white' }; 
    if (index >= 44 && index <= 55) return { text: 'text-[#007020]', bg: 'bg-[#007020]', activeText: 'text-white' }; 
    if (index >= 56 && index <= 63) return { text: 'text-[#0055a4]', bg: 'bg-[#0055a4]', activeText: 'text-white' }; 
    if (index >= 64 && index <= 66) return { text: 'text-[#4b0082]', bg: 'bg-[#4b0082]', activeText: 'text-white' }; 
    return { text: 'text-[#2b4c7e]', bg: 'bg-[#2b4c7e]', activeText: 'text-white' };
};

const isBookMatch = (bookCode, book) => {
    if (book.short_form && book.short_form.toUpperCase() === bookCode) return true;
    const nameStr = book.name.toUpperCase().replace(/\s+/g, '');
    const code = bookCode.toUpperCase();
    if (code === "JDG" && (nameStr.startsWith("JUDG") || nameStr.startsWith("JDG"))) return true;
    if (code === "SOS" && (nameStr.startsWith("SONG") || nameStr.startsWith("CANTICLES") || nameStr.startsWith("SOS"))) return true;
    if (code === "PHP" && (nameStr.startsWith("PHILIP") || nameStr.startsWith("PHP"))) return true;
    if (code === "PHM" && (nameStr.startsWith("PHILEM") || nameStr.startsWith("PHM"))) return true;
    if (code === "1JN" && (nameStr.startsWith("1JO") || nameStr.startsWith("1STJO") || nameStr.startsWith("IJO") || nameStr.startsWith("1JN"))) return true;
    if (code === "2JN" && (nameStr.startsWith("2JO") || nameStr.startsWith("2NDJO") || nameStr.startsWith("IIJO") || nameStr.startsWith("2JN"))) return true;
    if (code === "3JN" && (nameStr.startsWith("3JO") || nameStr.startsWith("3RDJO") || nameStr.startsWith("IIIJO") || nameStr.startsWith("3JN"))) return true;
    const map = { "1SA": "1SAM", "2SA": "2SAM", "1KI": "1KIN", "2KI": "2KIN", "1CH": "1CHR", "2CH": "2CHR", "1TH": "1THE", "2TH": "2THE", "1TI": "1TIM", "2TI": "2TIM", "1PE": "1PET", "2PE": "2PET", "PSA": "PSALM", "NAM": "NAHUM", "NAH": "NAHUM" };
    if (map[code] && nameStr.startsWith(map[code])) return true;
    const standardIndex = STANDARD_BOOKS.indexOf(code) + 1;
    if (book.id === standardIndex) return true;
    return nameStr.startsWith(code.replace(/[^A-Z0-9]/g, ''));
};

export default function BookSelectionModal({ visible, onHide, onConfirm }) {
    const [booksDB, setBooksDB] = useState([]);
    const [chaptersDB, setChaptersDB] = useState([]);
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [cycle, setCycle] = useState(3);
    const [enteredDays, setEnteredDays] = useState('');

    useEffect(() => {
        if (visible && booksDB.length === 0) {
            axios.get('http://' + window.location.hostname + ':8000/api/books', { withCredentials: true })
                .then(res => setBooksDB(res.data))
                .catch(err => console.error(err));
            axios.get('http://' + window.location.hostname + ':8000/api/chapters', { withCredentials: true })
                .then(res => setChaptersDB(res.data))
                .catch(err => console.error(err));
        }
    }, [visible, booksDB.length]);

    useEffect(() => {
        if (visible) {
            setEnteredDays('');
            setSelectedBooks([]);
            setCycle(3);
        }
    }, [visible]);

    const toggleBook = (bookId) => {
        const book = booksDB.find(b => b.id === bookId);
        if (!book) return;
        setSelectedBooks(prev => {
            if (prev.includes(bookId)) return prev.filter(id => id !== bookId);
            return [...prev, bookId];
        });
    };

    const appendDigit = (d) => {
        setEnteredDays(prev => {
            if (prev.length >= 3) return prev;
            if (prev === '0' && d !== 0) return String(d);
            if (prev === '' && d === 0) return '';
            return prev + d;
        });
    };

    const handleConfirm = () => {
        const validBooks = booksDB.filter(b => selectedBooks.includes(b.id));
        let ot_count = 0;
        let nt_count = 0;
        let total_chp = 0;
        let total_ver = 0;
        let total_art = 0;
        let total_english = 0;
        let total_hebrew = 0;
        let total_greek = 0;

        validBooks.forEach(b => {
            if (b.book_type && (b.book_type === 'OT' || b.book_type.toLowerCase().includes('old'))) {
                ot_count++;
            } else if (b.book_type && (b.book_type === 'NT' || b.book_type.toLowerCase().includes('new'))) {
                nt_count++;
            } else {
                if (b.id <= 39) ot_count++;
                else nt_count++;
            }
            total_art += (Number(b.total_art) || 0);
            const bChaps = chaptersDB.filter(c => c.book_id === b.id);
            total_chp += bChaps.length;
            bChaps.forEach(c => {
                total_ver += (c.verse_count || 0);
                total_english += (c.english_words || 0);
                total_hebrew += (c.hebrew_words || 0);
                total_greek += (c.greek_words || 0);
            });
        });

        const totalDays = parseInt(enteredDays) || 0;
        const calculatedWeeks = totalDays > 0 ? Math.ceil(totalDays / cycle) : 5;
        
        let formattedArt = Math.round(total_art) + "m";
        if (total_art >= 60) {
            formattedArt = `${Math.floor(total_art/60)}H ${Math.round(total_art%60)}m`;
        }

        onConfirm({
            ot_bks: String(ot_count),
            nt_bks: String(nt_count),
            chp: total_chp,
            ver: total_ver,
            art: formattedArt,
            days: totalDays,
            we5: String(calculatedWeeks), // overrides the default 5 with actual calculated weeks
            english_words: String(total_english),
            hebrew_words: String(total_hebrew),
            greek_words: String(total_greek)
        });
    };

    const getBookTooltip = (book) => {
        if (!book) return '';
        const chaps = chaptersDB.filter(c => c.book_id === book.id);
        const verses = chaps.reduce((acc, c) => acc + (c.verse_count || 0), 0);
        return `${book.name} - ${chaps.length} Chp - ${verses} Vrs`;
    };

    const renderBookGrid = (startIndex, count) => {
        return (
            <div className="grid grid-cols-5 gap-1.5 p-2 px-3">
                {STANDARD_BOOKS.slice(startIndex, startIndex + count).map((code, idx) => {
                    const actualIndex = startIndex + idx;
                    const book = booksDB.find(b => isBookMatch(code, b));
                    const isSelected = book && selectedBooks.includes(book.id);
                    const config = getBookColorConfig(actualIndex);
                    
                    return (
                        <div 
                            key={code}
                            className={`book-tooltip-item border rounded-[4px] py-1.5 flex items-center justify-center text-center text-[11px] font-bold cursor-pointer transition-all ${
                                isSelected 
                                    ? `${config.bg} ${config.activeText} shadow-inner border-transparent` 
                                    : `border-[#d3c09b] ${config.text} hover:bg-[#f5eeda] bg-white`
                            }`}
                            onClick={() => book && toggleBook(book.id)}
                            data-pr-tooltip={book ? getBookTooltip(book) : 'Book Not Found'}
                        >
                            {code}
                        </div>
                    );
                })}
            </div>
        );
    };

    const p119Book = booksDB.find(b => b.name.includes('119') || (b.short_form && b.short_form.includes('119')));
    const p75Book = booksDB.find(b => b.name.toUpperCase().includes('DAVID') || b.name.includes('75'));
    const p119Selected = p119Book && selectedBooks.includes(p119Book.id);
    const p75Selected = p75Book && selectedBooks.includes(p75Book.id);

    return (
        <Dialog visible={visible} onHide={onHide} header="Configure Module 5 - Books & Days" style={{ width: '600px' }} modal className="p-fluid">
            <div className="flex flex-col gap-4 p-2 bg-[#fdfbf6]">
                <Tooltip target=".book-tooltip-item" position="top" />
                
                {/* Old Testament */}
                <div className="border border-[#69512a] rounded-lg shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-[#0B2149] text-white py-1.5 flex items-center justify-center relative border-b-[3px] border-[#c7a96b]">
                        <div className="text-sm tracking-widest text-[#fdfbf6]" style={{fontFamily: "'Algerian', serif"}}>OLD TESTAMENT</div>
                    </div>
                    <div className="overflow-y-auto max-h-[180px] bg-[#fcf8ef] scrollbar-hide">
                        {renderBookGrid(0, 39)}
                    </div>
                </div>

                {/* New Testament */}
                <div className="border border-[#69512a] rounded-lg shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-[#0B2149] text-white py-1.5 flex items-center justify-center relative border-b-[3px] border-[#c7a96b]">
                        <div className="text-sm tracking-widest text-[#fdfbf6]" style={{fontFamily: "'Algerian', serif"}}>NEW TESTAMENT</div>
                    </div>
                    <div className="overflow-y-auto max-h-[140px] bg-[#fcf8ef] scrollbar-hide">
                        {renderBookGrid(39, 27)}
                    </div>
                </div>

                {/* Extra Options */}
                <div className="border border-[#69512a] rounded-lg shadow-sm overflow-hidden flex gap-2 p-2 bg-[#fcf8ef]">
                    <div 
                        className={`flex-1 border border-[#7a9e7a] rounded-[4px] flex flex-col items-center justify-center text-center text-sm font-bold uppercase cursor-pointer transition-all ${
                            p119Selected ? 'bg-[#e2efe2] text-[#1c3a1c] ring-1 ring-[#1c3a1c]' : 'bg-[#f0f7f0] text-[#3b603b]'
                        }`}
                        onClick={() => p119Book && toggleBook(p119Book.id)}
                    >
                        <span>PSALMS</span><span>CHP 119</span>
                    </div>
                    <div className="flex-[1.2] border border-[#e8dcb9] bg-white rounded-[4px] flex justify-evenly items-center px-1">
                        <button onClick={() => setCycle(3)} className={`font-bold text-xs ${cycle === 3 ? 'text-[#0B2149]' : 'text-gray-400'}`}>3 DAYS</button>
                        <div className="h-6 w-px bg-[#e8dcb9]"></div>
                        <button onClick={() => setCycle(5)} className={`font-bold text-xs ${cycle === 5 ? 'text-[#0B2149]' : 'text-gray-400'}`}>5 DAYS</button>
                        <div className="h-6 w-px bg-[#e8dcb9]"></div>
                        <button onClick={() => setCycle(7)} className={`font-bold text-xs ${cycle === 7 ? 'text-[#0B2149]' : 'text-gray-400'}`}>7 DAYS</button>
                    </div>
                    <div 
                        className={`flex-1 border border-[#7a9e7a] rounded-[4px] flex flex-col items-center justify-center text-center text-sm font-bold uppercase cursor-pointer transition-all ${
                            p75Selected ? 'bg-[#e2efe2] text-[#1c3a1c] ring-1 ring-[#1c3a1c]' : 'bg-[#f0f7f0] text-[#3b603b]'
                        }`}
                        onClick={() => p75Book && toggleBook(p75Book.id)}
                    >
                        <span>PSA OF DAVID</span><span>75 CHP</span>
                    </div>
                </div>

                {/* Days */}
                <div className="border border-[#69512a] rounded-lg shadow-sm overflow-hidden p-3 bg-[#fcf8ef]">
                    <div className="flex justify-between items-center px-4 mb-3">
                        <button 
                            onClick={() => { setEnteredDays(''); setSelectedBooks([]); }}
                            className="w-6 h-6 rounded-full border border-[#9c2929] text-[#9c2929] flex items-center justify-center hover:bg-red-50 transition-colors"
                        >
                            <i className="pi pi-refresh text-[10px] font-bold"></i>
                        </button>
                        <div className="relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#c3b08e] text-xs font-bold tracking-widest bg-[#fdfbf6] px-2 z-10 whitespace-nowrap">DAYS</div>
                            <div className="w-16 h-10 border border-[#e8dcb9] rounded-full flex items-center justify-center bg-white shadow-inner">
                                {enteredDays && <span className="text-xl font-black text-[#0B2149] z-20 bg-white px-2 rounded">{enteredDays}</span>}
                            </div>
                        </div>
                        <button 
                            onClick={handleConfirm}
                            className="w-6 h-6 rounded-full border border-[#2e532e] text-[#2e532e] flex items-center justify-center hover:bg-green-50 transition-colors"
                        >
                            <i className="pi pi-check text-[10px] font-bold"></i>
                        </button>
                    </div>
                    <div className="flex justify-center gap-2">
                        {[0,1,2,3,4,5,6,7,8,9].map(d => (
                            <button key={d} onClick={() => appendDigit(d)} className="text-xl font-bold w-10 h-10 rounded transition-all shadow-sm bg-white text-[#0B2149] hover:bg-[#f0e4cd] border border-[#e8dcb9]">{d}</button>
                        ))}
                    </div>
                </div>
                
                <div className="flex justify-end mt-4">
                    <button onClick={handleConfirm} className="bg-[#0B2149] text-white px-8 py-2.5 rounded shadow-lg hover:bg-[#1a3668] transition-colors font-bold tracking-widest border border-[#d3c09b]" style={{fontFamily: "'Algerian', serif"}}>CONFIRM & APPLY</button>
                </div>
                <style>{`
                    .scrollbar-hide::-webkit-scrollbar { display: none; }
                    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
            </div>
        </Dialog>
    );
}
