const bookService = require('../services/book.service');

// Use async/await for cleaner asynchronous handling
const handleGetAllBooks = async (req, res, next) => {
    try {
        // Pass query params directly to the service
        const { filter, sortBy, order } = req.query;

        const page = parseInt(req.query.page, 10) || 1; // Default to page 1 if not provided
        const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 items per page if not provided

        // Validate page and limit to be positive integers
        if (page < 1) {
            return res.status(400).json({ error: 'Page must be a positive integer' });
        }
        if (limit < 1) {
            return res.status(400).json({ error: 'Limit must be a positive integer' });
        }

        // Call the service to get all books with pagination
        const books = await bookService.getAllBooks(filter, sortBy, order, page, limit); // Service is now sync, but keep async for future DB calls
        res.status(200).json(books);
    } catch (error) {
        next(error); // Pass errors to the central error handler
    }
};

const handleGetBookById = async (req, res, next) => {
    try {
        const book = await bookService.getBookById(req.params.id);
        // Service throws 404 error if not found, caught by catch block
        res.status(200).json(book);
    } catch (error) {
        next(error); // Pass errors (like 404) to error handler
    }
};

const handleCreateBook = async (req, res, next) => {
    try {
        // Body already validated by middleware
        const newBook = await bookService.addBook(req.body);
        res.status(201).json(newBook);
    } catch (error) {
        // Handle potential errors during creation (e.g., unique constraint in DB)
        next(error);
    }
};

const handleUpdateBook = async (req, res, next) => {
    try {
        // Params and body validated by middleware
        const updatedBook = await bookService.updateBook(req.params.id, req.body);
        res.status(200).json(updatedBook);
    } catch (error) {
        next(error); // Pass errors (like 404) to error handler
    }
};

const handleDeleteBook = async (req, res, next) => {
    try {
        // Param validated by middleware
        await bookService.deleteBook(req.params.id);
        res.status(204).send(); // No content on successful deletion
    } catch (error) {
        next(error); // Pass errors (like 404) to error handler
    }
};

module.exports = {
    handleGetAllBooks,
    handleGetBookById,
    handleCreateBook,
    handleUpdateBook,
    handleDeleteBook,
};