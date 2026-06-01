import React, { useState, useEffect, useRef } from 'react';

const DocumentNotesModal = ({ isOpen, onClose, notes, setNotes, language }) => {
    // Local state to handle fast typing without lag if the parent is heavy
    const [localNotes, setLocalNotes] = useState(notes || '');
    const [isListening, setIsListening] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    const recognitionRef = useRef(null);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isSupported = !!SpeechRecognition;

    useEffect(() => {
        setLocalNotes(notes || '');
    }, [notes]);

    useEffect(() => {
        if (!isOpen || !isSupported) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'zh' ? 'zh-CN' : (language === 'ar' ? 'ar-SA' : language || 'en-US');

        recognition.onstart = () => {
            setIsListening(true);
            setLiveTranscript('');
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript !== '') {
                setLocalNotes(prev => {
                    const spacing = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
                    return prev + spacing + finalTranscript.trim() + ' ';
                });
                setLiveTranscript('');
            } else if (interimTranscript !== '') {
                setLiveTranscript(interimTranscript);
            }
        };

        recognition.onerror = (e) => {
            console.error('Speech recognition error in Notes:', e);
            setIsListening(false);
            setLiveTranscript('');
        };

        recognition.onend = () => {
            setIsListening(false);
            setLiveTranscript('');
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [isOpen, language]);

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Mic start failed inside Notes:", e);
            }
        }
    };

    // Update parent only when closing or on specific interval
    const handleClose = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
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
                <div className="flex items-center gap-1.5">
                    {isSupported && (
                        <button
                            onClick={toggleListening}
                            className={`p-1.5 rounded-full transition-all focus:outline-none flex items-center justify-center ${isListening ? 'bg-red-500 text-white animate-pulse shadow-md' : 'text-amber-700 hover:text-amber-900 hover:bg-amber-200/50'}`}
                            title={isListening ? 'Stop Voice Dictation' : 'Voice Dictation'}
                        >
                            <i className="pi pi-microphone text-sm"></i>
                        </button>
                    )}
                    <button onClick={handleClose} className="text-amber-700 hover:text-amber-900 hover:bg-amber-200/50 p-1.5 rounded-full transition-colors focus:outline-none">
                        <i className="pi pi-times text-sm"></i>
                    </button>
                </div>
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

            {isListening && (
                <div className="bg-slate-900 text-white px-4 py-2 border-t border-slate-700 flex items-center gap-3 animate-fadein shrink-0">
                    <div className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider leading-none mb-0.5">Live Transcribing</span>
                        <span className="text-xs font-semibold text-slate-200 block truncate italic">
                            {liveTranscript || 'Speak now...'}
                        </span>
                    </div>
                    <div className="flex items-end gap-0.5 h-3 shrink-0">
                        <div className="dictation-bar-mini" style={{ animationDelay: '0.1s', animationDuration: '0.6s' }}></div>
                        <div className="dictation-bar-mini" style={{ animationDelay: '0.2s', animationDuration: '0.5s' }}></div>
                        <div className="dictation-bar-mini" style={{ animationDelay: '0.3s', animationDuration: '0.7s' }}></div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes dictation-wave-mini {
                    0%, 100% { height: 3px; }
                    50% { height: 10px; }
                }
                .dictation-bar-mini {
                    width: 2px;
                    background-color: #ef4444;
                    border-radius: 9999px;
                    animation: dictation-wave-mini 0.8s ease-in-out infinite;
                }
            `}</style>

            {/* Bottom Footer Action */}
            <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 rounded-b-xl border-t border-gray-100 flex justify-between items-center">
                <span><i className="pi pi-info-circle mr-1"></i> Auto-saves closely with doc</span>
                <span className="font-mono">{localNotes.length} chars</span>
            </div>
        </div>
    );
};

export default DocumentNotesModal;
