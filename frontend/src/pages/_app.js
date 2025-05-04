import '../styles/globals.css';
import { BooksProvider } from '../context/BooksContext';
import { FilterProvider } from '../context/filter-context';
import Layout from './layout'; // Make sure this path is correct
import AdvancedFilterPanel from '../components/advanced-filter-panel';

function MyApp({ Component, pageProps }) {
  return (
    <BooksProvider>
      <FilterProvider>
        <Layout>
          <Component {...pageProps} />
          <AdvancedFilterPanel />
        </Layout>
      </FilterProvider>
    </BooksProvider>
  );
}

export default MyApp;
