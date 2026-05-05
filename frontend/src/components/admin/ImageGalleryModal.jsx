import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ImageGalleryModal = ({ isOpen, onClose, onInsert }) => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchImages();
        }
    }, [isOpen]);

    const fetchImages = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://' + window.location.hostname + ':8000/api/images', { withCredentials: true });
            setImages(res.data);
        } catch (err) {
            console.error('Failed to fetch images', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-4xl flex flex-col transform transition-all scale-100 opacity-100 h-[80vh]">
                <div className="px-5 py-4 bg-gray-100 border-b flex justify-between items-center bg-gradient-to-r from-gray-100 to-gray-50 shrink-0">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <i className="pi pi-images text-blue-500 text-lg"></i>
                        7 Transformation Image
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors focus:outline-none">
                        <i className="pi pi-times"></i>
                    </button>
                </div>
                <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                    {loading ? (
                        <div className="flex justify-center items-center h-full text-gray-400">
                            <i className="pi pi-spin pi-spinner text-4xl"></i>
                            <span className="ml-3 font-semibold">Loading gallery...</span>
                        </div>
                    ) : images.length > 0 ? (
                        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                            {images.map((img) => {
                                const fullUrl = img.url.startsWith('/') ? `http://${window.location.hostname}:8000${img.url}` : img.url;
                                return (
                                    <div
                                        key={img.id}
                                        className="relative group overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer bg-white border border-gray-200"
                                        onClick={() => onInsert(fullUrl)}
                                    >
                                        <img
                                            src={fullUrl}
                                            alt="Gallery"
                                            className="w-full object-cover break-inside-avoid rounded-xl group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='24' text-anchor='middle' dy='.3em' fill='%2364748b'%3EError%3C/text%3E%3C/svg%3E";
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-xl pointer-events-none"></div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <i className="pi pi-image text-4xl text-gray-300 mb-3"></i>
                            <h3 className="text-lg font-bold text-gray-600">No images available</h3>
                            <p className="text-gray-400 text-sm mt-1">Upload images to the gallery first.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageGalleryModal;
