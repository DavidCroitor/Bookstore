const express = require('express');
const bookController = require('../controllers/book.controller');
const {
    bookValidationRules,
    bookUpdateValidationRules,
    idParamValidationRule,
    bookQueryValidationRules,
    validate // The validation error handling middleware
} = require('../middlewares/validators'); // Import validation rules and handler

const router = express.Router();

// GET /api/books/stats - Get full statistics for all books
router.get('/stats', bookController.handleGetBookStats);

// GET /api/books - Apply query validation, then validation handler, then controller
router.get(
    '/',
    bookQueryValidationRules,
    validate,
    bookController.handleGetAllBooks
);

// GET /api/books/:id - Apply ID validation, handler, then controller
router.get(
    '/:id',
    idParamValidationRule,
    validate,
    bookController.handleGetBookById
);

// POST /api/books - Apply body validation, handler, then controller
router.post(
    '/',
    bookValidationRules,
    validate,
    bookController.handleCreateBook
);

// PATCH /api/books/:id - Apply ID and body validation, handler, then controller
router.patch(
    '/:id',
    idParamValidationRule,
    bookUpdateValidationRules, // Use update rules
    validate,
    bookController.handleUpdateBook
);

// DELETE /api/books/:id - Apply ID validation, handler, then controller
router.delete(
    '/:id',
    idParamValidationRule,
    validate,
    bookController.handleDeleteBook
);

module.exports = router; // Export the router instance