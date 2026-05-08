import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

const InteractiveNodeView = ({ node, updateAttributes, getPos, selected, editor, extension }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [puzzleModalOpen, setPuzzleModalOpen] = useState(false);
    const [puzzlePieces, setPuzzlePieces] = useState(10);
    const [textConfigOpen, setTextConfigOpen] = useState(false);
    const containerRef = useRef(null);

    const { 
        width = 200, 
        height = 'auto', 
        left = 0, 
        top = 0, 
        position = 'static', 
        locked = false,
        puzzle,
        svgFill,
        svgStroke,
        textConfig = {
            fontSize: 16, fontFamily: 'Inter, sans-serif', fontWeight: 'normal',
            fontStyle: 'normal', textAlign: 'left', letterSpacing: 0, color: '#000000'
        }
    } = node.attrs;

    const getValidDim = (val, defaultVal, isWidth) => {
        if (val === undefined || val === null || val === '') return defaultVal;
        if (val === 'auto') return isWidth ? 'max-content' : 'auto';
        if (typeof val === 'string' && (val.endsWith('px') || val.endsWith('%') || val.endsWith('vw') || val.endsWith('vh') || val === 'max-content')) {
            return val;
        }
        return `${val}px`;
    };

    const safeWidth = getValidDim(width, '200px', true);
    const safeHeight = getValidDim(height, 'auto', false);

    const isImage = node.type.name === 'image' || node.type.name === 'resizableImage';
    const isShape = node.type.name === 'shape';
    const isTextBox = node.type.name === 'textbox';

    const HANDLE_SIZE = 12;
    const handles = [
        { dir: 'nw', cursor: 'nwse-resize', top: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2 },
        { dir: 'ne', cursor: 'nesw-resize', top: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2 },
        { dir: 'sw', cursor: 'nesw-resize', bottom: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2 },
        { dir: 'se', cursor: 'nwse-resize', bottom: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2 },
        { dir: 'n', cursor: 'ns-resize', top: -HANDLE_SIZE/2, left: '50%', transform: 'translateX(-50%)' },
        { dir: 's', cursor: 'ns-resize', bottom: -HANDLE_SIZE/2, left: '50%', transform: 'translateX(-50%)' },
        { dir: 'e', cursor: 'ew-resize', top: '50%', right: -HANDLE_SIZE/2, transform: 'translateY(-50%)' },
        { dir: 'w', cursor: 'ew-resize', top: '50%', left: -HANDLE_SIZE/2, transform: 'translateY(-50%)' },
    ];

    const handleResizeStart = (e, dir) => {
        if (locked) return;
        e.preventDefault();
        e.stopPropagation();

        const startX = e.touches ? e.touches[0].clientX : e.clientX;
        const startY = e.touches ? e.touches[0].clientY : e.clientY;
        
        // Wait, how do we get the current zoomLevel? 
        // It might be on window, or we can just read it from a data attribute on the editor.
        const zoomLevelStr = document.querySelector('.ql-editor, .ProseMirror')?.style.zoom || '1';
        const zoomLevel = parseFloat(zoomLevelStr);

        const startWidth = containerRef.current.offsetWidth;
        const startHeight = containerRef.current.offsetHeight;
        const startLeft = parseFloat(left) || 0;
        const startTop = parseFloat(top) || 0;

        const onMove = (moveEvent) => {
            const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const currentY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

            const dx = (currentX - startX) / zoomLevel;
            const dy = (currentY - startY) / zoomLevel;

            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;

            if (dir.includes('e')) newWidth = startWidth + dx;
            if (dir.includes('s')) newHeight = startHeight + dy;
            if (dir.includes('w')) {
                newWidth = startWidth - dx;
                newLeft = startLeft + dx;
            }
            if (dir.includes('n')) {
                newHeight = startHeight - dy;
                newTop = startTop + dy;
            }

            if (isImage) {
                if (['nw', 'ne', 'sw', 'se'].includes(dir)) {
                    const ratio = startWidth / startHeight;
                    if (newWidth / newHeight > ratio) {
                        newWidth = newHeight * ratio;
                    } else {
                        newHeight = newWidth / ratio;
                    }
                }
            }

            if (newWidth > 20 && newHeight > 20) {
                updateAttributes({ width: newWidth, height: newHeight, left: newLeft, top: newTop });
            }
        };

        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onUp);
    };

    const handleDragStart = (e) => {
        if (locked) return;
        
        const startX = e.touches ? e.touches[0].clientX : e.clientX;
        const startY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const zoomLevelStr = document.querySelector('.ql-editor, .ProseMirror')?.style.zoom || '1';
        const zoomLevel = parseFloat(zoomLevelStr);

        let startLeft = parseFloat(left) || 0;
        let startTop = parseFloat(top) || 0;
        let hasMoved = false;
        let isAbsolute = position === 'absolute';

        const onMove = (moveEvent) => {
            const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const currentY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
            
            const dx = (currentX - startX) / zoomLevel;
            const dy = (currentY - startY) / zoomLevel;

            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                hasMoved = true;
            }

            if (hasMoved) {
                if (!isAbsolute) {
                    isAbsolute = true;
                    if (containerRef.current) {
                        startLeft = containerRef.current.offsetLeft;
                        startTop = containerRef.current.offsetTop;
                    }
                    updateAttributes({ position: 'absolute', left: startLeft + dx, top: startTop + dy });
                } else {
                    updateAttributes({ left: startLeft + dx, top: startTop + dy });
                }
            }
        };

        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onUp);
    };

    // Render Content Inner
    const renderContent = () => {
        if (isImage) {
            return (
                <img 
                    src={node.attrs.src} 
                    alt={node.attrs.alt || ''}
                    style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block', pointerEvents: 'none' }} 
                />
            );
        }
        if (isShape) {
            return (
                <div 
                    dangerouslySetInnerHTML={{ __html: node.attrs.svg }} 
                    style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
            );
        }
        if (isTextBox) {
            return (
                <textarea
                    value={node.attrs.text}
                    onChange={(e) => updateAttributes({ text: e.target.value })}
                    style={{
                        width: '100%',
                        height: '100%',
                        resize: 'none',
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        fontSize: `${textConfig.fontSize}px`,
                        fontFamily: textConfig.fontFamily,
                        fontWeight: textConfig.fontWeight,
                        fontStyle: textConfig.fontStyle,
                        textAlign: textConfig.textAlign,
                        letterSpacing: `${textConfig.letterSpacing}px`,
                        color: textConfig.color,
                        padding: '8px'
                    }}
                    placeholder="Enter text..."
                />
            );
        }
        return null;
    };

    // Typography update helper
    const updateTextStyle = (key, value) => {
        updateAttributes({ textConfig: { ...textConfig, [key]: value } });
    };

    const applyPuzzle = () => {
        // Simple puzzle mock or real logic
        const pieces = parseInt(puzzlePieces, 10) || 10;
        const canvas = document.createElement('canvas');
        canvas.width = parseFloat(width) || 200;
        canvas.height = parseFloat(height) || 150;
        const ctx = canvas.getContext('2d');
        
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        // Just store a placeholder puzzle data URL for now
        updateAttributes({ puzzle: canvas.toDataURL() });
        setPuzzleModalOpen(false);
    };

    return (
        <NodeViewWrapper 
            as="div"
            className={`relative inline-block ${selected || isHovered ? 'ring-2 ring-blue-500' : ''}`}
            style={{
                position: position === 'absolute' ? 'absolute' : 'relative',
                left: position === 'absolute' ? `${left}px` : 'auto',
                top: position === 'absolute' ? `${top}px` : 'auto',
                width: safeWidth,
                height: safeHeight,
                maxWidth: position === 'absolute' ? 'none' : '100%',
                zIndex: position === 'absolute' ? 10 : 1,
                cursor: position === 'absolute' && !locked ? 'move' : 'default',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseDown={!locked ? handleDragStart : undefined}
            onTouchStart={!locked ? handleDragStart : undefined}
            ref={containerRef}
        >
            {renderContent()}

            {/* Puzzle Overlay */}
            {puzzle && (
                <div 
                    className="absolute inset-0 pointer-events-none" 
                    style={{ backgroundImage: `url(${puzzle})`, backgroundSize: '100% 100%', zIndex: 5 }} 
                />
            )}

            {/* Resize Handles & Toolbar when Selected */}
            {selected && (
                <>
                    {handles.map((h, i) => (
                        <div
                            key={i}
                            className="absolute bg-white border-2 border-blue-500 rounded-full shadow-sm pointer-events-auto"
                            style={{
                                width: HANDLE_SIZE, height: HANDLE_SIZE, cursor: h.cursor,
                                top: h.top, left: h.left, right: h.right, bottom: h.bottom,
                                transform: h.transform
                            }}
                            onMouseDown={(e) => handleResizeStart(e, h.dir)}
                            onTouchStart={(e) => handleResizeStart(e, h.dir)}
                        />
                    ))}

                    <div className="absolute top-0 -right-10 flex flex-col gap-1 pointer-events-auto z-50">
                        {/* Lock */}
                        <button 
                            className={`w-8 h-8 flex items-center justify-center bg-white border rounded shadow ${locked ? 'text-red-500 border-red-300 bg-red-50' : 'text-gray-600 hover:bg-gray-50'}`}
                            onClick={(e) => { e.stopPropagation(); updateAttributes({ locked: !locked }); }}
                            title="Lock Element"
                        >
                            <i className={`pi ${locked ? 'pi-lock' : 'pi-lock-open'} text-xs`}></i>
                        </button>

                        {/* Layout Mode */}
                        <button 
                            className="w-8 h-8 flex items-center justify-center bg-white border rounded shadow text-gray-600 hover:bg-gray-50"
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                updateAttributes({ position: position === 'absolute' ? 'static' : 'absolute' }); 
                            }}
                            title="Toggle Wrap/Absolute Position"
                        >
                            <i className="pi pi-images text-xs"></i>
                        </button>

                        {/* Puzzle Icon */}
                        {!isShape && (
                            <button 
                                className="w-8 h-8 flex items-center justify-center bg-white border rounded shadow text-blue-500 hover:bg-blue-50"
                                onClick={(e) => { e.stopPropagation(); setPuzzleModalOpen(true); }}
                                title="Convert to Puzzle"
                            >
                                <i className="pi pi-th-large text-xs"></i>
                            </button>
                        )}

                        {/* Shape Colors */}
                        {isShape && (
                            <>
                                <div className="w-8 h-8 flex items-center justify-center bg-white border rounded shadow hover:bg-gray-50 relative overflow-hidden" title="Inner Color">
                                    <input 
                                        type="color" 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                        value={svgFill}
                                        onChange={(e) => updateAttributes({ svgFill: e.target.value })}
                                    />
                                    <i className="pi pi-palette text-xs text-blue-500 pointer-events-none"></i>
                                </div>
                                <div className="w-8 h-8 flex items-center justify-center bg-white border rounded shadow hover:bg-gray-50 relative overflow-hidden" title="Border Color">
                                    <input 
                                        type="color" 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                        value={svgStroke}
                                        onChange={(e) => updateAttributes({ svgStroke: e.target.value })}
                                    />
                                    <i className="pi pi-pencil text-xs text-gray-700 pointer-events-none"></i>
                                </div>
                            </>
                        )}

                        {/* TextBox Typography Settings */}
                        {isTextBox && (
                            <button 
                                className="w-8 h-8 flex items-center justify-center bg-white border rounded shadow text-orange-500 hover:bg-orange-50"
                                onClick={(e) => { e.stopPropagation(); setTextConfigOpen(true); }}
                                title="Typography Settings"
                            >
                                <i className="pi pi-bars text-xs"></i>
                            </button>
                        )}

                        {/* Delete */}
                        <button 
                            className="w-8 h-8 flex items-center justify-center bg-white border rounded shadow text-red-500 hover:bg-red-50"
                            onClick={(e) => { e.stopPropagation(); editor.commands.deleteNode(node.type.name); }}
                            title="Delete Element"
                        >
                            <i className="pi pi-trash text-xs"></i>
                        </button>
                    </div>
                </>
            )}

            {/* Puzzle Modal */}
            {puzzleModalOpen && (
                <div 
                    className="absolute z-[200] bg-black/40 flex items-center justify-center p-2 backdrop-blur-sm pointer-events-auto rounded"
                    style={{ inset: -100 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-xs flex flex-col">
                        <div className="px-4 py-3 bg-gray-100 border-b flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 text-sm">Puzzle Setup</h3>
                            <button onClick={() => setPuzzleModalOpen(false)} className="text-gray-400 hover:text-red-500"><i className="pi pi-times"></i></button>
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            <label className="text-xs font-semibold">Pieces</label>
                            <input type="number" min="1" value={puzzlePieces} onChange={(e) => setPuzzlePieces(e.target.value)} className="border rounded px-2 py-1 text-sm" />
                            <button onClick={applyPuzzle} className="bg-blue-600 text-white font-bold py-1.5 rounded text-sm mt-2">Generate</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Typography Modal */}
            {textConfigOpen && (
                <div 
                    className="absolute z-[200] bg-black/40 flex items-center justify-center p-2 backdrop-blur-sm pointer-events-auto rounded"
                    style={{ inset: -200 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-sm flex flex-col">
                        <div className="px-4 py-3 bg-gray-100 border-b flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 text-sm">Typography Settings</h3>
                            <button onClick={() => setTextConfigOpen(false)} className="text-gray-400 hover:text-red-500"><i className="pi pi-times"></i></button>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                            <div>
                                <label className="block text-xs font-semibold mb-1">Font Family</label>
                                <select value={textConfig.fontFamily} onChange={(e) => updateTextStyle('fontFamily', e.target.value)} className="w-full border rounded text-sm p-1">
                                    <option value="Inter, sans-serif">Inter</option>
                                    <option value="'Times New Roman', serif">Times New Roman</option>
                                    <option value="'Courier New', monospace">Courier New</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Size (px)</label>
                                <input type="number" value={textConfig.fontSize} onChange={(e) => updateTextStyle('fontSize', parseInt(e.target.value))} className="w-full border rounded text-sm p-1" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Color</label>
                                <input type="color" value={textConfig.color} onChange={(e) => updateTextStyle('color', e.target.value)} className="w-full h-8 cursor-pointer" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Spacing (px)</label>
                                <input type="number" value={textConfig.letterSpacing} onChange={(e) => updateTextStyle('letterSpacing', parseFloat(e.target.value))} className="w-full border rounded text-sm p-1" />
                            </div>
                            <div className="col-span-2 flex justify-between mt-2">
                                <div className="flex gap-1">
                                    <button onClick={() => updateTextStyle('fontWeight', textConfig.fontWeight === 'bold' ? 'normal' : 'bold')} className={`p-1 rounded ${textConfig.fontWeight === 'bold' ? 'bg-gray-200' : ''}`}><i className="pi pi-bold"></i></button>
                                    <button onClick={() => updateTextStyle('fontStyle', textConfig.fontStyle === 'italic' ? 'normal' : 'italic')} className={`p-1 rounded ${textConfig.fontStyle === 'italic' ? 'bg-gray-200' : ''}`}><i className="pi pi-italic"></i></button>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => updateTextStyle('textAlign', 'left')} className={`p-1 rounded ${textConfig.textAlign === 'left' ? 'bg-gray-200' : ''}`}><i className="pi pi-align-left"></i></button>
                                    <button onClick={() => updateTextStyle('textAlign', 'center')} className={`p-1 rounded ${textConfig.textAlign === 'center' ? 'bg-gray-200' : ''}`}><i className="pi pi-align-center"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </NodeViewWrapper>
    );
};

export default InteractiveNodeView;
