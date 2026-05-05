import React, { useState, useEffect, useRef } from 'react';
import { Quill } from 'react-quill-new';

const ImageResizerOverlay = ({ selectedElement, setSelectedImage, quillRef, zoomLevel }) => {
    const [rect, setRect] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const overlayRef = useRef(null);

    const [puzzleModalOpen, setPuzzleModalOpen] = useState(false);
    const [puzzlePieces, setPuzzlePieces] = useState(10);
    
    // TextBox typography configuration state
    const [textConfigOpen, setTextConfigOpen] = useState(false);
    const [textConfig, setTextConfig] = useState({
        fontSize: 16,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        letterSpacing: 0,
        color: '#000000'
    });

    const updateRect = () => {
        if (!selectedElement || !quillRef.current) {
            setRect(null);
            return;
        }
        const editorContent = quillRef.current.getEditor().root;
        const editorRect = editorContent.getBoundingClientRect();
        const imgRect = selectedElement.getBoundingClientRect();

        setRect({
            top: (imgRect.top - editorRect.top) / zoomLevel,
            left: (imgRect.left - editorRect.left) / zoomLevel,
            width: imgRect.width / zoomLevel,
            height: imgRect.height / zoomLevel
        });
    };

    useEffect(() => {
        if (selectedElement) {
            updateRect();
            const interval = setInterval(updateRect, 100);
            
            // If it's a textbox, load its current styles into state
            if (selectedElement.classList.contains('custom-textbox')) {
                const textarea = selectedElement.querySelector('textarea');
                if (textarea) {
                    const computed = window.getComputedStyle(textarea);
                    setTextConfig({
                        fontSize: parseInt(computed.fontSize) || 16,
                        fontFamily: computed.fontFamily || 'Inter, sans-serif',
                        fontWeight: computed.fontWeight === '700' || computed.fontWeight === 'bold' ? 'bold' : 'normal',
                        fontStyle: computed.fontStyle === 'italic' ? 'italic' : 'normal',
                        textAlign: computed.textAlign || 'left',
                        letterSpacing: parseInt(computed.letterSpacing) || 0,
                        color: computed.color || '#000000'
                    });
                }
            }
            
            return () => clearInterval(interval);
        } else {
            setRect(null);
        }
    }, [selectedElement, zoomLevel]);

    useEffect(() => {
        const handleGlobalClick = (e) => {
            const isToolbar = e.target.closest('.ql-toolbar') || e.target.closest('#tnt7-word-toolbar') || e.target.closest('.word-toolbar-wrapper');
            if (isToolbar) return;

            if (
                selectedElement && 
                e.target !== selectedElement && 
                !selectedElement.contains(e.target) &&
                (!overlayRef.current || !overlayRef.current.contains(e.target))
            ) {
                setSelectedImage(null);
            }
        };
        document.addEventListener('mousedown', handleGlobalClick);
        document.addEventListener('touchstart', handleGlobalClick);
        return () => {
            document.removeEventListener('mousedown', handleGlobalClick);
            document.removeEventListener('touchstart', handleGlobalClick);
        };
    }, [selectedElement, setSelectedImage]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedElement) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                const activeTag = document.activeElement ? document.activeElement.tagName.toUpperCase() : '';
                if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
                    if (document.activeElement === selectedElement.querySelector('textarea')) {
                        if (document.activeElement.value !== '') {
                            return; // Has text, let native handle it
                        }
                    } else {
                        return; // Different input focused
                    }
                }

                if (quillRef.current) {
                    const editor = quillRef.current.getEditor();
                    const blot = Quill.find(selectedElement);
                    if (blot) {
                        const index = editor.getIndex(blot);
                        if (index != null) {
                            editor.deleteText(index, 1);
                            setSelectedImage(null);
                            e.preventDefault();
                        }
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedElement, quillRef, setSelectedImage]);

    if (!selectedElement || !rect) return null;

    if (selectedElement.tagName === 'IMG' && selectedElement.src && selectedElement.src.startsWith('data:image/svg+xml;base64,')) {
        return null;
    }

    const handleDragStart = (e) => {
        if (!selectedElement || selectedElement.getAttribute('data-locked') === 'true') return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);

        const startX = e.touches ? e.touches[0].clientX : e.clientX;
        const startY = e.touches ? e.touches[0].clientY : e.clientY;
        const startLeft = rect.left;
        const startTop = rect.top;

        // Ensure image is absolutely positioned
        if (selectedElement.style.position !== 'absolute') {
            selectedElement.style.position = 'absolute';
            // Also need to push this to Quill delta
            const editor = quillRef.current.getEditor();
            const blot = Quill.find(selectedElement);
            if (blot) {
                const index = editor.getIndex(blot);
                // Keep image as absolute in DOM, Quill handles attributors if registered
            }
        }

        const handleMove = (moveEvent) => {
            const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const currentY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
            
            const dx = (currentX - startX) / zoomLevel;
            const dy = (currentY - startY) / zoomLevel;

            const newLeft = startLeft + dx;
            const newTop = startTop + dy;

            selectedElement.style.left = `${newLeft}px`;
            selectedElement.style.top = `${newTop}px`;
            updateRect();
        };

        const handleUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleUp);
            saveFormat();
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleUp);
    };

    const handleResizeStart = (e, direction) => {
        if (!selectedElement || selectedElement.getAttribute('data-locked') === 'true') return;
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);

        const startX = e.touches ? e.touches[0].clientX : e.clientX;
        const startY = e.touches ? e.touches[0].clientY : e.clientY;
        const startWidth = rect.width;
        const startHeight = rect.height;
        const startLeft = rect.left;
        const startTop = rect.top;

        const handleMove = (moveEvent) => {
            const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const currentY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

            const dx = (currentX - startX) / zoomLevel;
            const dy = (currentY - startY) / zoomLevel;

            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;

            if (direction.includes('e')) newWidth = startWidth + dx;
            if (direction.includes('s')) newHeight = startHeight + dy;
            if (direction.includes('w')) {
                newWidth = startWidth - dx;
                newLeft = startLeft + dx;
            }
            if (direction.includes('n')) {
                newHeight = startHeight - dy;
                newTop = startTop + dy;
            }

            // Maintain aspect ratio for corners only if it's an image
            if (direction.length === 2 && selectedElement.tagName === 'IMG') {
                const ratio = startWidth / startHeight;
                if (newWidth / newHeight > ratio) {
                    newWidth = newHeight * ratio;
                    if (direction.includes('w')) newLeft = startLeft + (startWidth - newWidth);
                } else {
                    newHeight = newWidth / ratio;
                    if (direction.includes('n')) newTop = startTop + (startHeight - newHeight);
                }
            }

            if (newWidth > 20 && newHeight > 20) {
                selectedElement.style.width = `${newWidth}px`;
                selectedElement.style.height = `${newHeight}px`;
                if (direction.includes('w') || direction.includes('n')) {
                    selectedElement.style.position = 'absolute';
                    selectedElement.style.left = `${newLeft}px`;
                    selectedElement.style.top = `${newTop}px`;
                }
                updateRect();
            }
        };

        const handleUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleUp);
            saveFormat();
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleUp);
    };

    const saveFormat = () => {
        if (!quillRef.current || !selectedElement) return;
        const editor = quillRef.current.getEditor();
        // Trigger a tiny text change to ensure Quill saves the mutated DOM to its Delta
        const index = editor.getLength();
        editor.insertText(index, '\n');
        editor.deleteText(index, 1);
    };

    const updateTextStyle = (key, value) => {
        const newConfig = { ...textConfig, [key]: value };
        setTextConfig(newConfig);
        
        if (selectedElement && selectedElement.classList.contains('custom-textbox')) {
            const textarea = selectedElement.querySelector('textarea');
            if (textarea) {
                if (key === 'fontSize') textarea.style.fontSize = `${value}px`;
                else if (key === 'letterSpacing') textarea.style.letterSpacing = `${value}px`;
                else textarea.style[key] = value;
                saveFormat();
            }
        }
    };

    const applyPuzzle = () => {
        if (!selectedElement || !quillRef.current) return;
        
        const pieces = parseInt(puzzlePieces, 10) || 10;
        
        if (selectedElement.tagName === 'IMG') {
            const renderPuzzle = (src) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const imgRatio = img.width / img.height;
                    let rows = Math.max(1, Math.round(Math.sqrt(pieces / imgRatio)));
                    let cols = Math.max(1, Math.round(pieces / rows));

                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    const tileW = canvas.width / cols;
                    const tileH = canvas.height / rows;

                    ctx.lineWidth = Math.max(3, canvas.width * 0.003);
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
                    ctx.shadowColor = "rgba(0,0,0,0.6)";
                    ctx.shadowBlur = Math.max(4, canvas.width * 0.01);
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;

                    const drawHorizontalEdge = (x, y, w, dir) => {
                        const tabSize = w * 0.2;
                        ctx.save();
                        ctx.translate(x, y);
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(w * 0.35, 0);
                        ctx.bezierCurveTo(w * 0.35, dir * tabSize * 1.5, w * 0.65, dir * tabSize * 1.5, w * 0.65, 0);
                        ctx.lineTo(w, 0);
                        ctx.stroke();
                        ctx.restore();
                    };

                    const drawVerticalEdge = (x, y, h, dir) => {
                        const tabSize = h * 0.2;
                        ctx.save();
                        ctx.translate(x, y);
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(0, h * 0.35);
                        ctx.bezierCurveTo(dir * tabSize * 1.5, h * 0.35, dir * tabSize * 1.5, h * 0.65, 0, h * 0.65);
                        ctx.lineTo(0, h);
                        ctx.stroke();
                        ctx.restore();
                    };

                for (let r = 1; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const dir = (r + c) % 2 === 0 ? 1 : -1;
                        drawHorizontalEdge(c * tileW, r * tileH, tileW, dir);
                    }
                }

                    for (let c = 1; c < cols; c++) {
                        for (let r = 0; r < rows; r++) {
                            const dir = (r + c) % 2 === 0 ? 1 : -1;
                            drawVerticalEdge(c * tileW, r * tileH, tileH, dir);
                        }
                    }

                    try {
                        selectedElement.setAttribute('src', canvas.toDataURL('image/png'));
                        saveFormat();
                    } catch (e) {
                        console.error("Tainted canvas: Could not save puzzle image", e);
                        alert("Could not process image due to cross-origin security restrictions.");
                    }
                };
                img.src = src;
            };

            if (selectedElement.src.startsWith('http')) {
                // Use cache buster to avoid browser returning opaque cached response without CORS headers
                const fetchUrl = selectedElement.src + (selectedElement.src.includes('?') ? '&' : '?') + 'cb=' + new Date().getTime();
                fetch(fetchUrl, { mode: 'cors' })
                    .then(res => res.blob())
                    .then(blob => {
                        const reader = new FileReader();
                        reader.onload = () => renderPuzzle(reader.result);
                        reader.readAsDataURL(blob);
                    }).catch(err => {
                        console.error("Fetch failed (CORS issue), trying direct", err);
                        renderPuzzle(selectedElement.src);
                    });
            } else {
                renderPuzzle(selectedElement.src);
            }
        } else if (selectedElement.classList.contains('custom-textbox')) {
            const rectObj = selectedElement.getBoundingClientRect();
            const width = rectObj.width / zoomLevel;
            const height = rectObj.height / zoomLevel;
            const imgRatio = width / height;
            
            let rows = Math.max(1, Math.round(Math.sqrt(pieces / imgRatio)));
            let cols = Math.max(1, Math.round(pieces / rows));

            const canvas = document.createElement('canvas');
            canvas.width = Math.max(200, width);
            canvas.height = Math.max(100, height);
            const ctx = canvas.getContext('2d');

            const tileW = canvas.width / cols;
            const tileH = canvas.height / rows;

            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(100, 100, 100, 0.4)";
            
            ctx.shadowColor = "rgba(255,255,255,0.8)";
            ctx.shadowBlur = 2;

            const drawHorizontalEdge = (x, y, w, dir) => {
                const tabSize = w * 0.2;
                ctx.save();
                ctx.translate(x, y);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(w * 0.35, 0);
                ctx.bezierCurveTo(w * 0.35, dir * tabSize * 1.5, w * 0.65, dir * tabSize * 1.5, w * 0.65, 0);
                ctx.lineTo(w, 0);
                ctx.stroke();
                ctx.restore();
            };

            const drawVerticalEdge = (x, y, h, dir) => {
                const tabSize = h * 0.2;
                ctx.save();
                ctx.translate(x, y);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, h * 0.35);
                ctx.bezierCurveTo(dir * tabSize * 1.5, h * 0.35, dir * tabSize * 1.5, h * 0.65, 0, h * 0.65);
                ctx.lineTo(0, h);
                ctx.stroke();
                ctx.restore();
            };

            for (let r = 1; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const dir = (r + c) % 2 === 0 ? 1 : -1;
                    drawHorizontalEdge(c * tileW, r * tileH, tileW, dir);
                }
            }

            for (let c = 1; c < cols; c++) {
                for (let r = 0; r < rows; r++) {
                    const dir = (r + c) % 2 === 0 ? 1 : -1;
                    drawVerticalEdge(c * tileW, r * tileH, tileH, dir);
                }
            }

            const dataUrl = canvas.toDataURL('image/png');
            
            // Remove old background if it was set incorrectly
            selectedElement.style.backgroundImage = '';
            
            selectedElement.setAttribute('data-puzzle', dataUrl);
            
            // Check if overlay already exists, update it, otherwise create it
            let overlay = selectedElement.querySelector('.puzzle-overlay');
            if (overlay) {
                overlay.style.backgroundImage = `url(${dataUrl})`;
            } else {
                overlay = document.createElement('div');
                overlay.classList.add('puzzle-overlay');
                overlay.style.position = 'absolute';
                overlay.style.inset = '0';
                overlay.style.pointerEvents = 'none';
                overlay.style.backgroundImage = `url(${dataUrl})`;
                overlay.style.backgroundSize = '100% 100%';
                overlay.style.zIndex = '10';
                selectedElement.appendChild(overlay);
            }
            
            saveFormat();
        }

        setPuzzleModalOpen(false);
    };

    const HANDLE_SIZE = 12;
    const handles = [
        { dir: 'nw', cursor: 'nwse-resize', top: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2 },
        { dir: 'ne', cursor: 'nesw-resize', top: -HANDLE_SIZE/2, left: rect.width - HANDLE_SIZE/2 },
        { dir: 'sw', cursor: 'nesw-resize', top: rect.height - HANDLE_SIZE/2, left: -HANDLE_SIZE/2 },
        { dir: 'se', cursor: 'nwse-resize', top: rect.height - HANDLE_SIZE/2, left: rect.width - HANDLE_SIZE/2 },
        { dir: 'n', cursor: 'ns-resize', top: -HANDLE_SIZE/2, left: rect.width/2 - HANDLE_SIZE/2 },
        { dir: 's', cursor: 'ns-resize', top: rect.height - HANDLE_SIZE/2, left: rect.width/2 - HANDLE_SIZE/2 },
        { dir: 'e', cursor: 'ew-resize', top: rect.height/2 - HANDLE_SIZE/2, left: rect.width - HANDLE_SIZE/2 },
        { dir: 'w', cursor: 'ew-resize', top: rect.height/2 - HANDLE_SIZE/2, left: -HANDLE_SIZE/2 },
    ];

    return (
        <div 
            ref={overlayRef}
            className="absolute z-50 pointer-events-none"
            style={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                border: '1.5px solid #3b82f6',
            }}
        >
            {/* Drag Handle Area */}
            <div 
                className="absolute inset-0 cursor-move"
                style={{ pointerEvents: selectedElement.tagName === 'IMG' ? 'auto' : 'none' }}
                onMouseDown={selectedElement.tagName === 'IMG' ? handleDragStart : undefined}
                onTouchStart={selectedElement.tagName === 'IMG' ? handleDragStart : undefined}
            />
            
            {/* Special border drag for TextBoxes */}
            {selectedElement.tagName !== 'IMG' && (
                <>
                    <div className="absolute top-0 left-0 right-0 h-3 cursor-move pointer-events-auto" onMouseDown={handleDragStart} onTouchStart={handleDragStart} />
                    <div className="absolute bottom-0 left-0 right-0 h-3 cursor-move pointer-events-auto" onMouseDown={handleDragStart} onTouchStart={handleDragStart} />
                    <div className="absolute top-0 bottom-0 left-0 w-3 cursor-move pointer-events-auto" onMouseDown={handleDragStart} onTouchStart={handleDragStart} />
                    <div className="absolute top-0 bottom-0 right-0 w-3 cursor-move pointer-events-auto" onMouseDown={handleDragStart} onTouchStart={handleDragStart} />
                </>
            )}

            {/* Resize Handles */}
            {handles.map((h, i) => (
                <div
                    key={i}
                    className="absolute bg-white border-2 border-blue-500 rounded-full pointer-events-auto shadow-sm"
                    style={{
                        width: HANDLE_SIZE,
                        height: HANDLE_SIZE,
                        top: h.top,
                        left: h.left,
                        cursor: h.cursor,
                    }}
                    onMouseDown={(e) => handleResizeStart(e, h.dir)}
                    onTouchStart={(e) => handleResizeStart(e, h.dir)}
                />
            ))}
            
            {/* Action Menu (Vertical) */}
            <div 
                className="absolute flex flex-col gap-1 pointer-events-auto"
                style={{
                    top: 0,
                    right: -32,
                }}
            >
                {/* Lock Utility */}
                <div 
                    className={`bg-white border rounded shadow-md flex items-center justify-center cursor-pointer transition-colors ${selectedElement.getAttribute('data-locked') === 'true' ? 'bg-red-50 border-red-300 text-red-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                    style={{ width: 24, height: 24 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        const isLocked = selectedElement.getAttribute('data-locked') === 'true';
                        selectedElement.setAttribute('data-locked', (!isLocked).toString());
                        saveFormat();
                        updateRect(); 
                    }}
                    title={selectedElement.getAttribute('data-locked') === 'true' ? "Unlock Position/Size" : "Lock Position/Size"}
                >
                    <i className={`pi ${selectedElement.getAttribute('data-locked') === 'true' ? 'pi-lock' : 'pi-lock-open'} text-xs`}></i>
                </div>

                {/* Layout Options Icon */}
                <div 
                    className="bg-white border border-gray-300 rounded shadow-md flex items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-600"
                    style={{ width: 24, height: 24 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (selectedElement.style.position === 'absolute') {
                            selectedElement.style.position = 'static';
                            selectedElement.style.left = '';
                            selectedElement.style.top = '';
                        } else {
                            selectedElement.style.position = 'absolute';
                            selectedElement.style.zIndex = '10';
                        }
                        saveFormat();
                        updateRect();
                    }}
                    title="Toggle Wrap/Absolute Position"
                >
                    <i className="pi pi-images text-xs"></i>
                </div>

                {/* Puzzle Icon */}
                {!selectedElement.classList.contains('custom-shape') && (
                    <div 
                        className="bg-white border border-gray-300 rounded shadow-md flex items-center justify-center cursor-pointer hover:bg-blue-50 text-blue-500"
                        style={{ width: 24, height: 24 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setPuzzleModalOpen(true);
                        }}
                        title="Convert to Puzzle"
                    >
                        <i className="pi pi-th-large text-xs"></i>
                    </div>
                )}

                {/* Shape Color Pickers */}
                {selectedElement.classList.contains('custom-shape') && (
                    <>
                        <div 
                            className="bg-white border border-gray-300 rounded shadow-md flex items-center justify-center cursor-pointer hover:bg-gray-50 relative overflow-hidden"
                            style={{ width: 24, height: 24 }}
                            title="Inner Color"
                        >
                            <input 
                                type="color" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                onChange={(e) => {
                                    const svg = selectedElement.querySelector('svg');
                                    if (svg) {
                                        svg.setAttribute('fill', e.target.value);
                                        svg.querySelectorAll('path, rect, circle, polygon, ellipse, line, polyline').forEach(el => {
                                            if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none') {
                                                el.setAttribute('fill', e.target.value);
                                            }
                                        });
                                        saveFormat();
                                    }
                                }}
                            />
                            <i className="pi pi-palette text-xs text-blue-500 pointer-events-none"></i>
                        </div>
                        <div 
                            className="bg-white border border-gray-300 rounded shadow-md flex items-center justify-center cursor-pointer hover:bg-gray-50 relative overflow-hidden"
                            style={{ width: 24, height: 24 }}
                            title="Border Color"
                        >
                            <input 
                                type="color" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                onChange={(e) => {
                                    const svg = selectedElement.querySelector('svg');
                                    if (svg) {
                                        svg.setAttribute('stroke', e.target.value);
                                        svg.querySelectorAll('path, rect, circle, polygon, ellipse, line, polyline').forEach(el => {
                                            if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
                                                el.setAttribute('stroke', e.target.value);
                                            }
                                        });
                                        saveFormat();
                                    }
                                }}
                            />
                            <i className="pi pi-pencil text-xs text-gray-700 pointer-events-none"></i>
                        </div>
                    </>
                )}

                {/* Text Typography Config */}
                {selectedElement.classList.contains('custom-textbox') && (
                    <div 
                        className="bg-white border border-gray-300 rounded shadow-md flex items-center justify-center cursor-pointer hover:bg-gray-50 text-orange-500"
                        style={{ width: 24, height: 24 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setTextConfigOpen(true);
                        }}
                        title="Typography Settings"
                    >
                        <i className="pi pi-bars text-xs"></i>
                    </div>
                )}


                {/* Delete Icon */}
                <div 
                    className="bg-white border border-gray-300 rounded shadow-md flex items-center justify-center cursor-pointer hover:bg-red-50 text-red-500"
                    style={{ width: 24, height: 24 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (quillRef.current) {
                            const editor = quillRef.current.getEditor();
                            const blot = Quill.find(selectedElement);
                            if (blot) {
                                const index = editor.getIndex(blot);
                                if (index != null) {
                                    editor.deleteText(index, 1);
                                    setSelectedImage(null);
                                }
                            }
                        }
                    }}
                    title="Delete Element"
                >
                    <i className="pi pi-trash text-xs"></i>
                </div>
            </div>

            {/* Puzzle Modal inside overlay */}
            {puzzleModalOpen && (
                <div 
                    className="absolute z-[200] bg-black/40 flex items-center justify-center p-2 backdrop-blur-sm pointer-events-auto print:hidden rounded"
                    style={{ inset: 0 }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-sm flex flex-col transform transition-all scale-100 opacity-100" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-4 bg-gray-100 border-b flex justify-between items-center bg-gradient-to-r from-gray-100 to-gray-50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <i className="pi pi-th-large text-blue-500 text-lg"></i>
                                Enter Puzzle Configuration
                            </h3>
                            <button onClick={() => setPuzzleModalOpen(false)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors focus:outline-none">
                                <i className="pi pi-times"></i>
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Pieces</label>
                                <input type="number" min="1" value={puzzlePieces} onChange={e => setPuzzlePieces(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                            <button onClick={() => setPuzzleModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors focus:outline-none">Cancel</button>
                            <button onClick={applyPuzzle} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg shadow cursor-pointer transition-transform hover:scale-105 focus:outline-none">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Text Config Modal inside overlay */}
            {textConfigOpen && (
                <div 
                    className="absolute z-[200] bg-black/40 flex items-center justify-center p-2 backdrop-blur-sm pointer-events-auto print:hidden rounded"
                    style={{ inset: -200 }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-sm flex flex-col transform transition-all scale-100 opacity-100" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-4 bg-gray-100 border-b flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <i className="pi pi-pencil text-orange-500 text-lg"></i>
                                Typography Settings
                            </h3>
                            <button onClick={() => setTextConfigOpen(false)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors focus:outline-none">
                                <i className="pi pi-times"></i>
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Font Family</label>
                                    <select 
                                        value={textConfig.fontFamily} 
                                        onChange={e => updateTextStyle('fontFamily', e.target.value)} 
                                        className="w-full border rounded px-2 py-1.5 text-sm"
                                    >
                                        <option value="Inter, sans-serif">Inter</option>
                                        <option value="'Times New Roman', serif">Times New Roman</option>
                                        <option value="'Courier New', monospace">Courier New</option>
                                        <option value="'Georgia', serif">Georgia</option>
                                        <option value="'Bungee Shade', cursive">Bungee Shade</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Font Size (px)</label>
                                    <input 
                                        type="number" min="8" max="200" 
                                        value={textConfig.fontSize} 
                                        onChange={e => updateTextStyle('fontSize', parseInt(e.target.value) || 16)} 
                                        className="w-full border rounded px-2 py-1.5 text-sm" 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Letter Spacing (px)</label>
                                    <input 
                                        type="number" min="-5" max="50" step="0.5"
                                        value={textConfig.letterSpacing} 
                                        onChange={e => updateTextStyle('letterSpacing', parseFloat(e.target.value) || 0)} 
                                        className="w-full border rounded px-2 py-1.5 text-sm" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Text Color</label>
                                    <input 
                                        type="color" 
                                        value={textConfig.color} 
                                        onChange={e => updateTextStyle('color', e.target.value)} 
                                        className="w-full h-8 border rounded cursor-pointer p-0" 
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 justify-between mt-2">
                                <div className="flex gap-1 bg-gray-100 p-1 rounded">
                                    <button 
                                        onClick={() => updateTextStyle('fontWeight', textConfig.fontWeight === 'bold' ? 'normal' : 'bold')}
                                        className={`w-8 h-8 rounded flex items-center justify-center ${textConfig.fontWeight === 'bold' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                                        title="Bold"
                                    ><i className="pi pi-bold"></i></button>
                                    <button 
                                        onClick={() => updateTextStyle('fontStyle', textConfig.fontStyle === 'italic' ? 'normal' : 'italic')}
                                        className={`w-8 h-8 rounded flex items-center justify-center ${textConfig.fontStyle === 'italic' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                                        title="Italic"
                                    ><i className="pi pi-italic"></i></button>
                                </div>
                                <div className="flex gap-1 bg-gray-100 p-1 rounded">
                                    <button 
                                        onClick={() => updateTextStyle('textAlign', 'left')}
                                        className={`w-8 h-8 rounded flex items-center justify-center ${textConfig.textAlign === 'left' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                                        title="Align Left"
                                    ><i className="pi pi-align-left"></i></button>
                                    <button 
                                        onClick={() => updateTextStyle('textAlign', 'center')}
                                        className={`w-8 h-8 rounded flex items-center justify-center ${textConfig.textAlign === 'center' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                                        title="Align Center"
                                    ><i className="pi pi-align-center"></i></button>
                                    <button 
                                        onClick={() => updateTextStyle('textAlign', 'right')}
                                        className={`w-8 h-8 rounded flex items-center justify-center ${textConfig.textAlign === 'right' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                                        title="Align Right"
                                    ><i className="pi pi-align-right"></i></button>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t flex justify-end">
                            <button onClick={() => setTextConfigOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg shadow cursor-pointer">Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageResizerOverlay;
