const express = require('express');
const bookController = require('../controllers/book.controller');
const {
    bookValidationRules,
    bookUpdateValidationRules,
    bookQueryValidationRules,
    validate
} = require('../middlewares/validators');

const router = express.Router();

router.get('/stats', bookController.handleGetBookStats);

router.get(
    '/',
    bookQueryValidationRules,
    validate,
    bookController.handleGetAllBooks
);

router.get(
    '/:id',
    bookController.handleGetBookById
);

router.post(
    '/',
    bookValidationRules,
    validate,
    bookController.handleCreateBook
);

router.put(
    '/:id',
    bookUpdateValidationRules,
    validate,
    bookController.handleUpdateBook
);

router.delete(
    '/:id',
    bookController.handleDeleteBook
);

module.exports = router;