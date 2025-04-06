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

        // Add this function before the queueAction function
    const validateQueueData = (action, data) => {
        // Clone data to avoid reference issues
        const validatedData = { ...data };
        
        switch (action) {
            case 'add':
                if (!validatedData.id) {
                    console.error('Add operation missing ID, generating temporary one');
                    validatedData.id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                }
                break;
                
            case 'update':
                if (!validatedData.id) {
                    console.error('Update operation missing ID, cannot proceed');
                    throw new Error('Book ID is required for update operations');
                }
                break;
                
            case 'delete':
                // For delete, we might just have {id: someId}
                if (!validatedData.id) {
                    console.error('Delete operation missing ID, cannot proceed');
                    throw new Error('Book ID is required for delete operations');
                }
                break;
        }
        
        return validatedData;
    };
    
    // Then modify the queueAction function to use validation
    const queueAction = useCallback((action, data) => {
        try {
            const validatedData = validateQueueData(action, data);
            
            setActionQueue(queue => [...queue, {
                id: Date.now().toString(),
                action,
                timestamp: new Date(),
                data: validatedData
            }]);
            
            console.log(`Action ${action} queued for later sync with ID: ${validatedData.id}`);
        } catch (error) {
            console.error('Failed to queue action:', error);
            setError(`Failed to queue ${action} operation: ${error.message}`);
        }
    }, []);
  

    useEffect(() => {
        // Check and initialize cache structures if they don't exist
        if (storage.getItem(LS_BOOKS_CACHE_KEY) === null) {
            console.log('Initializing empty books cache');
            storage.setItem(LS_BOOKS_CACHE_KEY, []);
        }
        
        if (storage.getItem(LS_BOOKS_CACHE_ID) === null) {
            console.log('Initializing empty local book IDs tracking');
            storage.setItem(LS_BOOKS_CACHE_ID, {});
        }
        
        if (storage.getItem(LS_ACTION_QUEUE_KEY) === null) {
            console.log('Initializing empty action queue');
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

    // Add this effect after your other useEffects - it will trigger sync on page load
    useEffect(() => {
    // Check if we have pending actions and we're online
    if (actionQueue.length > 0 && isOnline && isServerReachable) {
        console.log('Found pending actions on page load, triggering sync...');
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
        console.log(`Fetching page: ${pageToFetch}, isOnline: ${isOnline}, serverReachable: ${isServerReachable}`);
    
        // Handle offline or server unreachable scenarios
        if (!isOnline || !isServerReachable) {
            
            if (pageToFetch === 1 || isNewQuery) {
                const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || []; // Load from localStorage
                if(cachedBooks.length > 0){
                    console.log("Using cached books:", cachedBooks.length);
                    setBooks(cachedBooks); // Set cached books
                } else {
                    setBooks([]); // No cached books available
                    console.log("No cached books available");
                }
            } else {
                console.log("Cannot fetch more pages while offline/server unreachable.");
            }
            
            setLoadingInitial(false); // Stop loading initial state
            setLoadingMore(false); // Stop loading more state
            return; // Prevent further fetching if offline/server unreachable
        }
    
        console.log(`Attempting fetch page: ${pageToFetch}, Sort: ${sortBy}, Order: ${order}, Filter: ${filter}, NewQuery: ${isNewQuery}`);
    
        // Set appropriate loading state at the beginning
        if (pageToFetch === 1 || isNewQuery) {
            setLoadingInitial(true);
            setLoadingMore(false); // Ensure loadingMore is false during initial/reset
        } else {
            // Only set loadingMore if not already loading initial/more
            if (!loadingInitial && !loadingMore) {
                setLoadingMore(true);
            } else {
                console.log("Fetch skipped, already loading.");
                return; // Prevent overlapping fetches if one is already in progress
            }
        }
        setError(null);
    
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
            const params = new URLSearchParams();
            if (filter) params.append('filter', filter);
            if (sortBy) { 
                params.append('sortBy', sortBy); 
                params.append('order', order); 
            }
            params.append('page', pageToFetch.toString());
            params.append('limit', limit.toString());
    
            const url = `${API_URL}/books?${params.toString()}`;
            console.log('Fetching books from:', url);
            const response = await fetch(url);
    
            if (!response.ok) {
                let errorData = null; 
                try { 
                    errorData = await response.json(); 
                } catch (e) {}
                const errorMessage = errorData?.message || `HTTP error! Status: ${response.status}`;
                throw new Error(errorMessage);
            }
    
            const data = await response.json(); // Expect { books: [], currentPage: X, totalPages: Y, ... }
            console.log("API Data Received:", data);
    
            const receivedStats = data.stats || {
                totalCount: 0,
                mostExpensiveBook: null, 
                leastExpensiveBook: null, 
                closestToAverageBook: null, 
                averagePrice: 0 
            };
            setStats(receivedStats);
    
            // After successful fetch, update the cache
            if (data.books && data.books.length > 0) {
                const serverBooks = data.books;
                
                // If it's first page or new query, handle differently
                if (pageToFetch === 1 || isNewQuery) {
                    // If we just synced, don't include any more local books
                    if (justSyncedRef.current) {
                        console.log('Post-sync fetch: using only server books without merging locals');
                        setBooks(serverBooks);
                        storage.setItem(LS_BOOKS_CACHE_KEY, serverBooks);
                        justSyncedRef.current = false;
                    } else {
                        // Original logic for merging local books
                        const localOnlyBooks = books.filter(book => 
                            typeof book.id === 'string' && book.id.startsWith('local_')
                        );
                        
                        const serverIds = new Set(serverBooks.map(book => book.id));
                        const newBooks = [
                            ...serverBooks,
                            ...localOnlyBooks.filter(book => !serverIds.has(book.id))
                        ];
                        
                        setBooks(newBooks);
                        
                        // Update cache with same logic
                        const cachedBooks = [
                            ...serverBooks,
                            ...localOnlyBooks.filter(book => !serverIds.has(book.id))
                        ];
                        storage.setItem(LS_BOOKS_CACHE_KEY, cachedBooks);
                        console.log("Updated books cache with", cachedBooks.length, "books");
                    }
                } else {
                    // For subsequent pages, append server books while avoiding duplicates
                    setBooks(prevBooks => {
                        // Extract IDs from existing books for deduplication check
                        const existingIds = new Set(prevBooks.map(b => b.id));
                        return [
                            ...prevBooks,
                            ...serverBooks.filter(book => !existingIds.has(book.id))
                        ];
                    });
                    
                    // Update cache similarly
                    const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
                    const cachedBookIds = new Set(cachedBooks.map(book => book.id));
                    const updatedCache = [
                        ...cachedBooks,
                        ...serverBooks.filter(book => !cachedBookIds.has(book.id))
                    ];
                    storage.setItem(LS_BOOKS_CACHE_KEY, updatedCache);
                    console.log("Updated books cache with", updatedCache.length, "books");
                }
            }
    
            // --- Apply Delay Logic ---
            if (pageToFetch === 1 || isNewQuery) {
                // === Initial Load or Reset: No Delay ===
                console.log("Updating state immediately (initial/reset)");
                // Don't overwrite the previously merged books - that data is already in state
                // Just update the pagination information
                setCurrentPage(data.currentPage);
                setTotalPages(data.totalPages);
                setLoadingInitial(false); // Turn off initial loading
            } else {
                // === Subsequent Page Load: Apply Delay ===
                console.log(`Applying ${RELOAD_DELAY_MS}ms delay before state update`);
                setTimeout(() => {
                    console.log("Delay finished, updating state");
                    // No need to modify books state here - we already did it above
                    // with careful deduplication logic
                    setCurrentPage(data.currentPage);
                    setTotalPages(data.totalPages);
                    setLoadingMore(false); // Turn off loadingMore *after* delay
                }, RELOAD_DELAY_MS);
            }
            // --- End Delay Logic ---
    
        } catch (err) {
            console.error("Failed to fetch books:", err);
            
            // Check if this might be a server connectivity issue
            if (err.name === 'AbortError' || err.message.includes('Failed to fetch')) {
                setIsServerReachable(false);
                
                // Try to use cached data instead
                const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
                if (cachedBooks.length > 0 && (pageToFetch === 1 || isNewQuery)) {
                    console.log("Using cached books after fetch failure");
                    setBooks(cachedBooks);
                } 
            } else {
                setError(err.message || 'Failed to fetch books.');
            }
            
            // Turn off appropriate loading indicators immediately on error
            if (pageToFetch === 1 || isNewQuery) {
                setLoadingInitial(false);
            }
            setLoadingMore(false); // Stop loadingMore indicator on error
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
    ]); // Added isOnline and isServerReachable to dependencies

    // Update the triggerSync function to properly handle cache updates
    const triggerSync = useCallback(async () => {
    // Prevent concurrent syncs with better locking
    if (isSyncingRef.current) {
        console.log('Sync already in progress, skipping');
        return;
    }
    
    const currentQueueFromStorage = storage.getItem(LS_ACTION_QUEUE_KEY) || [];
    if (currentQueueFromStorage.length === 0) {
        console.log('No items in queue (verified from storage), skipping sync');
        return;
    }
    

    // Set syncing state immediately and update ref to prevent concurrent calls
    setIsSyncing(true);
    isSyncingRef.current = true;
    
    console.log('Starting sync of queued actions:', actionQueue.length);
    
    try {
        // Clone the current queue to work with
        const currentQueue = [...actionQueue];
        console.log('Processing queue with length:', currentQueue.length);
        
        // Store processed IDs to avoid duplicate processing
        const processedIds = new Set();
        
        // Process the queue and get results
        const { results, idMapping } = await processQueue(currentQueue);
        console.log('Sync results:', results);
        
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
            console.log('Successfully processed items:', successfulItemIds);
            
            // Update queue first - use a callback to ensure we work with the latest state
            setActionQueue(prevQueue => {
                const updatedQueue = prevQueue.filter(item => !processedIds.has(item.id));
                console.log(`Queue reduced from ${prevQueue.length} to ${updatedQueue.length} items`);
                
                storage.setItem(LS_ACTION_QUEUE_KEY, updatedQueue);
                console.log('Action queue updated in localStorage');
                
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
                    
                    console.log(`Added/updated synced book in cache: ${result.data.id}`);
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
                        console.log(`Removed deleted book from cache: ${deleteId}`);
                    }
                }
            });
            
            // Save the updated cache
            storage.setItem(LS_BOOKS_CACHE_KEY, updatedCache);
            console.log(`Cache updated with ${updatedCache.length} books`);
            
            // Clean up local book IDs that were synced
            if (Object.keys(idMapping).length > 0) {
                console.log('Updating local ID mappings:', idMapping);
                
                // IMMEDIATE REMOVAL: Remove synced local books from UI immediately
                setBooks(prevBooks => {
                    const filteredBooks = prevBooks.filter(book => {
                        const isLocalSyncedBook = typeof book.id === 'string' && 
                            book.id.startsWith('local_') && 
                            idMapping[book.id];
                        
                        if (isLocalSyncedBook) {
                            console.log(`Removing local book ${book.id} from UI (mapped to server ID ${idMapping[book.id]})`);
                        }
                        return !isLocalSyncedBook;
                    });
                    console.log(`Filtered books from ${prevBooks.length} to ${filteredBooks.length}`);
                    return filteredBooks;
                });
                
                // ALSO REMOVE FROM CACHE IMMEDIATELY
                const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
                const updatedCacheBooks = cachedBooks.filter(book => {
                    const isLocalSyncedBook = typeof book.id === 'string' && 
                        book.id.startsWith('local_') && 
                        idMapping[book.id];
                    
                    if (isLocalSyncedBook) {
                        console.log(`Removing local book ${book.id} from cache`);
                    }
                    return !isLocalSyncedBook;
                });
                
                // Save cache with locals removed before doing anything else
                storage.setItem(LS_BOOKS_CACHE_KEY, updatedCacheBooks);
                console.log(`Updated cache with ${updatedCacheBooks.length} books after removing local books`);
                
                // Update localBookIds tracking
                setLocalBookIds(prev => {
                    const updated = {...prev};
                    Object.keys(idMapping).forEach(localId => {
                        console.log(`Removing tracking for local book ID: ${localId}`);
                        delete updated[localId];
                    });
                    return updated;
                });
                
                // Wait longer to ensure state updates are complete
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            justSyncedRef.current = true;
    
            // Finally, refetch data from the server
            console.log('Refreshing book data from server after sync');
            console.log('Refreshing book data from server');
            await fetchBooks(1, currentSortBy, currentOrder, currentFilter, true);
        } else {
            console.log('No items were successfully processed');
        }
    } catch (error) {
        console.error('Sync failed:', error);
        setError('Sync failed: ' + (error.message || 'Unknown error'));
    } finally {
        // Always reset syncing state when done
        console.log('Sync process completed');
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
        console.log('Skipping server check during sync');
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
            console.log(`Server reachability changed: ${isServerReachable} -> ${newServerReachable}`);
            setIsServerReachable(newServerReachable);
        }
        
        // Only trigger sync if server becomes reachable, we're not currently syncing, 
        // and we have items to sync
        if (newServerReachable && !isSyncingRef.current && actionQueue.length > 0) {
            console.log('Server is reachable and we have items to sync');
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
            console.log(`Network status changed: ${online ? 'Online' : 'Offline'}`);
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
             console.log(`Fetch blocked: loadingInitial=${loadingInitial}, loadingMore=${loadingMore}, hasMore=${hasMore}`);
            return;
        }
        fetchBooks(currentPage + 1, currentSortBy, currentOrder, currentFilter, false); // false = not a new query
    }, [currentPage, totalPages, loadingInitial, loadingMore, fetchBooks, currentSortBy, currentOrder, currentFilter]);


    // --- Initial Load ---
    useEffect(() => {
        // Fetch page 1 on initial mount with default sort/filter
        fetchBooks(1, DEFAULT_SORT_BY, DEFAULT_SORT_ORDER, null, true); // true = new query
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    // --- Filtering (Resets to Page 1) ---
    const filterBooks = useCallback((searchTerm) => {
        fetchBooks(1, currentSortBy, currentOrder, searchTerm, true); // true = new query
    }, [fetchBooks, currentSortBy, currentOrder]);

    // --- Sorting (Resets to Page 1) ---
    const sortBooks = useCallback((sortBy, order = 'asc') => {
        fetchBooks(1, sortBy, order, currentFilter, true); // true = new query
    }, [fetchBooks, currentFilter]);

    // --- CRUD Actions (Refetch Page 1 on Success) ---
    // Keep the logic that refetches page 1 for simplicity after CRUD
    const refetchFirstPage = () => {
        fetchBooks(1, currentSortBy, currentOrder, currentFilter, true);
    };



    const processQueue = async (queue) => {
        const results = [];
        const idMapping = {}; // To map local IDs to server IDs
        
        console.log("Processing queue items:", queue.length);
        

        // Debug the queue before processing
        queue.forEach((item, index) => {
            console.log(`Queue item ${index}:`, {
                id: item.id,
                action: item.action,
                dataId: item.data?.id,
                dataType: item.data ? typeof item.data.id : 'undefined'
            });
        });
        
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
                        
                        console.log(`Processing ADD operation for ${isLocalId ? 'local' : 'server'} ID: ${tempId}`);
                        
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
                                console.log(`Successfully created book with server ID: ${newBook.id} from local ID: ${localId}`);
                                
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
                        if (!bookExistsInCache) {
                            console.log(`Book ${item.data.id} already removed from cache, marking as success without server call`);
                            results.push({
                                success: true,
                                item,
                                data: null
                            });
                            break;
                        }
                        console.log(`Processing DELETE operation for ${isLocalDeleteId ? 'local' : 'server'} ID: ${item.data.id}`);
                        
                        if (isLocalDeleteId) {
                            // For local IDs, we can just remove from local state without server call
                            console.log(`Skipping server deletion for local ID: ${item.data.id}`);
                            
                            results.push({
                                success: true,
                                item,
                                data: null
                            });
                        } else {
                            // Handle delete action for server IDs
                            response = await fetch(`${API_URL}/books/${item.data.id}`, {
                                method: 'DELETE'
                            });
                            
                            if (response.ok) {
                                console.log(`Successfully deleted book with server ID: ${item.data.id}`);
                                
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
        
        // Create a unique local ID with 'local_' prefix followed by timestamp and random string
        const tempId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Parse price to ensure it's a number
        const parsedPrice = parseFloat(newBookData.price);
        
        // Create a clean data object with only the necessary fields
        const bookToAdd = {
            id: tempId,
            title: newBookData.title || '',
            author: newBookData.author || '',
            genre: newBookData.genre || '',
            price: isNaN(parsedPrice) ? 0 : parsedPrice
        };
        
        // Update the part in addBook function where you handle offline mode
        if (!isOnline || !isServerReachable) {
            console.log(`Adding book in offline mode with temp ID: ${tempId}`);
            
            // Offline mode: update local state and queue the action
            setBooks(prevBooks => [...prevBooks, bookToAdd]);
            
            // Track this as a local book with tempId
            setLocalBookIds(prev => ({...prev, [tempId]: true}));
            
            // CRITICAL FIX: Also update the cache directly
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            storage.setItem(LS_BOOKS_CACHE_KEY, [...cachedBooks, bookToAdd]);
            console.log(`Added book to offline cache, now has ${cachedBooks.length + 1} books`);
            
            // Queue the action for later sync
            const actionId = Date.now().toString();
            setActionQueue(queue => [...queue, {
                id: actionId,
                action: 'add',
                timestamp: new Date(),
                data: bookToAdd
            }]);
            
            console.log('Book added to action queue for later sync');
            return bookToAdd;
        }
        
        try {
            console.log('Adding book in online mode');
            
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
            console.log('Book added successfully with server ID:', addedBook.id);
            
            // Update local state after server confirmation
            setBooks(prevBooks => [...prevBooks, addedBook]);
            
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
            
            // If it looks like a connection issue, update server reachability status
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
        // Parse price to ensure it's a number
        const parsedPrice = parseFloat(updatedBookData.price);
        
        // Make sure we extract only serializable data
        const parsedData = {
            id: bookId,
            title: updatedBookData.title || '',
            author: updatedBookData.author || '',
            genre: updatedBookData.genre || '',
            price: isNaN(parsedPrice) ? 0 : parsedPrice
        };
        
        // Check if we're dealing with a local book (local_* ID) or server book
        const isLocalBook = typeof bookId === 'string' && bookId.startsWith('local_');
        console.log(`Updating ${isLocalBook ? 'local' : 'server'} book with ID: ${bookId}`);
        
        if (!isOnline || !isServerReachable) {
            console.log('Updating book in offline mode');
            
            // Offline mode: update local state and queue the action
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
            
            console.log('Book update added to action queue for later sync');
            return parsedData;
        }
        
        try {
            console.log('Updating book in online mode');
            
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
            console.log('Book updated successfully:', updatedBook);
            
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
        
        // Check if we're dealing with a local book (local_* ID) or server book
        const isLocalBook = typeof id === 'string' && id.startsWith('local_');
        console.log(`Deleting ${isLocalBook ? 'local' : 'server'} book with ID: ${id}`);
        
        if (!isOnline || !isServerReachable) {
            console.log('Deleting book in offline mode');
            
            // Offline mode: update local state and queue the action
            setBooks(prevBooks => prevBooks.filter(book => book.id !== id));
            
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            storage.setItem(LS_BOOKS_CACHE_KEY, cachedBooks.filter(book => book.id !== id));
            console.log('Book removed from cache in offline mode');

            // Queue the action for later sync
            const actionId = Date.now().toString();
            setActionQueue(queue => [...queue, {
                id: actionId,
                action: 'delete',
                timestamp: new Date(),
                data: { id }
            }]);
            
            console.log('Book deletion added to action queue for later sync');
            return true;
        }
        
        try {
            console.log('Deleting book in online mode');
            
            // Online mode: send directly to server
            const response = await fetch(`${API_URL}/books/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to delete book');
            }
            
            console.log('Book deleted successfully');
            
            // Update local state after server confirmation
            setBooks(prevBooks => prevBooks.filter(book => book.id !== id));
            
            // Update cache
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            storage.setItem(LS_BOOKS_CACHE_KEY, cachedBooks.filter(book => book.id !== id));
            
            return true;
        } catch (err) {
            console.error('Error deleting book:', err);
            setError(err.message || 'Failed to delete book');
            
            // Fall back to offline mode
            setBooks(prevBooks => prevBooks.filter(book => book.id !== id));
            
            // Queue the action for later sync
            const actionId = Date.now().toString();
            setActionQueue(queue => [...queue, {
                id: actionId,
                action: 'delete',
                timestamp: new Date(),
                data: { id }
            }]);
            
            // If it looks like a connection issue, update server reachability status
            if (err.message.includes('Failed to fetch') || err.name === 'AbortError') {
                setIsServerReachable(false);
            }
            
            return true;
        }
    };



        
        // --- Derived State ---
    const hasMorePages = currentPage < totalPages;



return (
    <BooksContext.Provider
        value={{
            books,
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
            // Add these values
            isOnline,
            isServerReachable,
            isSyncing,
            actionQueue: actionQueue.length, // Just expose the count
            triggerSync
        }}
    >
        {children}
    </BooksContext.Provider>
);
};

export const useBooks = () => useContext(BooksContext);