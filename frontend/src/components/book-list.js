import styles from '../styles/book-list.module.css';
import {useBooks} from '../context/book-context' 


export default function BookList({itemsToDisplay = [], onBookClick }) {
    const { books, mostExpensiveBook, leastExpensiveBook, closestToAverageBook, averagePrice } = useBooks(); // Get the values from the context

    const hasBooksToShow = itemsToDisplay && itemsToDisplay.length > 0;

    return (
        <div className={styles.booksContainer}>
            {hasBooksToShow ? (
                itemsToDisplay.map((book) => {
                    // Highlight logic remains the same, using context values
                    const isMostExpensive = mostExpensiveBook && book.id === mostExpensiveBook.id;
                    const isLeastExpensive = leastExpensiveBook && book.id === leastExpensiveBook.id;
                    const isClosestToAverage = closestToAverageBook && book.id === closestToAverageBook.id;

                    let cardStyle = styles.bookCard;
                    if (isMostExpensive) cardStyle += ` ${styles.mostExpensive}`;
                    else if (isLeastExpensive) cardStyle += ` ${styles.leastExpensive}`;
                    else if (isClosestToAverage) cardStyle += ` ${styles.closestToAverage}`;

                    return (
                        <div
                            className={cardStyle}
                            key={book.id}
                            onClick={() => onBookClick(book.id)}
                        >
                            <h3>{book.title}</h3>
                            <p>{book.author}</p>
                            <p>{book.genre}</p>
                            <p>{book.price}$</p>
                        </div>
                    );
                })
            ) : (
                // Display message if no books were passed for the current page/filters
                <p>No books to display on this page.</p>
            )}
        </div>
    );
}
