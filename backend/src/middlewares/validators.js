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
     query('filter').optional().isString().escape(), 
     query('sortBy').optional().isIn(['title', 'author', 'price', 'genre', 'id', 'rating']).withMessage('Invalid sortBy field'), // Added genre/id
     query('order').optional().isIn(['asc', 'desc']).withMessage('Invalid order value')
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