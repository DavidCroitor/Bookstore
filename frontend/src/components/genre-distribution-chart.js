import React, { useState, useEffect } from 'react';
import { useBooks } from '@/context/BooksContext';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import styles from '../styles/genre-distribution-chart.module.css'; 

const GenreDistributionChart = () => {
    const { allBooks, fetchFullStatistics } = useBooks();
    const [chartData, setChartData] = useState([]);
    
    useEffect(() => {
        fetchFullStatistics();
    }, [fetchFullStatistics]);
    
    useEffect(() => {
        if (!allBooks || allBooks.length === 0) return;
        
        const genreCounts = allBooks.reduce((acc, book) => {
            if (!book.genre.name) return acc;
            acc[book.genre.name] = (acc[book.genre.name] || 0) + 1;
            return acc;
        }, {});
        
        const data = Object.entries(genreCounts).map(([genre, count]) => ({
            genre,
            count
        }));
        
        setChartData(data);
    }, [allBooks]); 
    
    if (!chartData || chartData.length === 0) {
        return <div className={styles.noData}>No chart data available</div>;
    }
    
    return (
        <div className={styles.chartContainer}>
            <h2>Books by Genre</h2>
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