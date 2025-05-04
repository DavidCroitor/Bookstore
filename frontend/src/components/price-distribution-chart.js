import React, { useMemo } from 'react';
import { useBooks } from '../context/BooksContext';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import styles from '../styles/price-distribution-chart.module.css';

const PriceDistributionChart = () => {
    const { allBooks, fetchFullStatistics } = useBooks();
    
    React.useEffect(() => {
        fetchFullStatistics();
    }, [fetchFullStatistics]);

    const chartData = useMemo(() => {
        if (!allBooks || allBooks.length === 0) {
            return [];
        }

        // 1. Get valid prices
        const prices = allBooks
            .map(book => typeof book.price === 'string' ? parseFloat(book.price) : book.price)
            .filter(price => !isNaN(price) && price > 0);

        if (prices.length === 0) {
             return [];
        }

        // 2. Determine range and bins
        const maxPrice = Math.max(...prices);
        const binSize = 5;
        
        // Ensure at least one bin even if maxPrice is small
        const numberOfBins = Math.max(1, Math.ceil(maxPrice / binSize));

        // 3. Initialize all potential bins and count books in each bin
        const bins = Array(numberOfBins).fill(0).map((_, i) => {
            const lowerBound = i * binSize;
            const upperBound = (i + 1) * binSize - 0.01;
            
            return {
                priceRange: `$${lowerBound.toFixed(2)} - $${upperBound.toFixed(2)}`,
                count: 0
            };
        });

        // 4. Fill bins with counts
        prices.forEach(price => {
            let binIndex = Math.floor(price / binSize);
            binIndex = Math.min(binIndex, numberOfBins - 1);
            binIndex = Math.max(0, binIndex);
            
            bins[binIndex].count++;
        });

        // 5. Filter out bins with zero counts
        return bins.filter(bin => bin.count > 0);
    }, [allBooks]);
    
    if (!chartData || chartData.length === 0) {
        return <div className={styles.noData}>No price distribution data available</div>;
    }

    return (
        <div className={styles.chartContainer}>
            <h2>Book Price Distribution</h2>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="priceRange" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Number of Books" fill="#FF9F40" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PriceDistributionChart;