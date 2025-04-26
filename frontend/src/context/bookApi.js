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
    // Re-throw network errors or specific API errors
    throw error; // Re-throw the original error or a more specific one
};


export const checkServerStatus = async () => {
    try {
        // Adding timestamp to prevent caching is good practice
        const response = await fetch(`${API_BASE_URL}/books?limit=1&_=${Date.now()}`, {
            method: 'HEAD',
            headers: { 'Cache-Control': 'no-cache' },
            signal: AbortSignal.timeout(5000) // Use constant
        });
        return response.ok;
    } catch (error) {
        console.warn('Server check failed:', error.message);
        return false;
    }
};

export const fetchBooksAPI = async ({ page, limit, sortBy, order, filter }) => {
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    if (sortBy) {
        params.append('sortBy', sortBy);
        params.append('order', order);
    }
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const url = `${API_BASE_URL}/books?${params.toString()}`;
    try {
        const response = await fetch(url);
        return await handleResponse(response);
    } catch (error) {
        handleFetchError(error);
    }
};

export const addBookAPI = async (bookData) => {
     // Remove temp ID if present before sending
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
     // Remove ID from payload if present
    const { id, ...dataToSend } = bookData;
    try {
        const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
            method: 'PATCH', // Or PUT depending on your API
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
        // Delete might return 204 No Content, handle appropriately
        if (!response.ok && response.status !== 204) {
             const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
             throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }
        return { success: true, id: bookId }; // Or just return true/void
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
        // Adjust limit as needed or implement proper pagination if "all" is too large
        const response = await fetch(`${API_BASE_URL}/books?limit=1000`);
        return await handleResponse(response);
    } catch (error) {
        handleFetchError(error);
    }
};
