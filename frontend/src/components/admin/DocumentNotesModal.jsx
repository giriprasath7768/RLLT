import React, { useState, useEffect } from 'react';

const DocumentNotesModal = ({ isOpen, onClose, notes, setNotes }) => {
    // Local state to handle fast typing without lag if the parent is heavy
    const [localNotes, setLocalNotes] = useState(notes || '');

    useEffect(() => {
        setLocalNotes(notes || '');
    }, [notes]);

    // Update parent only when closing or on specific interval
    const handleClose = () => {
        setNotes(localNotes);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed top-20 right-8 z-[200] w-96 max-h-[80vh] flex flex-col transform transition-all print:hidden shadow-2xl rounded-xl border border-gray-200 bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] animate-fadein">
            {/* Header */}
            <div className="flex justify-between items-center bg-gradient-to-r from-amber-100 to-yellow-50 px-4 py-3 rounded-t-xl border-b border-amber-200 cursor-move">
                <div className="flex items-center gap-2">
                    <i className="pi pi-clipboard text-amber-600"></i>
                    <h3 className="font-bold text-amber-900 tracking-wide text-sm">Document Notes</h3>
                </div>
                <button onClick={handleClose} className="text-amber-700 hover:text-amber-900 hover:bg-amber-200/50 p-1.5 rounded-full transition-colors focus:outline-none">
                    <i className="pi pi-times text-sm"></i>
                </button>
            </div>

            {/* Note Editor Area */}
            <div className="flex-1 p-0 overflow-hidden rounded-b-xl flex bg-yellow-50/30">
                <textarea
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    placeholder="Jot down structural ideas, page references, or reminders..."
                    className="w-full h-96 p-4 bg-transparent border-none outline-none resize-none text-gray-800 text-sm leading-relaxed custom-scrollbar placeholder-gray-400 font-sans"
                    style={{ backgroundImage: 'linear-gradient(transparent, transparent 27px, #fde68a 28px)', backgroundSize: '100% 28px', lineHeight: '28px', padding: '8px 16px' }}
                    autoFocus
                />
            </div>

            {/* Bottom Footer Action */}
            <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 rounded-b-xl border-t border-gray-100 flex justify-between items-center">
                <span><i className="pi pi-info-circle mr-1"></i> Auto-saves closely with doc</span>
                <span className="font-mono">{localNotes.length} chars</span>
            </div>
        </div>
    );
};

export default DocumentNotesModal;
