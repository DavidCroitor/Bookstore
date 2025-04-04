import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const BooksContext = createContext();
const API_URL = 'http://localhost:5000/api';
const ITEMS_PER_PAGE = 12; // Define items per page (limit)
const RELOAD_DELAY_MS = 500;

// --- Define Default Sort ---
const DEFAULT_SORT_BY = 'id';
const DEFAULT_SORT_ORDER = 'asc';

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
        mostExpensiveBook: null,
        leastExpensiveBook: null,
        closestToAverageBook: null,
        averagePrice: 0,
    });

    // --- Fetch Books (Core Logic) ---
    const fetchBooks = useCallback(async (
        pageToFetch,
        sortBy = currentSortBy,
        order = currentOrder,
        filter = currentFilter,
        isNewQuery = false
    ) => {
        console.log(`Fetching page: ${pageToFetch}, Sort: ${sortBy}, Order: ${order}, Filter: ${filter}, NewQuery: ${isNewQuery}`);

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
            // ... (add params as before: filter, sortBy, order, page, limit) ...
            if (filter) params.append('filter', filter);
            if (sortBy) { params.append('sortBy', sortBy); params.append('order', order); }
            params.append('page', pageToFetch.toString());
            params.append('limit', limit.toString());

            const url = `${API_URL}/books?${params.toString()}`;
            console.log('Fetching books from:', url);
            const response = await fetch(url);

            if (!response.ok) {
                // ... (error handling as before) ...
                let errorData = null; try { errorData = await response.json(); } catch (e) {}
                const errorMessage = errorData?.message || `HTTP error! Status: ${response.status}`;
                throw new Error(errorMessage);
            }

            const data = await response.json(); // Expect { books: [], currentPage: X, totalPages: Y, ... }
            console.log("API Data Received:", data);

            const receivedStats = data.stats || { mostExpensiveBook: null, leastExpensiveBook: null, closestToAverageBook: null, averagePrice: 0 };
            setStats(receivedStats);

            // --- Apply Delay Logic ---
            if (pageToFetch === 1 || isNewQuery) {
                // === Initial Load or Reset: No Delay ===
                console.log("Updating state immediately (initial/reset)");
                setBooks(data.books);
                setCurrentPage(data.currentPage);
                setTotalPages(data.totalPages);
                setLoadingInitial(false); // Turn off initial loading
            } else {
                // === Subsequent Page Load: Apply Delay ===
                console.log(`Applying ${RELOAD_DELAY_MS}ms delay before state update`);
                setTimeout(() => {
                    console.log("Delay finished, updating state");
                    setBooks(prevBooks => [...prevBooks, ...data.books]); // Append books
                    setCurrentPage(data.currentPage);
                    setTotalPages(data.totalPages);
                    setLoadingMore(false); // Turn off loadingMore *after* delay
                }, RELOAD_DELAY_MS);
            }
            // --- End Delay Logic ---

        } catch (err) {
            console.error("Failed to fetch books:", err);
            setError(err.message || 'Failed to fetch books.');
            // Turn off appropriate loading indicators immediately on error
            if (pageToFetch === 1 || isNewQuery) {
                setBooks([]);
                setLoadingInitial(false);
            } else {
                 setLoadingMore(false); // Stop loadingMore indicator on error
            }
        }
        // No finally block needed as loading states are handled in try/catch/setTimeout
    }, [limit, currentSortBy, currentOrder, currentFilter, currentPage, loadingInitial, loadingMore]); // Added loading states to deps to prevent overlapping calls check // Add currentPage dependency? Maybe not.

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

    const addBook = async (newBookData) => { /* ... as before, call refetchFirstPage() on success ... */
        setError(null); try { /* POST */ await fetch(/*...*/); refetchFirstPage(); } catch (err) { setError(err.message); }
    };
    const updateBook = async (updatedBookData) => { /* ... as before, call refetchFirstPage() on success ... */
        setError(null); try { /* PATCH */ await fetch(/*...*/); refetchFirstPage(); } catch (err) { setError(err.message); }
    };
    const deleteBook = async (id) => { /* ... as before, call refetchFirstPage() on success ... */
         setError(null); try { /* DELETE */ await fetch(/*...*/); refetchFirstPage(); } catch (err) { setError(err.message); }
    };
    // --- End CRUD ---

    // --- Derived State ---
    const hasMorePages = currentPage < totalPages;

    // Calculated values based on *all* loaded books
    const mostExpensiveBook = books.length > 0 ? books.reduce((max, book) => (book.price > max.price ? book : max), books[0]) : null;
    const leastExpensiveBook = books.length > 0 ? books.reduce((min, book) => (book.price < min.price ? book : min), books[0]) : null;
    // Average/Closest might be less meaningful with partially loaded data
    const averagePrice = books.length > 0 ? books.reduce((sum, book) => sum + parseFloat(book.price || 0), 0) / books.length : 0;
    const closestToAverageBook = books.length > 0 ? books.reduce((closest, book) => Math.abs(parseFloat(book.price || 0) - averagePrice) < Math.abs(parseFloat(closest.price || 0) - averagePrice) ? book : closest, books[0]) : null;


    return (
        <BooksContext.Provider
            value={{
                books,          // Accumulated list
                loadingInitial, // Loading state for first load / reset
                loadingMore,    // Loading state for subsequent pages
                error,
                currentPage,    // Last fetched page
                totalPages,     // Total pages available
                hasMorePages,   // Boolean: Can fetch more?
                fetchNextPage,  // Function to trigger loading the next page
                addBook,
                updateBook,
                deleteBook,
                sortBooks,
                filterBooks,
                currentFilter, 
                stats: {
                    mostExpensiveBook: stats.mostExpensiveBook,
                    leastExpensiveBook: stats.leastExpensiveBook,
                    closestToAverageBook: stats.closestToAverageBook,
                    averagePrice: stats.averagePrice,
                }
            }}
        >
            {children}
        </BooksContext.Provider>
    );
};

export const useBooks = () => useContext(BooksContext);