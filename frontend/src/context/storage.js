import {
    LS_BOOKS_CACHE_KEY,
    LS_ACTION_QUEUE_KEY,
    LS_BOOKS_CACHE_ID
} from './constants';

export const storage = {
    getItem: (key) => {
        try {
            if (typeof window !== 'undefined') {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            }
            return null;
        } catch (error) {
            console.error(`Error reading localStorage key ${key}:`, error);
            return null;
        }
    },
    setItem: (key, value) => {
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem(key, JSON.stringify(value));
            }
        } catch (error) {
            console.error(`Error writing localStorage key ${key}:`, error);
        }
    },
    removeItem: (key) => {
        try {
            if (typeof window !== 'undefined') {
                localStorage.removeItem(key);
            }
        } catch (error) {
            console.error(`Error removing localStorage key ${key}:`, error);
        }
    }
};

// Initialize if needed
export const initializeStorage = () => {
    if (storage.getItem(LS_BOOKS_CACHE_KEY) === null) {
        storage.setItem(LS_BOOKS_CACHE_KEY, []);
    }
    if (storage.getItem(LS_ACTION_QUEUE_KEY) === null) {
        storage.setItem(LS_ACTION_QUEUE_KEY, []);
    }
    // Add other keys if needed
};