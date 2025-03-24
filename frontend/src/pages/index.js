import { useRouter } from 'next/router';
import BookList from '../components/book-list';
import styles from '../styles/home.module.css';
import Image from 'next/image';
import BellIcon from '../../assets/bell.png';
import ProfileIcon from '../../assets/profile.png';
import { useBooks } from '@/context/book-context';
import DropdownSortMenu from '@/components/dropdown-menu';

export default function Home() {
    const { books } = useBooks();
    const router = useRouter();
    

    const handleAddButton = () => {
        router.push("/add-book"); 
    };
    

    

    const handleEditBook = (id) => {
        router.push(`/edit-book/${id}`);
    }

    return (

            <div className={styles.mainContent} >
                <header className={styles.header}>
                    <input className={styles.searchBar} type="text" placeholder="Search..."/> 
                    <div className={styles.account}>
                        <Image
                            src={BellIcon}
                            width={50}
                            height={50}
                            alt="BellIcon"
                        />
                        Account
                        <Image
                            src={ProfileIcon}
                            width={50}
                            height={50}
                            alt="ProfileIcon"
                        />
                    </div>
                </header>
                
                <DropdownSortMenu></DropdownSortMenu>

                <BookList books={books} onBookClick={handleEditBook}/>

                <button onClick={handleAddButton}>
                    Add book
                </button>

            </div>
  
        
    );
}
