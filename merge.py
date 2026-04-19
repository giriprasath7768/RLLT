import os

smt_path = os.path.join(os.path.dirname(__file__), 'frontend/src/pages/admin/SMTPlayer.jsx')
bookindex_path = os.path.join(os.path.dirname(__file__), 'frontend/src/pages/admin/BookIndex.jsx')

with open(smt_path, 'r', encoding='utf-8') as f:
    smt_content = f.read()

with open(bookindex_path, 'r', encoding='utf-8') as f:
    bookindex_content = f.read()

# 1. Extract Helper Components & Constants 
helper_start = smt_content.find('const DividerBox')
helper_end = smt_content.find('const PDFPageRender =')
helpers = smt_content[helper_start:helper_end]

explode_start = helpers.find('const explodeBookString')
explode_end = helpers.find('const DraggableWrapper')
if explode_start != -1 and explode_end != -1:
    helpers = helpers[:explode_start] + helpers[explode_end:]

constants_start = smt_content.find('// Constants for PDF Highlighting Tool')
constants_end = smt_content.find('const ScrollMenuPopup =')
constants = smt_content[constants_start:constants_end]

insert_pos1 = bookindex_content.find('const PDFPageRender =')
bookindex_content = bookindex_content[:insert_pos1] + constants + helpers + "\n" + bookindex_content[insert_pos1:]

# 2. Extract Highlighting & Audio Player States
togglePlayFixed = """
    const togglePlay = () => {
        if (!selectedBook || !selectedChapter) return;
        const trackIdentifier = `${selectedBook.name} ${selectedChapter.chapter_number}`;

        if (audioLoadedTrackName !== trackIdentifier) {
            const content = contentDB.find(c => c.book_id === selectedBook.id && c.chapter_id === selectedChapter.id);
            if (content && content.audio_url) {
                audioRef.current.src = `http://localhost:8000${content.audio_url}`;
                setAudioLoadedTrackName(trackIdentifier);
                audioRef.current.play().catch(e => console.error(e));
                setIsPlaying(true);
            } else {
                console.log("No audio found for:", trackIdentifier);
                return;
            }
        } else {
            if (audioRef.current.paused) {
                audioRef.current.play().catch(e => console.error(e));
                setIsPlaying(true);
            } else {
                audioRef.current.pause();
                setIsPlaying(false);
            }
        }
    };
"""

audioAndHighlightLogic = """
    // Highlighting State Memory
    const [highlights, setHighlights] = useState([]);
    const [selectionMenu, setSelectionMenu] = useState(null);
    const [showToolMenu, setShowToolMenu] = useState(false);

    // Audio Player State
    const audioRef = useRef(new Audio());
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioProgress, setAudioProgress] = useState(0);
    const [showAudioPlayer, setShowAudioPlayer] = useState(false);
    const [audioLoadedTrackName, setAudioLoadedTrackName] = useState(null);
    const [showWisdomOverlay, setShowWisdomOverlay] = useState(false);
    const [playerBgColor, setPlayerBgColor] = useState('#547395');
    const [playerBorderColor, setPlayerBorderColor] = useState('#080b12');

    useEffect(() => {
        const ad = audioRef.current;
        const updateTime = () => setAudioProgress(ad.currentTime);
        const updateDuration = () => setAudioDuration(ad.duration);
        const onEnd = () => setIsPlaying(false);

        ad.addEventListener('timeupdate', updateTime);
        ad.addEventListener('loadedmetadata', updateDuration);
        ad.addEventListener('ended', onEnd);
        return () => {
            ad.removeEventListener('timeupdate', updateTime);
            ad.removeEventListener('loadedmetadata', updateDuration);
            ad.removeEventListener('ended', onEnd);
            ad.pause();
        };
    }, []);

""" + togglePlayFixed + """

    const formatTrackTime = (time) => {
        if (!time || isNaN(time)) return '0:00';
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioRef.current.currentTime = percent * audioDuration;
        setAudioProgress(percent * audioDuration);
    };

    useEffect(() => {
        const handleStopPropagation = (e) => {
            if (e.target.closest('.react-pdf__Page__textContent')) {
                e.stopPropagation();
            }
        };

        const handleTextSelectionComplete = (e) => {
            if (e.target.closest('.ancient-scroll-bg')) return;
            const textContentNode = e.target.closest('.react-pdf__Page__textContent');
            if (!textContentNode) {
                setSelectionMenu(null);
                return;
            }

            const selection = window.getSelection();
            if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
                const range = selection.getRangeAt(0);
                const rects = Array.from(range.getClientRects());
                const pageNode = textContentNode.closest('.react-pdf__Page');
                if (!pageNode) return;

                const pageRect = pageNode.getBoundingClientRect();
                const pageNumberStr = pageNode.getAttribute('data-page-number');
                const pageNumber = pageNumberStr ? parseInt(pageNumberStr) : 1;

                const mappedRects = rects.map(r => ({
                    top: ((r.top - pageRect.top) / pageRect.height) * 100,
                    left: ((r.left - pageRect.left) / pageRect.width) * 100,
                    width: (r.width / pageRect.width) * 100,
                    height: (r.height / pageRect.height) * 100,
                }));

                setSelectionMenu({
                    x: e.clientX,
                    y: e.clientY,
                    rects: mappedRects,
                    pageNumber: pageNumber,
                    text: selection.toString().trim()
                });
            } else {
                setSelectionMenu(null);
            }
        };

        document.addEventListener('mousedown', handleStopPropagation, true);
        document.addEventListener('touchstart', handleStopPropagation, true);
        document.addEventListener('pointerdown', handleStopPropagation, true);
        document.addEventListener('mouseup', handleTextSelectionComplete);

        return () => {
            document.removeEventListener('mousedown', handleStopPropagation, true);
            document.removeEventListener('touchstart', handleStopPropagation, true);
            document.removeEventListener('pointerdown', handleStopPropagation, true);
            document.removeEventListener('mouseup', handleTextSelectionComplete);
        };
    }, []);

    const captureHighlight = (categoryObj) => {
        if (!selectionMenu) return;
        const isMountain = SEVEN_MOUNTAIN_SPHERES.some(m => m.label === categoryObj.label);

        setHighlights(prev => [...prev, {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            color: categoryObj.color,
            label: categoryObj.label,
            rects: selectionMenu.rects,
            pageNumber: selectionMenu.pageNumber,
            isSquare: isMountain
        }]);

        setSelectionMenu(prev => {
            if (!prev) return null;
            const nextState = { ...prev };
            if (isMountain) { nextState.hasMountain = true; } else { nextState.hasCategory = true; }
            if (nextState.hasMountain && nextState.hasCategory) {
                setTimeout(() => window.getSelection().removeAllRanges(), 0);
                return null;
            }
            return nextState;
        });
    };
"""

