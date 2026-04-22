import React, { useState } from 'react';

const ScriptViewerModal = ({ isOpen, onClose, scriptData, onInsert }) => {
    const [selectedGlyph, setSelectedGlyph] = useState(null);

    if (!isOpen || !scriptData) return null;

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
                            <p className="text-xs text-emerald-400/80 italic font-mono mt-0.5 tracking-wider">"{scriptData.motto}"</p>
                        </div>
                    </div>
                    <button onClick={() => { setSelectedGlyph(null); onClose(); }} className="text-gray-500 hover:text-white bg-gray-800/50 hover:bg-gray-700 p-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        <i className="pi pi-times text-lg"></i>
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gradient-to-b from-gray-900 to-gray-950 space-y-6">
                    {/* Generative Matrix Array */}
                    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-white relative">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-100 border-b border-gray-200 text-black text-xs tracking-widest font-mono font-bold select-none">
                                <tr>
                                    <th className="px-4 py-4 w-16 text-center">SEQ</th>
                                    <th className="px-4 py-4 text-center">GLYPH</th>
                                    <th className="px-4 py-4">PHONETIC</th>
                                    <th className="px-4 py-4 w-1/3 whitespace-normal">STYLIZED FORM DESCRIPTION</th>
                                    <th className="px-4 py-4 w-1/4">SYMBOLIC ARCHETYPE</th>
                                    <th className="px-4 py-4 text-right">VAL</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {scriptData.letters.map((letter, i) => {
                                    const isSelected = selectedGlyph === letter.original;
                                    return (
                                        <tr
                                            key={i}
                                            onClick={() => setSelectedGlyph(letter.original)}
                                            className={`cursor-pointer transition-all duration-300 group font-bold text-black ${isSelected ? 'bg-emerald-50 shadow-[inset_4px_0_0_0_#10b981]' : 'bg-white hover:bg-gray-50'}`}
                                        >
                                            <td className="px-4 py-4 text-center font-mono text-xs transition-colors">
                                                {String(letter.serial).padStart(2, '0')}
                                            </td>
                                            <td className="px-4 py-4 text-center text-3xl font-bold transition-all transform group-hover:scale-125 select-all lg:font-black">
                                                {letter.original}
                                            </td>
                                            <td className="px-4 py-4 font-mono transition-colors">
                                                {letter.phonetic}
                                            </td>
                                            <td className="px-4 py-4 whitespace-normal leading-relaxed text-xs italic transition-colors pr-8">
                                                {letter.desc}
                                            </td>
                                            <td className="px-4 py-4 font-medium tracking-wide text-xs transition-colors">
                                                {letter.meaning}
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono transition-colors">
                                                {letter.value !== null ? letter.value : 'Ø'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Insertion Action Bar */}
                {selectedGlyph && (
                    <div className="p-4 bg-gray-950 border-t border-gray-800 flex justify-end items-center gap-4 animate-fadein">
                        <span className="text-gray-400 font-mono text-sm">Selected: <b className="text-emerald-400 text-lg">{selectedGlyph}</b></span>
                        <button
                            onClick={() => { onInsert(selectedGlyph); setSelectedGlyph(null); }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-lg shadow-[0_0_15px_rgba(52,211,153,0.3)] flex items-center gap-2 transform transition-all hover:scale-[1.02] focus:outline-none"
                        >
                            <i className="pi pi-file-export pr-1"></i>
                            Move to Word Page
                        </button>
                    </div>
                )}

                {/* Footer Gradient Strip */}
                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none"></div>
            </div>
        </div>
    );
};

export default ScriptViewerModal;
