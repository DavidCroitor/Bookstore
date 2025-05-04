import { createContext, useContext, useState } from 'react';

const FilterContext = createContext({
  isFilterPanelOpen: false,
  toggleFilterPanel: () => {},
  closeFilterPanel: () => {},
  openFilterPanel: () => {},
  filters: {},
  setFilters: () => {},
  searchTerm: '',
  setSearchTerm: () => {},
  applyFilters: () => {},
  appliedFilters: {}
});

export function FilterProvider({ children }) {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const toggleFilterPanel = () => {
    setIsFilterPanelOpen(prev => !prev);
  };
  
  const closeFilterPanel = () => {
    setIsFilterPanelOpen(false);
  };
  
  const openFilterPanel = () => {
    setIsFilterPanelOpen(true);
  };
  
  const applyFilters = (newFilters) => {

    const filtersObject = typeof newFilters === 'object' ? newFilters : {};
  
    const { searchTerm: _, ...justFilters } = filtersObject;

    setAppliedFilters(justFilters);
    setFilters(justFilters);
  };

  const updateSearchTerm = (term) => {
    setSearchTerm(term || '');
  };
  
  const contextValue = {
    isFilterPanelOpen,
    toggleFilterPanel,
    closeFilterPanel,
    openFilterPanel,
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
    applyFilters,
    appliedFilters
  };

  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  // This is where the error is occurring
  const context = useContext(FilterContext);
  
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  
  return context;
}