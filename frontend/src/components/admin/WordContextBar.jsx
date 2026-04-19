import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';

// Sample flags (in a real app, you might map over all countries or use a library)
const FLAGS = [
    { code: 'US', emoji: '🇺🇸', name: 'United States' },
    { code: 'GB', emoji: '🇬🇧', name: 'United Kingdom' },
    { code: 'IN', emoji: '🇮🇳', name: 'India' },
    { code: 'CA', emoji: '🇨🇦', name: 'Canada' },
    { code: 'AU', emoji: '🇦🇺', name: 'Australia' },
    { code: 'FR', emoji: '🇫🇷', name: 'France' },
    { code: 'DE', emoji: '🇩🇪', name: 'Germany' },
    { code: 'JP', emoji: '🇯🇵', name: 'Japan' },
    { code: 'ZA', emoji: '🇿🇦', name: 'South Africa' },
    { code: 'BR', emoji: '🇧🇷', name: 'Brazil' },
];

const CATEGORIES = [
    { label: 'Training Material', value: 'training' },
    { label: 'Legal Document', value: 'legal' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Standard Operating Procedure', value: 'sop' },
];

const WordContextBar = ({ selectedCountry, setSelectedCountry, category, setCategory }) => {
    const [mapVisible, setMapVisible] = useState(false);
    const [hoveredFlag, setHoveredFlag] = useState(null);

    const handleFlagClick = (country) => {
        setSelectedCountry(country);
        setMapVisible(true);
    };

    return (
        <div className="flex flex-col border-b bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
            {/* Flags Row */}
            <div className="flex items-center gap-4 px-6 overflow-x-auto border-b border-gray-100 pb-2 pt-2 scrollbar-thin scrollbar-thumb-gray-200">
                <div className="flex items-center gap-3 w-max">
                    {FLAGS.map((flag) => (
                        <button
                            key={flag.code}
                            onClick={() => handleFlagClick(flag)}
                            onMouseEnter={() => setHoveredFlag(flag.name)}
                            onMouseLeave={() => setHoveredFlag(null)}
                            className={`text-2xl transition-transform hover:scale-125 focus:outline-none ${selectedCountry?.code === flag.code ? 'scale-125 saturate-100 drop-shadow-md' : 'saturate-50 hover:saturate-100 opacity-80 hover:opacity-100'
                                }`}
                            title={flag.name}
                        >
                            {flag.emoji}
                        </button>
                    ))}
                </div>
                <div className="ml-4 text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[120px]">
                    {hoveredFlag || (selectedCountry ? selectedCountry.name : 'Select Region')}
                </div>
            </div>

            {/* Category & Tags Row */}
            <div className="flex justify-between items-center px-6 py-2 bg-gray-50">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Classification</span>
                    <Dropdown
                        value={category}
                        options={CATEGORIES}
                        onChange={(e) => setCategory(e.value)}
                        placeholder="Select Document Category"
                        className="w-64 p-dropdown-sm bg-white border-gray-200"
                    />
                </div>
            </div>

            {/* Map Modal */}
            <Dialog
                header={`Regional Map: ${selectedCountry?.name}`}
                visible={mapVisible}
                className="w-[80vw] max-w-4xl"
                onHide={() => setMapVisible(false)}
            >
                <div className="w-full h-[500px] bg-[#eef2f5] rounded-lg border border-gray-200 flex items-center justify-center relative overflow-hidden">
                    {/* Placeholder for actual interactive map / iframe */}
                    <div className="text-center">
                        <i className="pi pi-map-marker text-6xl text-blue-500 mb-4 animate-bounce"></i>
                        <h2 className="text-2xl font-black text-gray-700">{selectedCountry?.name}</h2>
                        <p className="text-gray-500 mt-2 max-w-md">
                            Interactive map view for {selectedCountry?.name} will be rendered here.
                            (Integrate Google Maps or standard GeoJSON D3 maps).
                        </p>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default WordContextBar;
