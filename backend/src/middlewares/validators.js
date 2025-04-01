const { body, validationResult, query, param } = require('express-validator');

const bookValidationRules = [
    body('title').trim().notEmpty().withMessage('Title is required').isString().withMessage('Title must be a string'),
    body('author').trim().notEmpty().withMessage('Author is required').isString().withMessage('Author must be a string'),
    body('genre').trim().notEmpty().withMessage('Genre is required').isString().withMessage('Genre must be a string').isLength({ min: 3, max: 50 }).withMessage('Genre must be between 3 and 50 characters'),
    body('price').notEmpty().withMessage('Price is required').isFloat({ gt: 0, lt: 999999.99 }).withMessage('Price must be a positive number smaller than 999999.99')
];

const bookUpdateValidationRules = [
    // Optional fields for PATCH
    body('title').optional().trim().isString().withMessage('Title must be a string'),
    body('author').optional().trim().isString().withMessage('Author must be a string'),
    body('genre').optional().trim().isString().withMessage('Genre must be a string').isLength({ min: 3, max: 50 }).withMessage('Genre must be between 3 and 50 characters'),
    body('price').optional().isFloat({ gt: 0, lt:999999.99 }).withMessage('Price must be a positive number smaller than 999999.99')
];

const idParamValidationRule = [
    // Convert to int for consistent validation, although service/repo handles string/int conversion
    param('id').isInt({ gt: 0 }).withMessage('ID must be a positive integer').toInt()
];

const bookQueryValidationRules = [
     // Optional validation for query parameters
     query('filter').optional().isString().escape(), // Basic sanitization
     query('sortBy').optional().isIn(['title', 'author', 'price', 'genre', 'id']).withMessage('Invalid sortBy field'), // Added genre/id
     query('order').optional().isIn(['asc', 'desc']).withMessage('Invalid order value')
];

// Middleware to handle validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next(); // Proceed if no errors
    }
    // Extract specific error messages for a cleaner response
    const extractedErrors = {};
     errors.array().forEach(err => {
        // Avoid overwriting if multiple errors on the same field (unlikely with current rules)
        if (!extractedErrors[err.path]) {
            extractedErrors[err.path] = err.msg;
        }
     });

    // Use 422 Unprocessable Entity for validation errors often
    return res.status(422).json({
        message: 'Validation failed',
        errors: extractedErrors,
    });
};

module.exports = {
    bookValidationRules,
    bookUpdateValidationRules,
    idParamValidationRule,
    bookQueryValidationRules,
    validate
};