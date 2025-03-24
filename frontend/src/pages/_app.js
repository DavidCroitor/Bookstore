import '../styles/globals.css';
import Sidebar from '../components/sidebar';
import { BooksProvider } from '../context/book-context';

function MyApp({ Component, pageProps }) {
    return (
        <div className="appContainer">
                <Sidebar />
            <BooksProvider className="content">
                <Component {...pageProps} />
            </BooksProvider>
        </div>
    );
}

export default MyApp;
