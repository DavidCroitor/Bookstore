import styles from '../styles/book-list.module.css';
import {useBooks} from '../context/BooksContext'; 
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';

export default function BookList({ onBookClick }) {
    const {
        books, 
        loadingInitial,
        loadingMore,
        error,
        stats,
     } = useBooks();
    const router = useRouter();

    const hasBooksToShow = !loadingInitial && !error && books && books.length > 0;
    const showNoBooksMessage = !loadingInitial && !error && (!books || books.length === 0);

    const handleAddButton = () => {
        router.push("/add-book");
    };

    return (
        <>
            <div className={styles.booksContainer}>
                {books.map((book) => {
                    const bookId = String(book._id || book.id);
                    
                    const mostExpensiveId = stats.mostExpensiveBook ? 
                        String(stats.mostExpensiveBook._id || stats.mostExpensiveBook.id) : null;
                    const leastExpensiveId = stats.leastExpensiveBook ? 
                        String(stats.leastExpensiveBook._id || stats.leastExpensiveBook.id) : null;
                    const closestToAverageId = stats.closestToAverageBook ? 
                        String(stats.closestToAverageBook._id || stats.closestToAverageBook.id) : null;

                    const isMostExpensive = mostExpensiveId && bookId === mostExpensiveId;
                    const isLeastExpensive = leastExpensiveId && bookId === leastExpensiveId;
                    const isClosestToAverage = closestToAverageId && bookId === closestToAverageId;

                    let cardStyle = styles.bookCard;
                    if (isMostExpensive) cardStyle += ` ${styles.mostExpensive}`;
                    else if (isLeastExpensive) cardStyle += ` ${styles.leastExpensive}`;
                    else if (isClosestToAverage) cardStyle += ` ${styles.closestToAverage}`;

                    return (
                        <div className={cardStyle} key={book._id || book.id} onClick={() => onBookClick(book._id || book.id)}>
                            <h3>{book.title}</h3>
                            <p>{book.author?.name}</p>
                            <p>{book.genre?.name}</p>
                            <p>{book.price}$</p>
                            {book.rating !== undefined && <p>Rating: {book.rating}/5</p>}
                        </div>
                    );
                })}

                {showNoBooksMessage && <p className={styles.noBooksMessage}>No books found.</p>}

                {loadingMore && <div className={styles.loadingMore}>Loading more...</div>}

            </div>

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