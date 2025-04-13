import React, { createContext, useState, useContext, useEffect, useCallback, use } from 'react';

const BooksContext = createContext();
const API_URL = 'http://localhost:5000/api';
const ITEMS_PER_PAGE = 12; // Define items per page (limit)
const RELOAD_DELAY_MS = 500;
const SERVER_CHECK_INTERVAL = 30000; // Check server every 30 seconds


// --- Define Default Sort ---
const DEFAULT_SORT_BY = 'id';
const DEFAULT_SORT_ORDER = 'asc';

//LocalStorage Keys
const LS_BOOKS_CACHE_KEY = 'offlineBooksCache';
const LS_ACTION_QUEUE_KEY = 'offlineActionQueue';
const LS_BOOKS_CACHE_ID = 'offlineBooksCacheId';

const storage = {
    getItem: (key) => {
        try {
            // Check if we're in a browser environment
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
            // Check if we're in a browser environment
            if (typeof window !== 'undefined') {
                localStorage.setItem(key, JSON.stringify(value));
            }
        } catch (error) {
            console.error(`Error writing localStorage key ${key}:`, error);
        }
    },
    removeItem: (key) => {
        try {
            // Check if we're in a browser environment
            if (typeof window !== 'undefined') {
                localStorage.removeItem(key);
            }
        } catch (error) {
            console.error(`Error removing localStorage key ${key}:`, error);
        }
    }
};

