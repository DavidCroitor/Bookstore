import React, { useEffect, useCallback } from 'react';
import { useBooks } from '../context/BooksContext'; 
const BookStatsDisplay = () => {
    const {
        fetchFullStatistics,
        stats,
        books, 
        isOnline,
        isServerReachable,
        socket 
    } = useBooks();

    const refreshStats = useCallback(() => {
        fetchFullStatistics();
    }, [fetchFullStatistics]);

    useEffect(() => {
        refreshStats();
    }, [refreshStats]);

    useEffect(() => {
        refreshStats();
    }, [books.length, isOnline, isServerReachable, refreshStats]);

    useEffect(() => {
        if (socket) {
            const handleSocketMessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'new_book' || message.type === 'update_book' || message.type === 'delete_book') {
                    refreshStats();
                }
            };

            socket.addEventListener('message', handleSocketMessage);

            return () => {
                socket.removeEventListener('message', handleSocketMessage);
            };
        }
    }, [socket, refreshStats]);

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