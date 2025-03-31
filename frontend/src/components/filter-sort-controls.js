'use client'
import { useState, useEffect, useCallback } from 'react';
import { useBooks } from '@/context/book-context';

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 300;

export default function FilterSortControls() {
    const [isSortOpen, setIsSortOpen] = useState(false);

    // State for Filter Input
    const [filterTerm, setFilterTerm] = useState('');

    // Get functions from context
    const { sortBooksByPrice, filterBooks, fetchBooks } = useBooks(); // Added fetchBooks for clearing filter

    // Handler for the filter input change
    const handleFilterChange = (e) => {
        const newTerm = e.target.value;
        setFilterTerm(newTerm); // Update the local state for the input field
        console.log("Filtering immediately for:", newTerm); // Log for debugging
        filterBooks(newTerm);   // Call the context function IMMEDIATELY with the new value
    };

    // Optional: Function to clear the filter explicitly
    const clearFilter = () => {
        setFilterTerm('');
        // We could call fetchBooks() directly here, but the useEffect
        // will trigger filterBooks('') anyway when filterTerm changes.
    };

    // --- Sort Logic ---
    const toggleSortDropdown = () => {
        setIsSortOpen(!isSortOpen);
    };

    const handleSort = (order) => {
        sortBooksByPrice(order); // Call context function
        setIsSortOpen(false); // Close dropdown after selection
    };
        
    

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 bg-gray-100 rounded-md shadow">

        {/* Filter Input Section */}
        <div className="relative flex-grow w-full sm:w-auto">
            <label htmlFor="filterInput" className="sr-only">Filter books</label> {/* Screen reader label */}
            <input
                id="filterInput"
                type="text"
                value={filterTerm}
                onChange={handleFilterChange}
                placeholder="Filter by title or author..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {/* Optional: Clear button for filter */}
            {filterTerm && (
                 <button
                    onClick={clearFilter}
                >
                   {/* Simple 'X' icon or use an SVG */}
                   ✕
                </button>
            )}
        </div>

        {/* Sort Dropdown Section */}
        <div >
            {/* Dropdown button */}
            <button
                type="button"
                onClick={toggleSortDropdown}
                aria-expanded={isSortOpen}
            >
                Sort by Price
            </button>

            {/* Dropdown menu */}
            {isSortOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button" // Should match button id if it had one
                >
                    <div className="py-1" role="none">
                        <button
                            type="button"
                            onClick={() => handleSort('asc')}
                            role="menuitem"
                        >
                            Price: Low to High
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSort('desc')}
                            role="menuitem"
                        >
                            Price: High to Low
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
    );
}