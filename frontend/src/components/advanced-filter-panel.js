import { useState, useEffect } from 'react';
import { useFilter } from '../context/filter-context';
import { useBooks } from '../context/BooksContext';
import styles from '../styles/advanced-filter-panel.module.css';

export default function AdvancedFilterPanel() {
  // Move hooks to the top level of the component
  const filterContext = useFilter();
  const booksContext = useBooks();
  
  const { 
    isFilterPanelOpen, 
    closeFilterPanel, 
    filters, 
    applyFilters,
    searchTerm
  } = filterContext;
  
  const { 
    allBooks, 
    filterBooks 
  } = booksContext;
  
  const [localFilters, setLocalFilters] = useState({
    minPrice: '',
    maxPrice: '',
    author: '',
    genre: '',
    minRating: '',
    yearFrom: '',
    yearTo: '',
  });

  // Initialize local filters from context filters
  useEffect(() => {
    setLocalFilters({
      minPrice: filters.minPrice || '',
      maxPrice: filters.maxPrice || '',
      author: filters.author || '',
      genre: filters.genre || '',
      minRating: filters.minRating || '',
      yearFrom: filters.yearFrom || '',
      yearTo: filters.yearTo || '',
    });
  }, [filters]);
  
  // Extract unique values for dropdowns from books data
  const authors = [...new Set((allBooks || []).map(book => book.author?.name).filter(Boolean))];
  const genres = [...new Set((allBooks || []).map(book => book.genre?.name).filter(Boolean))];
  const years = [...new Set((allBooks || []).map(book => book.publicationYear).filter(Boolean))].sort();
  
  const handleInputChange = (field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    const cleanedFilters = Object.fromEntries(
      Object.entries(localFilters).filter(([_, value]) => value !== '')
    );

    console.log('Applying filters:', cleanedFilters);

    const currentSearchTerm = typeof searchTerm === 'string' ? searchTerm : '';
    console.log('Search term:', currentSearchTerm);

    applyFilters(cleanedFilters);
    
    filterBooks({...cleanedFilters,
      searchTerm
    });
    closeFilterPanel();
  };

  const handleReset = () => {
    setLocalFilters({
      minPrice: '',
      maxPrice: '',
      author: '',
      genre: '',
      minRating: '',
      yearFrom: '',
      yearTo: ''
    });
    applyFilters({});
    filterBooks({});
  };
  
  // If the panel is closed, don't render anything
  if (!isFilterPanelOpen) return null;

  return (
    <div className={styles.filterPanelOverlay} onClick={closeFilterPanel}>
      <div className={styles.filterPanel} onClick={(e) => e.stopPropagation()}>
        <header className={styles.filterHeader}>
          <h2>Advanced Filters</h2>
          <button className={styles.closeButton} onClick={closeFilterPanel}>×</button>
        </header>
        
        <div className={styles.filterScrollArea}>
          <div className={styles.filterGroup}>
            <h3>Price Range</h3>
            <div className={styles.rangeInputs}>
              <input
                type="number"
                placeholder="Min Price"
                value={localFilters.minPrice}
                onChange={(e) => handleInputChange('minPrice', e.target.value)}
                className={styles.numberInput}
              />
              <input
                type="number"
                placeholder="Max Price"
                value={localFilters.maxPrice}
                onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                className={styles.numberInput}
              />
            </div>
          </div>
          
          <div className={styles.filterGroup}>
            <h3>Author</h3>
            <select
              value={localFilters.author}
              onChange={(e) => handleInputChange('author', e.target.value)}
              className={styles.selectInput}
            >
              <option value="">All Authors</option>
              {authors.map(author => (
                <option key={author} value={author}>{author}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <h3>Genre</h3>
            <select
              value={localFilters.genre}
              onChange={(e) => handleInputChange('genre', e.target.value)}
              className={styles.selectInput}
            >
              <option value="">All Genres</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <h3>Rating</h3>
            <select
              value={localFilters.minRating}
              onChange={(e) => handleInputChange('minRating', e.target.value)}
              className={styles.selectInput}
            >
              <option value="">Any Rating</option>
              <option value="1">★ or higher</option>
              <option value="2">★★ or higher</option>
              <option value="3">★★★ or higher</option>
              <option value="4">★★★★ or higher</option>
              <option value="5">★★★★★ only</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <h3>Publication Year</h3>
            <div className={styles.rangeInputs}>
              <select
                value={localFilters.yearFrom}
                onChange={(e) => handleInputChange('yearFrom', e.target.value)}
                className={styles.selectInput}
              >
                <option value="">From</option>
                {years.map(year => (
                  <option key={`from-${year}`} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={localFilters.yearTo}
                onChange={(e) => handleInputChange('yearTo', e.target.value)}
                className={styles.selectInput}
              >
                <option value="">To</option>
                {years.map(year => (
                  <option key={`to-${year}`} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className={styles.filterActions}>
          <button 
            className={styles.resetButton} 
            onClick={handleReset}
          >
            Reset All
          </button>
          <button 
            className={styles.applyButton} 
            onClick={handleApply}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}