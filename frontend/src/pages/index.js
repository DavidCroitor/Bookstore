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
    
        console.log(`Scroll Check: loadingInitial=${loadingInitial}, loadingMore=${loadingMore}, hasMorePages=${hasMorePages}`);
        if (!hasMorePages || loadingInitial || loadingMore) return;
    
        const { scrollTop, scrollHeight, clientHeight } = container; // Use container properties
    
        console.log(`Container Scroll Pos: scrollTop=${scrollTop}, clientHeight=${clientHeight}, totalHeight=${scrollHeight}, Threshold Point=${scrollHeight - SCROLL_THRESHOLD}`);
    
        if (scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD) {
            console.log("Near bottom of container, fetching next page...");
            fetchNextPage();
        }
    }, [hasMorePages, loadingInitial, loadingMore, fetchNextPage]); // Dependencies for the handler

    useEffect(() => {
        const container = scrollContainerRef.current; // Get the DOM element

        // *** Check 1: Is 'container' null? ***
        console.log("Effect running. Container Element:", container);

        if (container) { // Make sure it exists before adding listener
            console.log("Attaching scroll listener to:", container);
            container.addEventListener('scroll', handleScroll);

            // Return cleanup function
            return () => {
                // *** Check 2: Is cleanup running correctly? ***
                // Ensure 'container' is still valid in closure
                const currentContainer = scrollContainerRef.current; // Re-read ref here maybe? Or rely on closure? Closure should be fine.
                if (container) { // Use the 'container' variable captured when listener was added
                   console.log("Removing scroll listener from:", container);
                   container.removeEventListener('scroll', handleScroll);
                } else {
                   console.log("Cleanup: Container was null or gone.");
                }
            };
        } else {
            // *** Check 3: Why is 'container' null? ***
            console.log("Effect ran, but container was null. Listener not attached.");
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

            <SortControls/> {/* Resets to page 1 in context */}

            {/* Display Initial Loading / Error State */}
            {loadingInitial && <div className={styles.loading}>Loading books...</div>}
            {error && !loadingInitial && <div className={styles.error}>Error: {error}</div>}

            {/* BookList now uses context internally, pass only click handler */}
            {/* Render BookList even if initially empty, it handles its own empty message */}
             <BookList onBookClick={handleEditBook} />

            {/* Remove PaginationControls component */}
            {/* Loading indicator for subsequent pages handled inside BookList */}

        </div>
    );
}