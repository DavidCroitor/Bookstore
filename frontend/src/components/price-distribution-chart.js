import React, { useMemo } from 'react';
import { useBooks } from '../context/book-context';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register the necessary components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PriceDistributionChart = () => {
    const { books } = useBooks();

    const chartData = useMemo(() => {
        if (!books || books.length === 0) {
            return { labels: [], datasets: [] };
        }

        // 1. Get valid prices
        const prices = books.map(book => book.price).filter(price => typeof price === 'number');
        if (prices.length === 0) {
             return { labels: [], datasets: [] };
        }

        // 2. Determine range and bins
        const maxPrice = Math.max(...prices);
        // const minPrice = Math.min(...prices); // minPrice not strictly needed for this binning approach
        const binSize = 5; // Define the price range for each bar (e.g., $5)
        // Ensure at least one bin even if maxPrice is small
        const numberOfBins = Math.max(1, Math.ceil(maxPrice / binSize));

        // 3. Initialize all potential bins and labels
        const allBins = {};
        const allLabels = [];
        for (let i = 0; i < numberOfBins; i++) {
            const lowerBound = i * binSize;
            const upperBound = (i + 1) * binSize - 0.01; // Make upper bound slightly less
            const binLabel = `$${lowerBound.toFixed(2)} - $${upperBound.toFixed(2)}`;
            allLabels.push(binLabel);
            allBins[binLabel] = 0; // Initialize count to 0
        }

        // 4. Fill bins with counts
        prices.forEach(price => {
            // Determine the correct bin index for the price
            let binIndex = Math.floor(price / binSize);
            // Handle edge case: price exactly on upper boundary or slightly over max due to calculation
            binIndex = Math.min(binIndex, numberOfBins - 1);
             // Ensure index is not negative (e.g., if price was 0)
            binIndex = Math.max(0, binIndex);

            const binLabel = allLabels[binIndex]; // Get label from pre-generated labels
            if (allBins[binLabel] !== undefined) { // Check if the label exists (should always)
                allBins[binLabel]++;
            } else {
                // This case should ideally not happen with the current logic,
                // but good for debugging if issues arise.
                console.warn(`Could not find bin label for price: ${price}, calculated index: ${binIndex}`);
            }
        });

        // 5. Filter out bins with zero counts
        const filteredLabels = [];
        const filteredData = [];
        allLabels.forEach(label => {
            if (allBins[label] > 0) { // Only include if count is greater than 0
                filteredLabels.push(label);
                filteredData.push(allBins[label]);
            }
        });

        // 6. Return chart data with filtered labels and data
        return {
            labels: filteredLabels, // Use the filtered labels
            datasets: [
                {
                    label: '# of Books',
                    data: filteredData, // Use the filtered data
                    backgroundColor: 'rgba(255, 159, 64, 0.6)', // Example color orange
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1,
                },
            ],
        };
    }, [books]);

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Book Price Distribution',
                color: '#000',
            },
        },
         scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of Books',
                    color: '#000',
                },
                ticks: {
                    color: '#000',
                }
            },
            x: {
                 title: {
                    display: true,
                    text: 'Price Range ($)',
                    color: '#000',
                },
                ticks: {
                    color: '#000',
                }
            }
        },
    };

    return (
        <div style={{ maxWidth: '1400px', margin: 'auto' }}>
             {books && books.length > 0 ? (
                 <Bar options={options} data={chartData} />
             ) : (
                 <p>No book data available to display price distribution.</p>
             )}
        </div>
    );
};

export default PriceDistributionChart;