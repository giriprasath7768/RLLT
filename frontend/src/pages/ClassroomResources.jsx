import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ClassroomResources = () => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [userRole, setUserRole] = useState(null);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ title: '', resource_type: 'video', url: '' });
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const resourceTypes = [
        { label: 'Video (MP4)', value: 'video', icon: 'pi pi-video' },
        { label: 'Audio (MP3)', value: 'audio', icon: 'pi pi-headphones' },
        { label: 'Study Material (PDF)', value: 'study_material', icon: 'pi pi-file-pdf' },
        { label: 'Book (PDF)', value: 'book', icon: 'pi pi-book' },
        { label: 'Link (URL)', value: 'link', icon: 'pi pi-link' }
    ];

    useEffect(() => {
        checkAuthAndFetchLocations();
    }, []);

    useEffect(() => {
        if (selectedLocation || userRole === 'student') {
            fetchResources();
        }
    }, [selectedLocation, userRole]);

    const checkAuthAndFetchLocations = async () => {
        try {
            const meRes = await axios.get(`http://${window.location.hostname}:8000/api/me`, { withCredentials: true });
            setUserRole(meRes.data.role);
            
            if (meRes.data.role !== 'student') {
                const locRes = await axios.get(`http://${window.location.hostname}:8000/api/locations`, { withCredentials: true });
                if (locRes.data && locRes.data.length > 0) {
                    setLocations(locRes.data);
                    setSelectedLocation(null); // Default to All Locations
                } else {
                    setLoading(false);
                }
            } else {
                // Students don't need location switcher, backend handles it
                fetchResources();
            }
        } catch (error) {
            console.error("Auth check failed", error);
            setLoading(false);
        }
    };

    const fetchResources = async () => {
        try {
            setLoading(true);
            const locationQuery = selectedLocation ? `?location_id=${selectedLocation.id}` : '';
            const res = await axios.get(`http://${window.location.hostname}:8000/api/classroom/resources${locationQuery}`, { withCredentials: true });
            setResources(res.data);
        } catch (error) {
            console.error("Failed to fetch resources", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic validation based on selected type
        if (formData.resource_type === 'video' && !file.type.includes('mp4')) {
            alert("Please upload an MP4 file for video resources.");
            return;
        }
        if (formData.resource_type === 'audio' && (!file.type.includes('mp3') && !file.type.includes('mpeg'))) {
            alert("Please upload an MP3 file for audio resources.");
            return;
        }
        if ((formData.resource_type === 'study_material' || formData.resource_type === 'book') && file.type !== 'application/pdf') {
            alert("Please upload a PDF file for this resource type.");
            return;
        }

        try {
            setUploading(true);
            const data = new FormData();
            data.append('files', file);

            // Reusing the images upload endpoint as it handles general file writing
            const res = await axios.post(`http://${window.location.hostname}:8000/api/images/upload`, data, { 
                withCredentials: true
            });
            
            if (res.data.urls && res.data.urls.length > 0) {
                setFormData({ ...formData, url: res.data.urls[0] });
            }
        } catch (error) {
            console.error("File upload failed", error);
            alert("Failed to upload file.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.url) {
            alert("Please provide a title and upload a file or enter a URL.");
            return;
        }

        try {
            const payload = {
                ...formData,
                location_id: selectedLocation ? selectedLocation.id : null
            };
            
            await axios.post(`http://${window.location.hostname}:8000/api/classroom/resources`, payload, { withCredentials: true });
            setIsModalOpen(false);
            setFormData({ title: '', resource_type: 'video', url: '' });
            fetchResources();
        } catch (error) {
            console.error("Failed to create resource", error);
            alert("Failed to create resource.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this resource?")) return;
        try {
            await axios.delete(`http://${window.location.hostname}:8000/api/classroom/resources/${id}`, { withCredentials: true });
            fetchResources();
        } catch (error) {
            console.error("Failed to delete resource", error);
        }
    };

    const getIconForType = (type) => {
        const found = resourceTypes.find(r => r.value === type);
        return found ? found.icon : 'pi pi-file';
    };

    const getLabelForType = (type) => {
        const found = resourceTypes.find(r => r.value === type);
        return found ? found.label : type;
    };

    const isAdmin = userRole && userRole !== 'student';

    return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#051220] tracking-tight">Resources</h1>
                    <p className="text-gray-500 mt-1">Access classroom materials, videos, audio, and books.</p>
                </div>

                {isAdmin && locations.length > 0 && (
                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-50 text-indigo-500">
                            <i className="pi pi-map-marker text-xl"></i>
                        </div>
                        <div className="pr-4">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Active Location</label>
                            <select 
                                className="bg-transparent border-none text-sm font-bold text-[#051220] focus:ring-0 p-0 cursor-pointer outline-none"
                                value={selectedLocation?.id || ''}
                                onChange={(e) => {
                                    if (e.target.value === '') {
                                        setSelectedLocation(null);
                                    } else {
                                        const loc = locations.find(l => l.id === e.target.value);
                                        setSelectedLocation(loc);
                                    }
                                }}
                            >
                                <option value="">All Locations</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.city}, {loc.country}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-[#051220]">
                        {isAdmin ? `Materials for ${selectedLocation ? selectedLocation.city : 'All Locations'}` : 'My Materials'}
                    </h2>
                    {isAdmin && (
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-[#cca673] hover:bg-[#b59263] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2"
                        >
                            <i className="pi pi-plus"></i> Add Resource
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="p-16 flex justify-center items-center">
                        <i className="pi pi-spin pi-spinner text-3xl text-gray-400"></i>
                    </div>
                ) : resources.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {resources.map(resource => (
                            <div key={resource.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-5">
                                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md">
                                        <i className={`${getIconForType(resource.resource_type)} text-2xl`}></i>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#051220]">{resource.title}</h3>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 font-medium">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold text-gray-600">{getLabelForType(resource.resource_type)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <a 
                                        href={resource.url.startsWith('/') ? `http://${window.location.hostname}:8000${resource.url}` : resource.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="h-10 px-4 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center transition-colors font-bold text-sm"
                                    >
                                        <i className="pi pi-external-link mr-2"></i> Open
                                    </a>
                                    {isAdmin && (
                                        <button 
                                            onClick={() => handleDelete(resource.id)}
                                            className="h-10 w-10 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete Resource"
                                        >
                                            <i className="pi pi-trash"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-16 flex flex-col items-center justify-center text-center">
                        <div className="h-24 w-24 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                            <i className="pi pi-folder-open text-4xl text-gray-300"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Resources Found</h3>
                        <p className="text-gray-500 max-w-md">There are no materials available for this location yet.</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-[#051220]">Add Resource</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="pi pi-times text-xl"></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#cca673]/50 focus:border-[#cca673] transition-all outline-none"
                                    placeholder="e.g. Introduction to Leadership"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Resource Type</label>
                                <select 
                                    value={formData.resource_type}
                                    onChange={e => setFormData({...formData, resource_type: e.target.value, url: ''})}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#cca673]/50 focus:border-[#cca673] transition-all outline-none"
                                >
                                    {resourceTypes.map(rt => (
                                        <option key={rt.value} value={rt.value}>{rt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {formData.resource_type === 'link' ? (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">URL</label>
                                    <input 
                                        type="url" 
                                        required 
                                        value={formData.url}
                                        onChange={e => setFormData({...formData, url: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#cca673]/50 focus:border-[#cca673] transition-all outline-none"
                                        placeholder="https://example.com"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Upload File</label>
                                    <div className="flex gap-3">
                                        <input 
                                            type="file" 
                                            ref={fileInputRef}
                                            className="hidden" 
                                            onChange={handleFileUpload} 
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => fileInputRef.current.click()}
                                            disabled={uploading}
                                            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                                        >
                                            <i className={uploading ? "pi pi-spin pi-spinner" : "pi pi-upload"}></i>
                                            {uploading ? 'Uploading...' : 'Choose File'}
                                        </button>
                                        <input 
                                            type="text" 
                                            readOnly 
                                            value={formData.url} 
                                            placeholder="No file chosen"
                                            className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 outline-none"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {formData.resource_type === 'video' && "Accepted format: .mp4"}
                                        {formData.resource_type === 'audio' && "Accepted format: .mp3"}
                                        {(formData.resource_type === 'study_material' || formData.resource_type === 'book') && "Accepted format: .pdf"}
                                    </p>
                                </div>
                            )}

                            <div className="mt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={uploading || !formData.url}
                                    className="flex-1 px-4 py-3 bg-[#cca673] hover:bg-[#b59263] text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Save Resource
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassroomResources;
