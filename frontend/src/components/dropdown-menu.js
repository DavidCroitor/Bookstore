'use client'
import { useState } from 'react';
import { useBooks } from '@/context/book-context';

export default function Dropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const { sortBooksByPrice } = useBooks();

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleSort = (order) => {
        sortBooksByPrice(order); 
        setIsOpen(false);
    };
        
    

    return (
        <div className="flex justify-center min-h-screen">
            <div className="relative inline-block text-left">
                {/* Dropdown button */}
                <button
                    type="button"
                    onClick={toggleDropdown}
                >
                    Sort by
                </button>

                {/* Dropdown menu */}
                {isOpen && (
                    <div>
                        <div>
                            <button
                                type="button"
                                onClick={()=>handleSort('asc')}>
                                Price ascending
                            </button>
                            <button
                                type="button"
                                onClick={()=>handleSort('')}>
                                Price descending
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}