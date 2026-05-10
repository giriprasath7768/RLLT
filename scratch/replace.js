const fs = require('fs');

let file = 'i:\\RLLT\\Webapp\\frontend\\src\\components\\admin\\WordToolbar.jsx';
let code = fs.readFileSync(file, 'utf8');

const target1 = `        <div
            className="bg-white border-b px-2 py-1 flex flex-nowrap items-center gap-2 z-10 sticky top-0 shadow-sm text-sm overflow-x-auto custom-scrollbar"
            style={{ width: '100%' }}
        >
            <style>{\`
                .word-toolbar-wrapper::-webkit-scrollbar { display: none; }
                .word-toolbar-wrapper { overflow: visible !important; }
            \`}</style>`;
const repl1 = `        <div
            className="bg-white border-b z-10 sticky top-0 shadow-sm text-sm flex flex-col"
            style={{ width: '100%' }}
        >
            <style>{\`
                .word-toolbar-wrapper::-webkit-scrollbar { display: none; }
                .word-toolbar-wrapper { overflow: visible !important; }
            \`}</style>
            
            {/* FIRST ROW */}
            <div className="px-2 py-1 flex flex-nowrap items-center gap-2 overflow-x-auto custom-scrollbar w-full">`;
code = code.replace(target1, repl1);


// Hebrew
const hebrewTarget = `
                <button
                    onClick={() => setHebrewCalculatorOpen(true)}
                    className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-gray-100 text-gray-700 shrink-0"
                    title="Hebrew Calculator"
                >
                    <i className="pi pi-compass text-emerald-500"></i>
                    <span className="hidden xl:inline font-medium">Hebrew</span>
                </button>`;
code = code.replace(hebrewTarget, "");

// Greek
const greekTarget = `
                <button
                    onClick={() => setGreekCalculatorOpen(true)}
                    className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-gray-100 text-gray-700 shrink-0"
                    title="Greek Calculator"
                >
                    <i className="pi pi-compass text-emerald-500"></i>
                    <span className="hidden xl:inline font-medium">Greek</span>
                </button>`;
code = code.replace(greekTarget, "");

// Script
const scriptTarget = `
                <div className="relative border-r border-gray-200 pr-1 mr-1 shrink-0" ref={agScriptDropdownRef}>
                    <button
                        onClick={() => setAgScriptDropdownOpen(!agScriptDropdownOpen)}
                        className={\`flex items-center gap-1 px-2 py-1 rounded transition-colors \${agScriptDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'}\`}
                        title="Other Scripts"
                    >
                        <i className="pi pi-moon text-indigo-500"></i>
                        <span className="hidden xl:inline font-medium">Scripts</span>
                    </button>
                    <DropdownPortal isOpen={agScriptDropdownOpen} anchorRef={agScriptDropdownRef}>
                        <div className="w-48 bg-gray-900 border border-gray-700 shadow-2xl rounded-lg p-1 flex flex-col gap-1 text-gray-200 pointer-events-auto">
                            {Object.values(ANTI_GRAVITY_SCRIPTS)
                                .filter(script => script.id !== 'hebrew' && script.id !== 'greek')
                                .map(script => (
                                    <button
                                        key={script.id}
                                        onMouseDown={(e) => { e.preventDefault(); setAgScriptDropdownOpen(false); setViewerScript(script); }}
                                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded text-gray-300 transition-colors w-full text-left"
                                    >
                                        <i className="pi pi-compass text-emerald-500"></i>
                                        {script.name}
                                    </button>
                                ))}
                        </div>
                    </DropdownPortal>
                </div>`;
code = code.replace(scriptTarget, "");

