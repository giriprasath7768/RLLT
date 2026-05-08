import React, { createContext, useContext, useEffect, useRef } from 'react';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const ws = useRef(null);

    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.hostname}:8000/api/ws`;

        const connect = () => {
            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                console.log("WebSocket connected");
            };

            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log("WS message received:", data);
                    // Dispatch a custom event so other components can listen to it globally
                    window.dispatchEvent(new CustomEvent('app-sync-event', { detail: data }));
                } catch (err) {
                    console.error("Failed to parse WS message", err);
                }
            };

            ws.current.onclose = () => {
                console.log("WebSocket disconnected. Reconnecting in 3s...");
                setTimeout(connect, 3000);
            };
            
            ws.current.onerror = (err) => {
                console.error("WebSocket error", err);
                ws.current.close();
            }
        };

        connect();

        return () => {
            if (ws.current) {
                ws.current.onclose = null; // Prevent reconnect loop on unmount
                ws.current.close();
            }
        };
    }, []);

    return (
        <WebSocketContext.Provider value={ws.current}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    return useContext(WebSocketContext);
};
