import { useRouter } from 'next/router';
import BookForm from '../components/book-form';
import { useBooks } from '@/context/BooksContext';
import { useEffect, useState } from 'react';

export default function AddBookPage() {

    const {addBook, isOnline, isServerReachable} = useBooks();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [offlineMessage, setOfflineMessage] = useState('');

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        if(!isOnline){
            setOfflineMessage('You are offline. Changes will sync when connection is restored.');
        }
        else if(!isServerReachable){
            setOfflineMessage('Server is unreachable. Working in offline mode.');
        }
        else {
            setOfflineMessage('');
        }
    }, [isOnline, isServerReachable, isClient]);

    const handleAddBook = async (newBook) => {
        try{
            await addBook(newBook)
            
            if (!isOnline || !isServerReachable) {
                setOfflineMessage('Changes will sync when connection is restored.');
            }
            router.push('/')
        } catch (error) {
            console.error('Error adding book:', error);
            alert(`Failed to add book. ${error.message}`);
        }
    }

    return (

            <div style={{
                width:"100%",
                justifyItems:"center",
            }}>
                <h1>Add new book</h1>
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
                <BookForm
                    onAddBook={handleAddBook}
                    sumbitButtonLabel ={(isOnline && isServerReachable) ? 'Add Book' : 'Save Book for later'}
                />

            </div>
  
        
    );
}
