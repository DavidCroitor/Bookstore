import { useBooks } from '../../context/BooksContext';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import BookEditForm from '../../components/book-edit-form';

export default function EditBookPage() {
    const { books, updateBook, deleteBook, isOnline, isServerReachable } = useBooks();
    const router = useRouter();
    const { id } = router.query;
    const [book, setBook] = useState(null);
    const [isClient, setIsClient] = useState(false);
    const [offlineMessage, setOfflineMessage] = useState('');

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        if (!isOnline) {
            setOfflineMessage('You are offline. Changes will sync when connection is restored.');
        } else if (!isServerReachable) {
            setOfflineMessage('Server is unreachable. Working in offline mode.');
        } else {
            setOfflineMessage('');
        }
    }, [isOnline, isServerReachable, isClient]);

    useEffect(() => {
        if (id && books.length > 0) {
            // Find book by ID, handling both numeric IDs and string IDs (for local books)
            const selectedBook = books.find((b) => {
                if (typeof b.id === 'string' && typeof id === 'string') {
                    return b.id === id;
                }
                return b.id === Number(id);
            });
            
            setBook(selectedBook);
        }
    }, [id, books]);

    const handleEditBook = async (updatedBook) => {
        try {
            await updateBook(updatedBook);
            
            if (!isOnline || !isServerReachable) {
                // Show feedback and navigate after a short delay
                setOfflineMessage('Changes saved locally and will sync when connection is restored.');
                setTimeout(() => {
                    router.push('/');
                }, 1500);
            } else {
                router.push('/'); // Redirect immediately when online
            }
        } catch (error) {
            console.error('Error updating book:', error);
            alert(`Failed to update book: ${error.message}`);
        }
    };

    const handleDeleteButton = async () => {
        try {
            await deleteBook(book.id);
            
            if (!isOnline || !isServerReachable) {
                // Show feedback and navigate after a short delay
                setOfflineMessage('Delete operation saved locally and will sync when connection is restored.');
                setTimeout(() => {
                    router.push('/');
                }, 1500);
            } else {
                router.push('/'); // Redirect immediately when online
            }
        } catch (error) {
            console.error('Error deleting book:', error);
            alert(`Failed to delete book: ${error.message}`);
        }
    };

    if (!book && id) {
        return <p>Loading book details...</p>;
    }

    if (!book) {
        return <p>Book not found</p>;
    }

    return (
        <div style={{
            width:"100%",
            justifyItems:"center",
        }}>
            <h1>Edit Book</h1>
            {isClient && offlineMessage && (
                <div style={{
                    backgroundColor: '#ffb74d',
                    color: '#000',
                    padding: '10px',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    fontWeight: '500',
                }}>
                    {offlineMessage}
                </div>
            )}
            <BookEditForm 
                book={book} 
                onEditBook={handleEditBook} 
                onCancel={() => router.push('/')}
                onDelete={handleDeleteButton}
                submitButtonLabel={(isOnline && isServerReachable) ? 'Update Book' : 'Save Changes for Later'}
                deleteButtonLabel={(isOnline && isServerReachable) ? 'Delete Book' : 'Queue Delete for Later'}
            />
        </div>
    );
}
