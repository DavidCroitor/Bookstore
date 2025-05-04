const genreService = require('../services/genre.service');
const websocketService = require('../services/websocket-service');

/**
 * Get all genres with filtering and sorting options
 */
const handleGetAllGenres = async (req, res, next) => {
    try {
        const { filter, sortBy, order } = req.query;
        const genres = await genreService.getAllGenres(filter, sortBy, order);
        res.status(200).json({ genres });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single genre by ID
 */
const handleGetGenreById = async (req, res, next) => {
    try {
        const genre = await genreService.getGenreById(req.params.id);
        res.status(200).json(genre);
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new genre
 */
const handleCreateGenre = async (req, res, next) => {
    try {
        const newGenre = await genreService.addGenre(req.body);
        
        websocketService.broadcast({
            type: 'new_genre',
            data: newGenre
        });
        
        console.log("Genre created successfully");
        res.status(201).json(newGenre);
    } catch (error) {
        next(error);
    }
};

/**
 * Update an existing genre
 */
const handleUpdateGenre = async (req, res, next) => {
    try {
        const updatedGenre = await genreService.updateGenre(req.params.id, req.body);
        
        websocketService.broadcast({
            type: 'update_genre',
            data: updatedGenre
        });
        
        console.log("Genre updated successfully");
        res.status(200).json(updatedGenre);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a genre
 */
const handleDeleteGenre = async (req, res, next) => {
    try {
        console.log("Deleting genre with ID:", req.params.id);
        await genreService.deleteGenre(req.params.id);
        
        websocketService.broadcast({
            type: 'delete_genre',
            data: { id: req.params.id }
        });
        
        console.log("Genre deleted successfully");
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    handleGetAllGenres,
    handleGetGenreById,
    handleCreateGenre,
    handleUpdateGenre,
    handleDeleteGenre
};