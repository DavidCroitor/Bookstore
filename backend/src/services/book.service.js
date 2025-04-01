const bookRepository = require('../repositories/book.repository');
const createError = require('http-errors'); // For semantic HTTP errors

const getAllBooks = (filter, sortBy, order = 'asc') => {
    let results = bookRepository.findAll(); // Get all books from repo

    // Filtering (simple case-insensitive search on title and author)
    if (filter) {
        const filterLower = filter.toLowerCase();
        results = results.filter(book =>
            book.title.toLowerCase().includes(filterLower) ||
            book.author.toLowerCase().includes(filterLower)
        );
    }

    // Sorting
    if (sortBy) {
        results.sort((a, b) => {
            // Handle potential undefined fields during sort
            const fieldA = a[sortBy] || '';
            const fieldB = b[sortBy] || '';

            let comparison = 0;
            if (fieldA > fieldB) {
                comparison = 1;
            } else if (fieldA < fieldB) {
                comparison = -1;
            }
            // Consider case-insensitive sort for strings
            // if (typeof fieldA === 'string') {
            //   comparison = fieldA.localeCompare(fieldB);
            // }

            return order === 'desc' ? (comparison * -1) : comparison;
        });
    }

    return results;
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