// Country
const countryTarget = `
                <div className="relative border-r border-gray-200 pr-1 mr-1 shrink-0" ref={countryDropdownRef}>
                    <button
                        onClick={() => {
                            setCountryDropdownOpen(!countryDropdownOpen);
                            if (!countryDropdownOpen) setCountrySearchTerm('');
                        }}
                        className={\`flex items-center gap-1 px-2 py-1 rounded transition-colors \${countryDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'}\`}
                        title="Insert Country"
                    >
                        <i className="pi pi-globe text-emerald-600"></i>
                        <span className="hidden xl:inline font-medium">Country</span>
                    </button>
                    <DropdownPortal isOpen={countryDropdownOpen} anchorRef={countryDropdownRef}>
                        <div className="w-64 max-h-64 overflow-y-auto bg-white border border-gray-200 shadow-2xl rounded-lg py-1 flex flex-col custom-scrollbar relative">
                            <div className="px-2 pb-1 sticky top-0 bg-white z-10 border-b border-gray-100">
                                <div className="relative">
                                    <i className="pi pi-search absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                                    <input
                                        type="text"
                                        className="w-full text-sm pl-7 pr-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 bg-gray-50 focus:bg-white transition-colors"
                                        placeholder="Search country..."
                                        value={countrySearchTerm}
                                        onChange={(e) => setCountrySearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            {(UN_COUNTRIES || [])
                                .filter(code => {
                                    if (!countrySearchTerm) return true;
                                    const countryName = regionNames ? regionNames.of(code) : code;
                                    return countryName.toLowerCase().includes(countrySearchTerm.toLowerCase());
                                })
                                .map(code => {
                                const countryName = regionNames ? regionNames.of(code) : code;
                                return (
                                    <div key={code} className="flex items-center hover:bg-gray-100 transition-colors border-b border-gray-50 last:border-0 w-full group">
                                        <button
                                            onMouseDown={(e) => { e.preventDefault(); insertCountry(countryName); }}
                                            className="px-4 py-2 text-left text-gray-700 text-sm flex-1 truncate focus:outline-none"
                                            title={\`Insert \${countryName}\`}
                                        >
                                            {countryName}
                                        </button>
                                        <button
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                setCountryDropdownOpen(false);
                                                if (handleOpenMap) handleOpenMap(code, countryName);
                                            }}
                                            className="px-3 py-2 flex items-center justify-center border-l border-transparent group-hover:border-gray-200 focus:outline-none"
                                            title={\`Open Map for \${countryName}\`}
                                        >
                                            <img
                                                src={\`https://flagcdn.com/w40/\${code.toLowerCase()}.png\`}
                                                srcSet={\`https://flagcdn.com/w80/\${code.toLowerCase()}.png 2x\`}
                                                width="20"
                                                alt={code}
                                                className="block rounded-sm drop-shadow-sm hover:scale-125 transition-transform"
                                            />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </DropdownPortal>
                </div>`;
code = code.replace(countryTarget, "");

// Shape
const shapeTarget = `
                <div className="relative" ref={shapesDropdownRef}>
                    <button
                        onClick={() => setShapesDropdownOpen(!shapesDropdownOpen)}
                        className={\`flex items-center gap-1 px-2 py-1 rounded transition-colors \${shapesDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'} hidden xl:flex\`}
                        title="Shapes"
                    >
                        <i className="pi pi-clone text-purple-500"></i>
                        <span className="hidden xl:inline font-medium">Shapes</span>
                    </button>
                    <button
                        onClick={() => setShapesDropdownOpen(!shapesDropdownOpen)}
                        className={\`flex items-center gap-1 px-2 py-1 rounded transition-colors \${shapesDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'} xl:hidden\`}
                        title="Shapes"
                    >
                        <i className="pi pi-clone text-purple-500"></i>
                    </button>

                    <DropdownPortal isOpen={shapesDropdownOpen} anchorRef={shapesDropdownRef}>
                        <div className="w-80 bg-white border border-gray-200 shadow-2xl rounded-lg p-3 max-h-96 overflow-y-auto custom-scrollbar">
                            {Object.entries(SHAPES).map(([category, shapesList]) => (
                                <div key={category} className="mb-4 last:mb-0">
                                    <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">{category}</div>
                                    <div className="grid grid-cols-5 gap-2">
                                        {shapesList.map(shape => (
                                            <button
                                                key={shape.name}
                                                onMouseDown={(e) => { e.preventDefault(); insertShape(shape.svg); }}
                                                className="w-10 h-10 border border-gray-200 rounded flex items-center justify-center hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 text-gray-600 transition-colors bg-white focus:outline-none"
                                                title={shape.name}
                                                dangerouslySetInnerHTML={{ __html: shape.svg }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </DropdownPortal>
                </div>`;
