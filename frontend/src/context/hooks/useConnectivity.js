import { useState, useEffect, useCallback } from 'react';
import { checkServerStatus } from '../bookApi';
import { SERVER_CHECK_INTERVAL } from '../constants';

export const useConnectivity = () => {
    const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
    const [isServerReachable, setIsServerReachable] = useState(true); // Assume reachable initially

    const performServerCheck = useCallback(async () => {
        // No need to check if browser thinks we are offline
        if (!navigator.onLine) {
            setIsServerReachable(false);
            return false;
        }
        const reachable = await checkServerStatus();
        setIsServerReachable(reachable);
        return reachable;
    }, []);

    useEffect(() => {
        const updateOnlineStatus = () => {
            const online = navigator.onLine;
            setIsOnline(online);
            if (!online) {
                setIsServerReachable(false); // Can't reach server if offline
            } else {
                performServerCheck(); // Check server when coming back online
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        // Initial check
        updateOnlineStatus();

        // Periodic check only when online
        let intervalId;
        if (isOnline) {
            intervalId = setInterval(async () => {
                 if (navigator.onLine) { // Double check before fetching
                    await performServerCheck();
                 } else {
                    setIsServerReachable(false); // Update if browser went offline between checks
                 }
            }, SERVER_CHECK_INTERVAL);
        }


        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
            clearInterval(intervalId);
        };
    }, [performServerCheck, isOnline]); // Rerun effect if isOnline changes

    return { isOnline, isServerReachable, checkServerReachability: performServerCheck };
};