insert_pos2 = bookindex_content.find('const groupedBooks =')
bookindex_content = bookindex_content[:insert_pos2] + audioAndHighlightLogic + "\n    " + bookindex_content[insert_pos2:]

# 3. Inject pageHighlights into PDFPageRender inside BookIndex
bookindex_content = bookindex_content.replace(
    'isCover={isHardCover}',
    'isCover={isHardCover}\n                                                                    pageHighlights={highlights.filter(h => h.pageNumber === index + 1)}'
)

# 4. Extract Top Bar and Audio UI from SMTPlayer and adapt it to BookIndex
topBarCode = """
            {/* Auto-Hiding fully responsive navigation top-bar bridging to native scroll systems */}
            <div className="fixed top-0 inset-x-0 z-[150] transition-transform duration-300 ease-out transform -translate-y-full hover:translate-y-0 flex flex-col">
                <div className="absolute top-full inset-x-0 h-4 bg-transparent cursor-ns-resize" />
                <div className="px-4 py-3 flex justify-between items-center z-50 w-full shrink-0 shadow-[0_15px_30px_rgba(0,0,0,0.6)] relative bg-[#0b0f19] border-b border-gray-800">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="bg-gray-800 hover:bg-gray-700 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all border border-gray-600 shrink-0">
                            <i className="pi pi-arrow-left text-lg"></i>
                        </button>
                        <button onClick={() => setIsSidebarOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all border border-blue-400 shrink-0">
                            <i className="pi pi-bars text-lg"></i>
                        </button>
                    </div>

                    {selectedBook && selectedChapter && numPages && (
                        <div className="flex justify-center items-center flex-1 mx-4 max-w-3xl min-w-[300px]">
                            <button onClick={() => flipBookRef.current?.pageFlip().flipPrev()} className="bg-[#1a2234] hover:bg-blue-600 text-white w-10 h-10 flex items-center justify-center rounded-full shadow-2xl border border-gray-600 transition-all shrink-0">
                                <i className="pi pi-angle-left text-lg font-bold -ml-1"></i>
                            </button>
                            <div className="bg-[#1a2234] border border-gray-600 px-4 py-2 rounded-full flex items-center justify-between shadow-2xl shrink-0 flex-1 mx-2 h-10 min-w-[280px]">
                                {(() => {
                                    const bookChapters = chaptersDB.filter(c => c.book_id === selectedBook.id).sort((a,b) => a.chapter_number - b.chapter_number);
                                    const activeTrackIndex = bookChapters.findIndex(c => c.id === selectedChapter.id);
                                    const isFirstBook = activeTrackIndex <= 0;
                                    const isLastBook = activeTrackIndex === -1 || activeTrackIndex >= bookChapters.length - 1;

                                    return (
                                        <>
                                            <button
                                                onClick={() => { if (!isFirstBook) setSelectedChapter(bookChapters[activeTrackIndex - 1]); }}
                                                disabled={isFirstBook}
                                                className={`flex items-center justify-center shrink-0 w-6 h-6 rounded-full transition-colors ${isFirstBook ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-700 hover:text-white text-blue-400'}`}
                                                title="Previous Chapter"
                                            >
                                                <i className="pi pi-step-backward text-[10px]"></i>
                                            </button>

                                            <div className="flex-1 flex justify-between items-center mx-2 px-2 overflow-hidden">
                                                <span className="text-blue-400 font-extrabold tracking-widest text-[11px] uppercase whitespace-nowrap hidden sm:inline-block">CHAP ${selectedChapter.chapter_number.toString().padStart(2, '0')}</span>
                                                <span className="text-white font-black tracking-[0.15em] text-[13px] uppercase text-center truncate mx-2 leading-none flex-1">${selectedBook.name}</span>
                                                <span className="text-gray-400 font-bold tracking-widest text-[10px] uppercase whitespace-nowrap pb-[1px] hidden md:inline-block">${numPages} TOTAL PAGES</span>
                                            </div>

                                            <button
                                                onClick={() => { if (!isLastBook) setSelectedChapter(bookChapters[activeTrackIndex + 1]); }}
                                                disabled={isLastBook}
                                                className={`flex items-center justify-center shrink-0 w-6 h-6 rounded-full transition-colors ${isLastBook ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-700 hover:text-white text-blue-400'}`}
                                                title="Next Chapter"
                                            >
                                                <i className="pi pi-step-forward text-[10px]"></i>
                                            </button>
                                        </>
                                    );
                                })()}
                            </div>
                            <button onClick={() => flipBookRef.current?.pageFlip().flipNext()} className="bg-[#1a2234] hover:bg-blue-600 text-white w-10 h-10 flex items-center justify-center rounded-full shadow-2xl border border-gray-600 transition-all shrink-0">
                                <i className="pi pi-angle-right text-lg font-bold -mr-1"></i>
                            </button>
                        </div>
                    )}

                    <div className="flex items-center relative gap-2">
                        <div className={`flex items-center gap-2 transition-all duration-300 ${showToolMenu ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'}`}>
                            <button
                                onClick={() => {
                                    setShowAudioPlayer(!showAudioPlayer);
                                    setShowToolMenu(false);
                                }}
                                className="bg-gray-800 hover:bg-blue-600 text-white px-5 py-2 rounded-full flex items-center gap-2 border border-gray-600 shadow-xl transition-colors whitespace-nowrap"
                            >
                                <i className="pi pi-play-circle text-lg"></i>
                                <span className="text-[11px] font-black tracking-widest uppercase">PLAYER</span>
                            </button>
                        </div>
                        <button
                            onClick={() => setShowToolMenu(!showToolMenu)}
                            className={`bg-gray-800 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all border border-gray-600 shrink-0 relative z-10 shadow-lg ${showToolMenu ? 'bg-blue-600 border-blue-400 text-white' : 'hover:bg-gray-700'}`}>
                            <i className="pi pi-wrench text-lg"></i>
                        </button>
                    </div>
                </div>
            </div>
"""

