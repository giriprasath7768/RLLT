import React from 'react';

const SavedDocumentsModal = ({ isOpen, onClose, documents, onSelectDocument, onDeleteDocument }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fadein print:hidden">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-2xl flex flex-col transform transition-all scale-100 opacity-100 h-[70vh]">

                {/* Header */}
                <div className="px-5 py-4 bg-gray-100 border-b flex justify-between items-center bg-gradient-to-r from-gray-100 to-gray-50 shrink-0">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <i className="pi pi-folder-open text-blue-500 text-lg"></i>
                        Saved Documents Library
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors focus:outline-none">
                        <i className="pi pi-times"></i>
                    </button>
                </div>

                {/* List Body */}
                <div className="flex-1 overflow-y-auto p-0 bg-gray-50 custom-scrollbar">
                    {documents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
                            <i className="pi pi-file text-4xl opacity-50"></i>
                            <p>No documents found in database.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {documents.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)).map(doc => (
                                <div
                                    key={doc.id}
                                    onClick={() => onSelectDocument(doc)}
                                    className="p-4 hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-between group"
                                >
                                    <div className="flex flex-col gap-1 overflow-hidden">
                                        <span className="font-semibold text-gray-800 truncate group-hover:text-blue-700">
                                            {doc.title || 'Untitled Document'}
                                        </span>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            {doc.country_code && (
                                                <span className="flex items-center gap-1 shadow-sm px-1.5 py-0.5 border rounded bg-white" title="Locale Map Configured">
                                                    <img src={`https://flagcdn.com/w20/${doc.country_code.toLowerCase()}.png`} alt="flag" className="w-3 rounded-sm" />
                                                    {doc.country_code}
                                                </span>
                                            )}
                                            {doc.category && (
                                                <span className="flex items-center gap-1">
                                                    <i className="pi pi-star text-[10px]"></i> {doc.category}
                                                </span>
                                            )}
                                            {doc.language !== 'en' && (
                                                <span className="flex items-center gap-1 px-1.5 rounded-md bg-gray-100 uppercase tracking-widest text-[10px] font-bold">
                                                    {doc.language}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-xs text-gray-400 font-mono">
                                                {new Date(doc.updated_at || doc.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteDocument(doc.id); }}
                                                className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors focus:outline-none"
                                                title="Delete document permanently"
                                            >
                                                <i className="pi pi-trash text-sm"></i>
                                            </button>
                                        </div>
                                        {doc.notes && (
                                            <i className="pi pi-clipboard text-amber-500 text-xs mt-1" title="Contains active sticky notes"></i>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Gradient Strip */}
                <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600 shrink-0"></div>
            </div>
        </div>
    );
};

export default SavedDocumentsModal;
