const genreRepository = require('../repositories/genre.repository');
const createError = require('http-errors');

/**
 * Get all genres with optional filtering and sorting
 */
const getAllGenres = async (filter, sortBy, order = 'asc') => {
    const filters = {};
    
    if (filter) {
        filters.name = filter;
    }
    
    const sort = {
        field: sortBy,
        direction: order
    };
    
    return await genreRepository.findAll(filters, sort);
};

/**
 * Get a genre by ID
 */
const getGenreById = async (id) => {
    const genre = await genreRepository.findById(id);
    if (!genre) {
        throw createError(404, 'Genre not found');
    }
    return genre;
};

/**
 * Add a new genre
 */
const addGenre = async (genreData) => {
    if (!genreData.name) {
        throw createError(400, 'Genre name is required');
    }
    
    return await genreRepository.create(genreData);
};

/**
 * Update an existing genre
 */
const updateGenre = async (id, genreData) => {
    const existingGenre = await genreRepository.findById(id);
    if (!existingGenre) {
        throw createError(404, 'Genre not found');
    }
    
    return await genreRepository.update(id, genreData);
};

/**
 * Delete a genre
 */
const deleteGenre = async (id) => {
    const deleted = await genreRepository.remove(id);
    if (!deleted) {
        throw createError(404, 'Genre not found');
    }
    return true;
};

module.exports = {
    getAllGenres,
    getGenreById,
    addGenre,
    updateGenre,
    deleteGenre
};