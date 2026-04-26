import React, { useState, useRef, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';

const Recordings = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0); // in seconds
    const [showModal, setShowModal] = useState(false);
    const [splits, setSplits] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);

    // Waveform visualization fake data
    const [waveformData, setWaveformData] = useState(Array.from({ length: 30 }, () => 10));

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);
    const timerRef = useRef(null);
    const waveIterRef = useRef(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start(100); // Collect data frequently
            setIsRecording(true);
            setIsPaused(false);
            setDuration(0);

            // Timer
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

            // Visualizer fake
            waveIterRef.current = setInterval(() => {
                setWaveformData(prev => {
                    const next = [...prev.slice(1), Math.random() * 40 + 10];
                    return next;
                });
            }, 100);

        } catch (error) {
            console.error('Error accessing microphone', error);
            alert("Could not access the microphone. Please check permissions.");
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            clearInterval(timerRef.current);
            clearInterval(waveIterRef.current);
        } else if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            timerRef.current = setInterval(() => setDuration(prev => prev + 1), 1000);
            waveIterRef.current = setInterval(() => {
                setWaveformData(prev => {
                    const next = [...prev.slice(1), Math.random() * 40 + 10];
                    return next;
                });
            }, 100);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            streamRef.current.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            setIsPaused(false);
            clearInterval(timerRef.current);
            clearInterval(waveIterRef.current);
            setWaveformData(Array.from({ length: 30 }, () => 10)); // Reset wave

            // Show modal slightly after to ensure chunks are gathered
            setTimeout(() => {
                setShowModal(true);
                setSplits(1);
            }, 200);
        }
    };

    const formatTime = (totalSeconds) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        if (hrs > 0) return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // ----- AUDIO SPLITTING LOGIC -----

    const bufferToWave = (abuffer) => {
        const numOfChan = abuffer.numberOfChannels;
        const length = abuffer.length * numOfChan * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);
        const channels = [];
        let i, sample;
        let offset = 0;
        let pos = 0;

        // write WAVE header
        setUint32(0x46464952);                         // "RIFF"
        setUint32(length - 8);                         // file length - 8
        setUint32(0x45564157);                         // "WAVE"

        setUint32(0x20746d66);                         // "fmt " chunk
        setUint32(16);                                 // length = 16
        setUint16(1);                                  // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(abuffer.sampleRate);
        setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
        setUint16(numOfChan * 2);                      // block-align
        setUint16(16);                                 // 16-bit (hardcoded in this impl)

        setUint32(0x61746164);                         // "data" - chunk
        setUint32(length - pos - 4);                   // chunk length

        // write interleaved data
        for (i = 0; i < numOfChan; i++)
            channels.push(abuffer.getChannelData(i));

        while (pos < length) {
            for (i = 0; i < numOfChan; i++) {
                sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
                view.setInt16(pos, sample, true);
                pos += 2;
            }
            offset++;
        }

        return new Blob([buffer], { type: "audio/wav" });

        function setUint16(data) {
            view.setUint16(pos, data, true);
            pos += 2;
        }

        function setUint32(data) {
            view.setUint32(pos, data, true);
            pos += 4;
        }
    };

    const sliceAudioBuffer = (ctx, buffer, beginTime, endTime) => {
        const sampleRate = buffer.sampleRate;
        const channels = buffer.numberOfChannels;
        const startOffset = Math.floor(sampleRate * beginTime);
        const endOffset = Math.floor(sampleRate * endTime);
        const frameCount = endOffset - startOffset;

        const newAudioBuffer = ctx.createBuffer(channels, frameCount, sampleRate);

        for (let c = 0; c < channels; c++) {
            const channelData = buffer.getChannelData(c);
            const newChannelData = newAudioBuffer.getChannelData(c);
            for (let i = 0; i < frameCount; i++) {
                newChannelData[i] = channelData[startOffset + i];
            }
        }
        return newAudioBuffer;
    };

    const processAndDownload = async () => {
        if (!audioChunksRef.current || audioChunksRef.current.length === 0) return;
        setIsProcessing(true);

        try {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

            if (splits <= 1) {
                // If only 1 part, just download the raw WebM blob to save time/compute
                downloadBlob(blob, `Recording_Full.webm`);
            } else {
                // Decode array buffer context
                const arrayBuffer = await blob.arrayBuffer();
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

                const totalDuration = audioBuffer.duration;
                // Calculate base duration rounded down to the nearest second
                const segmentLength = Math.floor(totalDuration / splits);

                for (let i = 0; i < splits; i++) {
                    const begin = i * segmentLength;
                    // For the final segment, stretch it to the absolute total duration
                    const end = (i === splits - 1) ? totalDuration : (i + 1) * segmentLength;

                    const chunkBuffer = sliceAudioBuffer(ctx, audioBuffer, begin, end);
                    const wavBlob = bufferToWave(chunkBuffer);

                    downloadBlob(wavBlob, `Recording_Part${i + 1}.wav`);

                    // Increased delay to allow the browser to initiate each download separately
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        } catch (err) {
            console.error("Error processing audio:", err);
            alert("An error occurred while processing the audio.");
        } finally {
            setIsProcessing(false);
            setShowModal(false);
        }
    };

    const downloadBlob = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        a.click();

        // Delay revocation to ensure download triggers properly
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 1000);
    };

    const modalFooter = (
        <div>
            <Button label="Cancel" icon="pi pi-times" onClick={() => setShowModal(false)} className="p-button-text text-gray-500 mr-2" disabled={isProcessing} />
            <Button label={isProcessing ? "Processing..." : "Process & Download"} icon={isProcessing ? "pi pi-spin pi-spinner" : "pi pi-download"} onClick={processAndDownload} autoFocus className="p-button-primary bg-[#051220] hover:bg-[#1a2d42] border-none" disabled={isProcessing} />
        </div>
    );

    return (
        <div className="p-10 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-[#051220] tracking-tight mb-2">Voice Recordings</h1>
                <p className="text-gray-500">Record your voice directly in the browser and dynamically split the audio into downloadable segments.</p>
            </div>

            {/* STYLED CARD MATCHING PRODUCT SCREENSHOT AESTHETICS */}
            <div className="bg-[rgb(81,106,135)] rounded-[20px] p-5 w-[330px] mx-auto mt-10 shadow-2xl font-sans border border-[#3C3C40]">
                {/* Image Placeholder area */}
                <div className="w-full relative flex items-center justify-center mb-8 mt-4 min-h-[150px]">
                    {(!isRecording && !isPaused) ? (
                        <svg viewBox="0 0 120 120" className="w-[160px] h-[160px] drop-shadow-[0_15px_30px_rgba(226,33,52,0.3)] transition-transform hover:scale-105 duration-300" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <clipPath id="circle-clip">
                                    <circle cx="60" cy="60" r="60" />
                                </clipPath>
                            </defs>
                            <circle cx="60" cy="60" r="60" fill="#e22134" />
                            <polygon points="50,40 120,80 120,120 50,120 40,80" fill="#cc1c2c" clipPath="url(#circle-clip)" />

                            <g transform="translate(15, 15) scale(0.75)">
                                <rect x="44" y="24" width="32" height="48" rx="16" fill="white" />
                                <line x1="44" y1="36" x2="76" y2="36" stroke="#e22134" strokeWidth="4" />
                                <line x1="44" y1="44" x2="76" y2="44" stroke="#e22134" strokeWidth="4" />
                                <line x1="44" y1="52" x2="76" y2="52" stroke="#e22134" strokeWidth="4" />

                                <path d="M 30 48 C 30 68, 90 68, 90 48" stroke="white" strokeWidth="6" strokeLinecap="butt" fill="none" />
                                <path d="M 28 48 L 36 42 M 92 48 L 84 42" stroke="white" strokeWidth="5" strokeLinecap="round" />

                                <rect x="56" y="68" width="8" height="15" fill="white" />

                                <rect x="47" y="83" width="26" height="4" fill="white" />
                                <rect x="38" y="89" width="44" height="4" fill="white" />
                                <rect x="29" y="95" width="62" height="5" fill="white" />

                                <path d="M 22 30 A 12 12 0 0 0 22 46" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                                <path d="M 16 23 A 20 20 0 0 0 16 53" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                                <path d="M 10 16 A 28 28 0 0 0 10 60" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />

                                <path d="M 98 30 A 12 12 0 0 1 98 46" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                                <path d="M 104 23 A 20 20 0 0 1 104 53" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                                <path d="M 110 16 A 28 28 0 0 1 110 60" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                            </g>
                        </svg>
                    ) : (
                        <div className="flex items-end justify-center w-full h-[120px] gap-[6px] p-4 opacity-90 border-b border-[#3C3C40] rounded-b-lg mb-6">
                            {waveformData.map((h, i) => (
                                <div
                                    key={i}
                                    className={`w-[6px] rounded-full transition-all duration-75 ${isRecording && !isPaused ? 'bg-gradient-to-t from-red-500 to-red-400' : 'bg-[#4a4a50]'}`}
                                    style={{ height: `${isRecording && !isPaused ? h * 2 + 10 : 10}px` }}
                                ></div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Title */}
                <h2 className="text-white text-[22px] font-bold tracking-wide">Audio Recorder</h2>

                {/* The requested Text */}
                <p className="text-[#a0a0a5] text-[14px] mt-2 mb-6 h-10 font-medium">
                    {!isRecording ? "Click microphone to start recording" : isPaused ? "Recording paused. Click play to resume." : "Recording in progress..."}
                </p>


                {/* Bottom Section */}
                <div className="flex justify-between items-center mb-2">
                    <div className="text-white text-[2.8rem] font-bold tracking-tighter">
                        {formatTime(duration)}
                    </div>

                    {!isRecording ? (
                        <button
                            onClick={startRecording}
                            className="bg-gradient-to-r from-green-500 to-green-400 px-5 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-transform hover:scale-[1.03] active:scale-95 shadow-[0_5px_15px_rgba(34,197,94,0.35)] outline-none"
                            style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3), 0 5px 15px rgba(34,197,94,0.35)' }}
                        >
                            <i className="pi pi-microphone text-lg"></i>
                            <span className="text-[15px]">Start</span>
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={pauseRecording}
                                className="w-[50px] h-[50px] flex items-center justify-center bg-[#1c1c1e] rounded-xl text-white hover:bg-[#2c2c2f] transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] border border-transparent hover:border-[#3c3c40]"
                            >
                                <i className={`pi ${isPaused ? 'pi-play' : 'pi-pause'} text-xl`}></i>
                            </button>
                            <button
                                onClick={stopRecording}
                                className="bg-gradient-to-r from-red-500 to-red-400 px-5 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-transform hover:scale-[1.03] active:scale-95 border border-red-400"
                                style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3), 0 5px 15px rgba(239,68,68,0.35)' }}
                            >
                                <i className="pi pi-stop"></i>
                                <span className="text-[15px]">Stop</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <Dialog
                header={<div className="font-bold text-xl text-[#051220]"><i className="pi pi-file-export mr-2 text-[#c8a165]"></i> Split & Export</div>}
                visible={showModal}
                style={{ width: '450px' }}
                footer={modalFooter}
                onHide={() => !isProcessing && setShowModal(false)}
                closable={!isProcessing}
                className="custom-export-dialog"
            >
                <div className="pt-4">
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200 flex justify-between items-center">
                        <span className="text-gray-600 font-semibold text-sm">Total Captured Time</span>
                        <span className="text-lg font-black text-[#051220]">{formatTime(duration)}</span>
                    </div>

                    <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                        Enter the number of equal segments you want to split this audio into. Entering <strong>1</strong> will export a single `webm` file. Entering a higher number will convert and split into multiple `.wav` segments.
                    </p>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="splits" className="font-bold text-sm text-gray-700">Number of Splits</label>
                        <InputNumber
                            inputId="splits"
                            value={splits}
                            onValueChange={(e) => setSplits(e.value || 1)}
                            min={1}
                            max={50}
                            showButtons
                            buttonLayout="horizontal"
                            decrementButtonClassName="p-button-secondary bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700"
                            incrementButtonClassName="p-button-secondary bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700"
                            incrementButtonIcon="pi pi-plus"
                            decrementButtonIcon="pi pi-minus"
                            inputClassName="text-center font-bold"
                            disabled={isProcessing}
                        />
                    </div>

                    {splits > 1 && (
                        <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs font-semibold">
                            <i className="pi pi-info-circle mr-1"></i> Will produce {splits} separate .wav files, each approx {formatTime(Math.floor(duration / splits))}.
                        </div>
                    )}
                </div>
            </Dialog>
        </div >
    );
};

export default Recordings;
