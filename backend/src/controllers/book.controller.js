const bookService = require('../services/book.service');
const websocketService = require('../services/websocket-service');


const handleGetAllBooks = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1; 
        const limit = parseInt(req.query.limit, 10) || 36;
        const sortBy = req.query.sortBy || 'title';
        const order = req.query.order || 'asc';
        
        const filters = {
            search: req.query.search || req.query.filter, // Support both search and filter for backward compatibility
            minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
            maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
            author: req.query.author,
            genre: req.query.genre,
            minRating: req.query.minRating ? parseFloat(req.query.minRating) : undefined,
            yearFrom: req.query.yearFrom ? parseInt(req.query.yearFrom) : undefined,
            yearTo: req.query.yearTo ? parseInt(req.query.yearTo) : undefined
        };

        if (page < 1) {
            return res.status(400).json({ error: 'Page must be a positive integer' });
        }
        if (limit < 1) {
            return res.status(400).json({ error: 'Limit must be a positive integer' });
        }

        const books = await bookService.getAllBooks(filters, sortBy, order, page, limit);
        res.status(200).json(books);
    } catch (error) {
        next(error);
    }
};

const handleGetBookById = async (req, res, next) => {
    try {
        const book = await bookService.getBookById(req.params.id);
        res.status(200).json(book);
    } catch (error) {
        next(error); 
    }
};

const handleCreateBook = async (req, res, next) => {
    try {
        const newBook = await bookService.addBook(req.body);

        websocketService.broadcast({
            type: 'new_book',
            data: newBook
        });


        console.log("Book created successfully");

        res.status(201).json(newBook);
    } catch (error) {
        next(error);
    }
};

const handleUpdateBook = async (req, res, next) => {
    try {
        console.log("Updating book with ID - controller:", req.params.id);
        const updatedBook = await bookService.updateBook(req.params.id, req.body);

        websocketService.broadcast({
            type: 'update_book',
            data: updatedBook
        });

        console.log("Book updated successfully");

        res.status(200).json(updatedBook);
    } catch (error) {
        next(error);
    }
};

const handleDeleteBook = async (req, res, next) => {
    try {
        console.log("Deleting book with ID:", req.params.id);
        await bookService.deleteBook(req.params.id);

        websocketService.broadcast({
            type: 'delete_book',
            data: {id: req.params.id}
        });

        console.log("Book deleted successfully");

        res.status(204).send();
    } catch (error) {
        next(error); 
    }
};

const handleGetBookStats = async (req, res, next) => {
    try {
        const stats = await bookService.getBookStatistics();
        res.status(200).json(stats);
    } catch (error) {
        next(error); 
    }
};

module.exports = {
    handleGetAllBooks,
    handleGetBookById,
    handleCreateBook,
    handleUpdateBook,
    handleDeleteBook,
    handleGetBookStats,
};