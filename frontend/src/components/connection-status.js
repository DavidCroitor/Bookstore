import React from 'react';
import { useBooks } from '@/context/BooksContext';
import styles from '../styles/connection-status.module.css';

const ConnectionStatus = () => {
    const { 
        isOnline, 
        isServerReachable, 
        isSyncing, 
        actionQueueCount: actionQueue, 
    } = useBooks();
    
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    if (isOnline && isServerReachable) {
        if (isSyncing) {
            return (
                <div className={`${styles.statusBar} ${styles.syncing}`}>
                    <div className={styles.spinner}></div>
                    <span>Syncing changes ({actionQueue.length} remaining)...</span>
                </div>
            );
        }
        if (actionQueue.length > 0) {
            return (
                <div className={`${styles.statusBar} ${styles.pendingSync}`}>
                    <span>Changes ready to sync ({actionQueue.length})</span>
                </div>
            );
        }
        return null; // Don't show anything if everything is normal
    }

    return (
        <div className={`${styles.statusBar} ${!isOnline ? styles.offline : styles.serverDown}`}>
            <span className={styles.icon}>
                {!isOnline ? '⚠️' : '🖥️'}
            </span>
            <span>
                {!isOnline 
                    ? 'You are offline. Changes will sync when connection is restored.' 
                    : 'Server is unreachable. Working in offline mode.'}
            </span>
            {actionQueue.length > 0 && (
                <span className={styles.queueCount}>
                    Pending changes: {actionQueue.length}
                </span>
            )}
        </div>
    );
};

export default ConnectionStatus;