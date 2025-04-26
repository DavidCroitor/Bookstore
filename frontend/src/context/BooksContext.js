import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import {
    DEFAULT_SORT_BY, 
    DEFAULT_SORT_ORDER, 
    ITEMS_PER_PAGE,
    LS_BOOKS_CACHE_KEY,
    RELOAD_DELAY_MS
} from './constants';
import { storage, initializeStorage } from './storage';
import * as bookApi from './bookApi';
import { useConnectivity } from './hooks/useConnectivity';
import { useOfflineSync } from './hooks/useOfflineSync';
import { useWebSocket } from './hooks/useWebSocket'; // Assuming WS URL is in constants

// Initialize storage defaults
initializeStorage();

const BooksContext = createContext();

export const BooksProvider = ({ children }) => {
    // --- Core State ---
    const [books, setBooks] = useState([]); // Main list (can include local items)
    const [allBooks, setAllBooks] = useState([]); // For stats/charts potentially
    const [stats, setStats] = useState({ 
        totalCount: 0,
        mostExpensiveBook: null,
        leastExpensiveBook: null,
        closestToAverageBook: null,
        averagePrice: 0, });
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [currentSortBy, setCurrentSortBy] = useState(DEFAULT_SORT_BY);
    const [currentOrder, setCurrentOrder] = useState(DEFAULT_SORT_ORDER);
    const [currentFilter, setCurrentFilter] = useState(null);

    // --- Hooks ---
    const { isOnline, isServerReachable } = useConnectivity();
    const syncCompletedRef = useRef(false); // To manage refresh after sync

    // Callback after sync finishes
    const handleSyncComplete = useCallback(async ({ success, processedCount, idMapping }) => {
        console.log(`Sync completed. Success: ${success}, Processed: ${processedCount}`);
        if (processedCount > 0) {
            // Update cache based on idMapping if needed (remove local IDs, ensure server data exists)
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            let updatedCache = cachedBooks.filter(book => !(typeof book.id === 'string' && book.id.startsWith('local_') && idMapping[book.id]));
            // Potentially fetch the newly added/updated items if not returned by sync process and add to cache? Or rely on refresh.
            storage.setItem(LS_BOOKS_CACHE_KEY, updatedCache);

            // Mark that sync happened and trigger a full refresh
            syncCompletedRef.current = true;
            await fetchBooks(1, currentSortBy, currentOrder, currentFilter, true); // Force refresh
        }
    }, [currentSortBy, currentOrder, currentFilter]); // Need fetchBooks dependency

    const { actionQueue, isSyncing, queueAction } = useOfflineSync(
        isOnline,
        isServerReachable,
        handleSyncComplete // Pass the callback
    );


    // --- WebSocket Handlers ---
     const handleWsUpdateCache = useCallback((updatedBook) => {
        const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
        const exists = cachedBooks.some(b => b.id === updatedBook.id);
        let newCache;
        if (exists) {
            newCache = cachedBooks.map(b => b.id === updatedBook.id ? updatedBook : b);
        } else {
            newCache = [...cachedBooks, updatedBook]; // Add if missing
        }
        storage.setItem(LS_BOOKS_CACHE_KEY, newCache);
    }, []);

    const handleWsDeleteCache = useCallback((deletedBookData) => {
        const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
        storage.setItem(LS_BOOKS_CACHE_KEY, cachedBooks.filter(b => b.id !== deletedBookData.id));
    }, []);

    const handleWsNewBook = useCallback((newBook) => {
        setBooks(prev => {
             // Avoid duplicates if book was added locally then sync'd fast
            if (!prev.some(b => b.id === newBook.id)) {
                return [...prev, newBook];
            }
            return prev;
        });
        handleWsUpdateCache(newBook); // Add/Update cache
        fetchFullStatisticsDebounced(); // Update stats eventually
    }, [handleWsUpdateCache]); // Added fetchFullStatisticsDebounced dependency

    const handleWsUpdateBook = useCallback((updatedBook) => {
        setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
        handleWsUpdateCache(updatedBook);
        fetchFullStatisticsDebounced(); // Update stats eventually
    }, [handleWsUpdateCache]); // Added fetchFullStatisticsDebounced dependency

    const handleWsDeleteBook = useCallback((deletedBookData) => {
        setBooks(prev => prev.filter(b => b.id !== deletedBookData.id));
        handleWsDeleteCache(deletedBookData);
        fetchFullStatisticsDebounced(); // Update stats eventually
    }, [handleWsDeleteCache]); // Added fetchFullStatisticsDebounced dependency

    // Instantiate WebSocket hook
    useWebSocket({
        onNewBook: handleWsNewBook,
        onUpdateBook: handleWsUpdateBook,
        onDeleteBook: handleWsDeleteBook,
        // Add onOpen, onClose, onError if needed for UI feedback
    });

    // --- Book Fetching Logic ---
    const fetchBooks = useCallback(async (
        pageToFetch,
        sortBy = currentSortBy,
        order = currentOrder,
        filter = currentFilter,
        isNewQuery = false
    ) => {
        const isOfflineMode = !isOnline || !isServerReachable;
        const isLoading = loadingInitial || loadingMore;

        if (isLoading && !isNewQuery) { // Prevent overlap unless it's a new filter/sort
            return;
        }

        // Set loading states
        if (pageToFetch === 1 || isNewQuery) {
            setLoadingInitial(true);
            setLoadingMore(false); // Ensure mutually exclusive
            if(isNewQuery) { // Reset state for new query
                 setBooks([]); // Clear current books immediately for filter/sort
                 setCurrentPage(0);
                 setTotalPages(1);
            }
        } else {
            setLoadingMore(true);
        }
        setError(null);

        // Update sort/filter state if changed
        if (isNewQuery) {
             setCurrentSortBy(sortBy);
             setCurrentOrder(order);
             setCurrentFilter(filter);
        }

        // --- Offline Handling ---
        if (isOfflineMode) {
            console.log('Fetching books in offline mode from cache.');
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            // Apply filtering/sorting locally to cache if needed (more complex)
            // For simplicity, we just load the cache here. Pagination might not work correctly offline.
            setBooks(cachedBooks);
            setTotalPages(1); // Can't determine total pages offline reliably
            setCurrentPage(1);
            setLoadingInitial(false);
            setLoadingMore(false);
            setError('App is offline. Displaying cached data.');
            return;
        }

        // --- Online Fetching ---
        try {
            const data = await bookApi.fetchBooksAPI({
                page: pageToFetch,
                limit: ITEMS_PER_PAGE,
                sortBy,
                order,
                filter
            });

            const serverBooks = data.books || [];
            const isRefreshAfterSync = syncCompletedRef.current;
            syncCompletedRef.current = false; // Reset flag


            // State Update Logic (handle merging local state if needed, or replace on new query/sync)
            if (pageToFetch === 1 || isNewQuery || isRefreshAfterSync) {
                 // How to merge? Simplest: Replace on new query/sync, keep local otherwise?
                 // This example replaces completely on new query or post-sync refresh
                 setBooks(serverBooks);
                 // Update cache with fresh data
                 storage.setItem(LS_BOOKS_CACHE_KEY, serverBooks);

            } else {
                // Append new page results, avoiding duplicates
                setBooks(prevBooks => {
                    const existingIds = new Set(prevBooks.map(b => b.id));
                    const newUniqueBooks = serverBooks.filter(book => !existingIds.has(book.id));
                    const combined = [...prevBooks, ...newUniqueBooks];
                     // Update cache incrementally
                     storage.setItem(LS_BOOKS_CACHE_KEY, combined);
                     return combined;
                });
            }

            // Update Pagination & Stats (from the fetched page data)
            setCurrentPage(data.currentPage);
            setTotalPages(data.totalPages);
            if (data.stats) { // Use stats from paginated response if available
                setStats(prev => ({...prev, ...data.stats})); // Merge, don't overwrite full stats
            }

        } catch (err) {
            console.error('Failed to fetch books:', err);
            setError(err.message || 'Failed to fetch books.');
            // Optionally load cache on error
             if (pageToFetch === 1 || isNewQuery) {
                 console.log('Error fetching, loading from cache.');
                 const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
                 setBooks(cachedBooks);
             }
        } finally {
             // Use delay only for loadingMore for smoother UX
             if (pageToFetch > 1 && !isNewQuery) {
                 setTimeout(() => setLoadingMore(false), RELOAD_DELAY_MS);
             } else {
                 setLoadingInitial(false);
             }
             setLoadingMore(false); // Ensure it's false if initial load
        }

    }, [isOnline, isServerReachable, currentSortBy, currentOrder, currentFilter, loadingInitial, loadingMore]); // Removed handleSyncComplete from deps

    // --- CRUD Operations ---

    const addBook = useCallback(async (newBookData) => {
        setError(null);
        const tempId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const parsedPrice = parseFloat(newBookData.price);
        const bookToAdd = {
            // id: tempId, // Assign temp ID only for offline state
            title: newBookData.title || '',
            author: newBookData.author || '',
            genre: newBookData.genre || '',
            price: isNaN(parsedPrice) ? 0 : parsedPrice
        };

        if (!isOnline || !isServerReachable) {
            console.log('Adding book offline.');
            const bookWithLocalId = { ...bookToAdd, id: tempId };
            // Optimistic UI update
            setBooks(prev => [...prev, bookWithLocalId]);
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            storage.setItem(LS_BOOKS_CACHE_KEY, [...cachedBooks, bookWithLocalId]);
            // Queue action
            queueAction('add', bookWithLocalId); // Pass data with temp ID
            return bookWithLocalId; // Return local object
        }

        // Online
        try {
            const addedBook = await bookApi.addBookAPI(bookToAdd); // API handles ID generation
            // No need for optimistic update if using WebSocket, but good fallback
            // setBooks(prev => [...prev, addedBook]); // Handled by WebSocket ideally
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            storage.setItem(LS_BOOKS_CACHE_KEY, [...cachedBooks, addedBook]); // Add to cache
             fetchFullStatisticsDebounced(); // Update stats
            return addedBook;
        } catch (error) {
            console.error('Failed to add book online:', error);
            setError(error.message);
            // Fallback to offline mode on error
            const bookWithLocalId = { ...bookToAdd, id: tempId };
            setBooks(prev => [...prev, bookWithLocalId]);
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            storage.setItem(LS_BOOKS_CACHE_KEY, [...cachedBooks, bookWithLocalId]);
            queueAction('add', bookWithLocalId);
            return bookWithLocalId;
        }
    }, [isOnline, isServerReachable, queueAction]); // Added fetchFullStatisticsDebounced dependency

    const updateBook = useCallback(async (updatedBookData) => {
        setError(null);
        const bookId = updatedBookData.id;
        if (!bookId) {
            const errorMsg = 'Update failed: Missing book ID.';
            setError(errorMsg);
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        const parsedPrice = parseFloat(updatedBookData.price);
        const dataToUpdate = {
            id: bookId, // Keep ID for local updates/queueing
            title: updatedBookData.title || '',
            author: updatedBookData.author || '',
            genre: updatedBookData.genre || '',
            price: isNaN(parsedPrice) ? 0 : parsedPrice
        };
        const isLocal = typeof bookId === 'string' && bookId.startsWith('local_');

        // Optimistic UI update (always update UI first)
        setBooks(prev => prev.map(b => b.id === bookId ? dataToUpdate : b));
        const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
        storage.setItem(LS_BOOKS_CACHE_KEY, cachedBooks.map(b => b.id === bookId ? dataToUpdate : b));

        if (!isOnline || !isServerReachable || isLocal) {
             console.log(`Updating book offline/locally: ${bookId}`);
             // Queue action (even for local, sync process might convert it to 'add')
             queueAction('update', dataToUpdate);
             return dataToUpdate;
        }

        // Online
        try {
            // API function expects ID separately
            const updatedBook = await bookApi.updateBookAPI(bookId, dataToUpdate);
            // UI already updated optimistically. WS might send update too.
            // Ensure cache consistency
            const currentCache = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
             storage.setItem(LS_BOOKS_CACHE_KEY, currentCache.map(b => b.id === bookId ? updatedBook : b));
             fetchFullStatisticsDebounced(); // Update stats
            return updatedBook;
        } catch (error) {
            console.error(`Failed to update book online ${bookId}:`, error);
            setError(error.message);
            // UI already updated optimistically. Queue the action now.
            queueAction('update', dataToUpdate);
            return dataToUpdate; // Return the data used for optimistic update
        }
    }, [isOnline, isServerReachable, queueAction]); // Added fetchFullStatisticsDebounced dependency

    const deleteBook = useCallback(async (id) => {
        setError(null);
        if (!id) {
             const errorMsg = 'Delete failed: Missing book ID.';
            setError(errorMsg);
            console.error(errorMsg);
            return false; // Indicate failure
        }

        const isLocal = typeof id === 'string' && id.startsWith('local_');

        // Optimistic UI Update (always remove from UI first)
        const bookToDelete = books.find(b => b.id === id); // Get data before removing
        setBooks(prev => prev.filter(b => b.id !== id));
        const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
        storage.setItem(LS_BOOKS_CACHE_KEY, cachedBooks.filter(b => b.id !== id));

        if (!isOnline || !isServerReachable || isLocal) {
             console.log(`Deleting book offline/locally: ${id}`);
             // Only queue if it wasn't a purely local item that never synced
             if (!isLocal && bookToDelete) { // Need bookToDelete to have ID info
                queueAction('delete', { id }); // Queue only the ID for delete
             } else if (isLocal) {
                 // If it's local, ensure it's removed from the queue if actions exist for it
                 // This part is tricky - requires filtering the queue. Simplified here.
                 console.log(`Local book ${id} removed. Related queued actions might persist.`);
             }
             return true; // Indicate local success
        }

        // Online
        try {
            await bookApi.deleteBookAPI(id);
             // UI already updated. Cache already updated. WebSocket might confirm.
             fetchFullStatisticsDebounced(); // Update stats
             return true; // Indicate success
        } catch (error) {
            console.error(`Failed to delete book online ${id}:`, error);
            setError(error.message);
            // UI/Cache already updated optimistically. Queue the action.
            if (bookToDelete) { // Ensure we have the ID
                 queueAction('delete', { id });
            }
            return true; // Still return true as it was deleted locally
        }
    }, [isOnline, isServerReachable, queueAction, books]); // Added fetchFullStatisticsDebounced, books dependency

    // --- Fetching All Stats/Books ---
    // Debounce function utility
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const fetchFullStatisticsInternal = useCallback(async () => {
        if (!isOnline || !isServerReachable) {
            console.log("Skipping full stats fetch - offline.");
            return;
        }
        console.log("Fetching full statistics and all books...");
        try {
            const [statsData, allBooksData] = await Promise.all([
                bookApi.fetchStatsAPI(),
                bookApi.fetchAllBooksAPI() // Ensure this doesn't fetch too much data
            ]);
            setStats(statsData);
            setAllBooks(allBooksData.books || []);
        } catch (err) {
            console.error("Error fetching full statistics/all books:", err);
            // Avoid setting main error state for this background fetch
        }
    }, [isOnline, isServerReachable]);

    // Create a debounced version
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fetchFullStatisticsDebounced = useCallback(debounce(fetchFullStatisticsInternal, 1500), [fetchFullStatisticsInternal]);


    // --- Pagination & Filtering/Sorting Triggers ---
    const fetchNextPage = useCallback(() => {
        if (!loadingInitial && !loadingMore && currentPage < totalPages) {
            fetchBooks(currentPage + 1, currentSortBy, currentOrder, currentFilter, false);
        }
    }, [loadingInitial, loadingMore, currentPage, totalPages, fetchBooks, currentSortBy, currentOrder, currentFilter]);

    const filterBooks = useCallback((searchTerm) => {
        fetchBooks(1, currentSortBy, currentOrder, searchTerm || null, true);
    }, [fetchBooks, currentSortBy, currentOrder]);

    const sortBooks = useCallback((sortBy, order = 'asc') => {
        fetchBooks(1, sortBy, order, currentFilter, true);
    }, [fetchBooks, currentFilter]);

     // --- Initial Load Effect ---
    useEffect(() => {
        console.log("Initial load effect running...");
        fetchBooks(1, DEFAULT_SORT_BY, DEFAULT_SORT_ORDER, null, true);
        fetchFullStatisticsInternal(); // Fetch stats on initial load (not debounced)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Ensure fetchBooks is stable or included if necessary (tricky)

    // Re-fetch logic if needed when coming back online AND sync isn't handling it
     useEffect(() => {
         if (isOnline && isServerReachable /*&& !isSyncing && actionQueue === 0 - add conditions if needed */) {
             // Maybe refresh if data seems stale? Or rely on sync/manual refresh.
             // console.log("Came back online, potentially refreshing data...");
             // fetchBooks(1, currentSortBy, currentOrder, currentFilter, true);
         }
     }, [isOnline, isServerReachable/*, isSyncing, actionQueue, fetchBooks, currentSortBy, currentOrder, currentFilter*/]);


    // --- Context Value ---
    const value = {
        books,
        allBooks,
        stats,
        loadingInitial,
        loadingMore,
        error,
        currentPage,
        totalPages,
        hasMorePages: currentPage < totalPages,
        currentSortBy,
        currentOrder,
        currentFilter,
        isOnline,
        isServerReachable,
        isSyncing,
        actionQueueCount: actionQueue, // Expose count
        addBook,
        updateBook,
        deleteBook,
        fetchNextPage,
        filterBooks,
        sortBooks,
        refreshBooks: () => fetchBooks(1, currentSortBy, currentOrder, currentFilter, true), // Explicit refresh
        fetchFullStatistics: fetchFullStatisticsDebounced, // Expose debounced version
    };

    return (
        <BooksContext.Provider value={value}>
            {children}
        </BooksContext.Provider>
    );
};

export const useBooks = () => useContext(BooksContext); // Keep the hook name consistent