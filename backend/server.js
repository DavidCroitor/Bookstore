const express = require('express');
const cors = require('cors');
const {body, validationResult, query, param} = require('express-validator');
const mongoose = require('mongoose');

const app = express();

let books = require('./books');
let nextId = books.length + 1;

app.use(cors({origin: 'http://localhost:3000'}));
app.use(express.json());

// --- Helper Functions ---
const findBookById = (id) => books.find(book => book.id === parseInt(id));
const findBookIndexById = (id) => books.findIndex(book => book.id === parseInt(id));

// --- Validation Rules ---
const bookValidationRules = [
    body('title').notEmpty().withMessage('Title is required').isString().withMessage('Title must be a string'),
    body('author').notEmpty().withMessage('Author is required').isString().withMessage('Author must be a string'),
    body('genre').notEmpty().withMessage('Genre is required').isString().withMessage('Genre must be a string').trim().isLength({ min: 3, max: 50 }).withMessage('Genre must be between 3 and 50 characters'),
    body('price').notEmpty().withMessage('Price is required').isFloat({ gt: 0, lt: 999999.99 }).withMessage('Price must be a positive number smaller than 999999.99')
];

const bookUpdateValidationRules = [
    // Optional fields for PATCH
    body('title').optional().isString().withMessage('Title must be a string'),
    body('author').optional().isString().withMessage('Author must be a string'),
    body('genre').optional().isString().withMessage('Genre must be a string').trim().isLength({ min: 3, max: 50 }).withMessage('Genre must be between 3 and 50 characters'),
    body('price').optional().isFloat({ gt: 0, lt:999999.99 }).withMessage('Price must be a positive number smaller than 999999.99')
];

const idParamValidationRule = [
    param('id').isInt({ gt: 0 }).withMessage('ID must be a positive integer')
];

// Middleware to handle validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next(); // Proceed if no errors
    }
    // Extract specific error messages
    const extractedErrors = errors.array().map(err => ({ [err.path]: err.msg }));

    return res.status(400).json({
        message: 'Validation failed',
        errors: extractedErrors,
    });
};


app.get('/books', [
    // Optional validation for query parameters
    query('filter').optional().isString().escape(), // Basic sanitization
    query('sortBy').optional().isIn(['title', 'author', 'price']).withMessage('Invalid sortBy field'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Invalid order value')
], validate, (req, res) => {
    const { filter, sortBy, order = 'asc' } = req.query; // Default order to 'asc'
    let results = [...books]; // Create a copy to avoid modifying the original array

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
            const fieldA = a[sortBy];
            const fieldB = b[sortBy];

            let comparison = 0;
            if (fieldA > fieldB) {
                comparison = 1;
            } else if (fieldA < fieldB) {
                comparison = -1;
            }

            return order === 'desc' ? (comparison * -1) : comparison;
        });
    }

    res.status(200).json(results);
});

// GET /books/:id - Get a single book by ID (Good practice, even if not explicitly in Bronze)
app.get('/books/:id', idParamValidationRule, validate, (req, res) => {
    const book = findBookById(req.params.id);
    if (!book) {
        return res.status(404).json({ message: 'Book not found' });
    }
    res.status(200).json(book);
});

// POST /books - Add a new book
app.post('/books', bookValidationRules, validate, (req, res) => {
    const { title, author, genre, price } = req.body;

    const newBook = {
        id: nextId++, // Assign next available ID and increment
        title,
        author,
        genre,
        price: parseFloat(price) // Ensure price is stored as a number
    };

    books.push(newBook);
    // In a real app, save to DB here
    res.status(201).json(newBook); // Return the created book
});

// PATCH /books/:id - Edit an existing book
app.patch('/books/:id', idParamValidationRule, bookUpdateValidationRules, validate, (req, res) => {
    const bookIndex = findBookIndexById(req.params.id);

    if (bookIndex === -1) {
        return res.status(404).json({ message: 'Book not found' });
    }

    const originalBook = books[bookIndex];
    const updatedBook = {
        ...originalBook, // Keep original values
        ...req.body, // Overwrite with new values from request body
         // Ensure price is float if updated
        price: req.body.price !== undefined ? parseFloat(req.body.price) : originalBook.price
    };

     // Prevent changing the ID via PATCH body
     updatedBook.id = originalBook.id;

    books[bookIndex] = updatedBook;
    // In a real app, save to DB here
    res.status(200).json(updatedBook); // Return the updated book
});

// DELETE /books/:id - Remove a book
app.delete('/books/:id', idParamValidationRule, validate, (req, res) => {
    const bookIndex = findBookIndexById(req.params.id);

    if (bookIndex === -1) {
        return res.status(404).json({ message: 'Book not found' });
    }

    books.splice(bookIndex, 1); // Remove the book from the array
    // In a real app, delete from DB here
    res.status(204).send(); // No content to send back
});

let server;
const PORT = 5000
if (process.env.NODE_ENV !== 'test') {
    server = app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

module.exports = { app, books };
