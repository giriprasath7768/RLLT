import React, { useEffect, useState } from 'react';

export const transformationColors = [
    '#00C0FF', '#00A638', '#3340CD', '#FAFA33',
    '#BB43B1', '#FE6D01', '#FE0005'
];

export const TransformationColorPopup = ({ inputColors, setInputColors }) => {
    const [colorPopup, setColorPopup] = useState({ visible: false, x: 0, y: 0, targetId: null });

    useEffect(() => {
        const handleMouseUp = (e) => {
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && activeEl.id) {
                if (activeEl.selectionStart !== activeEl.selectionEnd) {
                    const rect = activeEl.getBoundingClientRect();
                    setColorPopup({
                        visible: true,
                        x: Math.max(100, e.clientX),
                        y: Math.max(20, rect.top - 60),
                        targetId: activeEl.id
                    });
                    return;
                }
            }
            if (!e.target.closest('.color-popup-container')) {
                setColorPopup({ visible: false, x: 0, y: 0, targetId: null });
            }
        };
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, []);

    return (
        <>
            <style>{`
                ${Object.entries(inputColors || {}).map(([id, color]) => `
                    #${id} { color: ${color} !important; }
                `).join('\n')}
            `}</style>

            {colorPopup.visible && (
                <div 
                    className="color-popup-container fixed z-[1000] bg-[#1a2234] border border-gray-600 rounded-lg p-3 shadow-2xl flex flex-col gap-3"
                    style={{ left: colorPopup.x, top: colorPopup.y, transform: 'translateX(-50%)' }}
                >
                    <span className="text-[#fadfc3] text-[13px] font-bold text-center tracking-wide">Transformation Colors</span>
                    <div className="flex gap-2 justify-center">
                        {transformationColors.map(color => (
                            <button
                                key={color}
                                onClick={() => {
                                    if (setInputColors) setInputColors(prev => ({ ...prev, [colorPopup.targetId]: color }));
                                    setColorPopup({ visible: false, x: 0, y: 0, targetId: null });
                                }}
                                className="w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform shadow-md"
                                style={{ backgroundColor: color, borderColor: 'rgba(255,255,255,0.4)' }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};
