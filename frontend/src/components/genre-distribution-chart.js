import React, { useState, useEffect } from 'react';
import { useBooks } from '@/context/book-context';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import styles from '../styles/genre-distribution-chart.module.css'; // Adjust path


const GenreDistributionChart = () => {
    const { books, fetchFullStatistics } = useBooks();
    const [chartData, setChartData] = useState([]);
    
    // Fetch statistics on component mount
    useEffect(() => {
        fetchFullStatistics();
    }, [fetchFullStatistics]);
    
    // Process books into chart data whenever the books array changes
    useEffect(() => {
        if (!books || books.length === 0) return;
        
        // Count books by genre
        const genreCounts = books.reduce((acc, book) => {
            if (!book.genre) return acc;
            acc[book.genre] = (acc[book.genre] || 0) + 1;
            return acc;
        }, {});
        
        // Convert to array format for Recharts
        const data = Object.entries(genreCounts).map(([genre, count]) => ({
            genre,
            count
        }));
        
        setChartData(data);
    }, [books]); // Re-process whenever books change
    
    if (!chartData || chartData.length === 0) {
        return <div className={styles.noData}>No chart data available</div>;
    }
    
    return (
        <div className={styles.chartContainer}>
            <h2>Books by Genre (Real-time)</h2>
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
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Number of Books" fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default GenreDistributionChart;