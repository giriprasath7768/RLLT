import { useEffect } from 'react';

export const useAppSync = (callback) => {
    useEffect(() => {
        const handleSyncEvent = (event) => {
            // Check if there is a detail object
            if (event && event.detail) {
                callback(event.detail);
            }
        };

        window.addEventListener('app-sync-event', handleSyncEvent);
        return () => window.removeEventListener('app-sync-event', handleSyncEvent);
    }, [callback]);
};
