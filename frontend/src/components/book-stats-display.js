import React from 'react';
import { useBooks } from '../context/book-context'; // Adjust path as needed

// Simple component, doesn't need the chart library

const BookStatsDisplay = () => {
    const {
        books,
        averagePrice,
        mostExpensiveBook,
        leastExpensiveBook
    } = useBooks();

    // Helper to format price, handles undefined book
    const formatPrice = (book) => {
        return book && typeof book.price === 'number'
            ? `$${book.price.toFixed(2)}`
            : 'N/A';
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', margin: '20px 0' }}>
            <h2>Key Statistics</h2>
            {books && books.length > 0 ? (
                <ul>
                    <li><strong>Total Books:</strong> {books.length}</li>
                    <li><strong>Average Price:</strong> ${averagePrice.toFixed(2)}</li>
                    <li>
                        <strong>Most Expensive:</strong> {formatPrice(mostExpensiveBook)}
                        {mostExpensiveBook ? ` (${mostExpensiveBook.title})` : ''}
                    </li>
                    <li>
                        <strong>Least Expensive:</strong> {formatPrice(leastExpensiveBook)}
                        {leastExpensiveBook ? ` (${leastExpensiveBook.title})` : ''}
                    </li>
                </ul>
            ) : (
                <p>No book data available for statistics.</p>
            )}
        </div>
    );
};

export default BookStatsDisplay;