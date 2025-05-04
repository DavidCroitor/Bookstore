import { API_BASE_URL } from './constants';

const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }
    return response.json();
};

const handleFetchError = (error) => {
    if (error.name === 'AbortError') {
        throw new Error('Request timed out.');
    }
    throw error; 
};


export const checkServerStatus = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/books?limit=1&_=${Date.now()}`, {
            method: 'HEAD',
            headers: { 'Cache-Control': 'no-cache' },
            signal: AbortSignal.timeout(5000)
        });
        return response.ok;
    } catch (error) {
        console.warn('Server check failed:', error.message);
        return false;
    }
};

export const fetchBooksAPI = async (params = {}) => {
    const {
        page = 1,
        limit = 10,
        sortBy = 'title',
        order = 'asc',
        search,
        minPrice,
        maxPrice,
        author,
        genre,
        minRating,
        yearFrom,
        yearTo
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    queryParams.append('sortBy', sortBy);
    queryParams.append('order', order);
    
    // Add filter parameters if they exist
    if (search) queryParams.append('search', search);
    if (minPrice !== undefined) queryParams.append('minPrice', minPrice);
    if (maxPrice !== undefined) queryParams.append('maxPrice', maxPrice);
    if (author) queryParams.append('author', author);
    if (genre) queryParams.append('genre', genre);
    if (minRating) queryParams.append('minRating', minRating);
    if (yearFrom) queryParams.append('yearFrom', yearFrom);
    if (yearTo) queryParams.append('yearTo', yearTo);
    
    try{
        const response = await fetch(`${API_BASE_URL}/books?${queryParams.toString()}`);
        return await handleResponse(response);
    }
    catch (error) {
        handleFetchError(error);
    }
    
    
};

export const addBookAPI = async (bookData) => {
    const { id, ...dataToSend } = bookData;
    try {
        const response = await fetch(`${API_BASE_URL}/books`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });
        return await handleResponse(response);
    } catch (error) {
        handleFetchError(error);
    }
};

export const updateBookAPI = async (bookId, bookData) => {
    const { id, ...dataToSend } = bookData;

    if( typeof bookData.author === 'object' && bookData.author !== null) {
        dataToSend.author =  bookData.author.name || bookData.author;
    } else {
        dataToSend.author =  bookData.author;
    }
    if( typeof bookData.genre === 'object' && bookData.genre !== null) {
        dataToSend.genre =  bookData.genre.name || bookData.genre;
    } else {
        dataToSend.genre =  bookData.genre;
    }

    try {
        console.log("Updating book with ID - API:", bookId);
        const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });
        return await handleResponse(response);
    } catch (error) {
        handleFetchError(error);
    }
};

export const deleteBookAPI = async (bookId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
            method: 'DELETE'
        });
        if (!response.ok && response.status !== 204) {
            const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }
        return { success: true, id: bookId };
    } catch (error) {
        handleFetchError(error);
    }
};

export const fetchStatsAPI = async () => {
     try {
        const response = await fetch(`${API_BASE_URL}/books/stats`);
        return await handleResponse(response);
    } catch (error) {
        handleFetchError(error);
    }
};

export const fetchAllBooksAPI = async () => {
     try {
        const response = await fetch(`${API_BASE_URL}/books?limit=1000`);
        return await handleResponse(response);
    } catch (error) {
        handleFetchError(error);
    }
};
