import { useBooks } from '../../context/book-context';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import BookEditForm from '../../components/book-edit-form';

export default function EditBookPage() {
    const { books, updateBook, deleteBook } = useBooks();
    const router = useRouter();
    const { id } = router.query;
    const [book, setBook] = useState(null);

    useEffect(() => {
        if (id) {
            const selectedBook = books.find((b) => b.id === Number(id));
            setBook(selectedBook);
        }
    }, [id, books]);

    const handleEditBook = (updatedBook) => {
        updateBook(updatedBook);
        router.push('/'); // Redirect after updating the book
    };


    const handleDeleteButton = () => {
        deleteBook(book.id);
        router.push('/');
    }

    if (!book) {
        return <p>Loading...</p>;
    }

    return (
        <div style={{
            width:"100%",
            justifyItems:"center",
        }}>
            <h1>Edit Book</h1>
            <BookEditForm 
            book={book} 
            onEditBook={handleEditBook} 
            onCancel={() => router.push('/')}
            onDelete={handleDeleteButton}
            />
        </div>
    );
}
