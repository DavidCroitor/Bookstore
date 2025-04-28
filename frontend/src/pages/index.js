import { useState, useEffect, useRef, useCallback } from 'react'; 
import { useRouter } from 'next/router';
import BookList from '../components/book-list';
import styles from '../styles/home.module.css';
import Image from 'next/image';
import BellIcon from '../../assets/bell.png';
import ProfileIcon from '../../assets/profile.png';
import { useBooks } from '@/context/BooksContext';
import SortControls from '@/components/sort-controls';
import PaginationControls from '@/components/pagination-controls';

export default function Home() {
    // Get data and functions from context for endless scroll
    const {
        books,
        loadingInitial, 
        loadingMore,   
        error,
        filterBooks,
        currentFilter,
        currentPage,
        totalPages,
        currentSortBy,
        currentOrder,
        fetchBooks
     } = useBooks();
    const router = useRouter();

    // State for search input
    const [searchTerm, setSearchTerm] = useState(currentFilter || '');

     // Effect to sync search term
     useEffect(() => {
        setSearchTerm(currentFilter || '');
    }, [currentFilter]);
    
    // Page navigation handlers
    const handlePreviousPage = useCallback(() => {
        if (currentPage > 1) {
            console.log("Fetching previous page:", currentPage - 1);
            fetchBooks(currentPage - 1, currentSortBy, currentOrder, currentFilter);
        }
    }, [currentPage, totalPages, currentSortBy, currentOrder, currentFilter, fetchBooks]);

    const handleNextPage = useCallback(() => {
        if (currentPage < totalPages) {
            console.log("Fetching next page:", currentPage + 1);
            fetchBooks(currentPage + 1, currentSortBy, currentOrder, currentFilter);
        }
    }, [currentPage, totalPages, currentSortBy, currentOrder, currentFilter, fetchBooks]);


    // --- Other Handlers ---
    const handleEditBook = (id) => {
        router.push(`/edit-book/${id}`);
    }

    const handleSearchChange = (e) => {
        const newTerm = e.target.value;
        setSearchTerm(newTerm);
        filterBooks(newTerm);
    }


    return (
        <div className={styles.mainContent}>
            <header className={styles.header}>
                <input
                    className={styles.searchBar}
                    type="search"
                    placeholder="Search by title or author..."
                    value={searchTerm}
                    onChange={handleSearchChange} />
                 <div className={styles.account}>
                    <Image src={BellIcon} width={50} height={50} alt="Notifications"/>
                    Account
                    <Image src={ProfileIcon} width={50} height={50} alt="Profile"/>
                </div>
            </header>

            <SortControls/>
            
            {loadingInitial && <div className={styles.loading}>Loading books...</div>}
            {error && !loadingInitial && <div className={styles.error}>Error: {error}</div>}

            <BookList onBookClick={handleEditBook} />

            {!loadingInitial &&  totalPages > 1 && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPreviousPage={handlePreviousPage}
                    onNextPage={handleNextPage} />
            )}
            

        </div>
    );
}