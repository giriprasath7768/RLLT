import React, { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';

const TypographyEditor = ({ title, config, setConfig, textValue, setTextValue, showAlignSpaceBetween, inputPlaceholder = "" }) => {
    return (
        <div className="flex flex-col gap-2 mb-4 bg-gray-50/50 p-3 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest">{title}</span>
                <div className="flex gap-1 border bg-white rounded p-1 shadow-sm">
                    <button onClick={() => setConfig({ ...config, align: 'left' })} className={`p-1 rounded text-xs w-6 h-6 flex items-center justify-center transition-colors ${config.align === 'left' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`} title="Left Align"><i className="pi pi-align-left"></i></button>
                    <button onClick={() => setConfig({ ...config, align: 'center' })} className={`p-1 rounded text-xs w-6 h-6 flex items-center justify-center transition-colors ${config.align === 'center' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`} title="Center Align"><i className="pi pi-align-center"></i></button>
                    <button onClick={() => setConfig({ ...config, align: 'right' })} className={`p-1 rounded text-xs w-6 h-6 flex items-center justify-center transition-colors ${config.align === 'right' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`} title="Right Align"><i className="pi pi-align-right"></i></button>
                    {showAlignSpaceBetween && (
                        <button onClick={() => setConfig({ ...config, align: 'space-between' })} className={`p-1 rounded text-xs w-6 h-6 flex items-center justify-center transition-colors ${config.align === 'space-between' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`} title="Space Between"><i className="pi pi-align-justify"></i></button>
                    )}
                </div>
            </div>

            <div className="flex gap-2 items-center">
                <select value={config.font} onChange={e => setConfig({ ...config, font: e.target.value })} className="border border-gray-300 p-1.5 rounded text-xs font-medium flex-1 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white shadow-sm">
                    <option value="'Times New Roman', serif">Times New Roman</option>
                    <option value="sans-serif">Sans Serif</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="'Courier New', monospace">Courier New</option>
                    <option value="Impact, sans-serif">Impact</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                </select>

                <div className="flex items-center border border-gray-300 rounded bg-white overflow-hidden shrink-0 shadow-sm">
                    <span className="text-[10px] text-gray-500 font-bold px-1.5 border-r border-gray-200 bg-gray-50">px</span>
                    <input type="number" min="10" max="120" value={config.size} onChange={e => setConfig({ ...config, size: parseInt(e.target.value) || 12 })} className="w-12 p-1.5 text-xs text-center focus:outline-none text-gray-900 bg-white" title="Font Size" />
                </div>

                <div className="flex gap-1 border border-gray-300 bg-white rounded p-1 shrink-0">
                    <button onClick={() => setConfig({ ...config, bold: !config.bold })} className={`p-1 rounded text-xs w-6 h-6 flex items-center justify-center transition-colors font-bold ${config.bold ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`} title="Bold">B</button>
                    <button onClick={() => setConfig({ ...config, italic: !config.italic })} className={`p-1 rounded text-xs w-6 h-6 flex items-center justify-center transition-colors font-serif italic ${config.italic ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`} title="Italic">I</button>
                    <button onClick={() => setConfig({ ...config, underline: !config.underline })} className={`p-1 rounded text-xs w-6 h-6 flex items-center justify-center transition-colors underline ${config.underline ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`} title="Underline">U</button>
                </div>
            </div>

            {setTextValue !== undefined && (
                <div className="mt-1">
                    <input type="text" value={textValue} onChange={e => setTextValue(e.target.value)} maxLength={showAlignSpaceBetween ? 12 : undefined} placeholder={inputPlaceholder} className="w-full border border-gray-300 p-2 rounded text-gray-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-inner mt-2" />
                </div>
            )}
        </div>
    );
};

const LionChartModal = ({ visible, onHide, onUpdate }) => {
    const toast = useRef(null);

    const [acronym, setAcronym] = useState("LIONS");
    const [bannerText, setBannerText] = useState("EXCUSES STOP YOU FROM GROWING");

    const [rows, setRows] = useState([
        "ET GO ALL EXCUSES NOW",
        "DENTIFY YOUR GOALS AND PRIORITIES",
        "VERCOME PROCRASTINATION TAKE ACTION NOW",
        "URTURE GOOD HABITS AND DISCIPLINE",
        "TRIVE FOR EXCELLENCE IN EVERYTHING"
    ]);

    const [bgColor, setBgColor] = useState("#8E0000");
    const [bannerColor, setBannerColor] = useState("#e8f110");
    const [titleColor, setTitleColor] = useState("#38bcf8");
    const [bannerTextColor, setBannerTextColor] = useState("#92c020");
    const [rowTextColor, setRowTextColor] = useState("#c00000");

    const [acronymConfig, setAcronymConfig] = useState({
        font: "'Times New Roman', serif", size: 60, bold: true, italic: false, underline: false, align: 'space-between'
    });

    const [bannerConfig, setBannerConfig] = useState({
        font: "sans-serif", size: 28, bold: true, italic: false, underline: false, align: 'center'
    });

    const [rowsConfig, setRowsConfig] = useState({
        font: "sans-serif", size: 22, bold: true, italic: false, underline: false, align: 'left'
    });

    const letters = acronym.split('').map(l => l.toUpperCase());

    const handleRowChange = (index, val) => {
        const newRows = [...rows];
        newRows[index] = val;
        setRows(newRows);
    };

    const buildSvgContent = () => {
        let headerTexts = '';
        const totalLetters = Math.min(letters.length, 10);

        letters.slice(0, 10).forEach((L, i) => {
            let xPos = 400;
            const spacingPx = acronymConfig.size * 1.5;

            if (acronymConfig.align === 'space-between') {
                if (totalLetters <= 1) xPos = 400;
                else xPos = 50 + (640 / (totalLetters - 1)) * i;
            } else if (acronymConfig.align === 'center') {
                const totalW = (totalLetters - 1) * spacingPx;
                const startX = 400 - (totalW / 2);
                xPos = startX + i * spacingPx;
            } else if (acronymConfig.align === 'left') {
                xPos = 50 + i * spacingPx;
            } else if (acronymConfig.align === 'right') {
                xPos = 700 - ((totalLetters - 1) * spacingPx) + i * spacingPx;
            }

            headerTexts += `<text x="${xPos}" y="90" font-family="${acronymConfig.font}" font-size="${acronymConfig.size}" font-weight="${acronymConfig.bold ? 'bold' : 'normal'}" font-style="${acronymConfig.italic ? 'italic' : 'normal'}" text-decoration="${acronymConfig.underline ? 'underline' : 'none'}" fill="${titleColor}" stroke="white" stroke-width="1.5" text-anchor="middle">${L}.</text>\n`;
        });

        let rowsTexts = '';
        letters.slice(0, 8).forEach((L, i) => {
            const rowY = 210 + i * 60;
            // Native Bullet Point (Syncing Acronym Typography Matrix)
            rowsTexts += `<text x="80" y="${rowY}" font-family="${acronymConfig.font}" font-size="${acronymConfig.size * 0.8}" font-weight="${acronymConfig.bold ? 'bold' : 'normal'}" font-style="${acronymConfig.italic ? 'italic' : 'normal'}" fill="${titleColor}" stroke="white" stroke-width="1.5" text-anchor="middle">${L}</text>\n`;

            // Row Content Alignment
            let rowX = 135;
            let rowAnchor = 'start';
            if (rowsConfig.align === 'center') { rowX = 400; rowAnchor = 'middle'; }
            if (rowsConfig.align === 'right') { rowX = 750; rowAnchor = 'end'; }

            rowsTexts += `<text x="${rowX}" y="${rowY}" xml:space="preserve" letter-spacing="1.5" font-family="${rowsConfig.font}" font-size="${rowsConfig.size}" font-weight="${rowsConfig.bold ? 'bold' : 'normal'}" font-style="${rowsConfig.italic ? 'italic' : 'normal'}" text-decoration="${rowsConfig.underline ? 'underline' : 'none'}" fill="${rowTextColor}" text-anchor="${rowAnchor}">${(rows[i] || "").toUpperCase()}</text>\n`;
        });

        let bannerX = 400;
        let bannerAnchor = 'middle';
        if (bannerConfig.align === 'left') { bannerX = 50; bannerAnchor = 'start'; }
        if (bannerConfig.align === 'right') { bannerX = 700; bannerAnchor = 'end'; }

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
            <rect x="25" y="25" width="750" height="120" fill="${bgColor}" stroke="#777" stroke-width="6" />
            ${headerTexts}
            <rect x="25" y="105" width="750" height="40" fill="${bannerColor}" />
            <text x="${bannerX}" y="132" font-family="${bannerConfig.font}" font-size="${bannerConfig.size}" font-weight="${bannerConfig.bold ? 'bold' : 'normal'}" font-style="${bannerConfig.italic ? 'italic' : 'normal'}" text-decoration="${bannerConfig.underline ? 'underline' : 'none'}" fill="${bannerTextColor}" text-anchor="${bannerAnchor}" letter-spacing="3">${bannerText}</text>
            <g>${rowsTexts}</g>
        </svg>`;
    };

    React.useEffect(() => {
        if (!visible) return;
        const svgContent = buildSvgContent();
        const safeSvg = encodeURIComponent(svgContent).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1));
        const base64Data = `data:image/svg+xml;base64,${window.btoa(safeSvg)}`;

        if (onUpdate) {
            onUpdate(base64Data);
        }
    }, [acronym, bannerText, rows, bgColor, bannerColor, titleColor, bannerTextColor, rowTextColor, acronymConfig, bannerConfig, rowsConfig, visible]);

    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            header="Edit Lion Chart"
            style={{ width: '450px' }}
            position="right"
            modal={true}
            maskStyle={{ backgroundColor: 'transparent' }}
            contentClassName="p-0 border-0 bg-gray-100 flex flex-col shadow-2xl"
            className="lion-chart-editor-modal"
        >
            <Toast ref={toast} />

            <div className="w-full bg-white p-6 overflow-y-auto flex flex-col z-10 custom-scrollbar">

                <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs border-b border-gray-200 pb-2 mb-4">Color Coordinates</h3>
                <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm">
                    <label className="flex flex-col gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        Header Background
                        <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-full h-8 cursor-pointer rounded border border-gray-200" />
                    </label>
                    <label className="flex flex-col gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        Banner Background
                        <input type="color" value={bannerColor} onChange={e => setBannerColor(e.target.value)} className="w-full h-8 cursor-pointer rounded border border-gray-200" />
                    </label>
                    <label className="flex flex-col gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        Acronym Fill
                        <input type="color" value={titleColor} onChange={e => setTitleColor(e.target.value)} className="w-full h-8 cursor-pointer rounded border border-gray-200" />
                    </label>
                    <label className="flex flex-col gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        Banner Text
                        <input type="color" value={bannerTextColor} onChange={e => setBannerTextColor(e.target.value)} className="w-full h-8 cursor-pointer rounded border border-gray-200" />
                    </label>
                    <label className="flex flex-col gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wide col-span-2">
                        Details Content Text
                        <input type="color" value={rowTextColor} onChange={e => setRowTextColor(e.target.value)} className="w-full h-8 cursor-pointer rounded border border-gray-200" />
                    </label>
                </div>

                <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs border-b border-gray-200 pb-2 mb-4">Typography & Styling</h3>

                <TypographyEditor
                    title="Acronym Sequence"
                    config={acronymConfig}
                    setConfig={setAcronymConfig}
                    textValue={acronym}
                    setTextValue={setAcronym}
                    showAlignSpaceBetween={true}
                    inputPlaceholder="e.g. LIONS"
                />

                <TypographyEditor
                    title="Banner Title"
                    config={bannerConfig}
                    setConfig={setBannerConfig}
                    textValue={bannerText}
                    setTextValue={setBannerText}
                    showAlignSpaceBetween={false}
                    inputPlaceholder="Banner Subtitle Text"
                />

                <TypographyEditor
                    title="Row Definitions Base Settings"
                    config={rowsConfig}
                    setConfig={setRowsConfig}
                    showAlignSpaceBetween={false}
                />

                <div className="flex flex-col gap-3 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide border-b pb-1">Input Sequences</span>
                    {letters.map((L, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="font-bold text-xl w-8 text-center text-blue-600 bg-blue-100 border border-blue-200 rounded-lg p-1.5 shadow-sm">{L}</span>
                            <input
                                type="text"
                                value={rows[i] || ""}
                                onChange={e => handleRowChange(i, e.target.value)}
                                className="border border-gray-300 p-2.5 rounded text-xs font-bold text-gray-800 flex-1 focus:ring-2 focus:ring-blue-500 shadow-inner outline-none"
                                placeholder={`Enter text block for [ ${L} ] ...`}
                            />
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-4 border-t flex gap-3 mt-auto">
                    <Button label="Finish Editing" icon="pi pi-check" onClick={onHide} className="p-button-warning w-full font-bold shadow-lg" />
                </div>
            </div>
        </Dialog>
    );
};

export default LionChartModal;
