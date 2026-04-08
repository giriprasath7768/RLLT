import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { jsPDF } from 'jspdf';

const EditableText = ({ value, onChange, className, isTextarea = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    // Sync state if value changes externally
    useEffect(() => { setTempValue(value); }, [value]);

    const handleBlur = () => {
        setIsEditing(false);
        onChange(tempValue);
    };

    if (isEditing) {
        if (isTextarea) {
            return (
                <textarea
                    autoFocus
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={handleBlur}
                    className={`w-full bg-black/10 border border-dashed border-white/50 text-white rounded p-1 outline-none resize-none ${className}`}
                    rows={3}
                />
            );
        }
        return (
            <input
                autoFocus
                type="text"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={handleBlur}
                className={`w-full bg-black/10 border border-dashed border-white/50 text-white rounded p-0.5 outline-none ${className}`}
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`min-h-[1.5em] cursor-pointer hover:ring-1 hover:ring-white/30 rounded ${className} ${!value ? 'opacity-50 italic text-sm' : ''}`}
        >
            {value || "Click to edit"}
        </div>
    );
};

const VCard = ({ data, onChange, onRemove }) => {
    const updateField = (field, val) => {
        onChange({ ...data, [field]: val });
    };

    const updateBullet = (idx, val) => {
        const newBullets = [...data.bullets];
        newBullets[idx] = val;
        updateField('bullets', newBullets);
    };

    const addBullet = () => {
        updateField('bullets', [...data.bullets, "New Item"]);
    };

    const removeBullet = (idx) => {
        const newBullets = data.bullets.filter((_, i) => i !== idx);
        updateField('bullets', newBullets);
    };

    // Generic Icon Options (PrimeIcons)
    const iconOptions = [
        { label: 'Circle', value: 'pi-circle-fill' },
        { label: 'Check', value: 'pi-check-circle' },
        { label: 'Star', value: 'pi-star-fill' },
        { label: 'Bookmark', value: 'pi-bookmark-fill' },
        { label: 'Send', value: 'pi-send' }
    ];

    // Card Colors
    const sideColor = data.sideColor || '#3883f5'; // light blue
    const bodyColor = data.bodyColor || '#425f8b'; // slate blue

    return (
        <div className="relative group w-[500px] flex-shrink-0 flex border-2 border-black overlow-hidden bg-white shadow-md mx-auto" style={{ height: '320px' }}>
            {/* Delete button (only visible on hover) */}
            <button 
                onClick={onRemove} 
                className="absolute -top-3 -right-3 z-50 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <i className="pi pi-times text-xs"></i>
            </button>

            {/* Left Vertical Band */}
            <div className="w-[50px] flex-shrink-0 flex items-center justify-center border-r border-[#1e4b94]" style={{ backgroundColor: sideColor }}>
                <div className="rotate-180" style={{ writingMode: 'vertical-rl' }}>
                    <EditableText
                        value={data.leftLabel}
                        onChange={(v) => updateField('leftLabel', v)}
                        className="text-white font-extrabold text-[18px] tracking-widest uppercase whitespace-nowrap text-center"
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative w-full overflow-hidden">
                {/* Background Image / Color Area */}
                <div 
                    className="flex-1 relative flex flex-col"
                    style={{ 
                        backgroundColor: bodyColor,
                        backgroundImage: data.bgImage ? `url(${data.bgImage})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                >
                    {/* Background Overlay if image exists to make text readable (optional) */}
                    {data.bgImage && <div className="absolute inset-0 bg-black/20"></div>}

                    {/* Top Layer */}
                    <div className="relative z-10 w-full h-full p-6 flex flex-col">
                        
                        {/* Bullets & Right Panel wrapper */}
                        <div className="flex w-full h-full">
                            {/* Bullets Area */}
                            <div className="flex-[3] flex flex-col gap-4 pt-4">
                                {data.bullets.map((bullet, idx) => (
                                    <div key={idx} className="flex flex-row items-start gap-4 group/bullet">
                                        <div className="flex items-center gap-2 mt-1">
                                            {/* Icon bullet */}
                                            <i className={`pi ${data.iconClass || 'pi-circle-fill'}`} style={{ color: data.iconColor || '#22c55e', fontSize: '0.75rem' }}></i>
                                            {/* Remove bullet btn */}
                                            <button 
                                                onClick={() => removeBullet(idx)}
                                                className="opacity-0 group-hover/bullet:opacity-100 text-white/50 hover:text-red-400 absolute -ml-6"
                                            >
                                                <i className="pi pi-minus-circle text-[10px]"></i>
                                            </button>
                                        </div>
                                        <div className="flex-1">
                                            <EditableText
                                                value={bullet}
                                                onChange={(v) => updateBullet(idx, v)}
                                                className="text-white font-bold text-lg leading-none"
                                            />
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    icon="pi pi-plus"
                                    className="p-button-text p-button-sm text-white/50 hover:text-white mt-2 self-start w-8 h-8 rounded-full p-0"
                                    onClick={addBullet}
                                    tooltip="Add Bullet"
                                />
                            </div>

                            {/* Top Right Area (Logo / Text) */}
                            <div className="flex-[1] flex flex-col items-center pt-2 gap-3 relative">
                                {/* Editable image URL or placeholder */}
                                {data.topRightLogo ? (
                                    <img src={data.topRightLogo} alt="Logo" className="w-[50px] h-[50px] object-contain cursor-pointer border border-transparent hover:border-dashed hover:border-white/50 rounded-full bg-white/20" onClick={() => {
                                        const url = prompt("Enter Image URL:", data.topRightLogo);
                                        if (url !== null) updateField('topRightLogo', url);
                                    }}/>
                                ) : (
                                    <div onClick={() => {
                                        const url = prompt("Enter Image URL:");
                                        if (url !== null) updateField('topRightLogo', url);
                                    }} className="w-[50px] h-[50px] rounded-full border border-dashed border-white/50 flex items-center justify-center text-white/50 cursor-pointer">
                                        <i className="pi pi-image text-xl"></i>
                                    </div>
                                )}
                                <div className="text-center w-full">
                                    <EditableText
                                        value={data.topRightText}
                                        onChange={(v) => updateField('topRightText', v)}
                                        className="text-white text-md font-medium tracking-wide"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bottom inside image elements */}
                        <div className="w-full flex justify-between items-end mt-auto pb-2">
                             <div>
                                 {data.bottomLeftImg ? (
                                     <img src={data.bottomLeftImg} alt="Bottom Left" className="h-[30px] object-contain cursor-pointer" onClick={() => {
                                         const url = prompt("Enter Image URL:", data.bottomLeftImg);
                                         if (url !== null) updateField('bottomLeftImg', url);
                                     }}/>
                                 ) : (
                                    <div onClick={() => {
                                         const url = prompt("Enter Bottom Left Image URL:");
                                         if (url !== null) updateField('bottomLeftImg', url);
                                     }} className="h-[30px] w-[50px] border border-dashed border-white/30 flex items-center justify-center text-white/30 cursor-pointer text-[10px]">
                                         Img
                                     </div>
                                 )}
                             </div>
                             <div>
                                <EditableText
                                     value={data.bottomRightBoxText}
                                     onChange={(v) => updateField('bottomRightBoxText', v)}
                                     className="bg-black/40 text-white font-bold text-xs uppercase px-2 py-1 tracking-widest min-w-[80px] text-center"
                                 />
                             </div>
                        </div>

                    </div>
                </div>

                {/* Footer Band */}
                <div className="flex-shrink-0 flex items-center justify-center p-3 border-t border-[#1e4b94] min-h-[50px]" style={{ backgroundColor: sideColor }}>
                    <div className="w-full text-center">
                        <EditableText
                            isTextarea
                            value={data.footerText}
                            onChange={(v) => updateField('footerText', v)}
                            className="text-white text-[12px] font-bold leading-tight"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const VCardChart = () => {
    const toast = useRef(null);
    const [chartsList, setChartsList] = useState([]);
    const [selectedChart, setSelectedChart] = useState(null);
    
    // Header properties (similar to MainChart)
    const [headerSubtitle, setHeaderSubtitle] = useState("NO CHART SELECTED");
    const [logoUrl, setLogoUrl] = useState(null);
    const [bannerText, setBannerText] = useState("");
    const [tLabel, setTLabel] = useState("T");
    const [phaseLabel, setPhaseLabel] = useState("1/1");
    
    // Scale
    const [tableFontSize, setTableFontSize] = useState(12);

    // V-Cards Data
    const [vCards, setVCards] = useState([]);

    const getDefaultCard = (id) => ({
        id,
        leftLabel: "NEW CARD",
        bgImage: "",
        sideColor: "#3883f5",
        bodyColor: "#425f8b",
        iconClass: "pi-circle-fill",
        iconColor: "#22c55e",
        bullets: ["####", "#####"],
        topRightLogo: "",
        topRightText: "",
        footerText: "Footer Verse text...",
        bottomLeftImg: "",
        bottomRightBoxText: ""
    });

    const fetchChartList = () => {
        axios.get('http://localhost:8000/api/vcards/list', { withCredentials: true })
            .then(res => setChartsList(res.data))
            .catch(err => console.error("Could not fetch vcards list", err));
    };

    useEffect(() => {
        fetchChartList();
    }, []);

    useEffect(() => {
        if (!selectedChart) {
            setVCards([]);
            setHeaderSubtitle("NO CHART SELECTED");
            return;
        }

        const { module, facet, phase, label } = selectedChart;
        
        axios.get(`http://localhost:8000/api/vcards/sync/${module}/${facet}/${phase}`, { withCredentials: true })
            .then(res => {
                const data = res.data;
                setHeaderSubtitle(`MDL${module} FCT${facet} PHS${phase}`);
                setLogoUrl(data.logo_url ? `http://localhost:8000${data.logo_url}` : null);
                setBannerText(data.banner_text || "");
                setTLabel(data.t_label || "T");
                setPhaseLabel(`${phase}`);
                
                if (data.state_payload) {
                    try {
                        const parsed = JSON.parse(data.state_payload);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setVCards(parsed);
                        } else {
                            setVCards([getDefaultCard(Date.now())]);
                        }
                    } catch(e) { 
                        console.error("Parse err", e);
                        setVCards([getDefaultCard(Date.now())]);
                    }
                } else {
                    setVCards([
                        {
                            ...getDefaultCard(1),
                            leftLabel: "DAILY BREAD",
                            bullets: ["####", "#####", "####", "####", "####"],
                            topRightText: "ART - 50 m",
                            footerText: "It is the same with my word. I send it out, and it always produces fruit. It will accomplish all I want it to, and it will prosper everywhere I send it. Isaiah 55:11"
                        },
                        {
                            ...getDefaultCard(2),
                            leftLabel: "WEEK / TEAM 1/6 - DAY 1",
                            bullets: ["####", "####", "####"],
                            iconColor: "#3883f5",
                            bottomRightBoxText: "######"
                        }
                    ]);
                }
                toast.current?.show({ severity: 'success', summary: 'Loaded', detail: 'V-Card layout loaded.', life: 2000 });
            })
            .catch(err => {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not load V-Card details.', life: 3000 });
                setVCards([getDefaultCard(1)]);
            });
    }, [selectedChart]);

    const handleSave = async () => {
        if (!selectedChart) {
            toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'Please select a chart configuration first.', life: 3000 });
            return;
        }

        const formData = new FormData();
        formData.append('module', selectedChart.module);
        formData.append('facet', selectedChart.facet);
        formData.append('phase', selectedChart.phase);
        formData.append('banner_text', bannerText);
        formData.append('t_label', tLabel);
        formData.append('state_payload', JSON.stringify(vCards));
        
        try {
            await axios.post('http://localhost:8000/api/vcards/sync', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'V-Card layout saved successfully.', life: 2000 });
            fetchChartList(); // Refresh list to catch name updates
        } catch (err) {
            console.error(err);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save layout.', life: 3000 });
        }
    };

    const handlePrint = () => {
        const printContent = document.getElementById('printable-vcard');
        if (!printContent) return;
        
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0'; iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <html>
                <head>
                    <title>Print V-Card</title>
                    <style>
                        @page { size: landscape; margin: 5mm; }
                        body { margin: 0; padding: 0; background: white !important; font-family: Arial, sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .print-container { width: 100%; display: flex; flex-direction: column; align-items: center; }
                        /* Essential utilities mapping */
                        .flex { display: flex; } .flex-row { flex-direction: row; } .flex-col { flex-direction: column; }
                        .flex-1 { flex: 1 1 0%; } .w-full { width: 100%; } .h-full { height: 100%; }
                        .items-center { align-items: center; } .justify-center { justify-content: center; } .justify-between { justify-content: space-between; }
                        .text-center { text-align: center; } .uppercase { text-transform: uppercase; } .font-bold { font-weight: bold; }
                        .border-2 { border: 2px solid black; } .border-t { border-top: 1px solid #1e4b94; } .border-r { border-right: 1px solid #1e4b94; }
                        .bg-white { background-color: white; }
                        .grid { display: grid; } .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                        .gap-8 { gap: 2rem; } .p-3 { padding: 0.75rem; } .p-6 { padding: 1.5rem; } .m-auto { margin: auto; }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        ${printContent.innerHTML}
                    </div>
                    <script>
                        window.onload = () => { setTimeout(() => { window.print(); window.frameElement.remove(); }, 1000); };
                    </script>
                </body>
            </html>
        `);
        doc.close();
    };

    const renderMainHeaderBlock = () => {
        return (
            <div className="flex flex-col w-full mb-8 z-10 relative" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <table className="w-full bg-white table-fixed border-collapse border-2 border-black" style={{ borderSpacing: 0 }}>
                    <tbody>
                        <tr className="h-[45px]">
                            <td className="w-[45px] bg-[#00b050] border-r-2 border-black p-0 align-middle" style={{ backgroundColor: '#00b050 !important', WebkitPrintColorAdjust: 'exact' }}>
                                <div className="w-full h-full flex items-center justify-center">
                                    <input value={tLabel} onChange={e=>setTLabel(e.target.value)} className="w-full text-center bg-transparent text-white font-serif text-[28px] leading-none outline-none" />
                                </div>
                            </td>
                            <td className="p-0 align-middle text-center bg-white" style={{ WebkitPrintColorAdjust: 'exact' }}>
                                <span className="text-[#ff0000] font-bold text-[18px] tracking-wide uppercase" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                    REAL LIFE LEADERSHIP TRAINING - <span className="text-[14px] font-bold">{headerSubtitle}</span>
                                </span>
                            </td>
                            <td className="w-[50px] bg-[#00b050] border-l-2 border-black p-0 h-[45px]" style={{ backgroundColor: '#00b050 !important', WebkitPrintColorAdjust: 'exact' }}>
                                <div className="flex flex-col h-full w-full">
                                    <div className="flex-1 flex items-center justify-center border-b-2 border-black">
                                        <span className="text-white font-black text-[13px] tracking-tighter">PH</span>
                                    </div>
                                    <div className="flex-1 flex items-center justify-center">
                                        <span className="text-white font-bold text-[15px]">{phaseLabel}</span>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <table className="w-full bg-white table-fixed border-collapse border-b-2 border-l-2 border-r-2 border-black" style={{ borderSpacing: 0 }}>
                    <tbody>
                        <tr className="h-[55px]">
                            {/* Dummy Image boxes for header structure like MainChart */}
                            <td className="w-[70px] border-r-2 border-black p-0 bg-[#f1f5f9]"></td>
                            <td className="w-[70px] border-r-2 border-black p-0 bg-[#f1f5f9]"></td>
                            <td className="w-[70px] border-r-2 border-black p-0 bg-[#f1f5f9]"></td>
                            <td className="border-r-2 border-black p-1 align-middle bg-white relative" style={{ WebkitPrintColorAdjust: 'exact' }}>
                                <div className="absolute inset-[2px] border-[3px] border-[#e47636] pointer-events-none"></div>
                                <div className="w-full h-full flex items-center px-4 relative z-10">
                                    <input 
                                        type="text" 
                                        value={bannerText} 
                                        onChange={e=>setBannerText(e.target.value)} 
                                        placeholder="Banner Text" 
                                        className="w-full bg-transparent text-black font-bold text-[18px] uppercase outline-none" 
                                    />
                                </div>
                            </td>
                            <td className="w-[120px] bg-[#ffff00] p-0 h-[55px]" style={{ backgroundColor: '#ffff00 !important', WebkitPrintColorAdjust: 'exact' }}>
                                <div className="flex flex-col h-full w-full">
                                    <div className="flex-1 flex items-center justify-center border-b-2 border-black">
                                        <span className="text-black font-black tracking-widest text-[16px] whitespace-nowrap">B K - A R</span>
                                    </div>
                                    <div className="flex-1 flex items-center justify-center">
                                        <span className="text-black font-black tracking-widest text-[14px]">6 6 - 4 0 +</span>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    const updateCard = (index, newData) => {
        const newCards = [...vCards];
        newCards[index] = newData;
        setVCards(newCards);
    };

    const removeCard = (index) => {
        setVCards(vCards.filter((_, i) => i !== index));
    };

    const addCard = () => {
        setVCards([...vCards, getDefaultCard(Date.now())]);
    };

    return (
        <div className="p-8 w-full max-w-full overflow-x-auto bg-gray-50 min-h-screen">
            <Toast ref={toast} />

            {/* Top Toolbar */}
            <div className="bg-[#051220] shadow-2xl rounded-xl border border-white/20 mb-6 print:hidden py-4 px-6 flex flex-wrap justify-between items-center gap-6">
                <div className="flex-shrink-0">
                    <h1 className="text-2xl font-black tracking-tight text-[#f1c40f] uppercase mb-0 whitespace-nowrap">V-CARD CHART EDITOR</h1>
                </div>

                <div className="flex items-center gap-3 bg-white/10 p-1.5 px-4 rounded-lg border border-white/20 grow max-w-md">
                    <span className="text-[#f1c40f] font-black text-xs uppercase border-r border-white/20 pr-3 whitespace-nowrap">Chart:</span>
                    <Dropdown 
                        value={selectedChart} 
                        options={chartsList} 
                        optionLabel="label" 
                        placeholder="Select a chart..." 
                        className="border-none w-full h-[36px] flex items-center bg-transparent shadow-none focus:ring-0" 
                        onChange={(e) => setSelectedChart(e.value)} 
                    />
                </div>

                <div className="flex gap-3">
                    <Button 
                        icon="pi pi-plus" 
                        label="Add Card"
                        className="p-button-outlined p-button-warning text-[#f1c40f] border-[#f1c40f] hover:bg-[#f1c40f] hover:text-[#051220] transition-all font-bold" 
                        onClick={addCard}
                    />
                    <Button 
                        icon="pi pi-save" 
                        label="Save Layout"
                        className="p-button p-button-warning border-2 bg-transparent text-[#f1c40f] border-[#f1c40f] hover:bg-[#f1c40f] hover:text-[#051220] transition-all shadow-lg font-bold" 
                        onClick={handleSave}
                    />
                    <Button 
                        icon="pi pi-print" 
                        className="p-button-rounded p-button-warning border-2 w-11 h-11 bg-transparent text-[#f1c40f] border-[#f1c40f] hover:bg-[#f1c40f] hover:text-[#051220] transition-all shadow-lg" 
                        onClick={handlePrint}
                        tooltip="Print Preview"
                    />
                </div>
            </div>

            {/* Printable Content wrapper with Border Box */}
            <div className="max-w-[1200px] mx-auto bg-gray-100 p-6 rounded-2xl shadow-xl relative overflow-hidden print-wrapper">
                
                {/* Bordered Box covering everything per user instruction */}
                <div id="printable-vcard" className="w-full bg-white p-6 border-4 border-black relative" style={{ minHeight: '800px', pageBreakInside: 'avoid' }}>
                    
                    {/* Header Part Same as Main Chart */}
                    {renderMainHeaderBlock()}

                    {/* V-Cards Grid */}
                    {vCards.length > 0 ? (
                        <div className="w-full flex justify-center mt-10">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-16">
                                {vCards.map((card, idx) => (
                                    <VCard 
                                        key={card.id} 
                                        data={card} 
                                        onChange={(newData) => updateCard(idx, newData)} 
                                        onRemove={() => removeCard(idx)}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-400 py-32 text-2xl font-bold text-center flex flex-col items-center">
                            <i className="pi pi-table text-6xl mb-4 opacity-50"></i>
                            Please select a chart or add a new card to begin designing V-Cards.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VCardChart;
