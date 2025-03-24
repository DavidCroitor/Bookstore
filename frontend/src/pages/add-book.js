import { useRouter } from 'next/router';
import BookForm from '../components/book-form';
import { useBooks } from '@/context/book-context';

export default function AddBookPage() {

    const {addBook} = useBooks();
    const router = useRouter();


    const handleAddBook = (newBook) => {
        addBook(newBook)
        router.push('/')
    }

    return (

            <div style={{
                width:"100%",
                justifyItems:"center",
            }}>
                <h1>Add new book</h1>
                <BookForm  onAddBook={handleAddBook} />

            </div>
  
        
    );
}
