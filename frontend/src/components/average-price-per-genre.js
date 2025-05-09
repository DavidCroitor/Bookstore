import React, { useMemo, useEffect } from 'react';
import { useBooks } from '../context/BooksContext';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import styles from '../styles/average-price-per-genre.module.css';

const AveragePricePerGenreChart = () => {
    const { allBooks, fetchFullStatistics } = useBooks();
    
    useEffect(() => {
        fetchFullStatistics();
    }, [fetchFullStatistics]);

    const chartData = useMemo(() => {
        if (!allBooks || allBooks.length === 0) {
            console.log('No books data available for chart');
            return [];
        }

        const genrePrices = allBooks.reduce((acc, book) => {
            let genreName = 'Unknown';
            if (book.genre) {
                if (typeof book.genre === 'object' && book.genre !== null) {
                    genreName = book.genre.name || 'Unknown';
                } else if (typeof book.genre === 'string') {
                    genreName = book.genre;
                }
            }

            if (!acc[genreName]) {
                acc[genreName] = { total: 0, count: 0 };
            }

            let price = 0;
            if (book.price !== undefined && book.price !== null) {
                price = typeof book.price === 'string' 
                    ? parseFloat(book.price) 
                    : typeof book.price === 'number' 
                        ? book.price 
                        : 0;
            }

            // Skip NaN values
            if (!isNaN(price)) {
                acc[genreName].total += price;
                acc[genreName].count += 1;
            }

            return acc;
        }, {});

        // Convert to array format for Recharts
        return Object.entries(genrePrices).map(([genre, data]) => ({
            genre,
            averagePrice: data.count > 0 
                ? parseFloat((data.total / data.count).toFixed(2)) 
                : 0
        }));
    }, [allBooks]);

    if (!chartData || chartData.length === 0) {
        return <div className={styles.noData}>No average price data available</div>;
    }

    return (
        <div className={styles.chartContainer}>
            <h2>Average Book Price per Genre</h2>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="genre" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => ['$' + value, 'Average Price']} />
                    <Legend />
                    <Bar dataKey="averagePrice" name="Average Price ($)" fill="#36A2EB" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AveragePricePerGenreChart;