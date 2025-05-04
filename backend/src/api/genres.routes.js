const express = require('express');
const router = express.Router();
const genreController = require('../controllers/genre.controller');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validators');

// Validation rules for genre creation and update
const genreValidationRules = () => {
    return [
        body('name')
            .isString()
            .notEmpty().withMessage('Genre name is required')
            .trim()
            .isLength({ min: 2, max: 100 }).withMessage('Genre name must be between 2 and 100 characters')
    ];
};

// GET all genres with optional filtering and sorting
router.get('/', genreController.handleGetAllGenres);

// GET genre by ID
router.get('/:id', genreController.handleGetGenreById);

// POST create new genre
router.post('/', genreValidationRules(), validate, genreController.handleCreateGenre);

// PUT update genre
router.put('/:id', genreValidationRules(), validate, genreController.handleUpdateGenre);

// DELETE genre
router.delete('/:id', genreController.handleDeleteGenre);

module.exports = router;