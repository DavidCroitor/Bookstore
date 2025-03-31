import React, { useMemo } from 'react';
import { useBooks } from '../context/book-context';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale, // x-axis
    LinearScale,   // y-axis
    BarElement,    // The bars themselves
    Title,
    Tooltip,
    Legend,
    Ticks
} from 'chart.js';

// Register the necessary components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);


const AveragePricePerGenreChart = () => {
    const { books } = useBooks();

    const chartData = useMemo(() => {
        if (!books || books.length === 0) {
            return { labels: [], datasets: [] };
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

        const labels = Object.keys(genrePrices);
        // Calculate average price, handle potential division by zero
        const data = labels.map(genre =>
            genrePrices[genre].count > 0 ? (genrePrices[genre].total / genrePrices[genre].count).toFixed(2) : 0
        );

        return {
            labels,
            datasets: [
                {
                    label: 'Average Price ($)',
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)', // Example color blue
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                },
            ],
        };
    }, [books]);

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false, // Often hide legend for single dataset bar charts
                color: '#000'
            },
            title: {
                display: true,
                text: 'Average Book Price per Genre',
                color: '#000'
            },
        },
        scales: { // Configure axes
            y: {
                beginAtZero: true, // Start y-axis at 0
                title: {
                    display: true,
                    text: 'Average Price ($)',
                    color: '#000'
                },
                ticks: {
                    color: '#000',
                }
            },
            x: {
                title: {
                   display: true,
                   text: "Genre",
                   color: '#000',
               },
               ticks: {
                   display: false,
               }
           }
        }
        
    };

    return (
        <div style={{ maxWidth: '600px', margin: 'auto' }}>
             {books && books.length > 0 ? (
                <Bar options={options} data={chartData} />
             ) : (
                <p>No book data available to display average prices.</p>
             )}
        </div>
    );
};

export default AveragePricePerGenreChart;