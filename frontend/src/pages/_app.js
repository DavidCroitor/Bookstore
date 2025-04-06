import '../styles/globals.css';
import Sidebar from '../components/sidebar';
import { BooksProvider } from '../context/book-context';
import ConnectionStatus from '@/components/connection-status';

function MyApp({ Component, pageProps }) {
    return (
        <div className="appContainer">
            <Sidebar />
            <BooksProvider className="content">
                <ConnectionStatus/>
                <Component {...pageProps} />
            </BooksProvider>
        </div>
    );
}

export default MyApp;
