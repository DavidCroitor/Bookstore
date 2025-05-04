const bookRepository = require('../repositories/book.repository');
const createError = require('http-errors'); // For semantic HTTP errors

const safeParseFloat = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num; // Default to 0 if not a valid number
};

const getAllBooks = async (filters = {}, sortBy, order = 'asc', page = 1, limit = 10) => {
    const {books, total} = await bookRepository.findAll({
        sortBy,
        order: order.toUpperCase(),
        limit,
        offset: (page - 1) * limit,
        ...filters
    });

    const totalPages = Math.ceil(total / limit);

    const stats = await calculateBookStatistics(books);
    
    return {
        books,
        currentPage: page,
        totalPages,
        totalBooks: total,
        limit,
        stats
    };
};

const calculateBookStatistics = async (books) => {
    let mostExpensiveBook = null;
    let leastExpensiveBook = null;
    let averagePrice = 0;
    let closestToAverageBook = null;

    if (books.length > 0) {
        // Most expensive book
        mostExpensiveBook = books.reduce((max, book) =>
            (safeParseFloat(book.price) > safeParseFloat(max.price) ? book : max),
            books[0]
        );

        // Least expensive book
        leastExpensiveBook = books.reduce((min, book) =>
            (safeParseFloat(book.price) < safeParseFloat(min.price) ? book : min),
            books[0]
        );

        // Calculate average price
        const totalPrice = books.reduce((sum, book) => sum + safeParseFloat(book.price), 0);
        averagePrice = totalPrice / books.length;

        // Find closest to average
        closestToAverageBook = books.reduce((closest, book) =>
            Math.abs(safeParseFloat(book.price) - averagePrice) < 
            Math.abs(safeParseFloat(closest.price) - averagePrice) ? book : closest,
            books[0]
        );
    }

    return {
        totalCount: books.length,
        mostExpensiveBook,
        leastExpensiveBook,
        averagePrice,
        closestToAverageBook
    };
};


const getBookStatistics = async () => {
    try {
        // Get statistics from repository
        const statistics = await bookRepository.getBookStatistics();
        
        // Format the statistics for the API response
        return {
            totalBooks: statistics.count,
            mostExpensiveBook: statistics.mostExpensive,
            leastExpensiveBook: statistics.leastExpensive,
            averagePrice: parseFloat(statistics.averagePrice.toFixed(2)),
            closestToAverageBook: statistics.closestToAveragePrice
        };
    } catch (error) {
        console.error('Error in book statistics service:', error);
        throw createError(500, 'Failed to get book statistics');
    }
};

const getBookById = async (id) => {
    const book = await bookRepository.findById(id);
    if (!book) {
        throw createError(404, 'Book not found');
    }
    return book;
};

const addBook = async (bookData) => {
    const newBook = await bookRepository.create(bookData);
    return newBook;
};

const updateBook = async (id, updateData) => {
    console.log('Updating book with ID - service:', id);


    const existingBook = await bookRepository.findById(id);
    if (!existingBook) {
        throw createError(404, 'Book not found');
    }
    const updatedBook = await bookRepository.update(id, updateData);
    if (!updatedBook) {
        throw createError(404, 'Book not found during update');
    }
    return updatedBook;
};

const deleteBook = async (id) => {
    const deleted = await bookRepository.remove(id);
    if (!deleted) {
        throw createError(404, 'Book not found');
    }
};

const createBook = async (bookData) => {
    if (!bookData.title || !bookData.author) {
        throw createError(400, 'Title and author are required');
    }

    const newBook = await bookRepository.create(bookData);
    return newBook;
};

module.exports = {
    getAllBooks,
    getBookById,
    addBook,
    updateBook,
    deleteBook,
    createBook,
    getBookStatistics,
};