code = code.replace(shapeTarget, "");

// Scroll
const scrollTarget = `
                <button
                    onClick={() => setScrollMenuOpen(true)}
                    className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-orange-50 text-[#8b5a2b] shrink-0"
                    title="Scroll Formats"
                >
                    <span className="text-lg leading-none">📜</span>
                    <span className="hidden xl:inline font-medium">Scroll</span>
                </button>`;
code = code.replace(scrollTarget, "");

// Books
const booksTarget = `
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="flex items-center gap-1 px-2 py-1 rounded transition-colors text-gray-600 hover:bg-blue-50 hover:text-blue-600 font-medium text-sm"
                    title="Open Bible Index"
                >
                    <i className="pi pi-book text-blue-500"></i>
                    Books
                </button>`;
code = code.replace(booksTarget, "");

// Emojis
const emojiTarget = `
                <div className="relative border-r border-gray-200 pr-1 mr-1" ref={emojiDropdownRef}>
                    <button
                        onClick={() => setEmojiDropdownOpen(!emojiDropdownOpen)}
                        className={\`flex items-center gap-1 px-2 py-1 rounded transition-colors \${emojiDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'}\`}
                        title="Insert Emoji"
                    >
                        <i className="pi pi-face-smile text-lg text-yellow-500"></i>
                        <span className="hidden lg:inline font-medium">Emoji</span>
                    </button>
                    <DropdownPortal isOpen={emojiDropdownOpen} anchorRef={emojiDropdownRef}>
                        <div className="w-72 max-h-64 overflow-y-auto bg-white border border-gray-200 shadow-2xl rounded-lg p-2 grid grid-cols-8 gap-1 custom-scrollbar">
                            {EMOJIS.map((emoji, idx) => (
                                <button
                                    key={idx}
                                    onMouseDown={(e) => { e.preventDefault(); insertEmoji(emoji); }}
                                    className="text-xl hover:bg-gray-100 rounded p-1 transition-transform hover:scale-125 focus:outline-none flex justify-center items-center"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </DropdownPortal>
                </div>`;
code = code.replace(emojiTarget, "");

// End Insert
const endTarget = `            </div>

            {/* Puzzle Configuration Modal */}`;

