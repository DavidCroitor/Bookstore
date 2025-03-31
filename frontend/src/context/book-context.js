import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const BooksContext = createContext();
const API_URL = 'http://localhost:5000';

export const BooksProvider = ({ children }) => {
    const [books, setBooks] = useState([]); // Ensure this is your initial state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch All Books (Initial Load & Refresh) ---
    const fetchBooks = useCallback(async (sortBy = null, order = 'asc', filter = null) => {
        setLoading(true);
        setError(null);
        try {
            // Construct query parameters
            const params = new URLSearchParams();
            if (filter) params.append('filter', filter);
            if (sortBy) params.append('sortBy', sortBy);
            if (sortBy) params.append('order', order); // Only add order if sortBy is present

            const queryString = params.toString();
            const url = `${API_URL}/books${queryString ? `?${queryString}` : ''}`;

            console.log('Fetching books from:', url); // Log the URL being fetched

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            setBooks(data);
        } catch (err) {
            console.error("Failed to fetch books:", err);
            setError(err.message || 'Failed to fetch books.'); // Set error state
            setBooks([]); // Clear books on error or show stale data? Your choice.
        } finally {
            setLoading(false); // Stop loading indicator
        }
    }, []); // useCallback ensures fetchBooks doesn't change unnecessarily

     // --- Initial Load ---
     useEffect(() => {
        fetchBooks(); // Fetch books when the component mounts
        // We don't need localStorage loading anymore
    }, [fetchBooks]); // Depend on fetchBooks



     // --- Actions (API Calls) ---

    // Add new book
    const addBook = async (newBookData) => {
        setLoading(true); // Optional: indicate loading during add
        setError(null);
        try {
            const response = await fetch(`${API_URL}/books`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...newBookData,
                    price: parseFloat(newBookData.price) // Ensure price is number
                }),
            });
            if (!response.ok) {
                // Handle validation errors or other issues
                const errorData = await response.json();
                console.error("Add failed:", errorData);
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }
            // const addedBook = await response.json(); // Get the added book data from response

            // Instead of manually updating state, re-fetch the list for consistency
            await fetchBooks();

        } catch (err) {
            console.error("Failed to add book:", err);
            setError(err.message || 'Failed to add book.');
        } finally {
             setLoading(false);
        }
    };

    // Update existing book
    const updateBook = async (updatedBookData) => {
         setLoading(true);
         setError(null);
        try {
            const response = await fetch(`${API_URL}/books/${updatedBookData.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // Only send fields that might be updated
                    title: updatedBookData.title,
                    author: updatedBookData.author,
                    price: parseFloat(updatedBookData.price) // Ensure price is number
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Update failed:", errorData);
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }
             // const updatedBook = await response.json(); // Get updated book data

            // Re-fetch the list for consistency
            await fetchBooks();

        } catch (err) {
            console.error("Failed to update book:", err);
             setError(err.message || 'Failed to update book.');
        } finally {
            setLoading(false);
        }
    };

    // Delete book
    const deleteBook = async (id) => {
         setLoading(true);
         setError(null);
        try {
            const response = await fetch(`${API_URL}/books/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok && response.status !== 204) { // 204 No Content is success
                 const errorData = await response.json(); // May fail if no content
                 console.error("Delete failed:", errorData);
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

             // Re-fetch the list to reflect deletion
             await fetchBooks();

        } catch (err) {
            console.error("Failed to delete book:", err);
            setError(err.message || 'Failed to delete book.');
        } finally {
             setLoading(false);
        }
    };

    // --- Sorting ---
    // Let the backend handle sorting - just call fetchBooks with sort params
    const sortBooksByPrice = (order = 'asc') => {
        fetchBooks('price', order); // Call fetchBooks with sorting parameters
    };

     // --- Filtering ---
     // Add a function to trigger filtering via the API
     const filterBooks = (searchTerm) => {
         fetchBooks(null, 'asc', searchTerm); // Pass the filter term to fetchBooks
     };

      // --- Calculated Values (Derived State) ---
    // These calculations work on the `books` state, which is now populated by the API.
    // They don't need to change unless the structure of a 'book' object changes.
    // Added checks for empty books array to avoid errors.
    const mostExpensiveBook = books.length > 0 ? books.reduce((max, book) => (book.price > max.price ? book : max), books[0]) : null;
    const leastExpensiveBook = books.length > 0 ? books.reduce((min, book) => (book.price < min.price ? book : min), books[0]) : null;
    const averagePrice = books.length > 0 ? books.reduce((sum, book) => sum + parseFloat(book.price || 0), 0) / books.length : 0; // Ensure price is treated as number
    const closestToAverageBook = books.length > 0 ? books.reduce((closest, book) =>
        Math.abs(parseFloat(book.price || 0) - averagePrice) < Math.abs(parseFloat(closest.price || 0) - averagePrice) ? book : closest,
        books[0]
    ) : null;


    return (
        <BooksContext.Provider
            value={{
                books,
                addBook,
                updateBook,
                deleteBook,
                sortBooksByPrice,
                filterBooks,
                mostExpensiveBook,
                leastExpensiveBook,
                closestToAverageBook,
                averagePrice,
            }}
        >
            {children}
        </BooksContext.Provider>
    );
};

export const useBooks = () => useContext(BooksContext);
