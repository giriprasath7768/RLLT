import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Toast } from 'primereact/toast';

const ImageGallery = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState(null);
    const toast = useRef(null);

    const API_BASE_URL = 'http://localhost:8000/api/images';

    const fetchImages = async () => {
        setLoading(true);
        try {
            const res = await axios.get(API_BASE_URL, { withCredentials: true });
            setImages(res.data);
        } catch (err) {
            console.error(err);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to fetch images' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handleManualUpload = async (e) => {
        const files = e.target.files;
        if (!files.length) return;

        const formData = new FormData();
        Array.from(files).forEach((file) => {
            formData.append('files', file);
        });

        setUploading(true);
        try {
            await axios.post(`${API_BASE_URL}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Images uploaded successfully' });
            fetchImages();
        } catch (err) {
            console.error(err);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to upload images' });
        } finally {
            setUploading(false);
        }
    };

    const handleExcelImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            // Extract URLs: Look for common headers like 'url', 'image', 'link' or just take the first string that starts with http
            const urls = [];
            data.forEach(row => {
                let foundUrl = null;

                // First try to match explicitly by column name
                const searchKeys = ['location', 'url', 'image', 'link'];
                for (let key in row) {
                    if (searchKeys.includes(key.toLowerCase())) {
                        foundUrl = row[key];
                        break;
                    }
                }

                // Fallback to checking values if no column name matched
                if (!foundUrl) {
                    const values = Object.values(row);
                    for (let val of values) {
                        if (typeof val === 'string' && (val.startsWith('http') || val.startsWith('/'))) {
                            foundUrl = val;
                            break;
                        }
                    }
                }

                if (foundUrl && typeof foundUrl === 'string') {
                    urls.push(foundUrl.trim());
                }
            });

            if (!urls.length) {
                toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No valid URLs found in the Excel sheet.' });
                return;
            }

            setUploading(true);
            try {
                await axios.post(`${API_BASE_URL}/urls`, { urls }, { withCredentials: true });
                toast.current?.show({ severity: 'success', summary: 'Success', detail: `${urls.length} image URLs imported successfully` });
                fetchImages();
            } catch (err) {
                console.error(err);
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to import image URLs' });
            } finally {
                setUploading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleDeleteImage = async (e, imageId) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this image?")) return;

        try {
            await axios.delete(`${API_BASE_URL}/${imageId}`, { withCredentials: true });
            toast.current?.show({ severity: 'success', summary: 'Deleted', detail: 'Image removed successfully' });
            fetchImages();
        } catch (err) {
            console.error(err);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete image' });
        }
    };

    const downloadExcelTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            { location: "/api/uploads/image1.jpg" },
            { location: "/api/uploads/image2.png" }
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ImagesTemplate");
        XLSX.writeFile(wb, "Image_Upload_Template.xlsx");
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <Toast ref={toast} />
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Image Gallery</h1>
                    <p className="text-gray-500 mt-2">Manage and view your spectacular image collections.</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    {uploading && <span className="text-sm font-bold text-blue-600 animate-pulse">Uploading...</span>}

                    <div className="flex items-center gap-4">
                        {/* Download Template */}
                        <button
                            onClick={downloadExcelTemplate}
                            className="relative overflow-hidden group border-2 border-dashed border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors rounded-xl px-4 py-2 flex items-center gap-2 cursor-pointer shadow-sm"
                        >
                            <i className="pi pi-download"></i>
                            <span className="font-bold text-sm tracking-wide">Download Template</span>
                        </button>

                        {/* Manual Image Upload */}
                        <div className="relative overflow-hidden group border-2 border-dashed border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors rounded-xl px-4 py-2 flex items-center gap-2 cursor-pointer shadow-sm">
                            <i className="pi pi-upload"></i>
                            <span className="font-bold text-sm tracking-wide">Upload Images</span>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleManualUpload}
                                disabled={uploading}
                            />
                        </div>

                        {/* Excel Sheet Import */}
                        <div className="relative overflow-hidden group border-2 border-dashed border-green-400 bg-green-50 text-green-600 hover:bg-green-100 transition-colors rounded-xl px-4 py-2 flex items-center gap-2 cursor-pointer shadow-sm">
                            <i className="pi pi-file-excel"></i>
                            <span className="font-bold text-sm tracking-wide">Import Excel Links</span>
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleExcelImport}
                                disabled={uploading}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20 text-gray-400">
                    <i className="pi pi-spin pi-spinner text-4xl"></i>
                    <span className="ml-3 font-semibold">Loading gallery...</span>
                </div>
            ) : images.length > 0 ? (
                <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                    {images.map((img) => {
                        const fullUrl = img.url.startsWith('/') ? `http://localhost:8000${img.url}` : img.url;
                        return (
                            <div
                                key={img.id}
                                className="relative group overflow-hidden rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer bg-white"
                                onClick={() => setFullScreenImage(fullUrl)}
                            >
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 z-10 rounded-2xl"></div>
                                <img
                                    src={fullUrl}
                                    alt="Gallery Element"
                                    className="w-full object-cover break-inside-avoid rounded-2xl"
                                    loading="lazy"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='24' text-anchor='middle' dy='.3em' fill='%2364748b'%3EImage Unavailable%3C/text%3E%3C/svg%3E";
                                    }}
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                                    <div className="flex justify-between items-end gap-2">
                                        <div className="overflow-hidden">
                                            <div className="text-white text-xs font-medium truncate">{new Date(img.created_at).toLocaleDateString()}</div>
                                            <div className="text-white text-[10px] truncate opacity-70 mt-1">{img.url}</div>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteImage(e, img.id)}
                                            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors ml-2 flex-shrink-0"
                                            title="Delete Image"
                                        >
                                            <i className="pi pi-trash text-sm"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-20 text-center border-4 border-dashed border-gray-200 rounded-3xl bg-white/50 w-full">
                    <div className="text-gray-400 text-6xl mb-4"><i className="pi pi-image"></i></div>
                    <h3 className="text-xl font-bold text-gray-700">No images found</h3>
                    <p className="text-gray-500 mt-2">Upload images manually or import an Excel sheet to populate the gallery.</p>
                </div>
            )}

            {/* Full Screen Image Modal */}
            {fullScreenImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                    onClick={() => setFullScreenImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors p-2 z-[60]"
                        onClick={() => setFullScreenImage(null)}
                    >
                        <i className="pi pi-times text-3xl font-bold"></i>
                    </button>
                    <img
                        src={fullScreenImage}
                        alt="Fullscreen"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl scale-in-center"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <style>{`
                .scale-in-center {
                    animation: scale-in-center 0.3s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
                }
                @keyframes scale-in-center {
                    0% { transform: scale(0.95); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default ImageGallery;