hoverHeaderTarget = """            {/* Hover Header (Menu + Back) */}
            <div className="absolute top-0 left-0 w-full h-20 flex items-center px-6 gap-6 z-40 opacity-0 hover:opacity-100 transition-opacity duration-300 hover:bg-gradient-to-b hover:from-black/60 hover:to-transparent pointer-events-auto">
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors p-2 bg-black/50 backdrop-blur rounded-lg focus:outline-none flex items-center justify-center">
                    <i className="pi pi-arrow-left text-xl font-bold"></i>
                </button>
                <button onClick={() => setIsSidebarOpen(true)} className="text-gray-400 hover:text-white transition-colors p-2 bg-black/50 backdrop-blur rounded-lg focus:outline-none flex items-center justify-center">
                    <i className="pi pi-bars text-xl font-bold"></i>
                </button>
            </div>"""

bookindex_content = bookindex_content.replace(hoverHeaderTarget, topBarCode)

# 5. Inject bottom Audio Player and Overlay Popups into rendering
renderBottomInjections = """
                {/* Ancient Scroll Overlay Rendering! */}
                {selectionMenu && (
                    <ScrollMenuPopup
                        position={selectionMenu}
                        onSelect={captureHighlight}
                    />
                )}

                {/* Custom Bottom Audio Player Wrapped in Draggable */}
                {showAudioPlayer && (
                    <DraggableWrapper
                        initialX={0}
                        initialY={0}
                        className="fixed bottom-[15vh] left-1/2 w-[90%] max-w-[450px] z-[200]"
                    >
                        {/* Wrapper for children to inherit drag position correctly */}
                        <div className="flex flex-col items-center gap-1.5 w-full relative group">

                            {/* Player UI */}
                            <div
                                className="w-full h-[60px] border-[3px] shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex items-center px-4 transition-all duration-300 rounded-[2px]"
                                style={{ backgroundColor: playerBgColor, borderColor: playerBorderColor }}
                            >
                                {/* Left Side: Play Button */}
                                <button onClick={togglePlay} className="text-black hover:scale-110 active:scale-95 transition-all outline-none mr-3">
                                    <i className={`pi ${isPlaying ? 'pi-pause' : 'pi-play'} text-[32px]`}></i>
                                </button>

                                {/* Center Column: Scrubber & Text Row */}
                                <div className="flex-1 flex flex-col justify-center gap-1 mx-2 relative top-0.5">
                                    <div
                                        className="w-[96%] mx-auto h-[5px] bg-[#e4baaf]/50 cursor-pointer rounded-full relative hover:h-[6px] transition-all"
                                        onClick={handleSeek}
                                        data-nodrag="true"
                                    >
                                        <div
                                            className="absolute top-0 left-0 h-full bg-[#fe8b80] rounded-full drop-shadow-sm transition-all pointer-events-none"
                                            style={{ width: `${audioDuration ? (audioProgress / audioDuration) * 100 : 0}%` }}
                                        />
                                    </div>

                                    {/* Text row */}
                                    <div className="flex justify-between items-center w-full text-black font-black text-[12px] tracking-wide mt-1 select-none pointer-events-none">
                                        <span>{formatTrackTime(audioProgress)}</span>
                                        <span className="text-[14px] uppercase tracking-widest leading-none drop-shadow-sm">{selectedBook ? `${selectedBook.name} ${selectedChapter.chapter_number}` : 'Audio'}</span>
                                        <span>{formatTrackTime(audioDuration)}</span>
                                    </div>
                                </div>

                                {/* Right Side: Cog Icon & Close */}
                                <div className="flex items-center gap-1 ml-4" data-nodrag="true">
                                    <button
                                        onClick={() => setShowWisdomOverlay(!showWisdomOverlay)}
                                        className="text-black hover:rotate-90 transition-all duration-300 outline-none w-8 h-8 flex items-center justify-center relative top-[1px]"
                                    >
                                        <i className="pi pi-cog text-[24px]"></i>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (audioRef.current && !audioRef.current.paused) {
                                                audioRef.current.pause();
                                            }
                                            setShowAudioPlayer(false);
                                            setIsPlaying(false);
                                            setShowWisdomOverlay(false);
                                        }}
                                        className="text-black hover:text-red-500 hover:scale-110 active:scale-95 transition-all duration-300 outline-none w-8 h-8 flex items-center justify-center ml-1"
                                    >
                                        <i className="pi pi-times-circle text-[22px]"></i>
                                    </button>
                                </div>
                            </div>

                            {/* Wisdom Overlay Popup rendered directly below the player inside wrapper */}
                            {showWisdomOverlay && (
                                <div
                                    className="absolute bottom-[calc(100%+8px)] w-full shadow-[0_-10px_30px_rgba(0,0,0,0.5)] rounded-[4px] overflow-hidden animate-slide-up-fade"
                                    data-nodrag="true"
                                >
                                    <WisdomOverlay
                                        onPencilClick={(color) => {
                                            setPlayerBgColor(color);
                                        }}
                                        onLetterClick={(color) => {
                                            setPlayerBorderColor(color);
                                        }}
                                    />
                                </div>
                            )}

                        </div>
                    </DraggableWrapper>
                )}
            </div>
        </div>
    );
};

export default BookIndex;
"""

bottomInsertionTarget = """            </div>
        </div>
    );
};

export default BookIndex;"""

bookindex_content = bookindex_content.replace(bottomInsertionTarget, renderBottomInjections)

with open(bookindex_path, 'w', encoding='utf-8') as f:
    f.write(bookindex_content)
    
print("Merge complete!")