const secondRow = `            </div>
            
            {/* SECOND ROW */}
            <div className="flex flex-nowrap items-center gap-2 px-2 py-1 w-full overflow-x-auto custom-scrollbar border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => setHebrewCalculatorOpen(true)}
                        className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-gray-100 text-gray-700 shrink-0"
                        title="Hebrew Calculator"
                    >
                        <i className="pi pi-compass text-emerald-500"></i>
                        <span className="hidden xl:inline font-medium">Hebrew</span>
                    </button>

                    <button
                        onClick={() => setGreekCalculatorOpen(true)}
                        className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-gray-100 text-gray-700 shrink-0"
                        title="Greek Calculator"
                    >
                        <i className="pi pi-compass text-emerald-500"></i>
                        <span className="hidden xl:inline font-medium">Greek</span>
                    </button>

                    <div className="relative shrink-0" ref={agScriptDropdownRef}>
                        <button
                            onClick={() => setAgScriptDropdownOpen(!agScriptDropdownOpen)}
                            className={\`flex items-center gap-1 px-2 py-1 rounded transition-colors \${agScriptDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'}\`}
                            title="Other Scripts"
                        >
                            <i className="pi pi-moon text-indigo-500"></i>
                            <span className="hidden xl:inline font-medium">Scripts</span>
                        </button>
                        <DropdownPortal isOpen={agScriptDropdownOpen} anchorRef={agScriptDropdownRef}>
                            <div className="w-48 bg-gray-900 border border-gray-700 shadow-2xl rounded-lg p-1 flex flex-col gap-1 text-gray-200 pointer-events-auto">
                                {Object.values(ANTI_GRAVITY_SCRIPTS)
                                    .filter(script => script.id !== 'hebrew' && script.id !== 'greek')
                                    .map(script => (
                                        <button
                                            key={script.id}
                                            onMouseDown={(e) => { e.preventDefault(); setAgScriptDropdownOpen(false); setViewerScript(script); }}
                                            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded text-gray-300 transition-colors w-full text-left"
                                        >
                                            <i className="pi pi-compass text-emerald-500"></i>
                                            {script.name}
                                        </button>
                                    ))}
                            </div>
                        </DropdownPortal>
                    </div>

                    <div className="border-l border-gray-300 h-4 mx-1"></div>

                    <div className="relative shrink-0" ref={countryDropdownRef}>
                        <button
                            onClick={() => {
                                setCountryDropdownOpen(!countryDropdownOpen);
                                if (!countryDropdownOpen) setCountrySearchTerm('');
                            }}
                            className={\`flex items-center gap-1 px-2 py-1 rounded transition-colors \${countryDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'}\`}
                            title="Insert Country"
                        >
                            <i className="pi pi-globe text-emerald-600"></i>
                            <span className="hidden xl:inline font-medium">Country</span>
                        </button>
                        <DropdownPortal isOpen={countryDropdownOpen} anchorRef={countryDropdownRef}>
                            <div className="w-64 max-h-64 overflow-y-auto bg-white border border-gray-200 shadow-2xl rounded-lg py-1 flex flex-col custom-scrollbar relative">
                                <div className="px-2 pb-1 sticky top-0 bg-white z-10 border-b border-gray-100">
                                    <div className="relative">
                                        <i className="pi pi-search absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                                        <input
                                            type="text"
                                            className="w-full text-sm pl-7 pr-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 bg-gray-50 focus:bg-white transition-colors"
                                            placeholder="Search country..."
                                            value={countrySearchTerm}
                                            onChange={(e) => setCountrySearchTerm(e.target.value)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                {(UN_COUNTRIES || [])
                                    .filter(code => {
                                        if (!countrySearchTerm) return true;
                                        const countryName = regionNames ? regionNames.of(code) : code;
                                        return countryName.toLowerCase().includes(countrySearchTerm.toLowerCase());
                                    })
                                    .map(code => {
                                    const countryName = regionNames ? regionNames.of(code) : code;
                                    return (
                                        <div key={code} className="flex items-center hover:bg-gray-100 transition-colors border-b border-gray-50 last:border-0 w-full group">
                                            <button
                                                onMouseDown={(e) => { e.preventDefault(); insertCountry(countryName); }}
                                                className="px-4 py-2 text-left text-gray-700 text-sm flex-1 truncate focus:outline-none"
                                                title={\`Insert \${countryName}\`}
                                            >
                                                {countryName}
                                            </button>
                                            <button
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setCountryDropdownOpen(false);
                                                    if (handleOpenMap) handleOpenMap(code, countryName);
                                                }}
                                                className="px-3 py-2 flex items-center justify-center border-l border-transparent group-hover:border-gray-200 focus:outline-none"
                                                title={\`Open Map for \${countryName}\`}
                                            >
                                                <img
                                                    src={\`https://flagcdn.com/w40/\${code.toLowerCase()}.png\`}
                                                    srcSet={\`https://flagcdn.com/w80/\${code.toLowerCase()}.png 2x\`}
                                                    width="20"
                                                    alt={code}
                                                    className="block rounded-sm drop-shadow-sm hover:scale-125 transition-transform"
                                                />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </DropdownPortal>
                    </div>

                    <div className="relative shrink-0" ref={shapesDropdownRef}>
                        <button
                            onClick={() => setShapesDropdownOpen(!shapesDropdownOpen)}
                            className={\`flex items-center gap-1 px-2 py-1 rounded transition-colors \${shapesDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'}\`}
                            title="Shapes"
                        >
                            <i className="pi pi-clone text-purple-500"></i>
                            <span className="hidden xl:inline font-medium">Shapes</span>
                        </button>
                        <DropdownPortal isOpen={shapesDropdownOpen} anchorRef={shapesDropdownRef}>
                            <div className="w-80 bg-white border border-gray-200 shadow-2xl rounded-lg p-3 max-h-96 overflow-y-auto custom-scrollbar">
                                {Object.entries(SHAPES).map(([category, shapesList]) => (
                                    <div key={category} className="mb-4 last:mb-0">
                                        <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">{category}</div>
                                        <div className="grid grid-cols-5 gap-2">
                                            {shapesList.map(shape => (
                                                <button
                                                    key={shape.name}
                                                    onMouseDown={(e) => { e.preventDefault(); insertShape(shape.svg); }}
                                                    className="w-10 h-10 border border-gray-200 rounded flex items-center justify-center hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 text-gray-600 transition-colors bg-white focus:outline-none"
                                                    title={shape.name}
                                                    dangerouslySetInnerHTML={{ __html: shape.svg }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </DropdownPortal>
                    </div>

                    <div className="border-l border-gray-300 h-4 mx-1"></div>

                    <button
                        onClick={() => setScrollMenuOpen(true)}
                        className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-orange-50 text-[#8b5a2b] shrink-0"
                        title="Scroll Formats"
                    >
                        <span className="text-lg leading-none">📜</span>
                        <span className="hidden xl:inline font-medium">Scroll</span>
                    </button>

                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="flex items-center gap-1 px-2 py-1 rounded transition-colors text-gray-600 hover:bg-blue-50 hover:text-blue-600 font-medium text-sm shrink-0"
                        title="Open Bible Index"
                    >
                        <i className="pi pi-book text-blue-500"></i>
                        <span className="hidden xl:inline font-medium">Books</span>
                    </button>

                    <div className="border-l border-gray-300 h-4 mx-1"></div>

                    <div className="relative shrink-0" ref={emojiDropdownRef}>
                        <button
                            onClick={() => setEmojiDropdownOpen(!emojiDropdownOpen)}
                            className={\`flex items-center gap-1 px-2 py-1 rounded transition-colors \${emojiDropdownOpen ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'}\`}
                            title="Insert Emoji"
                        >
                            <i className="pi pi-face-smile text-lg text-yellow-500"></i>
                            <span className="hidden xl:inline font-medium">Emoji</span>
                        </button>
                        <DropdownPortal isOpen={emojiDropdownOpen} anchorRef={emojiDropdownRef}>
                            <div className="w-72 max-h-64 overflow-y-auto bg-white border border-gray-200 shadow-2xl rounded-lg p-2 grid grid-cols-8 gap-1 custom-scrollbar">
                                {EMOJIS.map((emoji, idx) => (
                                    <button
                                        key={idx}
                                        onMouseDown={(e) => { e.preventDefault(); insertEmoji(emoji); }}
                                        className="text-xl hover:bg-gray-100 rounded p-1 transition-transform hover:scale-125 focus:outline-none flex justify-center items-center"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </DropdownPortal>
                    </div>
                </div>
            </div>
        </div>

        {/* Puzzle Configuration Modal */}`;

code = code.replace(endTarget, secondRow);

fs.writeFileSync(file, code);
console.log("Replaced successfully!");
