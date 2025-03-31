import React, { useMemo } from 'react';
import { useBooks } from '../context/book-context'; // Adjust path
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);


const GenreDistributionChart = () => {
    const { books } = useBooks();

    const chartData = useMemo(() => {
        if (!books || books.length === 0) {
            return { labels: [], datasets: [] };
        }

        const genreCounts = books.reduce((acc, book) => {
            const genre = book.genre || 'Unknown'; // Handle undefined genre
            acc[genre] = (acc[genre] || 0) + 1;
            return acc;
        }, {});

        const labels = Object.keys(genreCounts);
        const data = Object.values(genreCounts);

        return {
            labels,
            datasets: [
                {
                    label: '# of Books',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)', // Example color
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                },
            ],
        };
    }, [books]); // Re-calculate only when books array changes

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Books per Genre',
                color: '#000',
            },
        },
         scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Books',
                    color: '#000',
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
        },
    };

    return (
        <div>
            {books.length > 0 ? <Bar options={options} data={chartData} /> : <p>No book data available.</p>}
        </div>
    );
};

export default GenreDistributionChart;