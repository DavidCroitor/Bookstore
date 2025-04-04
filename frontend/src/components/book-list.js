import styles from '../styles/book-list.module.css';
import {useBooks} from '../context/book-context' 
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';

export default function BookList({ onBookClick }) {
    // Get data directly from context
    const {
        books, // Accumulated list
        loadingInitial, // Use this to avoid showing "No books" during initial load
        loadingMore,   // Use this for the "Loading more..." indicator
        error,
        stats,
     } = useBooks();
    const router = useRouter();

    // Determine if list has content (after initial load attempt)
    const hasBooksToShow = !loadingInitial && !error && books && books.length > 0;
    // Show "No books" only if initial load finished, no error, and books is empty
    const showNoBooksMessage = !loadingInitial && !error && (!books || books.length === 0);

    const handleAddButton = () => {
        router.push("/add-book");
    };

    return (
        <>
            <div className={styles.booksContainer}>
                {/* Map over the full 'books' array */}
                {books.map((book) => {
                    const isMostExpensive = stats.mostExpensiveBook && book.id === stats.mostExpensiveBook?.id;
                    const isLeastExpensive = stats.leastExpensiveBook && book.id === stats.leastExpensiveBook?.id;
                    const isClosestToAverage = stats.closestToAverageBook && book.id === stats.closestToAverageBook?.id;

                    let cardStyle = styles.bookCard;
                    if (isMostExpensive) cardStyle += ` ${styles.mostExpensive}`;
                    else if (isLeastExpensive) cardStyle += ` ${styles.leastExpensive}`;
                    else if (isClosestToAverage) cardStyle += ` ${styles.closestToAverage}`;

                    return (
                        <div className={cardStyle} key={book.id} onClick={() => onBookClick(book.id)}>
                            <h3>{book.title}</h3>
                            <p>{book.author}</p>
                            <p>{book.genre}</p>
                            <p>{book.price}$</p>
                            {book.rating !== undefined && <p>Rating: {book.rating}/5</p>}
                        </div>
                    );
                })}

                {/* Show "No books found" message */}
                {showNoBooksMessage && <p className={styles.noBooksMessage}>No books found.</p>}

                 {/* Show "Loading more..." indicator at the end */}
                 {loadingMore && <div className={styles.loadingMore}>Loading more...</div>}

            </div> {/* End booksContainer */}

            {/* Add Button Container */}
            {/* Render Add button unless initial load is happening or there's an error blocking display */}
            {!loadingInitial && !error && (
                 <div className={styles.buttonContainer}>
                    <button onClick={handleAddButton} className={styles.addButton}>
                        Add book
                    </button>
                </div>
            )}
        </>
    );
}

BookList.propTypes = {
    onBookClick: PropTypes.func.isRequired,
};