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
    const tracksToStopRef = useRef([]);
    const audioContextRef = useRef(null);

    const startRecording = async () => {
        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });

            let voiceStream = null;
            try {
                voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            } catch (err) {
                console.warn("Could not get microphone access:", err);
            }

            const allTracks = [...displayStream.getTracks()];
            if (voiceStream) {
                allTracks.push(...voiceStream.getTracks());
            }
            tracksToStopRef.current = allTracks;

            let finalStream = new MediaStream([...displayStream.getVideoTracks()]);
            const hasDisplayAudio = displayStream.getAudioTracks().length > 0;
            const hasVoiceAudio = voiceStream && voiceStream.getAudioTracks().length > 0;

            if (hasDisplayAudio || hasVoiceAudio) {
                const audioContext = new AudioContext();
                audioContextRef.current = audioContext;
                const audioDestination = audioContext.createMediaStreamDestination();

                if (hasDisplayAudio) {
                    const displayAudioSource = audioContext.createMediaStreamSource(new MediaStream([displayStream.getAudioTracks()[0]]));
                    displayAudioSource.connect(audioDestination);
                }

                if (hasVoiceAudio) {
                    const voiceAudioSource = audioContext.createMediaStreamSource(new MediaStream([voiceStream.getAudioTracks()[0]]));
                    voiceAudioSource.connect(audioDestination);
                }

                audioDestination.stream.getAudioTracks().forEach(track => finalStream.addTrack(track));
                
                if (audioContext.state === 'suspended') {
                    audioContext.resume().catch(console.error);
                }
            }

            setMediaStream(finalStream);

            // Determine the most compatible format supported by the browser
            const supportedFormats = [
                { mime: 'video/webm;codecs=vp8,opus', ext: 'webm' },
                { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
                { mime: 'video/mp4', ext: 'mp4' },
                { mime: 'video/x-matroska;codecs=avc1', ext: 'mkv' },
                { mime: 'video/webm;codecs=h264', ext: 'mkv' },
                { mime: 'video/webm', ext: 'webm' },
                { mime: '', ext: 'webm' } // fallback to let browser decide entirely
            ];

            const formatInfo = supportedFormats.find(f => f.mime === '' || MediaRecorder.isTypeSupported(f.mime));

            const mediaRecorder = new MediaRecorder(finalStream, { mimeType: formatInfo.mime });
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

                    const response = await fetch('http://' + window.location.hostname + ':8000/api/screen-recorder/convert', {
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

            finalStream.getVideoTracks()[0].onended = () => {
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
        
        if (tracksToStopRef.current && tracksToStopRef.current.length > 0) {
            tracksToStopRef.current.forEach(track => track.stop());
            tracksToStopRef.current = [];
        }

        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            setMediaStream(null);
        }

        if (audioContextRef.current) {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }

        setRecording(false);
    };

    // Clean up only on unmount (App close)
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                mediaRecorderRef.current.stop();
            }
            if (tracksToStopRef.current && tracksToStopRef.current.length > 0) {
                tracksToStopRef.current.forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(console.error);
            }
        };
    }, []);

    return (
        <ScreenRecordingContext.Provider value={{ recording, isProcessing, startRecording, stopRecording }}>
            {children}
        </ScreenRecordingContext.Provider>
    );
};

