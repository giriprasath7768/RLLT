import React from 'react';
import { useScreenRecording } from '../../context/ScreenRecordingContext';

const ScreenRecorder = () => {
    const { recording, isProcessing, startRecording, stopRecording } = useScreenRecording();

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6 text-white flex items-center gap-3">
                <i className="pi pi-desktop text-blue-400"></i>
                Screen Recorder
            </h1>

            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Capture System Screen</h2>
                        <p className="text-gray-400 mt-1">Record your entire screen, a window, or a specific browser tab.</p>
                        <p className="text-gray-500 mt-2 text-sm italic">Recording continues even if you navigate to other pages in the admin panel.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {recording && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full animate-pulse">
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                                <span className="font-semibold text-sm uppercase tracking-wider">Recording</span>
                            </div>
                        )}

                        {!recording ? (
                            <button
                                onClick={startRecording}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg transition-colors font-medium border border-blue-500 hover:border-blue-400 shadow-md"
                            >
                                <i className="pi pi-circle-fill text-sm"></i>
                                Start Recording
                            </button>
                        ) : (
                            <button
                                onClick={stopRecording}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-lg transition-colors font-medium border border-red-500 hover:border-red-400 shadow-md"
                            >
                                <i className="pi pi-stop-circle text-sm"></i>
                                Stop Recording
                            </button>
                        )}
                    </div>
                </div>

                {/* Video preview removed to prevent infinite mirror illusion */}
                <div className="w-full bg-black rounded-lg border border-gray-700 shadow-inner h-64 flex flex-col items-center justify-center p-8 text-center text-gray-500 gap-4 relative overflow-hidden">
                    {isProcessing ? (
                        <div className="flex flex-col items-center gap-3 w-full animate-fade-in z-10">
                            <i className="pi pi-spin pi-spinner text-5xl text-blue-400 mb-3 drop-shadow-md"></i>
                            <p className="text-xl font-bold text-white tracking-wide">Compiling Video...</p>
                            <p className="text-sm text-gray-400">Processing audio formatting strictly for Universal Playback capability. Please do not close this window.</p>
                        </div>
                    ) : (
                        <>
                            <i className="pi pi-video text-6xl opacity-40"></i>
                            {recording ? (
                                <p className="text-lg text-gray-400">Screen Recording in progress...<br /><span className="text-sm opacity-70">Preview disabled to prevent mirror effect</span></p>
                            ) : (
                                <p className="text-lg">Click Start Recording to begin.<br /><span className="text-sm opacity-70">Preview disabled to prevent mirror effect</span></p>
                            )}
                        </>
                    )}

                    {isProcessing && <div className="absolute inset-0 bg-blue-500/10 animate-pulse pointer-events-none"></div>}
                </div>
            </div>
        </div>
    );
};

export default ScreenRecorder;
