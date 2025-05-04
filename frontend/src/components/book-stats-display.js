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

    // More comprehensive condition check
    const hasValidStats = stats && 
                         (stats.totalBooks > 0 || 
                          (stats.mostExpensiveBook || 
                           stats.leastExpensiveBook || 
                           stats.averagePrice > 0));

    return (
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', margin: '20px 0' }}>
            <h2>Key Statistics</h2>
            {hasValidStats ? (
                <ul>
                    <li><strong>Total Books:</strong> {stats.totalCount}</li>
                    <li><strong>Average Price:</strong> ${stats.averagePrice.toFixed(2)}</li>
                    <li>
                        <strong>Most Expensive:</strong> {stats.mostExpensiveBook.price}
                        {stats.mostExpensiveBook ? ` (${stats.mostExpensiveBook.title})` : ''}
                    </li>
                    <li>
                        <strong>Least Expensive:</strong> {stats.leastExpensiveBook.price}
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