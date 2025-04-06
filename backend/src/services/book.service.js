const bookRepository = require('../repositories/book.repository');
const createError = require('http-errors'); // For semantic HTTP errors

const safeParseFloat = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num; // Default to 0 if not a valid number
};

const getAllBooks = (filter, sortBy, order = 'asc', page = 1, limit = 10) => {
    let allBooks = bookRepository.findAll(); // Get all books from repo

    // Filtering (simple case-insensitive search on title and author)
    let filteredBooks = allBooks;
    if (filter) {
        const filterLower = filter.toLowerCase();
        filteredBooks = allBooks.filter(book =>
            book.title.toLowerCase().includes(filterLower) ||
            book.author.toLowerCase().includes(filterLower) 
        );
    }

    // Sorting
    let sortedBooks = [...filteredBooks];
    if (sortBy) {
        sortedBooks.sort((a, b) => {
            // Handle potential undefined fields during sort
            const fieldA = a[sortBy] || '';
            const fieldB = b[sortBy] || '';

            let comparison = 0;
            if (fieldA > fieldB) {
                comparison = 1;
            } else if (fieldA < fieldB) {
                comparison = -1;
            }

            return order === 'desc' ? (comparison * -1) : comparison;
        });
    }

    const totalBooks = sortedBooks.length;
    const totalPages = Math.ceil(totalBooks / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const booksPerPage = sortedBooks.slice(startIndex, endIndex);

    let mostExpensiveBook = null;
    let leastExpensiveBook = null;
    let averagePrice = 0;
    let closestToAverageBook = null;

    if (sortedBooks.length > 0) {
        // Use reduce for most/least expensive
        mostExpensiveBook = sortedBooks.reduce((max, book) =>
            (safeParseFloat(book.price) > safeParseFloat(max.price) ? book : max),
        sortedBooks[0] // Initial value for reduce
        );

        leastExpensiveBook = sortedBooks.reduce((min, book) =>
            (safeParseFloat(book.price) < safeParseFloat(min.price) ? book : min),
        sortedBooks[0] // Initial value for reduce
        );

        // Calculate average price
        const totalPrice = sortedBooks.reduce((sum, book) => sum + safeParseFloat(book.price), 0);
        averagePrice = totalPrice / sortedBooks.length;

        // Find closest to average
        closestToAverageBook = sortedBooks.reduce((closest, book) =>
             Math.abs(safeParseFloat(book.price) - averagePrice) < Math.abs(safeParseFloat(closest.price) - averagePrice) ? book : closest,
        sortedBooks[0] // Initial value for reduce
        );
    }
    return {
        books: booksPerPage,
        currentPage: page,
        totalPages: totalPages,
        totalBooks: totalBooks,
        limit: limit,
        stats: {
            totalCount: allBooks.length,
            mostExpensiveBook: mostExpensiveBook,
            leastExpensiveBook: leastExpensiveBook,
            averagePrice: averagePrice,
            closestToAverageBook: closestToAverageBook,
        },
    };
};

const getBookById = (id) => {
    const book = bookRepository.findById(id);
    if (!book) {
        // Use http-errors for standard error objects
        throw createError(404, 'Book not found');
    }
    return book;
};

const addBook = (bookData) => {
    // Add any other business validation rules here if needed
    // (e.g., check if a book with the same title/author already exists)
    const newBook = bookRepository.create(bookData);
    return newBook;
};

const updateBook = (id, updateData) => {
    // Check if book exists first (optional, repo update might handle it)
    const existingBook = bookRepository.findById(id);
     if (!existingBook) {
        throw createError(404, 'Book not found');
    }
    // Add business logic before update if needed
    const updatedBook = bookRepository.update(id, updateData);
    // update should ideally return the updated book or confirm success
    if (!updatedBook) {
         // This case might be redundant if findById check is done above
         throw createError(404, 'Book not found during update');
    }
    return updatedBook;
};

const deleteBook = (id) => {
    const deleted = bookRepository.remove(id);
    if (!deleted) {
        throw createError(404, 'Book not found');
    }
    // No return value needed for successful delete typically
};

module.exports = {
    getAllBooks,
    getBookById,
    addBook,
    updateBook,
    deleteBook,
};