import React, { useMemo, useEffect } from 'react';
import { useBooks } from '../context/book-context';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import styles from '../styles/average-price-per-genre.module.css';

const AveragePricePerGenreChart = () => {
    const { books, fetchFullStatistics } = useBooks();
    
    // Fetch statistics on component mount
    useEffect(() => {
        fetchFullStatistics();
    }, [fetchFullStatistics]);

    const chartData = useMemo(() => {
        if (!books || books.length === 0) {
            return [];
        }

        // Calculate total price and count per genre
        const genrePrices = books.reduce((acc, book) => {
            const genre = book.genre || 'Unknown';
            if (!acc[genre]) {
                // Initialize if genre not seen before
                acc[genre] = { total: 0, count: 0 };
            }
            // Ensure price is a number before adding
            const price = typeof book.price === 'number' ? book.price : 0;
            acc[genre].total += price;
            acc[genre].count += 1;
            return acc;
        }, {});

        // Convert to array format for Recharts
        return Object.entries(genrePrices).map(([genre, data]) => ({
            genre,
            averagePrice: data.count > 0 
                ? parseFloat((data.total / data.count).toFixed(2)) 
                : 0
        }));
    }, [books]); // Re-calculate when books change

    if (!chartData || chartData.length === 0) {
        return <div className={styles.noData}>No average price data available</div>;
    }

    return (
        <div className={styles.chartContainer}>
            <h2>Average Book Price per Genre (Real-time)</h2>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
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