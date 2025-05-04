'use client'
import { useState, useEffect, useCallback } from 'react';
import { useBooks } from '@/context/BooksContext';
import style from '@/styles/sort-controls.module.css';


export default function SortControls() {
    const [isSortOpen, setIsSortOpen] = useState(false);
    const { sortBooks, currentSortBy, currentOrder } = useBooks(); 

    const getSortDescription = () => {
        const sortOptions = {
            'title': { asc: 'Title (A-Z)', desc: 'Title (Z-A)' },
            'price': { asc: 'Price: Low to High', desc: 'Price: High to Low' },
            'rating': { asc: 'Rating: Low to High', desc: 'Rating: High to Low' },
            'publicationYear': { asc: 'Publication: Oldest First', desc: 'Publication: Newest First' },
            'author.name': { asc: 'Author (A-Z)', desc: 'Author (Z-A)' },
            'id': { asc: 'Default', desc: 'Default' },
        };

        return sortOptions[currentSortBy]?.[currentOrder] || 'Sort by';
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
        <div className={style.sortControlsContainer}>
            <div className={style.dropdown}>
                <button
                    type="button"
                    onClick={toggleSortDropdown}
                    className={style.dropdownButton}
                >
                    {getSortDescription()} ▼
                </button>

                {isSortOpen && (
                    <div className={style.dropdownMenu}>
                        <div>
                            <h4 className={style.menuCategory}>Default</h4>
                            <button
                                type="button"
                                onClick={() => handleSort('id', 'asc')}
                                className={`${style.menuItem} ${currentSortBy === 'id' && currentOrder === 'asc' ? style.active : ''}`}>
                                Default Order
                            </button>
                            
                            <h4 className={style.menuCategory}>Title</h4>
                            <button
                                type="button"
                                onClick={() => handleSort('title', 'asc')}
                                className={`${style.menuItem} ${currentSortBy === 'title' && currentOrder === 'asc' ? style.active : ''}`}>
                                Title (A-Z)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSort('title', 'desc')}
                                className={`${style.menuItem} ${currentSortBy === 'title' && currentOrder === 'desc' ? style.active : ''}`}>
                                Title (Z-A)
                            </button>
                            
                            <h4 className={style.menuCategory}>Price</h4>
                            <button
                                type="button"
                                onClick={() => handleSort('price', 'asc')}
                                className={`${style.menuItem} ${currentSortBy === 'price' && currentOrder === 'asc' ? style.active : ''}`}>
                                Price: Low to High
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSort('price', 'desc')}
                                className={`${style.menuItem} ${currentSortBy === 'price' && currentOrder === 'desc' ? style.active : ''}`}>
                                Price: High to Low
                            </button>
                            
                            <h4 className={style.menuCategory}>Rating</h4>
                            <button
                                type="button"
                                onClick={() => handleSort('rating', 'asc')}
                                className={`${style.menuItem} ${currentSortBy === 'rating' && currentOrder === 'asc' ? style.active : ''}`}>
                                Rating: Low to High
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSort('rating', 'desc')}
                                className={`${style.menuItem} ${currentSortBy === 'rating' && currentOrder === 'desc' ? style.active : ''}`}>
                                Rating: High to Low
                            </button>
                            
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}