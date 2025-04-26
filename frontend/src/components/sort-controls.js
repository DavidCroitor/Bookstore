'use client'
import { useState, useEffect, useCallback } from 'react';
import { useBooks } from '@/context/BooksContext';
import style from '@/styles/sort-controls.module.css';

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 300;

export default function SortControls() {
    const [isSortOpen, setIsSortOpen] = useState(false);

    // State for Filter Input
    const [filterTerm, setFilterTerm] = useState('');

    // Get functions from context
    const { sortBooks, filterBooks } = useBooks(); // Added fetchBooks for clearing filter

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

    const handleSort = (sortBy, order) => {
        sortBooks(sortBy, order); // Call context function
        setIsSortOpen(false); // Close dropdown after selection
    };
        
    

    return (
        <div >
            {/* Sort Dropdown Section */}
            <div >
                {/* Dropdown button */}
                <button
                    type="button"
                    onClick={toggleSortDropdown}
                    className={style.dropdownButton}
                >
                    Sort by
                </button>

                {/* Dropdown menu */}
                {isSortOpen && (
                    <div
                        role="menu"
                        className={style.dropdownMenu}
                        >
                        <div>
                            <button
                                type="button"
                                onClick={() => handleSort('id', 'asc')}
                                className={style.menuItem}>
                                Default
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSort('price', 'asc')}
                                className={style.menuItem}>
                                Price: Low to High
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSort('price', 'desc')}
                                className={style.menuItem}>
                                Price: High to Low
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSort('rating', 'asc')}
                                className={style.menuItem}>
                                Rating: Low to High
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSort('rating', 'desc')}
                                className={style.menuItem}>
                                Rating: High to Low
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}