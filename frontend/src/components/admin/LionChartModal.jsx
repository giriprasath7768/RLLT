import React, { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Slider } from 'primereact/slider';
import { InputSwitch } from 'primereact/inputswitch';
import html2canvas from 'html2canvas';

const FONTS = [
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Times New Roman', value: '"Times New Roman", serif' },
    { label: 'Impact', value: 'Impact, sans-serif' },
    { label: 'Courier New', value: '"Courier New", monospace' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
    { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
    { label: 'Palatino Linotype', value: '"Palatino Linotype", Book Antiqua, Palatino, serif' },
    { label: 'Lucida Sans Unicode', value: '"Lucida Sans Unicode", "Lucida Grande", sans-serif' }
];

const DEFAULT_ABBR = [
    "ET GO ALL EXCUSES NOW",
    "DENTIFY YOUR GOALS AND PRIORITIES",
    "VERCOME PROCRASTINATION TAKE ACTION NOW",
    "URTURE GOOD HABITS AND DISCIPLINE",
    "TRIVE FOR EXCELLENCE IN EVERYTHING"
];

const LionChartModal = ({ visible, onHide, onInsert }) => {
    const [acronym, setAcronym] = useState('LIONS');
    const [topBgColor, setTopBgColor] = useState('#8b0000'); // dark red
    const [bottomBgColor, setBottomBgColor] = useState('#eab308'); // yellow
    const [topTextColor, setTopTextColor] = useState('#3b82f6'); // blue
    const [bottomTextColor, setBottomTextColor] = useState('#a3e635'); // lime-400
    const [abbrTextColor, setAbbrTextColor] = useState('#dc2626'); // red-600
    const [fontFamily, setFontFamily] = useState(FONTS[2].value); // Impact
    const [isBold, setIsBold] = useState(true);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [letterGap, setLetterGap] = useState(50); // pixels
    const [lineSpacing, setLineSpacing] = useState(24); // pixels
    const [borderRadius, setBorderRadius] = useState(0); // pixels
    const [abbreviations, setAbbreviations] = useState(DEFAULT_ABBR);
    const [showVertical, setShowVertical] = useState(true);

    const chartRef = useRef(null);

    const handleInsert = async () => {
        if (!chartRef.current) return;
        try {
            const canvas = await html2canvas(chartRef.current, { backgroundColor: null, scale: 2 });
            const base64Img = canvas.toDataURL('image/png');
            onInsert(base64Img);
            onHide();
        } catch (error) {
            console.error("Failed to generate chart image", error);
        }
    };

    const handleAbbrChange = (index, value) => {
        const newAbbr = [...abbreviations];
        newAbbr[index] = value;
        setAbbreviations(newAbbr);
    };

    const renderPreview = () => {
        return (
            <div ref={chartRef} className="bg-white p-4 inline-block w-full" style={{ fontFamily }}>
                {/* Top Banner Box */}
                <div 
                    className="border-8 border-gray-500 overflow-hidden"
                    style={{ borderRadius: `${borderRadius}px` }}
                >
                    {/* Top Section - Acronym */}
                    <div 
                        className="py-6 px-4 flex justify-center items-center"
                        style={{ backgroundColor: topBgColor, gap: `${letterGap}px` }}
                    >
                        {acronym.split('').map((letter, i) => (
                            <span 
                                key={i} 
                                className={`text-7xl tracking-wider ${isBold ? 'font-bold' : ''} ${isItalic ? 'italic' : ''} ${isUnderline ? 'underline' : ''}`}
                                style={{ 
                                    color: topTextColor, 
                                    textShadow: '-2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff' 
                                }}
                            >
                                {letter}.
                            </span>
                        ))}
                    </div>

                    {/* Bottom Section - EXCUSES... */}
                    <div 
                        className="py-3 px-4 text-center"
                        style={{ backgroundColor: bottomBgColor }}
                    >
                        <span 
                            className={`text-4xl tracking-widest ${isBold ? 'font-bold' : ''} ${isItalic ? 'italic' : ''} ${isUnderline ? 'underline' : ''}`}
                            style={{ color: bottomTextColor }}
                        >
                            EXCUSES STOP YOU FROM GROWING
                        </span>
                    </div>
                </div>

                {/* Vertical Abbreviations */}
                {showVertical && (
                    <div className="mt-8 ml-12 flex flex-col" style={{ gap: `${lineSpacing}px` }}>
                        {acronym.split('').map((letter, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span 
                                    className={`text-6xl ${isBold ? 'font-bold' : ''} ${isItalic ? 'italic' : ''} ${isUnderline ? 'underline' : ''}`}
                                    style={{ 
                                        color: topTextColor, 
                                        textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0px 0px 4px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    {letter}
                                </span>
                                <span 
                                    className={`text-3xl mt-3 uppercase ${isBold ? 'font-bold' : ''} ${isItalic ? 'italic' : ''} ${isUnderline ? 'underline' : ''}`}
                                    style={{ color: abbrTextColor }}
                                >
                                    {abbreviations[i] || ''}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            header="LION Chart Configuration"
            style={{ width: '90vw', maxWidth: '1400px' }}
            maximizable
            modal
        >
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Controls Panel */}
                <div className="w-full lg:w-1/3 flex flex-col gap-5 p-4 bg-gray-50 rounded-lg border border-gray-200 overflow-y-auto max-h-[70vh] relative">
                    <h3 className="font-bold text-lg text-gray-800 border-b pb-2">Customization Options</h3>
                    
                    <div className="flex flex-col gap-4">
                        {/* Acronym Text */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Acronym Text</label>
                            <InputText 
                                value={acronym} 
                                onChange={(e) => setAcronym(e.target.value.toUpperCase())} 
                                className="w-full" 
                                placeholder="E.g., LIONS, ANT"
                            />
                        </div>

                        {/* Font Style */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Font Style</label>
                            <div className="flex gap-2">
                                <Dropdown 
                                    value={fontFamily} 
                                    options={FONTS} 
                                    onChange={(e) => setFontFamily(e.value)} 
                                    className="w-full" 
                                />
                                <Button icon="pi pi-bold" tooltip="Bold" className={`p-button-sm shrink-0 ${isBold ? '' : 'p-button-outlined'}`} onClick={() => setIsBold(!isBold)} />
                                <Button icon="pi pi-italic" tooltip="Italic" className={`p-button-sm shrink-0 ${isItalic ? '' : 'p-button-outlined'}`} onClick={() => setIsItalic(!isItalic)} />
                                <Button icon="pi pi-underline" tooltip="Underline" className={`p-button-sm shrink-0 ${isUnderline ? '' : 'p-button-outlined'}`} onClick={() => setIsUnderline(!isUnderline)} />
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Top Banner BG</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={topBgColor} onChange={(e) => setTopBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                                    <span className="text-xs text-gray-500 uppercase">{topBgColor}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Bottom Banner BG</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={bottomBgColor} onChange={(e) => setBottomBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                                    <span className="text-xs text-gray-500 uppercase">{bottomBgColor}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Top Text Color</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={topTextColor} onChange={(e) => setTopTextColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                                    <span className="text-xs text-gray-500 uppercase">{topTextColor}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Bottom Text Color</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={bottomTextColor} onChange={(e) => setBottomTextColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                                    <span className="text-xs text-gray-500 uppercase">{bottomTextColor}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Abbr Text Color</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={abbrTextColor} onChange={(e) => setAbbrTextColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                                    <span className="text-xs text-gray-500 uppercase">{abbrTextColor}</span>
                                </div>
                            </div>
                        </div>

                        {/* Sliders */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Letter Gap: {letterGap}px
                            </label>
                            <Slider value={letterGap} onChange={(e) => setLetterGap(e.value)} min={0} max={200} />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Vertical Line Spacing: {lineSpacing}px
                            </label>
                            <Slider value={lineSpacing} onChange={(e) => setLineSpacing(e.value)} min={0} max={100} />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Shape Border Radius: {borderRadius}px
                            </label>
                            <Slider value={borderRadius} onChange={(e) => setBorderRadius(e.value)} min={0} max={100} />
                        </div>

                        {/* Vertical Abbreviations */}
                        <div className="pt-4 border-t">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-sm font-semibold text-gray-700">Show Vertical Abbreviations</label>
                                <InputSwitch checked={showVertical} onChange={(e) => setShowVertical(e.value)} />
                            </div>

                            {showVertical && (
                                <div className="flex flex-col gap-3">
                                    {acronym.split('').map((letter, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="font-bold text-lg w-6 text-center">{letter}</span>
                                            <InputText 
                                                value={abbreviations[i] || ''} 
                                                onChange={(e) => handleAbbrChange(i, e.target.value)} 
                                                className="w-full p-inputtext-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="sticky bottom-0 left-0 w-full bg-gray-50 border-t border-gray-200 mt-auto pt-4 pb-2 z-10 flex justify-end shadow-[0_-10px_15px_-3px_rgba(249,250,251,1)]">
                        <Button label="Move to Word's Page" icon="pi pi-arrow-right" onClick={handleInsert} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded shadow-md border-none" />
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="w-full lg:w-2/3 bg-gray-200 border border-gray-300 border-dashed rounded-lg flex items-start justify-center p-8 overflow-auto min-h-[500px]">
                    <div className="shadow-2xl max-w-full">
                        {renderPreview()}
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default LionChartModal;
