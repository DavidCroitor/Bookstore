'use client'
import { useState, useEffect, useCallback } from 'react';
import { useBooks } from '@/context/BooksContext';
import style from '@/styles/sort-controls.module.css';

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 300;

export default function SortControls() {
    const [isSortOpen, setIsSortOpen] = useState(false);

    const [filterTerm, setFilterTerm] = useState('');

    const { sortBooks, filterBooks } = useBooks(); 

    const handleFilterChange = (e) => {
        const newTerm = e.target.value;
        setFilterTerm(newTerm); 
        console.log("Filtering immediately for:", newTerm);
        filterBooks(newTerm);   
    };

    const clearFilter = () => {
        setFilterTerm('');
    };

    // --- Sort Logic ---
    const toggleSortDropdown = () => {
        setIsSortOpen(!isSortOpen);
    };

    const handleSort = (sortBy, order) => {
        sortBooks(sortBy, order);
        setIsSortOpen(false);
    };
        
    

    return (
        <div >
            <div >
                <button
                    type="button"
                    onClick={toggleSortDropdown}
                    className={style.dropdownButton}
                >
                    Sort by
                </button>

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