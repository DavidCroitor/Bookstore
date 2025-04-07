import { useState, useEffect, useRef, useCallback } from 'react'; 
import { useRouter } from 'next/router';
import BookList from '../components/book-list';
import styles from '../styles/home.module.css';
import Image from 'next/image';
import BellIcon from '../../assets/bell.png';
import ProfileIcon from '../../assets/profile.png';
import { useBooks } from '@/context/book-context';
import SortControls from '@/components/sort-controls';

const SEARCH_DEBOUNCE_DELAY = 300;
const SCROLL_THRESHOLD = 350; // Pixels from bottom to trigger fetch

export default function Home() {
    // Get data and functions from context for endless scroll
    const {
        loadingInitial, // Use this for main loading indicator
        loadingMore,    // Use this for loading more books indicator
        error,
        fetchNextPage, // Function to load more
        hasMorePages,  // To know when to stop fetching
        filterBooks,
        currentFilter
     } = useBooks();
    const router = useRouter();


    const scrollContainerRef = useRef(null);

    // State for search input
    const [searchTerm, setSearchTerm] = useState(currentFilter || '');
    // Ref for debounce timer (optional)
    // const debounceTimeoutRef = useRef(null);

     // Effect to sync search term (optional)
     useEffect(() => {
        setSearchTerm(currentFilter || '');
    }, [currentFilter]);

    // Remove client-side pagination state (currentPage, useMemo, effect, handlers)

    

    // --- Scroll Event Listener ---
    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return; // Exit if ref not set yet
    
        if (!hasMorePages || loadingInitial || loadingMore) return;
    
        const { scrollTop, scrollHeight, clientHeight } = container; // Use container properties
    
        
        if (scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD) {
            fetchNextPage();
        }
    }, [hasMorePages, loadingInitial, loadingMore, fetchNextPage]); // Dependencies for the handler

    useEffect(() => {
        const container = scrollContainerRef.current; // Get the DOM element


        if (container) { // Make sure it exists before adding listener
            container.addEventListener('scroll', handleScroll);

            // Return cleanup function
            return () => {
                const currentContainer = scrollContainerRef.current; // Re-read ref here maybe? Or rely on closure? Closure should be fine.
                if (container) { 
                   container.removeEventListener('scroll', handleScroll);
                }
            };
        } 
    }, [handleScroll]); // Dependency is handleScroll

    // --- Other Handlers ---
    const handleEditBook = (id) => {
        router.push(`/edit-book/${id}`);
    }

    const handleSearchChange = (e) => {
        const newTerm = e.target.value;
        setSearchTerm(newTerm);
        // Apply filter immediately (resets to page 1 in context)
        filterBooks(newTerm);
        // Or use debounce
    }

    return (
        // Optional: Add ref to mainContent if scrolling is container-based
        <div className={styles.mainContent} ref={scrollContainerRef}>
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

            

        </div>
    );
}