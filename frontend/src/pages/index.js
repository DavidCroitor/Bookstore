import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import BookList from '../components/book-list';
import styles from '../styles/home.module.css';
import Image from 'next/image';
import BellIcon from '../../assets/bell.png';
import ProfileIcon from '../../assets/profile.png';
import { useBooks } from '@/context/book-context';
import FilterSortControls from '@/components/filter-sort-controls';

const ITEMS_PER_PAGE = 7;

export default function Home() {
    const { books } = useBooks();
    const router = useRouter();
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = ITEMS_PER_PAGE;

    // --- Pagination Calculations (Memoized) ---
    const { currentItemsToDisplay, totalPages } = useMemo(() => {
        if (!books || books.length === 0) {
            return { currentItemsToDisplay: [], totalPages: 0 };
        }

        const totalItems = books.length;
        const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);

        // Ensure currentPage doesn't exceed totalPages if books array shrinks
        const validCurrentPage = Math.min(currentPage, calculatedTotalPages) || 1;

        const indexOfLastItem = validCurrentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;

        const calculatedCurrentItems = books.slice(indexOfFirstItem, indexOfLastItem);

        return { currentItemsToDisplay: calculatedCurrentItems, totalPages: calculatedTotalPages };

    }, [books, currentPage, itemsPerPage]); // Recalculate when these change

    // --- Effect to adjust currentPage if totalPages changes ---
     useEffect(() => {
        // If current page is greater than the new total pages, go to the last page
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
         // If there are no pages (empty list) but we are not on page 1, reset to 1
         else if (totalPages === 0 && currentPage !== 1) {
             setCurrentPage(1);
         }
    }, [totalPages, currentPage]);


    // --- Event Handlers ---
    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleAddButton = () => {
        router.push("/add-book"); 
    };

    const handleEditBook = (id) => {
        router.push(`/edit-book/${id}`);
    }

    return (

            <div className={styles.mainContent} >
                <header className={styles.header}>
                    <input className={styles.searchBar} type="text" placeholder="Search..."/> 
                    <div className={styles.account}>
                        <Image
                            src={BellIcon}
                            width={50}
                            height={50}
                            alt="BellIcon"
                        />
                        Account
                        <Image
                            src={ProfileIcon}
                            width={50}
                            height={50}
                            alt="ProfileIcon"
                        />
                    </div>
                </header>
                
                <FilterSortControls/>

                <BookList itemsToDisplay={currentItemsToDisplay} onBookClick={handleEditBook}/>

                <button onClick={handleAddButton}>
                    Add book
                </button>
                {/* Pagination Controls - Rendered here in Home */}
            {totalPages > 1 && (
                // Use styles imported from book-list.module.css for pagination
                <div style = {{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    position: 'absolute',
                    bottom: '10%',
                    left: '50%'
                }}>
                    <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                    >
                        « Previous
                    </button>

                    <span >
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        
                    >
                        Next »
                    </button>
                </div>
            )}


            </div>
  
        
    );
}
