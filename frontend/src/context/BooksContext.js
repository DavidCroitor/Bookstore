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
import { useWebSocket } from './hooks/useWebSocket';

initializeStorage();

const BooksContext = createContext();

export const BooksProvider = ({ children }) => {
    const [books, setBooks] = useState([]);
    const [allBooks, setAllBooks] = useState([]);
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
    const syncCompletedRef = useRef(false);

    const handleSyncComplete = useCallback(async ({ success, processedCount, idMapping }) => {
        console.log(`Sync completed. Success: ${success}, Processed: ${processedCount}`);
        if (processedCount > 0) {
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            let updatedCache = cachedBooks.filter(book => !(typeof book.id === 'string' && book.id.startsWith('local_') && idMapping[book.id]));
            storage.setItem(LS_BOOKS_CACHE_KEY, updatedCache);

            syncCompletedRef.current = true;
            await fetchBooks(1, currentSortBy, currentOrder, currentFilter, true);
        }
    }, [currentSortBy, currentOrder, currentFilter]);

    const { actionQueue, isSyncing, queueAction } = useOfflineSync(
        isOnline,
        isServerReachable,
        handleSyncComplete
    );


    // --- WebSocket Handlers ---
    const handleWsUpdateCache = useCallback((updatedBook) => {
        const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
        const exists = cachedBooks.some(b => b.id === updatedBook.id);
        let newCache;
        if (exists) {
            newCache = cachedBooks.map(b => b.id === updatedBook.id ? updatedBook : b);
        } else {
            newCache = [...cachedBooks, updatedBook];
        }
        storage.setItem(LS_BOOKS_CACHE_KEY, newCache);
    }, []);

    const handleWsDeleteCache = useCallback((deletedBookData) => {
        const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
        storage.setItem(LS_BOOKS_CACHE_KEY, cachedBooks.filter(b => b.id !== deletedBookData.id));
    }, []);

    const handleWsNewBook = useCallback((newBook) => {
        setBooks(prev => {
            if (!prev.some(b => b.id === newBook.id)) {
                return [...prev, newBook];
            }
            return prev;
        });
        handleWsUpdateCache(newBook);
        fetchFullStatisticsDebounced();
    }, [handleWsUpdateCache]);

    const handleWsUpdateBook = useCallback((updatedBook) => {
        setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
        handleWsUpdateCache(updatedBook);
        fetchFullStatisticsDebounced();
    }, [handleWsUpdateCache]);

    const handleWsDeleteBook = useCallback((deletedBookData) => {
        setBooks(prev => prev.filter(b => b.id !== deletedBookData.id));
        handleWsDeleteCache(deletedBookData);
        fetchFullStatisticsDebounced();
    }, [handleWsDeleteCache]);

    useWebSocket({
        onNewBook: handleWsNewBook,
        onUpdateBook: handleWsUpdateBook,
        onDeleteBook: handleWsDeleteBook,
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

        console.log(`Fetching books: page ${pageToFetch}, sortBy ${sortBy}, order ${order}, filter ${filter}, isNewQuery ${isNewQuery}`);

       if(!isNewQuery && pageToFetch > 1) {
            setLoadingMore(true);
       }
       else {
            setLoadingInitial(true);
            setLoadingMore(false);
       }
        
        if (isNewQuery) {
            setBooks([]);
            setCurrentPage(0);
            setTotalPages(1);

            setCurrentSortBy(sortBy);
            setCurrentOrder(order);
            setCurrentFilter(filter);
        }
        
        if (isOfflineMode) {
            console.log('Fetching books in offline mode from cache.');
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            setBooks(cachedBooks);
            setTotalPages(1);
            setCurrentPage(1);
            setLoadingInitial(false);
            setLoadingMore(false);
            setError('App is offline. Displaying cached data.');
            return;
        }

        // --- Online Fetching ---
        try {

            let apiParams = {
                page: pageToFetch,
                limit: ITEMS_PER_PAGE,
                sortBy,
                order
            };

            if(typeof filter === 'string' && filter) {
                if (filter.searchTerm) {
                    apiParams.search = filter.searchTerm;
                }
            }
            else if (filter && typeof filter === 'object') {
                if (filter.searchTerm) apiParams.search = filter.searchTerm;
                if (filter.minPrice) apiParams.minPrice = filter.minPrice;
                if (filter.maxPrice) apiParams.maxPrice = filter.maxPrice;
                if (filter.author) apiParams.author = filter.author;
                if (filter.genre) apiParams.genre = filter.genre;
                if (filter.minRating) apiParams.minRating = filter.minRating;
                if (filter.yearFrom) apiParams.yearFrom = filter.yearFrom;
                if (filter.yearTo) apiParams.yearTo = filter.yearTo;
            }

            const data = await bookApi.fetchBooksAPI(apiParams);

            const serverBooks = data.books || [];
            const isRefreshAfterSync = syncCompletedRef.current;
            syncCompletedRef.current = false;

            setBooks(serverBooks);

            if (pageToFetch === 1 || isNewQuery) {
                setBooks(serverBooks);
                storage.setItem(LS_BOOKS_CACHE_KEY, serverBooks);
            } else {
                const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
                const existingIds = new Set(cachedBooks.map(book => book.id));
                const uniqueNewBooks = serverBooks.filter(book => !existingIds.has(book.id));
                storage.setItem(LS_BOOKS_CACHE_KEY, [...cachedBooks, ...uniqueNewBooks]);
            }

            console.log('Books cache:', storage.getItem(LS_BOOKS_CACHE_KEY) || []);

            setCurrentPage(data.currentPage);
            setTotalPages(data.totalPages);

        } catch (err) {
            console.error('Failed to fetch books:', err);
            setError(err.message || 'Failed to fetch books.');
            if (pageToFetch === 1 || isNewQuery) {
                console.log('Error fetching, loading from cache.');
                const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
                setBooks(cachedBooks);
                setCurrentPage(1);

            }
        } finally {
            if (pageToFetch > 1 && !isNewQuery) {
                setTimeout(() => setLoadingMore(false), RELOAD_DELAY_MS);
                console.log('Loading more books...');
            } else {
                console.log('Initial load complete.');
                setLoadingInitial(false);
            }
            setLoadingMore(false);
        }

    }, [isOnline, isServerReachable]);

    // --- CRUD Operations ---
    const addBook = useCallback(async (newBookData) => {
        setError(null);
        const tempId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const parsedPrice = parseFloat(newBookData.price);
        const bookToAdd = {
            title: newBookData.title || '',
            author: newBookData.author || '',
            genre: newBookData.genre || '',
            price: isNaN(parsedPrice) ? 0 : parsedPrice,
            rating: newBookData.rating || 0,
        };

        if (!isOnline || !isServerReachable) {
            console.log('Adding book offline.');
            const bookWithLocalId = { ...bookToAdd, id: tempId };
            setBooks(prev => [...prev, bookWithLocalId]);
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            storage.setItem(LS_BOOKS_CACHE_KEY, [...cachedBooks, bookWithLocalId]);
            queueAction('add', bookWithLocalId);
            return bookWithLocalId;
        }

        try {
            const addedBook = await bookApi.addBookAPI(bookToAdd);
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            storage.setItem(LS_BOOKS_CACHE_KEY, [...cachedBooks, addedBook]);
            fetchFullStatisticsDebounced();
            return addedBook;
        } catch (error) {
            console.error('Failed to add book online:', error);
            setError(error.message);
            const bookWithLocalId = { ...bookToAdd, id: tempId };
            setBooks(prev => [...prev, bookWithLocalId]);
            const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            storage.setItem(LS_BOOKS_CACHE_KEY, [...cachedBooks, bookWithLocalId]);
            queueAction('add', bookWithLocalId);
            return bookWithLocalId;
        }
    }, [isOnline, isServerReachable, queueAction]);

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
            id: bookId,
            title: updatedBookData.title || '',
            author: updatedBookData.author || '',
            genre: updatedBookData.genre || '',
            price: isNaN(parsedPrice) ? 0 : parsedPrice,
            rating: updatedBookData.rating || 0,
        };
        const isLocal = typeof bookId === 'string' && bookId.startsWith('local_');

        setBooks(prev => prev.map(b => b.id === bookId ? dataToUpdate : b));
        const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
        storage.setItem(LS_BOOKS_CACHE_KEY, cachedBooks.map(b => b.id === bookId ? dataToUpdate : b));

        if (!isOnline || !isServerReachable || isLocal) {
            console.log(`Updating book offline/locally: ${bookId}`);
            queueAction('update', dataToUpdate);
            return dataToUpdate;
        }

        try {
            const updatedBook = await bookApi.updateBookAPI(bookId, dataToUpdate);
            const currentCache = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
            storage.setItem(LS_BOOKS_CACHE_KEY, currentCache.map(b => b.id === bookId ? updatedBook : b));
            fetchFullStatisticsDebounced();
            return updatedBook;
        } catch (error) {
            console.error(`Failed to update book online ${bookId}:`, error);
            setError(error.message);
            queueAction('update', dataToUpdate);
            return dataToUpdate;
        }
    }, [isOnline, isServerReachable, queueAction]);

    const deleteBook = useCallback(async (id) => {
        setError(null);
        if (!id) {
            const errorMsg = 'Delete failed: Missing book ID.';
            setError(errorMsg);
            console.error(errorMsg);
            return false;
        }

        const isLocal = typeof id === 'string' && id.startsWith('local_');

        const bookToDelete = books.find(b => b.id === id);
        setBooks(prev => prev.filter(b => b.id !== id));
        const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
        storage.setItem(LS_BOOKS_CACHE_KEY, cachedBooks.filter(b => b.id !== id));

        if (!isOnline || !isServerReachable || isLocal) {
            console.log(`Deleting book offline/locally: ${id}`);
            if (!isLocal && bookToDelete) {
                queueAction('delete', { id });
            } else if (isLocal) {
                console.log(`Local book ${id} removed. Related queued actions might persist.`);
            }
            return true;
        }

        try {
            await bookApi.deleteBookAPI(id);
            fetchFullStatisticsDebounced();
            return true;
        } catch (error) {
            console.error(`Failed to delete book online ${id}:`, error);
            setError(error.message);
            if (bookToDelete) {
                queueAction('delete', { id });
            }
            return true;
        }
    }, [isOnline, isServerReachable, queueAction, books]);

    const fetchFullStatisticsInternal = useCallback(async () => {
        if (!isOnline || !isServerReachable) {
          console.log("Skipping full stats fetch - offline.");
          // Use cached stats or calculate from cached books when offline
          const cachedBooks = storage.getItem(LS_BOOKS_CACHE_KEY) || [];
          if (cachedBooks.length > 0) {
            const offlineStats = calculateOfflineStats(cachedBooks);
            setStats(offlineStats);
          }
          return;
        }
        
        console.log("Fetching full statistics...");
        try {
          const statsData = await bookApi.fetchStatsAPI();
          setStats(statsData);
          
          // Optional - fetch all books separately if needed
          try {
            const allBooksData = await bookApi.fetchAllBooksAPI();
            setAllBooks(allBooksData.books || []);
          } catch (booksErr) {
            console.error("Error fetching all books:", booksErr);
          }
        } catch (err) {
          console.error("Error fetching statistics:", err);
        }
    }, [isOnline, isServerReachable]);
      

    const calculateOfflineStats = (books) => {
    if (!books || books.length === 0) {
        return {
        totalCount: 0,
        mostExpensiveBook: null,
        leastExpensiveBook: null,
        averagePrice: 0,
        closestToAverageBook: null
        };
    }
    
    // Find most expensive book
    const mostExpensiveBook = books.reduce((max, book) => 
        parseFloat(book.price) > parseFloat(max.price) ? book : max
    , books[0]);
    
    // Find least expensive book
    const leastExpensiveBook = books.reduce((min, book) => 
        parseFloat(book.price) < parseFloat(min.price) ? book : min
    , books[0]);
    
    // Calculate average price
    const totalPrice = books.reduce((sum, book) => 
        sum + parseFloat(book.price), 0);
    const averagePrice = totalPrice / books.length;
    
    // Find closest to average price
    const closestToAverageBook = books.reduce((closest, book) => {
        const closestDiff = Math.abs(parseFloat(closest.price) - averagePrice);
        const currentDiff = Math.abs(parseFloat(book.price) - averagePrice);
        return currentDiff < closestDiff ? book : closest;
    }, books[0]);
    
    return {
        totalCount: books.length,
        mostExpensiveBook,
        leastExpensiveBook,
        averagePrice,
        closestToAverageBook
    };
    };

    const filterBooks = useCallback((filterOptions) => {
        console.log('filterBooks received:', filterOptions);
      
        // Initialize with defaults
        let searchTermValue = '';
        let otherFilters = {};
        
        if (filterOptions) {
          if (typeof filterOptions === 'string') {
            // Case 1: Simple string searchTerm
            searchTermValue = filterOptions;
          } 
          else if (typeof filterOptions === 'object') {
            // Case 2: Filter object
            const { searchTerm, ...rest } = filterOptions;
            
            // Handle searchTerm safely - ensure it's a string
            searchTermValue = typeof searchTerm === 'string' ? searchTerm : '';
            
            // All other filters go in otherFilters
            otherFilters = rest;
          }
        }
        
        console.log('Processed filters:', { 
          searchTerm: searchTermValue, 
          otherFilters 
        });
        
        // Build the final filter object
        const finalFilter = {
          ...otherFilters
        };
        
        // Only add searchTerm if it exists
        if (searchTermValue) {
          finalFilter.searchTerm = searchTermValue;
        }
        
        // Pass the cleaned filter object to fetchBooks
        fetchBooks(1, currentSortBy, currentOrder, finalFilter, true);
    }, [fetchBooks, currentSortBy, currentOrder]);

    const sortBooks = useCallback((sortBy, order = 'asc') => {
        fetchBooks(1, sortBy, order, currentFilter, true);
    }, [fetchBooks, currentFilter]);

    useEffect(() => {
        console.log("Initial load effect running...");
        fetchBooks(1, DEFAULT_SORT_BY, DEFAULT_SORT_ORDER, null, true);
        fetchFullStatisticsInternal();
    }, []);

    const value = {
        books,
        allBooks,
        stats,
        loadingInitial,
        loadingMore,
        error,
        currentPage,
        totalPages,
        currentSortBy,
        currentOrder,
        currentFilter,
        isOnline,
        isServerReachable,
        isSyncing,
        actionQueueCount: actionQueue, 
        fetchBooks,
        addBook,
        updateBook,
        deleteBook,
        filterBooks,
        sortBooks,
        fetchFullStatistics: fetchFullStatisticsInternal,
    };

    return (
        <BooksContext.Provider value={value}>
            {children}
        </BooksContext.Provider>
    );
};

export const useBooks = () => useContext(BooksContext);

