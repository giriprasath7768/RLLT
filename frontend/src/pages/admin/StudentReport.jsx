
import playerMockup from '../../../public/player-mockup.png';
import React, { useState } from 'react';

const DividerBox = ({ letter, letterColor, num }) => {
    const hexColor = letterColor.match(/\[(.*?)\]/)[1];
    return (
        <div
            className="flex flex-col items-center justify-start min-w-0 border-[2px] bg-white shadow-sm pt-1 pb-1 cursor-pointer hover:bg-gray-100 transition-colors"
            style={{ flex: 1.0, borderColor: hexColor }}
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

const Pencil = ({ label, baseNum, bodyColorClass, tipColorClass, textColor }) => {
    return (
        <div
            className="flex flex-col items-center min-w-0 bg-gray-500 border-[2px] border-black cursor-pointer hover:-translate-y-1 transition-transform relative h-full drop-shadow-md pb-0"
            style={{ flex: 1.0 }}
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
    const [middleImage, setMiddleImage] = useState(null);
    const [playerImage, setPlayerImage] = useState(null);

    const handleMiddleImageUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            setMiddleImage(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handlePlayerImageUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            setPlayerImage(URL.createObjectURL(e.target.files[0]));
        }
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen text-xs text-gray-800 font-sans">
            <div className="max-w-[1400px] mx-auto bg-white border border-gray-300 shadow-sm p-4 w-full">
                {/* Header Section */}
                <div className="text-center font-bold text-lg border-b border-gray-400 pb-2 mb-2 uppercase tracking-tight text-gray-600">
                    REAL LIFE LEADERSHIP TRAINING - SUCCESS ROAD MAP - HONEYCOMP CHART
                </div>

                {/* Top Info Grid */}
                <div className="flex border border-gray-400 border-b-0 font-bold bg-white">
                    <div className="flex-[0.8] p-2 border-r border-gray-400 flex items-center justify-center text-center">
                        <div>
                            <div className="underline">CEO</div>
                        </div>
                    </div>
                    <div className="flex-[0.6] p-2 border-r border-gray-400 flex items-center justify-center text-center text-lg">
                        STUDENT NAME
                    </div>
                    <div className="flex-[0.6] p-2 border-r border-gray-400 flex items-center justify-center text-center text-lg">
                        {/* Empty column as requested to split the previous cell into two */}
                    </div>
                    <div className="flex-[1] p-2 border-r border-gray-400 flex flex-col items-center justify-center text-center">
                        <div className="text-sm tracking-wider">WED 13 MAR 2024 5:40 PM</div>
                    </div>
                    <div className="w-24 border-r border-gray-400 bg-[#7B9E5A] text-white flex items-center justify-center text-4xl font-normal opacity-90 border-b-[3px] border-b-[#7B9E5A] shadow-inner">
                        66
                    </div>
                    <div className="w-32 bg-[#D1B85D] p-1 flex flex-col justify-center items-center font-bold text-[#4B3B2B] border-t-4 border-l-4 border-r-4 border-[#A39148]">
                        <div className="border-b-2 border-[#A39148] w-full text-center pb-1 tracking-widest">BK - AR</div>
                        <div className="pt-1 text-xl tracking-wider">66 - 40+</div>
                    </div>
                </div>

                {/* Main Data Table */}
                <div className="border border-gray-400 mb-0 border-b-0 bg-white">
                    {/* Header Row */}
                    <div className="flex border-b border-gray-400 bg-gray-300 font-bold overflow-hidden">
                        <div className="min-w-[180px] p-2 border-r border-gray-400 uppercase text-[11px] tracking-wide">MODULE 1- FACET 1: 1PHASE</div>
                        <div className="flex-1 p-2 flex items-center">
                            <span className="font-bold mr-2 uppercase text-xs tracking-wider">TEAM - 7 Transformation Elective And Mandate -</span>
                            <span className="text-[10px] text-gray-600 tracking-widest break-all">FAMILY FINANCE GOVERNMENT SPIRITUALITY TALENT TRAINING SERVICE</span>
                        </div>
                    </div>

                    {/* Columns Header Row */}
                    <div className="flex font-bold bg-[#444] text-[10px] text-center leading-tight py-[2px] px-[1px] text-gray-800">
                        <div className="w-10 flex"><div className="flex-1 bg-white mx-[1px] flex items-center justify-center">PHS</div></div>
                        <div className="w-[72px] flex"><div className="flex-1 bg-white mx-[1px] flex items-center justify-center">BOOKS</div></div>
                        <div className="w-[72px] flex"><div className="flex-1 bg-white mx-[1px] flex items-center justify-center">AUTHERS</div></div>
                        <div className="w-[66px] flex"><div className="flex-1 bg-white mx-[1px] flex items-center justify-center whitespace-nowrap text-[10px] sm:text-[9px]">WE5</div></div>
                        <div className="w-[66px] flex"><div className="flex-1 bg-white mx-[1px] flex items-center justify-center whitespace-nowrap text-[10px] sm:text-[9px]">7/5 DAYS</div></div>
                        <div className="w-[66px] flex"><div className="flex-1 bg-white mx-[1px] flex items-center justify-center whitespace-nowrap text-[10px] sm:text-[9px]">30 DAYS</div></div>
                        <div className="flex-[2] flex min-w-[200px]">
                            <div className="flex-1 flex"><div className="flex-1 bg-white mx-[1px] flex items-center justify-center whitespace-nowrap px-0.5">ART-2h.25m</div></div>
                            <div className="flex-1 flex"><div className="flex-1 bg-white mx-[1px] flex items-center justify-center whitespace-nowrap px-0.5">PRO-1</div></div>
                            <div className="flex-1 flex"><div className="flex-1 bg-white mx-[1px] flex items-center justify-center whitespace-nowrap px-0.5">ECC-1</div></div>
                            <div className="flex-1 flex"><div className="flex-1 bg-white mx-[1px] flex items-center justify-center whitespace-nowrap px-0.5">PSA-1</div></div>
                            <div className="flex-1 flex"><div className="flex-1 bg-white mx-[1px] flex items-center justify-center whitespace-nowrap px-0.5">JOB-1</div></div>
                            <div className="flex-1 flex"><div className="flex-1 bg-white mx-[1px] flex items-center justify-center whitespace-nowrap px-0.5 relative tracking-tighter">OT-39 BKS</div></div>
                            <div className="flex-1 flex"><div className="flex-1 bg-white mx-[1px] flex items-center justify-center whitespace-nowrap px-0.5 relative tracking-tighter">NT-27 BKS</div></div>
                        </div>
                        <div className="w-16 flex"><div className="flex-1 bg-white mx-[1px] flex items-center justify-center">CHAP</div></div>
                        <div className="w-16 flex"><div className="flex-1 bg-white mx-[1px] flex items-center justify-center">VERSE</div></div>
                        <div className="w-20 flex"><div className="flex-1 bg-white mx-[1px] flex items-center justify-center">TIME</div></div>
                    </div>

                    {/* Data Row */}
                    <div className="flex bg-white h-48 border-b border-gray-400 text-gray-700 font-medium">
                        <div className="w-10 border-r border-gray-400 flex items-center justify-center font-bold">1</div>

                        <div className="w-[72px] border-r border-gray-400 flex">
                            <div className="w-1/2 flex items-center justify-center border-r border-gray-400 text-gray-500 font-bold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                <span className="text-[10px] tracking-widest leading-none">BOOKS OVERVIEW</span>
                            </div>
                            <div className="w-1/2 flex items-center justify-center bg-gray-100 font-semibold text-[13px]">66</div>
                        </div>

                        <div className="w-[72px] border-r border-gray-400 flex">
                            <div className="w-1/2 flex items-center justify-center border-r border-gray-400 text-gray-500 font-bold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                <span className="text-[10px] tracking-widest leading-none">AUTHERS BIOGRAPHY</span>
                            </div>
                            <div className="w-1/2 flex items-center justify-center bg-gray-100 font-semibold text-[13px]">40+</div>
                        </div>

                        <div className="w-[66px] border-r border-gray-400 flex items-center justify-center bg-gray-100 font-semibold text-[16px]">
                            6
                        </div>

                        <div className="w-[66px] border-r border-gray-400 flex items-center justify-center bg-gray-100 font-semibold text-[16px]">
                            30
                        </div>

                        <div className="w-[66px] border-r border-gray-400 flex items-center justify-center bg-gray-100 font-semibold text-[16px]">

                        </div>

                        {/* Spanning Mother Tongue Box */}
                        <div className="flex-[2] border-r border-gray-400 flex flex-col bg-gray-50 relative min-w-[200px]">
                            <div className="flex-1 flex items-center justify-center p-4 border-b border-gray-400 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')]">
                                <div className="bg-[#E4C59E] border-x-[12px] border-[#8B5A2B] text-[#5A3A1A] w-64 h-24 rounded-sm shadow-md flex items-center justify-center text-center p-2 text-xs font-bold uppercase relative" style={{ boxShadow: 'inset 0 0 20px rgba(139,69,19,0.3)' }}>
                                    MOTHER TOUNG
                                </div>
                            </div>
                            <div className="h-6 bg-gray-100 flex items-center justify-center">
                                {/* Empty bottom row spanning area except for labels */}
                            </div>
                        </div>

                        <div className="w-16 border-r border-gray-400 flex flex-col">
                            <div className="flex-1 flex items-center justify-center text-xs border-b border-gray-400"></div>
                            <div className="h-6 flex items-center justify-center bg-gray-100 font-semibold text-[13px]">1189</div>
                        </div>
                        <div className="w-16 border-r border-gray-400 flex flex-col">
                            <div className="flex-1 flex items-center justify-center text-xs border-b border-gray-400"></div>
                            <div className="h-6 flex items-center justify-center bg-gray-100 font-semibold text-[13px]">31102</div>
                        </div>
                        <div className="w-20 flex flex-col">
                            <div className="flex-1 flex items-center justify-center text-xs border-b border-gray-400"></div>
                            <div className="h-6 flex items-center justify-center bg-gray-100 font-semibold text-[13px]">70H.11M</div>
                        </div>
                    </div>
                </div>

                {/* Bottom 3 Boxes as Next Row */}
                <div className="flex flex-col lg:flex-row w-full items-stretch border border-gray-400 border-t-0 bg-white">

                    {/* Box 1: Transformation list and Pencils */}
                    <div className="flex-1 bg-[#f9f9f9] flex flex-col relative h-[480px] border-r border-gray-400">
                        <div className="flex justify-between items-center bg-gray-200 p-2 border-b-2 border-gray-300 text-xs text-blue-700 font-bold px-4">
                            <span>Touch Counter</span>
                            <span className="bg-white border-2 border-blue-200 rounded px-3 py-0.5">0</span>
                        </div>
                        <div className="flex bg-white flex-col flex-1 pb-0 overflow-y-auto custom-scrollbar w-full h-full">
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

                            {/* TRANSFORMATION Text Bar */}
                            <div className="w-full bg-black py-0.5 text-white flex justify-between items-center px-[12px] font-black text-[10px] mx-0 drop-shadow-md z-10 shrink-0 mb-0 mt-1">
                                {"TRANSFORMATION".split('').map((char, i) => (
                                    <span key={i}>{char}</span>
                                ))}
                            </div>

                            {/* List using similar structure from TTomTPlayer */}
                            <div className="px-3 pt-2 pb-2 flex flex-col justify-between whitespace-nowrap bg-white overflow-hidden w-full shrink gap-1 relative mt-1">
                                <div className="flex items-center gap-2 border-2 border-transparent rounded py-0 px-1">
                                    <span className="text-[#8e2b8c] text-[10px] sm:text-[11px] font-black flex-shrink-0 leading-none">1.</span>
                                    <span className="text-[#8e2b8c] text-[13px] sm:text-[14px] font-black leading-none drop-shadow-sm flex-shrink-0 px-1 font-serif">W</span>
                                    <span className="text-black text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-transparent outline-none flex-grow min-w-0 leading-none">ISDOM OF GOD</span>
                                </div>
                                <div className="flex items-center gap-2 border-2 border-transparent rounded py-0 px-1">
                                    <span className="text-[#294291] text-[10px] sm:text-[11px] font-black flex-shrink-0 leading-none">2.</span>
                                    <span className="text-[#294291] text-[13px] sm:text-[14px] font-black leading-none drop-shadow-sm flex-shrink-0 px-1 font-serif">I</span>
                                    <span className="text-black text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-transparent outline-none flex-grow min-w-0 leading-none">MAGINATION</span>
                                </div>
                                <div className="flex items-center gap-2 border-2 border-transparent rounded py-0 px-1">
                                    <span className="text-[#86c5f7] text-[10px] sm:text-[11px] font-black flex-shrink-0 leading-none">3.</span>
                                    <span className="text-[#86c5f7] text-[13px] sm:text-[14px] font-black leading-none drop-shadow-sm flex-shrink-0 px-1 font-serif">S</span>
                                    <span className="text-black text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-transparent outline-none flex-grow min-w-0 leading-none">CRIPTURES TO PRAYER</span>
                                </div>
                                <div className="flex items-center gap-2 border-2 rounded py-0 px-1" style={{ borderColor: '#38b948' }}>
                                    <span className="text-[#38b948] text-[10px] sm:text-[11px] font-black flex-shrink-0 leading-none">4.</span>
                                    <span className="text-[#38b948] text-[13px] sm:text-[14px] font-black leading-none drop-shadow-sm flex-shrink-0 px-1 font-serif">D</span>
                                    <span className="text-black text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-transparent outline-none flex-grow min-w-0 leading-none">AILY GROWING IN GODLINESS</span>
                                </div>
                                <div className="flex items-center gap-2 border-2 border-transparent rounded py-0 px-1">
                                    <span className="text-[#e3242b] text-[10px] sm:text-[11px] font-black flex-shrink-0 leading-none">5.</span>
                                    <span className="text-[#e3242b] text-[13px] sm:text-[14px] font-black leading-none drop-shadow-sm flex-shrink-0 px-1 font-serif">O</span>
                                    <span className="text-black text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-transparent outline-none flex-grow min-w-0 leading-none">BEDIENCE TO GOD'S WILL</span>
                                </div>
                                <div className="flex items-center gap-2 border-2 border-transparent rounded py-0 px-1">
                                    <span className="text-[#ed9b26] text-[10px] sm:text-[11px] font-black flex-shrink-0 leading-none">6.</span>
                                    <span className="text-[#ed9b26] text-[13px] sm:text-[14px] font-black leading-none drop-shadow-sm flex-shrink-0 px-1 font-serif">M</span>
                                    <span className="text-black text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-transparent outline-none flex-grow min-w-0 leading-none">EDITATING ON GOD'S CHARACTER</span>
                                </div>
                            </div>
                        </div>

                        {/* Audio Player Placeholder */}
                        <div className="bg-[#44B244] border-[3px] border-[#FF8C00] m-3 mt-auto flex flex-col justify-center px-3 py-1.5 shadow-sm rounded-sm flex-shrink-0">
                            {/* Top Bar for scrub */}
                            <div className="w-full px-8 pt-1">
                                <div className="w-full h-[5px] bg-white/40 rounded-full relative">
                                </div>
                            </div>
                            {/* Controls */}
                            <div className="flex justify-between items-center w-full mt-1.5">
                                <button className="text-black text-xl pr-2 hover:scale-110"><i className="pi pi-play" style={{ transform: 'scale(1.2)' }}></i></button>
                                <span className="text-black text-[12px] font-black">0:00</span>
                                <span className="flex-1 text-center text-[#1A2234] text-[13px] font-extrabold tracking-widest uppercase">PROVERBS 1</span>
                                <span className="text-black text-[12px] font-black mr-2 text-right">0:00</span>
                                <button className="text-white text-lg drop-shadow-md"><i className="pi pi-cog" style={{ transform: 'scale(1.2)' }}></i></button>
                            </div>
                        </div>
                    </div>

                    {/* Box 2: Middle Scroll Area */}
                    <div className="flex-1 bg-white flex flex-col relative h-[480px] border-r border-gray-400">
                        <div className="flex justify-between items-center bg-gray-200 p-2 border-b-2 border-gray-300 text-xs text-blue-700 font-bold px-4 z-10 w-full">
                            <span>Touch Counter</span>
                            <span className="bg-white border-2 border-blue-200 rounded px-3 py-0.5">0</span>
                        </div>
                        <div className="w-full flex-1 flex flex-col p-4 bg-white relative overflow-hidden items-center justify-center">
                            {middleImage ? (
                                <img src={middleImage} alt="Middle Box Graphic" className="w-full h-full object-contain drop-shadow-md" />
                            ) : (
                                <label className="cursor-pointer bg-blue-100 text-blue-700 border border-blue-300 px-4 py-2 rounded shadow-sm hover:bg-blue-200 font-semibold text-sm">
                                    Upload Image
                                    <input type="file" accept="image/*" className="hidden" onChange={handleMiddleImageUpload} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Box 3: Dark Reader Table Area */}
                    <div className="flex-1 bg-[#1A1A1A] text-white flex flex-col relative h-[480px]">
                        <div className="flex justify-between items-center bg-[#2A2A2A] p-2 border-b-2 border-[#444] text-[11px] text-[#A0C4FF] font-bold px-4">
                            <span>Touch Counter</span>
                            <span className="bg-[#1A1A1A] border shadow-inner border-[#555] rounded px-3 py-0.5 text-white">0</span>
                        </div>

                        {/* Static Component Replacement */}
                        <div className="flex flex-col flex-1 bg-black overflow-hidden relative border-t-2 border-[#1B2633] items-center justify-center">
                            {playerImage ? (
                                <img src={playerImage} alt="Player Graphic" className="w-full h-full object-fill opacity-95" />
                            ) : (
                                <label className="cursor-pointer bg-[#2A2A2A] text-[#A0C4FF] border border-[#444] px-4 py-2 rounded shadow-sm hover:bg-gray-800 font-semibold text-sm z-10 transition-colors">
                                    Upload Image
                                    <input type="file" accept="image/*" className="hidden" onChange={handlePlayerImageUpload} />
                                </label>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentReport;
