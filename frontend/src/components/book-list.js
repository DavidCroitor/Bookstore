import styles from '../styles/book-list.module.css';

export default function BookList({ books = [], onBookClick }) {
    return (
        <div className={styles.booksContainer}>
            {books.length > 0 ? (
                books.map((book) => (
                    <div 
                    className={styles.bookCard}
                    key={book.id}
                    onClick={()=>onBookClick(book.id)}
                    >
                        <h3>{book.title}</h3>
                        <p>{book.author}</p>
                        <p>{book.genre}</p>
                        <p>{book.price}$</p>
                    </div>
                ))
            ) : (
                <p>No books available</p> 
            )}
        </div>
    );
}
