export const API_BASE_URL = 'http://localhost:5000/api';
export const WS_URL = 'ws://localhost:5000';
export const ITEMS_PER_PAGE = 36;
export const RELOAD_DELAY_MS = 500;
export const SERVER_CHECK_INTERVAL = 30000;
export const SERVER_CHECK_TIMEOUT = 5000; // Timeout for HEAD request

// Default Sort
export const DEFAULT_SORT_BY = 'id';
export const DEFAULT_SORT_ORDER = 'asc';

// LocalStorage Keys
export const LS_BOOKS_CACHE_KEY = 'offlineBooksCache';
export const LS_ACTION_QUEUE_KEY = 'offlineActionQueue';
export const LS_BOOKS_CACHE_ID = 'offlineBooksCacheId'; // Consider if still needed with new structure