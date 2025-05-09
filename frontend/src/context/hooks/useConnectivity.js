import { useState, useEffect, useCallback } from 'react';
import { checkServerStatus } from '../bookApi';
import { SERVER_CHECK_INTERVAL } from '../constants';

export const useConnectivity = () => {
    const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
    const [isServerReachable, setIsServerReachable] = useState(true); 

    const performServerCheck = useCallback(async () => {
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
                setIsServerReachable(false); 
            } else {
                performServerCheck(); 
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        updateOnlineStatus();

        let intervalId;
        if (isOnline) {
            intervalId = setInterval(async () => {
                 if (navigator.onLine) { 
                    await performServerCheck();
                 } else {
                    setIsServerReachable(false); 
                 }
            }, SERVER_CHECK_INTERVAL);
        }


        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
            clearInterval(intervalId);
        };
    }, [performServerCheck, isOnline]); 

    return { isOnline, isServerReachable, checkServerReachability: performServerCheck };
};