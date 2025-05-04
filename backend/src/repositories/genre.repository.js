const {Genre, Book} = require('../models/relations');
const {Op} = require('sequelize');

const transformGenre = (genre) => {
    if (!genre) return null;
    return genre.get({plain: true});
};

/**
 * Find all genres with optional filtering and sorting
 */
const findAll = async (filters = {}, sort = {}) => {
    try {
        const whereClause = {};
        
        // Filter by name
        if (filters.name) {
            whereClause.name = {[Op.iLike]: `%${filters.name}%`};
        }
        
        // Determine order
        const order = [];
        if (sort.field && sort.direction) {
            order.push([sort.field, sort.direction.toUpperCase()]);
        } else {
            order.push(['name', 'ASC']);
        }
        
        const genres = await Genre.findAll({
            where: whereClause,
            order,
            include: [{
                model: Book,
                as: 'books',
                attributes: ['id', 'title', 'price'],
                through: { attributes: [] }
            }]
        });
        
        return genres.map(transformGenre);
    } catch (error) {
        console.error('Error fetching genres:', error);
        throw error;
    }
};

/**
 * Find genre by ID
 */
const findById = async (id) => {
    try {
        const genre = await Genre.findByPk(id, {
            include: [{
                model: Book,
                as: 'books',
                attributes: ['id', 'title', 'price'],
                through: { attributes: [] }
            }]
        });
        return transformGenre(genre);
    } catch (error) {
        console.error('Error fetching genre by ID:', error);
        throw error;
    }
};

/**
 * Create a new genre
 */
const create = async (genreData) => {
    try {
        const genre = await Genre.create(genreData);
        return transformGenre(genre);
    } catch (error) {
        console.error('Error creating genre:', error);
        throw error;
    }
};

/**
 * Update an existing genre
 */
const update = async (id, genreData) => {
    try {
        const genre = await Genre.findByPk(id);
        if (!genre) throw new Error('Genre not found');
        
        await genre.update(genreData);
        return transformGenre(genre);
    } catch (error) {
        console.error('Error updating genre:', error);
        throw error;
    }
};

/**
 * Delete a genre
 */
const remove = async (id) => {
    try {
        const genre = await Genre.findByPk(id);
        if (!genre) throw new Error('Genre not found');
        
        await genre.destroy();
        return true;
    } catch (error) {
        console.error('Error deleting genre:', error);
        throw error;
    }
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove
};