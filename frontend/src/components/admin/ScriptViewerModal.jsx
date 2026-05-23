import React, { useState } from 'react';

const ScriptViewerModal = ({ isOpen, onClose, scriptData, onInsert }) => {
    const [selectedCells, setSelectedCells] = useState({});

    if (!isOpen || !scriptData) return null;

    const isTableFormat = scriptData.id === 'hebrew' || scriptData.id === 'greek';

    const toggleCell = (rowIndex, colKey, cellValue) => {
        setSelectedCells(prev => {
            const rowSelections = prev[rowIndex] || {};
            const isSelected = !!rowSelections[colKey];
            
            const newRowSelections = { ...rowSelections };
            if (isSelected) {
                delete newRowSelections[colKey];
            } else {
                newRowSelections[colKey] = cellValue;
            }
            
            const newSelectedCells = { ...prev };
            if (Object.keys(newRowSelections).length === 0) {
                delete newSelectedCells[rowIndex];
            } else {
                newSelectedCells[rowIndex] = newRowSelections;
            }
            
            return newSelectedCells;
        });
    };

    const handleInsert = () => {
        const textToInsert = Object.keys(selectedCells).sort((a, b) => Number(a) - Number(b)).map(rowIndex => {
            const rowSelections = selectedCells[rowIndex];
            const parts = [];
            if (rowSelections.original) parts.push(rowSelections.original);
            if (rowSelections.phonetic) parts.push(rowSelections.phonetic);
            if (rowSelections.desc) parts.push(rowSelections.desc);
            if (rowSelections.meaning) parts.push(rowSelections.meaning);
            if (rowSelections.value) parts.push(rowSelections.value);
            return parts.join(' - ');
        }).join('\n');
        
        onInsert(textToInsert);
        setSelectedCells({});
    };

    const selectedCount = Object.values(selectedCells).reduce((count, row) => count + Object.keys(row).length, 0);

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 py-8 backdrop-blur-md print:hidden">
            <div className="bg-gray-900 border border-gray-700 shadow-[0_0_40px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden w-full max-w-6xl h-[95vh] max-h-full flex flex-col text-gray-100 transform transition-all scale-100 opacity-100 relative">

                {/* Floating Cosmic Accent lines logic */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-800/80 flex justify-between items-center bg-gray-950/80 backdrop-blur">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-800 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                            <i className="pi pi-compass text-xl text-emerald-400"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-[0.25em] uppercase text-white drop-shadow-md">{scriptData.name}</h2>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {selectedCount > 0 && (
                            <div className="flex items-center gap-3 animate-fadein mr-2">
                                <span className="text-gray-400 font-mono text-sm hidden sm:inline-block">Selected: <b className="text-emerald-400 text-lg">{selectedCount}</b></span>
                                <button
                                    onClick={handleInsert}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-5 rounded-lg shadow-[0_0_15px_rgba(52,211,153,0.3)] flex items-center gap-2 transform transition-all hover:scale-[1.02] focus:outline-none text-sm"
                                >
                                    <i className="pi pi-file-export pr-1"></i>
                                    Move to Word Page
                                </button>
                            </div>
                        )}
                        <button onClick={() => { setSelectedCells({}); onClose(); }} className="text-gray-500 hover:text-white bg-gray-800/50 hover:bg-gray-700 p-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500">
                            <i className="pi pi-times text-lg"></i>
                        </button>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gradient-to-b from-gray-900 to-gray-950 space-y-6">
                    {/* Generative Matrix Array */}
                    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-white relative">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-100 border-b border-gray-200 text-black text-xs tracking-widest font-mono font-bold select-none">
                                <tr>
                                    <th className="px-4 py-4 w-16 text-center">{isTableFormat ? 'NO.' : 'SEQ'}</th>
                                    <th className="px-4 py-4 text-center">{scriptData.id === 'hebrew' ? 'HEBREW LETTER' : scriptData.id === 'greek' ? 'GREEK LETTER' : 'GLYPH'}</th>
                                    <th className="px-4 py-4">{isTableFormat ? 'ENGLISH PRONUNCIATION' : 'PHONETIC'}</th>
                                    {!isTableFormat && <th className="px-4 py-4 w-1/3 whitespace-normal">STYLIZED FORM DESCRIPTION</th>}
                                    <th className="px-4 py-4 w-1/4">{isTableFormat ? 'NAME' : 'SYMBOLIC ARCHETYPE'}</th>
                                    <th className="px-4 py-4 text-right">{isTableFormat ? 'NUMERIC VALUE' : 'VAL'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {scriptData.letters.map((letter, i) => {
                                    const rowSelections = selectedCells[i] || {};
                                    return (
                                        <tr
                                            key={i}
                                            className="transition-all duration-300 group font-bold text-black bg-white hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-4 text-center font-mono text-xs transition-colors">
                                                {String(letter.serial).padStart(2, '0')}
                                            </td>

                                            <td 
                                                className={`px-4 py-4 transition-all cursor-pointer select-none ${rowSelections.original ? 'bg-emerald-50 shadow-[inset_4px_0_0_0_#10b981]' : ''}`}
                                                onClick={() => toggleCell(i, 'original', letter.original)}
                                            >
                                                <div className="flex items-center gap-3 justify-center">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!rowSelections.original}
                                                        readOnly
                                                        className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                                                    />
                                                    <span className="text-3xl font-bold transform group-hover:scale-125 transition-transform lg:font-black">
                                                        {letter.original}
                                                    </span>
                                                </div>
                                            </td>

                                            <td 
                                                className={`px-4 py-4 font-mono transition-colors cursor-pointer select-none ${rowSelections.phonetic ? 'bg-emerald-50 shadow-[inset_4px_0_0_0_#10b981]' : ''}`}
                                                onClick={() => toggleCell(i, 'phonetic', letter.phonetic)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!rowSelections.phonetic}
                                                        readOnly
                                                        className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                                                    />
                                                    <span>{letter.phonetic}</span>
                                                </div>
                                            </td>

                                            {!isTableFormat && (
                                                <td 
                                                    className={`px-4 py-4 whitespace-normal leading-relaxed text-xs italic transition-colors pr-8 cursor-pointer select-none ${rowSelections.desc ? 'bg-emerald-50 shadow-[inset_4px_0_0_0_#10b981]' : ''}`}
                                                    onClick={() => toggleCell(i, 'desc', letter.desc)}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!!rowSelections.desc}
                                                            readOnly
                                                            className="w-4 h-4 mt-0.5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                                                        />
                                                        <span>{letter.desc}</span>
                                                    </div>
                                                </td>
                                            )}

                                            <td 
                                                className={`px-4 py-4 font-medium tracking-wide text-xs transition-colors cursor-pointer select-none ${rowSelections.meaning ? 'bg-emerald-50 shadow-[inset_4px_0_0_0_#10b981]' : ''}`}
                                                onClick={() => toggleCell(i, 'meaning', letter.meaning)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!rowSelections.meaning}
                                                        readOnly
                                                        className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                                                    />
                                                    <span>{letter.meaning}</span>
                                                </div>
                                            </td>

                                            <td 
                                                className={`px-4 py-4 text-right font-mono transition-colors cursor-pointer select-none ${rowSelections.value ? 'bg-emerald-50 shadow-[inset_4px_0_0_0_#10b981]' : ''}`}
                                                onClick={() => toggleCell(i, 'value', letter.value !== null ? letter.value : 'Ø')}
                                            >
                                                <div className="flex items-center justify-end gap-3">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!rowSelections.value}
                                                        readOnly
                                                        className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                                                    />
                                                    <span>{letter.value !== null ? letter.value : 'Ø'}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Gradient Strip */}
                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none"></div>
            </div>
        </div>
    );
};

export default ScriptViewerModal;