export const BooksProvider = ({ children }) => {
    // --- State ---
    const [books, setBooks] = useState([]); // Holds the ACCUMULATED list
    const [currentPage, setCurrentPage] = useState(0); // Last fetched page (start at 0)
    const [totalPages, setTotalPages] = useState(1); // Total pages from API
    const [limit] = useState(ITEMS_PER_PAGE);
    // Loading state: differentiate initial vs subsequent page loads
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    // Track current sort/filter
    const [currentSortBy, setCurrentSortBy] = useState(DEFAULT_SORT_BY);
    const [currentOrder, setCurrentOrder] = useState(DEFAULT_SORT_ORDER);
    const [currentFilter, setCurrentFilter] = useState(null);

    const [stats, setStats] = useState({
        totalCount: 0,
        mostExpensiveBook: null,
        leastExpensiveBook: null,
        closestToAverageBook: null,
        averagePrice: 0,
    });
    
    const [allBooks, setAllBooks] = useState([]);
    const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
    const [isServerReachable, setIsServerReachable] = useState(true);
    const [actionQueue, setActionQueue] = useState(() => {
        if (typeof window !== 'undefined') {
            return storage.getItem(LS_ACTION_QUEUE_KEY) || [];
        }
        return [];
    });
    const [isSyncing, setIsSyncing] = useState(false); // Track syncing state
    const isSyncingRef = React.useRef(isSyncing); // Ref to avoid stale state in async functions
    const justSyncedRef = React.useRef(false); // Ref to track if sync just happened
    const [localBookIds, setLocalBookIds] = useState(() => {
        if (typeof window !== 'undefined') {
            return storage.getItem(LS_BOOKS_CACHE_ID) || [];
        }
        return {};
    });
    const [socket, setSocket] = useState(null);

    // Helper functions to support fetchBooks
    const updateBooksState = (serverBooks, pageToFetch, isNewQuery) => {
        if (pageToFetch === 1 || isNewQuery) {
            if (justSyncedRef.current) {
                // Post-sync fetch: use only server books
                setBooks(serverBooks);
                justSyncedRef.current = false;
            } else {
                // Merge with local books
                const localOnlyBooks = books.filter(book => 
                    typeof book.id === 'string' && book.id.startsWith('local_')
                );
                
                const serverIds = new Set(serverBooks.map(book => book.id));
                const newBooks = [
                    ...serverBooks,
                    ...localOnlyBooks.filter(book => !serverIds.has(book.id))
                ];
                
                setBooks(newBooks);
            }
        } else {
            // For subsequent pages, append server books while avoiding duplicates
            setBooks(prevBooks => {
                const existingIds = new Set(prevBooks.map(b => b.id));
                return [
                    ...prevBooks,
                    ...serverBooks.filter(book => !existingIds.has(book.id))
                ];
            });
        }
    };

    const updateBooksCache = (serverBooks, pageToFetch, isNewQuery) => {
        if (pageToFetch === 1 || isNewQuery) {
            if (justSyncedRef.current) {
                storage.setItem(LS_BOOKS_CACHE_KEY, serverBooks);
            } else {
                const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
                const localOnlyBooks = cachedBooks.filter(book => 
                    typeof book.id === 'string' && book.id.startsWith('local_')
                );
                
                const serverIds = new Set(serverBooks.map(book => book.id));
                const updatedCache = [
                    ...serverBooks,
                    ...localOnlyBooks.filter(book => !serverIds.has(book.id))
                ];
                
                storage.setItem(LS_BOOKS_CACHE_KEY, updatedCache);
            }
        } else {
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            const cachedBookIds = new Set(cachedBooks.map(book => book.id));
            const updatedCache = [
                ...cachedBooks,
                ...serverBooks.filter(book => !cachedBookIds.has(book.id))
            ];
            
            storage.setItem(LS_BOOKS_CACHE_KEY, updatedCache);
        }
    };

    const updatePaginationState = (data, pageToFetch, isNewQuery) => {
        if (pageToFetch === 1 || isNewQuery) {
            setCurrentPage(data.currentPage);
            setTotalPages(data.totalPages);
            setLoadingInitial(false);
        } else {
            setTimeout(() => {
                setCurrentPage(data.currentPage);
                setTotalPages(data.totalPages);
                setLoadingMore(false);
            }, RELOAD_DELAY_MS);
        }
    };

    const handleFetchError = (err, pageToFetch, isNewQuery) => {
        if (err.name === 'AbortError' || err.message.includes('Failed to fetch')) {
            setIsServerReachable(false);
            
            // Try to use cached data instead
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            if (cachedBooks.length > 0 && (pageToFetch === 1 || isNewQuery)) {
                setBooks(cachedBooks);
            }
        } else {
            setError(err.message || 'Failed to fetch books.');
        }
        
        // Reset loading states
        if (pageToFetch === 1 || isNewQuery) {
            setLoadingInitial(false);
        }
        setLoadingMore(false);
    };

    useEffect(() => {
        // Check and initialize cache structures if they don't exist
        if (storage.getItem(LS_BOOKS_CACHE_KEY) === null) {
            storage.setItem(LS_BOOKS_CACHE_KEY, []);
        }
        
        if (storage.getItem(LS_BOOKS_CACHE_ID) === null) {
            storage.setItem(LS_BOOKS_CACHE_ID, {});
        }
        
        if (storage.getItem(LS_ACTION_QUEUE_KEY) === null) {
            storage.setItem(LS_ACTION_QUEUE_KEY, []);
        }
    }, []);

    useEffect(() => {
        storage.setItem(LS_BOOKS_CACHE_ID, localBookIds); // Save local book IDs to localStorage
    }, [localBookIds]); // Update whenever localBookIds changes

    useEffect(() => {
        isSyncingRef.current = isSyncing; // Update ref whenever syncing state changes
    }, [isSyncing]); // Update ref whenever syncing state changes

    useEffect(() => {
        storage.setItem(LS_ACTION_QUEUE_KEY, actionQueue); // Save action queue to localStorage
    }, [actionQueue]); // Update whenever actionQueue changes

    
    useEffect(() => {
    // Check if we have pending actions and we're online
    if (actionQueue.length > 0 && isOnline && isServerReachable) {
        // Small delay to ensure app is fully initialized
        const timer = setTimeout(() => {
            triggerSync();
        }, 1000);
        
        return () => clearTimeout(timer);
    }
    }, []); // Empty dependency array means this runs once on mount

    const fetchBooks = useCallback(async (
        pageToFetch,
        sortBy = currentSortBy,
        order = currentOrder,
        filter = currentFilter,
        isNewQuery = false
    ) => {
        // Handle offline or server unreachable scenarios
        if (!isOnline || !isServerReachable) {
            
            if (pageToFetch === 1 || isNewQuery) {
                const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || []; // Load from localStorage
                setBooks(cachedBooks); // Set cached books
                
            }
            setLoadingInitial(false); // Stop loading initial state
            setLoadingMore(false); // Stop loading more state
            return; 
        }

        // Set appropriate loading state at the beginning
        if (pageToFetch === 1 || isNewQuery) {
            setLoadingInitial(true);
            setLoadingMore(false); // Ensure loadingMore is false during initial/reset
        } else if (!loadingInitial && !loadingMore) {
                setLoadingMore(true);
            } else {
                return; // Prevent overlapping fetches if one is already in progress
            }
        
        // Reset error state
        setError(null);
    
        // Update current sort/filter state if it's a new query
        if (isNewQuery) {
            setCurrentSortBy(sortBy);
            setCurrentOrder(order);
            setCurrentFilter(filter);
            // Reset page state only if it's a truly new query context
            if (pageToFetch !== 1 && currentPage !== 0) {
                setCurrentPage(0);
                setTotalPages(1);
            }
        }
    
        try {
            // Build request URL
            const params = new URLSearchParams();
            if (filter) params.append('filter', filter);
            if (sortBy) { 
                params.append('sortBy', sortBy); 
                params.append('order', order); 
            }
            params.append('page', pageToFetch.toString());
            params.append('limit', limit.toString());
    
            const url = `${API_URL}/books?${params.toString()}`;
            const response = await fetch(url);
    
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
            }
            
            // Process response data
            const data = await response.json(); 
    
            // Update stats
            const receivedStats = data.stats || {
                totalCount: 0,
                mostExpensiveBook: null, 
                leastExpensiveBook: null, 
                closestToAverageBook: null, 
                averagePrice: 0 
            };
            setStats(receivedStats);
    
            // Update books and cache if we got results
            if (data.books?.length > 0) {
                const serverBooks = data.books;
                updateBooksState(serverBooks, pageToFetch, isNewQuery);
                updateBooksCache(serverBooks, pageToFetch, isNewQuery);
            }

            // Update pagination state
            updatePaginationState(data, pageToFetch, isNewQuery);
    
        } catch (err) {
            handleFetchError(err, pageToFetch, isNewQuery);
        }
    }, [
        limit, 
        currentSortBy, 
        currentOrder, 
        currentFilter, 
        currentPage, 
        loadingInitial, 
        loadingMore, 
        isOnline, 
        isServerReachable
    ]);

    const triggerSync = useCallback(async () => {
    // Prevent concurrent syncs with better locking
    if (isSyncingRef.current) {
        return;
    }
    
    const currentQueueFromStorage = storage.getItem(LS_ACTION_QUEUE_KEY) || [];
    if (currentQueueFromStorage.length === 0) {
        return;
    }

    // Set syncing state immediately and update ref to prevent concurrent calls
    setIsSyncing(true);
    isSyncingRef.current = true;
    
    try {
        // Clone the current queue to work with
        const currentQueue = [...actionQueue];
        // Store processed IDs to avoid duplicate processing
        const processedIds = new Set();
        
        // Process the queue and get results
        const { results, idMapping } = await processQueue(currentQueue);
        
        // Keep track of which items were successfully processed
        const successfulItemIds = results
            .filter(result => result.success)
            .map(result => {
                if (result.item && result.item.id) {
                    processedIds.add(result.item.id);
                    return result.item.id;
                }
                return null;
            })
            .filter(id => id !== null);
        
        if (successfulItemIds.length > 0) {
            // Update queue first - use a callback to ensure we work with the latest state
            setActionQueue(prevQueue => {
                const updatedQueue = prevQueue.filter(item => !processedIds.has(item.id));
                storage.setItem(LS_ACTION_QUEUE_KEY, updatedQueue);
                return updatedQueue;
            });
            
            // Wait for state update to complete
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // IMPORTANT NEW STEP: Update the cache with the synced books
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            const updatedCache = [...cachedBooks];
            
            // Add new books to cache and update existing books
            results.forEach(result => {
                if (result.success && result.data && result.item.action !== 'delete') {
                    // Find if this book already exists in the cache
                    const existingIndex = updatedCache.findIndex(book => book.id === result.data.id);
                    if (existingIndex >= 0) {
                        // Update existing book
                        updatedCache[existingIndex] = result.data;
                    } else {
                        // Add new book to cache
                        updatedCache.push(result.data);
                    }
                }
            });
            
            // Remove deleted books
            results.forEach(result => {
                if (result.success && result.item.action === 'delete' && result.item.data.id) {
                    const deleteId = result.item.data.id;
                    // If we had a local ID mapping, look for the server ID
                    const serverIdToDelete = idMapping[deleteId] || deleteId;
                    
                    const deleteIndex = updatedCache.findIndex(book => 
                        book.id === serverIdToDelete || book.id === deleteId
                    );
                    
                    if (deleteIndex >= 0) {
                        updatedCache.splice(deleteIndex, 1);
                    }
                }
            });
            
            // Save the updated cache
            storage.setItem(LS_BOOKS_CACHE_KEY, updatedCache);
            
            // Clean up local book IDs that were synced
            if (Object.keys(idMapping).length > 0) {
                setBooks(prevBooks => {
                    const filteredBooks = prevBooks.filter(book => {
                        const isLocalSyncedBook = typeof book.id === 'string' && 
                            book.id.startsWith('local_') && 
                            idMapping[book.id];
                
                        return !isLocalSyncedBook;
                    });
                    return filteredBooks;
                });
                
                // Remove synced books from cache
                const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
                const updatedCacheBooks = cachedBooks.filter(book => {
                    const isLocalSyncedBook = typeof book.id === 'string' && 
                        book.id.startsWith('local_') && 
                        idMapping[book.id];
                    return !isLocalSyncedBook;
                });
                
                // Save cache with locals removed before doing anything else
                storage.setItem(LS_BOOKS_CACHE_KEY, updatedCacheBooks);
               
                // Update localBookIds tracking
                setLocalBookIds(prev => {
                    const updated = {...prev};
                    Object.keys(idMapping).forEach(localId => {
                        delete updated[localId];
                    });
                    return updated;
                });
                
                // Wait longer to ensure state updates are complete
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            justSyncedRef.current = true;
    
            await fetchBooks(1, currentSortBy, currentOrder, currentFilter, true);
        } else {
            console.log('No items were successfully processed');
        }
    } catch (error) {
        console.error('Sync failed:', error);
        setError('Sync failed: ' + (error.message || 'Unknown error'));
    } finally {
        setIsSyncing(false);
        isSyncingRef.current = false;
    }
    }, [actionQueue, currentFilter, currentOrder, currentSortBy, fetchBooks]);

    // Check server reachability
    const checkServerReachability = useCallback(async () => {
    if (!isOnline) {
        setIsServerReachable(false);
        return;
    }
    
    // Don't check server if we're already syncing
    if (isSyncingRef.current) {
        return;
    }
    
    try {
        // Use a lightweight endpoint for checking server status
        // Adding timestamp to prevent caching
        const response = await fetch(`${API_URL}/books?limit=1&_=${Date.now()}`, {
            method: 'HEAD', // Lightweight request for just headers
            headers: { 'Cache-Control': 'no-cache' },
            // Short timeout to avoid long waits
            signal: AbortSignal.timeout(3000)
        });
        
        const newServerReachable = response.ok;
        
        // Only update if state actually changes
        if (newServerReachable !== isServerReachable) {
            setIsServerReachable(newServerReachable);
        }
        
        // Only update if state changes
        if (newServerReachable && !isSyncingRef.current && actionQueue.length > 0) {
            // Add a small delay before triggering sync
            setTimeout(() => triggerSync(), 500);
        }
    } catch (error) {
        console.log('Server check failed:', error);
        setIsServerReachable(false);
    }
    }, [isOnline, actionQueue, isServerReachable, triggerSync]);

    // Monitor online/offline status
    useEffect(() => {
        const updateOnlineStatus = () => {
            const online = navigator.onLine;
            setIsOnline(online);
            
            if (online) {
                // When coming online, check server status and possibly trigger sync
                checkServerReachability();
            } else {
                // When going offline, server is definitely not reachable
                setIsServerReachable(false);
            }
        };
        
        // Set initial status
        updateOnlineStatus();
        
        // Check server status on an interval when online
        let serverCheckInterval;
        if (navigator.onLine) {
            checkServerReachability();
            serverCheckInterval = setInterval(checkServerReachability, SERVER_CHECK_INTERVAL);
        }
        
        // Add event listeners
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
            clearInterval(serverCheckInterval);
        };
    }, [checkServerReachability]);

    // --- Fetch Next Page Function ---
    const fetchNextPage = useCallback(() => {
        const hasMore = currentPage < totalPages;
        // Prevent fetching if already loading OR no more pages
        if (loadingInitial || loadingMore || !hasMore) {
            return;
        }
        fetchBooks(currentPage + 1, currentSortBy, currentOrder, currentFilter, false); // false = not a new query
    }, [currentPage, totalPages, loadingInitial, loadingMore, fetchBooks, currentSortBy, currentOrder, currentFilter]);

    // --- Initial Load ---
    useEffect(() => {
        // Fetch page 1 on initial mount with default sort/filter
        fetchBooks(1, DEFAULT_SORT_BY, DEFAULT_SORT_ORDER, null, true); // true = new query
        
        // Also fetch full statistics on initial load
        fetchFullStatistics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    const filterBooks = useCallback((searchTerm) => {
        fetchBooks(1, currentSortBy, currentOrder, searchTerm, true); // true = new query
    }, [fetchBooks, currentSortBy, currentOrder]);

    // --- Sorting (Resets to Page 1) ---
    const sortBooks = useCallback((sortBy, order = 'asc') => {
        fetchBooks(1, sortBy, order, currentFilter, true); // true = new query
    }, [fetchBooks, currentFilter]);

    const processQueue = async (queue) => {
        const results = [];
        const idMapping = {};
        
        for (const item of queue) {
            try {
                let response;
                
                // Validate the item structure
                if (!item.data) {
                    console.error('Invalid queue item structure:', item);
                    results.push({
                        success: false,
                        item,
                        error: 'Invalid queue item structure - missing data'
                    });
                    continue; // Skip this item
                }
                
                switch (item.action) {
                    case 'add':
                        // Check if this is a local ID (string that starts with 'local_')
                        const isLocalId = typeof item.data.id === 'string' && item.data.id.startsWith('local_');
                        const tempId = item.data.id;
                        
                        // Clean data for server - remove ID to let server generate real one
                        const { id: addId, ...addData } = item.data;
                          
                        response = await fetch(`${API_URL}/books`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(addData)
                        });
                        
                        if (response.ok) {
                            const newBook = await response.json();
                            console.log(`Successfully added book with server ID: ${newBook.id}`);
                            
                            // Save mapping from local to server ID if it was a local ID
                            if (isLocalId) {
                                idMapping[tempId] = newBook.id;
                            }
                            
                            results.push({
                                success: true,
                                item,
                                data: newBook
                            });
                        } else {
                            const errorData = await response.json().catch(() => ({}));
                            console.error('Failed to add book:', errorData);
                            
                            results.push({
                                success: false,
                                item,
                                error: errorData.message || 'Failed to add book during sync'
                            });
                        }
                        break;           
                    case 'update':
                        // Check if this is a local ID
                        const isLocalUpdateId = typeof item.data.id === 'string' && item.data.id.startsWith('local_');
                        
                        // CRITICAL: Check if ID exists at all
                        if (!item.data.id) {
                            console.error('Update operation missing ID:', item);
                            results.push({
                                success: false,
                                item,
                                error: 'Update operation missing book ID'
                            });
                            break;
                        }
                        
                        console.log(`Processing UPDATE operation for ${isLocalUpdateId ? 'local' : 'server'} ID: ${item.data.id}`);
                        
                        if (isLocalUpdateId) {
                            // For local IDs, we need to create a new book instead of updating
                            const { id: localId, ...updateData } = item.data;
                            
                            response = await fetch(`${API_URL}/books`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(updateData)
                            });
                            
                            if (response.ok) {
                                const newBook = await response.json();
                                // Map the local ID to the new server ID
                                idMapping[localId] = newBook.id;
                                
                                results.push({
                                    success: true,
                                    item,
                                    data: newBook
                                });
                            } else {
                                const errorData = await response.json().catch(() => ({}));
                                console.error('Failed to create book from local update:', errorData);
                                
                                results.push({
                                    success: false,
                                    item,
                                    error: errorData.message || 'Failed to create book during sync'
                                });
                            }
                        } else {
                            // Normal update for server IDs
                            response = await fetch(`${API_URL}/books/${item.data.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(item.data)
                            });
                            
                            if (response.ok) {
                                const updatedBook = await response.json();
                                console.log(`Successfully updated book with server ID: ${updatedBook.id}`);
                                
                                results.push({
                                    success: true,
                                    item,
                                    data: updatedBook
                                });
                            } else {
                                const errorData = await response.json().catch(() => ({}));
                                console.error('Failed to update book:', errorData);
                                
                                results.push({
                                    success: false,
                                    item,
                                    error: errorData.message || 'Failed to update book during sync'
                                });
                            }
                        }
                        break;                   
                    case 'delete':
                        // Check if this is a local ID
                        const isLocalDeleteId = typeof item.data.id === 'string' && item.data.id.startsWith('local_');
                        
                        // CRITICAL: Check if ID exists
                        if (!item.data || !item.data.id) {
                            console.error('Delete operation missing ID:', item);
                            results.push({
                                success: false,
                                item,
                                error: 'Delete operation missing book ID'
                            });
                            break;
                        }
                        const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
                        const bookExistsInCache = cachedBooks.some(book => book.id === item.data.id);
                        
                        // If book is already gone from our cache, consider this operation complete
                        if (!bookExistsInCache || isLocalDeleteId) {
                            results.push({
                                success: true,
                                item,
                                data: null
                            });
                            break;
                        }
                        else {
                            // Handle delete action for server IDs
                            response = await fetch(`${API_URL}/books/${item.data.id}`, {
                                method: 'DELETE'
                            });
                            
                            console.log(`Processing DELETE operation for ${isLocalDeleteId ? 'local' : 'server'} ID: ${item.data.id}`);
                            console.log('Response status:', response.status);


                            if (response.ok) {
                                results.push({
                                    success: true,
                                    item,
                                    data: null
                                });
                            } else {
                                const errorData = await response.json().catch(() => ({}));
                                console.error('Failed to delete book:', errorData);
                                
                                results.push({
                                    success: false,
                                    item,
                                    error: errorData.message || 'Failed to delete book during sync'
                                });
                            }
                        }
                        break;
                    
                    default:
                        console.warn('Unknown action type:', item.action);
                        results.push({
                            success: false,
                            item,
                            error: `Unknown action type: ${item.action}`
                        });
                }
            } catch (error) {
                console.error(`Error processing queued ${item?.action || 'unknown'} operation:`, error);
                results.push({
                    success: false,
                    item,
                    error: error.message || `Failed to process ${item?.action || 'unknown'}`
                });
            }
        }
        
        return { results, idMapping };
    };

    const addBook = async (newBookData) => {
        setError(null);
        
        // Create a unique an prepare book data
        const tempId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const parsedPrice = parseFloat(newBookData.price);
        
        // Create a clean data object with only the necessary fields
        const bookToAdd = {
            id: tempId,
            title: newBookData.title || '',
            author: newBookData.author || '',
            genre: newBookData.genre || '',
            price: isNaN(parsedPrice) ? 0 : parsedPrice
        };
        
        if (!isOnline || !isServerReachable) {
            setBooks(prevBooks => [...prevBooks, bookToAdd]);
        
            // Track this as a local book with tempId
            setLocalBookIds(prev => ({...prev, [tempId]: true}));
            
            // Update the cache
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            storage.setItem(LS_BOOKS_CACHE_KEY, [...cachedBooks, bookToAdd]);
    
            // Queue the action for later sync
            const actionId = Date.now().toString();
            setActionQueue(queue => [...queue, {
                id: actionId,
                action: 'add',
                timestamp: new Date(),
                data: bookToAdd
            }]);
            
            return bookToAdd;
        }
        
        try {
            // Online mode: send directly to server
            const response = await fetch(`${API_URL}/books`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: bookToAdd.title,
                    author: bookToAdd.author,
                    genre: bookToAdd.genre,
                    price: bookToAdd.price
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to add book');
            }
            
            const addedBook = await response.json();

           
            // Update cache
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            storage.setItem(LS_BOOKS_CACHE_KEY, [...cachedBooks, addedBook]);
            
            return addedBook;
        } catch (err) {
            console.error('Error adding book:', err);
            setError(err.message || 'Failed to add book');
            
            // Fall back to offline mode if request failed
            setBooks(prevBooks => [...prevBooks, bookToAdd]);
            setLocalBookIds(prev => ({...prev, [tempId]: true}));
            
            // Queue the action for later sync
            const actionId = Date.now().toString();
            setActionQueue(queue => [...queue, {
                id: actionId,
                action: 'add',
                timestamp: new Date(),
                data: bookToAdd
            }]);
            
            // Update connectivity status if needed
            if (err.message.includes('Failed to fetch') || err.name === 'AbortError') {
                setIsServerReachable(false);
            }
            
            return bookToAdd;
        }
    };

    const updateBook = async (updatedBookData) => {
        setError(null);
        const bookId = updatedBookData.id;
        if (!bookId) {
            const errorMsg = 'Cannot update book: Missing book ID';
            console.error(errorMsg);
            setError(errorMsg);
            throw new Error(errorMsg);
        }
        // Prepare book data
        const parsedPrice = parseFloat(updatedBookData.price);
        const parsedData = {
            id: bookId,
            title: updatedBookData.title || '',
            author: updatedBookData.author || '',
            genre: updatedBookData.genre || '',
            price: isNaN(parsedPrice) ? 0 : parsedPrice
        };
        
        
        if (!isOnline || !isServerReachable) {
            // Offline mode: update local state and queue the action
            setBooks(prevBooks => 
                prevBooks.map(book => 
                    book.id === bookId ? { ...book, ...parsedData } : book
                )
            );
            
            // Update cache
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            storage.setItem(LS_BOOKS_CACHE_KEY, 
                cachedBooks.map(book => book.id === bookId ? { ...book, ...parsedData } : book)
            );

            // Queue the action for later sync
            const actionId = Date.now().toString();
            setActionQueue(queue => [...queue, {
                id: actionId,
                action: 'update',
                timestamp: new Date(),
                data: parsedData
            }]);
            
            return parsedData;
        }
        
        try {
            // Online mode: send directly to server
            const response = await fetch(`${API_URL}/books/${bookId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: parsedData.title,
                    author: parsedData.author,
                    genre: parsedData.genre,
                    price: parsedData.price
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update book');
            }
            
            const updatedBook = await response.json();
            // Update local state after server confirmation
            setBooks(prevBooks => 
                prevBooks.map(book => 
                    book.id === bookId ? updatedBook : book
                )
            );
            
            // Update cache
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            storage.setItem(LS_BOOKS_CACHE_KEY, 
                cachedBooks.map(book => book.id === bookId ? updatedBook : book)
            );
            
            return updatedBook;
        } catch (err) {
            console.error('Error updating book:', err);
            setError(err.message || 'Failed to update book');
            
            // Fall back to offline mode
            setBooks(prevBooks => 
                prevBooks.map(book => 
                    book.id === bookId ? { ...book, ...parsedData } : book
                )
            );
            
            // Queue the action for later sync
            const actionId = Date.now().toString();
            setActionQueue(queue => [...queue, {
                id: actionId,
                action: 'update',
                timestamp: new Date(),
                data: parsedData
            }]);
            
            // If it looks like a connection issue, update server reachability status
            if (err.message.includes('Failed to fetch') || err.name === 'AbortError') {
                setIsServerReachable(false);
            }
            
            return parsedData;
        }
    };

    const deleteBook = async (id) => {
        setError(null);
        const isLocalBook = typeof id === 'string' && id.startsWith('local_');
    
        // Update local state immediately in all cases
        const updateLocalState = () => {
            setBooks(prevBooks => prevBooks.filter(book => book.id !== id));
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            storage.setItem(LS_BOOKS_CACHE_KEY, cachedBooks.filter(book => book.id !== id));
        };
        
        // Queue deletion for sync
        const queueForSync = () => {
            const actionId = Date.now().toString();
            setActionQueue(queue => [...queue, {
                id: actionId,
                action: 'delete',
                timestamp: new Date(),
                data: { id }
            }]);
        };

        // Handle offline mode or local books
        if (!isOnline || !isServerReachable || isLocalBook) {
            // Update local state immediately only in offline mode
            updateLocalState();
            
            // Only queue server books for sync
            if (!isLocalBook && (!isOnline || !isServerReachable)) {
                queueForSync();
            }
            
            console.log(`Book with ID ${id} deleted locally (offline mode)`);
            return true;
        }
        
        try {
            // Online mode: send directly to server
            const response = await fetch(`${API_URL}/books/${id}`, {
                method: 'DELETE'
            });
            
            console.log(`Server response for deletion of book with ID ${id}:`, response);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to delete book');
            }

            
            return true;
        } catch (err) {
            setError(err.message || 'Failed to delete book');
            
            updateLocalState(); // Update local state immediately
            queueForSync(); // Queue the action for later sync

            
            // Update connectivity status if needed
            if (err.message.includes('Failed to fetch') || err.name === 'AbortError') {
                setIsServerReachable(false);
            }
            return true;
        }
    };

    // Initialize WebSocket connection
    useEffect(() => {
        // Create WebSocket connection
        const ws = new WebSocket('ws://localhost:5000');
        
        ws.onopen = () => {
            console.log('Connected to WebSocket server');
            setIsServerReachable(true);
        };
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
                case 'new_book':
                    console.log('Received new book:', message.data);
                    setBooks(prevBooks => [...prevBooks, message.data]);
                    break;
                    
                case 'update_book':
                    console.log('Received updated book:', message.data);
                    setBooks(prevBooks => 
                        prevBooks.map(book => 
                            book.id === message.data.id ? message.data : book
                        )
                    );

                    // Update cache
                    const updateBookCache = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
                    storage.setItem(LS_BOOKS_CACHE_KEY,
                        updateBookCache.map(book => 
                            book.id === message.data.id ? message.data : book
                        )
                    );

                    break;
                    
                case 'delete_book':
                    console.log('Received deleted book ID:', message.data.id);

                    setBooks(prevBooks => 
                        prevBooks.filter(book => book.id !== message.data.id)
                    );

                    // Update cache
                    const deleteBookCache = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
                    storage.setItem(LS_BOOKS_CACHE_KEY, 
                        deleteBookCache.filter(book => book.id !== message.data.id)
                    );

                    break;
                default:
                    console.log('Received unknown message type:', message);
            }
        };
        
        ws.onclose = () => {
            console.log('Disconnected from WebSocket server');
            setIsServerReachable(false);
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsServerReachable(false);
        };
        
        setSocket(ws);
        
        // Cleanup on unmount
        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, []);  // Empty dependency array means this runs once on mount

    // Function to fetch complete statistics for all books
    const fetchFullStatistics = useCallback(async () => {
        // Don't attempt if offline or server unreachable
        if (!isOnline || !isServerReachable) {
            return;
        }
        
        try {
            // First fetch full statistics
            const statsUrl = `${API_URL}/books/stats`;
            const statsResponse = await fetch(statsUrl);
            
            if (!statsResponse.ok) {
                const errorData = await statsResponse.json().catch(() => ({}));
                throw new Error(errorData?.message || `HTTP error! Status: ${statsResponse.status}`);
            }
            
            const statsData = await statsResponse.json();
            setStats(statsData);
            
            // Then fetch ALL books without pagination for chart data
            const allBooksUrl = `${API_URL}/books?limit=1000`; // Set a high limit to get all books
            const booksResponse = await fetch(allBooksUrl);
            
            if (!booksResponse.ok) {
                const errorData = await booksResponse.json().catch(() => ({}));
                throw new Error(errorData?.message || `HTTP error! Status: ${booksResponse.status}`);
            }
            
            const booksData = await booksResponse.json();
            setAllBooks(booksData.books || []);
        } catch (err) {
            console.error("Error fetching full statistics:", err);
            // Don't update error state to avoid interfering with main book fetching
        }
    }, [isOnline, isServerReachable]);

        
        // --- Derived State ---
    const hasMorePages = currentPage < totalPages;



return (
    <BooksContext.Provider
        value={{
            books,
            allBooks, // Include full dataset for charts
            loadingInitial,
            loadingMore,
            error,
            stats,
            currentPage,
            totalPages,
            hasMorePages,
            addBook,
            updateBook,
            deleteBook,
            fetchNextPage,
            filterBooks,
            sortBooks,
            fetchFullStatistics,
            isOnline,
            isServerReachable,
            isSyncing,
            actionQueue: actionQueue.length, // Just expose the count
            triggerSync,
            socket, // Make socket available to consumers if needed
        }}
    >
        {children}
    </BooksContext.Provider>
);
};

export const useBooks = () => useContext(BooksContext);