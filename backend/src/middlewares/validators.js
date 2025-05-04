const { body, validationResult, query, param } = require('express-validator');

const bookValidationRules = [
    body('title').trim()
        .notEmpty().withMessage('Title is required')
        .isString().withMessage('Title must be a string'),
    body('author').trim()
        .notEmpty().withMessage('Author is required')
        .isString().withMessage('Author must be a string')
        .matches(/^[a-zA-Z\s.]+$/).withMessage('Author must contain only alphabetic characters and spaces'),
    body('genre').trim()
        .notEmpty().withMessage('Genre is required')
        .isString().withMessage('Genre must be a string')
        .matches(/^[a-zA-Z\s-]+$/).withMessage('Genre must contain only alphabetic characters and spaces')
        .isLength({ min: 3, max: 50 }).withMessage('Genre must be between 3 and 50 characters'),
    body('price')
        .notEmpty().withMessage('Price is required')
        .isFloat({ gt: 0, lt: 999999.99 }).withMessage('Price must be a positive number smaller than 999999.99'),
    body('rating').optional().trim()
        .isFloat({ min: 0, max: 5 }).withMessage('Rating must be a number between 0 and 5')
];

const bookUpdateValidationRules = [
    body('title').optional().trim()
        .isString().withMessage('Title must be a string'),
    body('author').optional().trim()
        .isString().withMessage('Author must be a string')
        .matches(/^[a-zA-Z\s.]+$/).withMessage('Author must contain only alphabetic characters and spaces'),
    body('genre').optional().trim()
        .isString().withMessage('Genre must be a string')
        .matches(/^[a-zA-Z\s-]+$/).withMessage('Genre must contain only alphabetic characters and spaces').isLength({ min: 3, max: 50 }).withMessage('Genre must be between 3 and 50 characters'),
    body('price').optional()
        .isFloat({ gt: 0, lt:999999.99 }).withMessage('Price must be a positive number smaller than 999999.99'),
    body('rating').optional().trim()
        .isFloat({ min: 0, max: 5 }).withMessage('Rating must be a number between 0 and 5')
];


const bookQueryValidationRules = [
    query('search').optional().isString().escape(),
    query('filter').optional().isString().escape(), // Keep for backward compatibility
    query('sortBy').optional().isIn(['title', 'author', 'price', 'genre', 'id', 'rating', 'publicationYear']).withMessage('Invalid sortBy field'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Invalid order value'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
    
    // Advanced filter parameters
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Minimum price must be a non-negative number'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Maximum price must be a non-negative number'),
    query('author').optional().isString().escape(),
    query('genre').optional().isString().escape(),
    query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Minimum rating must be between 0 and 5'),
    query('yearFrom').optional().isInt({ min: 1000, max: 9999 }).withMessage('Year must be a valid 4-digit year'),
    query('yearTo').optional().isInt({ min: 1000, max: 9999 }).withMessage('Year must be a valid 4-digit year')
];

// Middleware to handle validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    const extractedErrors = {};
     errors.array().forEach(err => {
        if (!extractedErrors[err.path]) {
            extractedErrors[err.path] = err.msg;
        }
     });

    return res.status(422).json({
        message: 'Validation failed',
        errors: extractedErrors,
    });
};

module.exports = {
    bookValidationRules,
    bookUpdateValidationRules,
    bookQueryValidationRules,
    validate
};