import React, { useEffect, useCallback } from 'react';
import { useBooks } from '../context/book-context'; // Adjust path as needed

// Simple component, doesn't need the chart library

const BookStatsDisplay = () => {
    const {
        fetchFullStatistics,
        stats,
        books, // Add dependency on books array
        isOnline,
        isServerReachable,
        socket // Add socket to detect real-time updates
    } = useBooks();

    // Create a memoized refresh function
    const refreshStats = useCallback(() => {
        fetchFullStatistics();
    }, [fetchFullStatistics]);

    // Fetch full statistics when component mounts
    useEffect(() => {
        refreshStats();
    }, [refreshStats]);

    // Re-fetch statistics when books array changes or connectivity changes
    useEffect(() => {
        refreshStats();
    }, [books.length, isOnline, isServerReachable, refreshStats]);

    // Set up WebSocket event listener for real-time updates
    useEffect(() => {
        if (socket) {
            const handleSocketMessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'new_book' || message.type === 'update_book' || message.type === 'delete_book') {
                    // Refresh statistics when book-related events occur
                    refreshStats();
                }
            };

            // Add event listener
            socket.addEventListener('message', handleSocketMessage);

            // Clean up on unmount
            return () => {
                socket.removeEventListener('message', handleSocketMessage);
            };
        }
    }, [socket, refreshStats]);

    // Helper to format price, handles undefined book
    const formatPrice = (book) => {
        return book && typeof book.price === 'number'
            ? `$${book.price.toFixed(2)}`
            : 'N/A';
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', margin: '20px 0' }}>
            <h2>Key Statistics</h2>
            {stats.totalCount > 0 ? (
                <ul>
                    <li><strong>Total Books:</strong> {stats.totalCount}</li>
                    <li><strong>Average Price:</strong> ${stats.averagePrice.toFixed(2)}</li>
                    <li>
                        <strong>Most Expensive:</strong> {formatPrice(stats.mostExpensiveBook)}
                        {stats.mostExpensiveBook ? ` (${stats.mostExpensiveBook.title})` : ''}
                    </li>
                    <li>
                        <strong>Least Expensive:</strong> {formatPrice(stats.leastExpensiveBook)}
                        {stats.leastExpensiveBook ? ` (${stats.leastExpensiveBook.title})` : ''}
                    </li>
                </ul>
            ) : (
                <p>No book data available for statistics.</p>
            )}
        </div>
    );
};

export default BookStatsDisplay;