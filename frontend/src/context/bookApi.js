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
    try {
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
