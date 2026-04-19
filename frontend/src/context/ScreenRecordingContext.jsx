import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const ScreenRecordingContext = createContext();

export const useScreenRecording = () => {
    return useContext(ScreenRecordingContext);
};

export const ScreenRecordingProvider = ({ children }) => {
    const [recording, setRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mediaStream, setMediaStream] = useState(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const startTimeRef = useRef(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });

            setMediaStream(stream);

            // Determine the most compatible format supported by the browser
            const supportedFormats = [
                { mime: 'video/mp4', ext: 'mp4' },
                { mime: 'video/x-matroska;codecs=avc1', ext: 'mkv' },
                { mime: 'video/webm;codecs=h264', ext: 'mkv' },
                { mime: 'video/webm', ext: 'webm' }
            ];

            const formatInfo = supportedFormats.find(f => MediaRecorder.isTypeSupported(f.mime)) || supportedFormats[3];

            const mediaRecorder = new MediaRecorder(stream, { mimeType: formatInfo.mime });
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorderRef.current._extension = formatInfo.ext;
            recordedChunksRef.current = [];

            mediaRecorder.ondataavailable = function (e) {
                if (e.data.size > 0) {
                    recordedChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async function () {
                setIsProcessing(true);
                const mimeType = mediaRecorder.mimeType;
                const blob = new Blob(recordedChunksRef.current, { type: mimeType });

                try {
                    const formData = new FormData();
                    formData.append('file', blob, 'video.webm');

                    const response = await fetch('http://localhost:8000/api/screen-recorder/convert', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) {
                        throw new Error('Transcoding failed');
                    }

                    const fixedBlob = await response.blob();
                    const url = URL.createObjectURL(fixedBlob);

                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;

                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    a.download = `Screen_Recording_${timestamp}.mp4`;

                    document.body.appendChild(a);
                    a.click();

                    setTimeout(() => {
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                    }, 500);

                } catch (error) {
                    console.error("Transcoding Server Error:", error);
                    alert("A server error occurred while compiling your video. A raw WebM version will be downloaded instead, which might require VLC Player to view.");

                    // Fallback to purely downloading the raw webm
                    const fallbackUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = fallbackUrl;
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    a.download = `Screen_Recording_Raw_${timestamp}.webm`;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => window.URL.revokeObjectURL(fallbackUrl), 500);
                } finally {
                    setIsProcessing(false);
                }
            };

            stream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };

            mediaRecorder.start(); // collect all into one chunk
            setRecording(true);
        } catch (error) {
            console.error("Error starting screen recording:", error);
            if (error.name !== "NotAllowedError") {
                alert("Could not start screen recording. See console for details.");
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            setMediaStream(null);
        }
        setRecording(false);
    };

    // Clean up only on unmount (App close)
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    return (
        <ScreenRecordingContext.Provider value={{ recording, isProcessing, startRecording, stopRecording }}>
            {children}
        </ScreenRecordingContext.Provider>
    );
};
