import React, { useState, useRef, useEffect, useMemo } from 'react';
import { WORLD_LANGUAGES } from '../../constants/worldLanguages';

const MotherTongueScroll = ({ value, onChange, readOnly = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    const selectedLanguage =
        value && value.trim() !== '' && value.trim().toUpperCase() !== 'MOTHER TONGUE'
            ? value.trim()
            : '';

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const filteredLanguages = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return WORLD_LANGUAGES;
        return WORLD_LANGUAGES.filter((lang) => lang.toLowerCase().includes(q));
    }, [searchQuery]);

    const handleSelectLanguage = (lang) => {
        if (onChange) {
            onChange(lang);
        }
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div
            ref={containerRef}
            className="flex-1 bg-white relative rounded-l-[11px] select-none"
        >
            <img
                src="/mothertoung.png"
                alt="Mother Tongue Scroll"
                className="absolute inset-0 w-full h-full object-fill rounded-l-[11px] pointer-events-none select-none"
            />

            {/* Scroll Content Layer */}
            <div className="absolute inset-0 flex flex-col items-center justify-start pt-4 pb-3 px-8 z-10">
                {/* Top Heading: MOTHER TONGUE (clickable trigger) */}
                <button
                    type="button"
                    disabled={readOnly}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!readOnly) setIsOpen((prev) => !prev);
                    }}
                    className={`font-black text-[#4a2e15] tracking-widest text-[13px] lg:text-[15px] uppercase text-center bg-transparent border-none outline-none flex items-center justify-center gap-1.5 ${
                        readOnly ? 'cursor-default' : 'cursor-pointer hover:opacity-80'
                    }`}
                    title={readOnly ? 'Mother Tongue' : 'Click to select language'}
                >
                    <span>MOTHER TONGUE</span>
                    {!readOnly && (
                        <i
                            className={`pi pi-chevron-down text-[10px] text-[#4a2e15] transition-transform duration-200 ${
                                isOpen ? 'rotate-180' : ''
                            }`}
                        />
                    )}
                </button>

                {/* Selected Language displayed in the middle of the scroll */}
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!readOnly) setIsOpen((prev) => !prev);
                    }}
                    className={`flex-1 w-full flex items-center justify-center ${
                        readOnly ? 'cursor-default' : 'cursor-pointer'
                    }`}
                >
                    {selectedLanguage && (
                        <span className="font-black text-[#4a2e15] tracking-widest text-[15px] lg:text-[18px] uppercase text-center drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                            {selectedLanguage}
                        </span>
                    )}
                </div>
            </div>

            {/* Language Dropdown Menu */}
            {!readOnly && isOpen && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-[36px] left-1/2 -translate-x-1/2 w-[82%] max-w-[260px] bg-[#fffdf8] border-2 border-[#7c4d25] rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col"
                >
                    {/* Search Input */}
                    <div className="p-1.5 border-b border-[#e6d5b8] bg-[#f8efe0] flex items-center gap-1.5">
                        <i className="pi pi-search text-[11px] text-[#6b4220] ml-1" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search world languages..."
                            className="w-full bg-transparent border-none outline-none text-[12px] font-semibold text-[#3b2310] placeholder-[#8c6747]"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="text-[#6b4220] hover:text-black px-1 cursor-pointer"
                            >
                                <i className="pi pi-times text-[10px]" />
                            </button>
                        )}
                    </div>

                    {/* Languages List */}
                    <div className="max-h-[190px] overflow-y-auto divide-y divide-[#f3e8d2]">
                        {selectedLanguage && !searchQuery && (
                            <button
                                type="button"
                                onClick={() => handleSelectLanguage('MOTHER TONGUE')}
                                className="w-full text-left px-3 py-1.5 text-[11px] font-bold text-red-700 hover:bg-red-50 transition-colors flex items-center justify-between cursor-pointer"
                            >
                                <span>Clear Selection</span>
                                <i className="pi pi-times text-[10px]" />
                            </button>
                        )}
                        {filteredLanguages.length > 0 ? (
                            filteredLanguages.map((lang) => {
                                const isSelected =
                                    selectedLanguage.toLowerCase() === lang.toLowerCase();
                                return (
                                    <button
                                        key={lang}
                                        type="button"
                                        onClick={() => handleSelectLanguage(lang)}
                                        className={`w-full text-left px-3 py-1.5 text-[12px] font-bold transition-colors flex items-center justify-between cursor-pointer ${
                                            isSelected
                                                ? 'bg-[#7c4d25] text-white'
                                                : 'text-[#3b2310] hover:bg-[#f3e3c6]'
                                        }`}
                                    >
                                        <span className="truncate">{lang}</span>
                                        {isSelected && <i className="pi pi-check text-[10px] shrink-0" />}
                                    </button>
                                );
                            })
                        ) : (
                            <button
                                type="button"
                                onClick={() => handleSelectLanguage(searchQuery.trim())}
                                className="w-full text-left px-3 py-2 text-[12px] font-bold text-[#3b2310] hover:bg-[#f3e3c6] cursor-pointer"
                            >
                                Use &ldquo;{searchQuery.trim()}&rdquo;
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MotherTongueScroll;
