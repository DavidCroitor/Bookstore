const {Book, Genre, Author} = require('../models/relations');
const {Op} = require('sequelize');

const transformBook = (book) => {
    if (!book) return null;
    const plainBook = book.get({plain: true});
    return plainBook;
}

const findAll = async (options = {}) => {
    try {
        const {
            limit,
            offset,
            sortBy = 'title',
            order = 'ASC',
            search,
            minPrice,
            maxPrice,
            author,
            genre,
            minRating,
            yearFrom,
            yearTo
        } = options;

        // Build where clause
        const whereClause = {};
        const authorWhereClause = {};
        const genreWhereClause = {};

        // Handle search term (across title and author)
        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.iLike]: `%${search}%` } },
                { '$author.name$': { [Op.iLike]: `%${search}%` } }
            ];
        }

        // Handle specific author filter
        if (author) {
            authorWhereClause.name = author;
        }

        // Handle specific genre filter
        if (genre) {
            genreWhereClause.name = genre;
        }

        // Handle price range
        if (minPrice !== undefined || maxPrice !== undefined) {
            whereClause.price = {};
            if (minPrice !== undefined) {
                whereClause.price[Op.gte] = minPrice;
            }
            if (maxPrice !== undefined) {
                whereClause.price[Op.lte] = maxPrice;
            }
        }

        // Handle rating filter
        if (minRating !== undefined) {
            whereClause.rating = { [Op.gte]: minRating };
        }

        // Handle publication year range
        if (yearFrom !== undefined || yearTo !== undefined) {
            whereClause.publicationYear = {};
            if (yearFrom !== undefined) {
                whereClause.publicationYear[Op.gte] = yearFrom;
            }
            if (yearTo !== undefined) {
                whereClause.publicationYear[Op.lte] = yearTo;
            }
        }

        // Execute the query with all filters
        const { rows, count } = await Book.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Author,
                    as: 'author',
                    attributes: ['id', 'name', 'birthYear', 'nationality'],
                    where: Object.keys(authorWhereClause).length > 0 ? authorWhereClause : undefined
                },
                {
                    model: Genre,
                    as: 'genre',
                    attributes: ['id', 'name'],
                    where: Object.keys(genreWhereClause).length > 0 ? genreWhereClause : undefined
                }
            ],
            order: [[sortBy, order]],
            limit: limit ? limit : undefined,
            offset: offset ? offset : undefined,
            distinct: true // Important for correct count with associations
        });

        return {
            books: rows.map(transformBook),
            total: count
        };
    } catch (error) {
        console.error('Error fetching books with filters:', error);
        throw error;
    }
}

const findById = async (id) => {
    try
    {
        const book = await Book.findByPk(id, {
            include: [
                {
                    model: Genre,
                    as: 'genre',
                    attributes: ['id', 'name']
                },
                {
                    model: Author,
                    as: 'author',
                    attributes: ['id', 'name', 'birthYear', 'nationality']
                }
            ]
        });
        return transformBook(book);
    }
    catch (error)
    {
        console.error('Error fetching book by ID:', error);
        throw error;
    }
}

const create = async (bookData) => {
    try
    {
        const {genre, author, ...bookInfo} = bookData;

        const book = await Book.create(bookInfo);
        
        if(genre) {
            // Find or create the genre
            let genreInstance;
            
            if (typeof genre === 'string') {
                // If genre is a string, find or create by name
                const [foundGenre] = await Genre.findOrCreate({
                    where: { name: genre }
                });
                genreInstance = foundGenre;
            } else if (typeof genre === 'object' && genre.id) {
                // If genre is an object with ID, use that ID
                genreInstance = await Genre.findByPk(genre.id);
            } else if (typeof genre === 'object' && genre.name) {
                // If genre is an object with name but no ID, find or create
                const [foundGenre] = await Genre.findOrCreate({
                    where: { name: genre.name }
                });
                genreInstance = foundGenre;
            }

            if (genreInstance) {
                await book.setGenre(genreInstance);
            }
        }

        if(author) {
            // Find or create the author
            let authorInstance;
            
            if (typeof author === 'string') {
                // If author is a string, find or create by name
                const [foundAuthor] = await Author.findOrCreate({
                    where: { name: author }
                });
                authorInstance = foundAuthor;
            } else if (typeof author === 'object' && author.id) {
                // If author is an object with ID, use that ID
                authorInstance = await Author.findByPk(author.id);
            } else if (typeof author === 'object' && author.name) {
                // If author is an object with name but no ID, find or create
                const [foundAuthor] = await Author.findOrCreate({
                    where: { name: author.name }
                });
                authorInstance = foundAuthor;
            }

            if (authorInstance) {
                await book.setAuthor(authorInstance);
            }
        }

        return findById(book.id);
    }
    catch (error)
    {
        console.error('Error creating book:', error);
        throw error;
    }
}

const update = async (id, bookData) => {
    try
    {
        console.log('Updating book with ID - repository:', id);

        const {genre, author, ...bookInfo} = bookData;
        
        const book = await Book.findByPk(id);
        if (!book) throw new Error('Book not found');

        await book.update(bookInfo);

        if(genre) {
            // Find or create the genre
            let genreInstance;
            
            if (typeof genre === 'string') {
                // If genre is a string, find or create by name
                const [foundGenre] = await Genre.findOrCreate({
                    where: { name: genre }
                });
                genreInstance = foundGenre;
            } else if (typeof genre === 'object' && genre.id) {
                // If genre is an object with ID, use that ID
                genreInstance = await Genre.findByPk(genre.id);
            } else if (typeof genre === 'object' && genre.name) {
                // If genre is an object with name but no ID, find or create
                const [foundGenre] = await Genre.findOrCreate({
                    where: { name: genre.name }
                });
                genreInstance = foundGenre;
            }

            if (genreInstance) {
                await book.setGenre(genreInstance);
            }
        }

        if(author) {
            // Find or create the author
            let authorInstance;
            
            if (typeof author === 'string') {
                // If author is a string, find or create by name
                const [foundAuthor] = await Author.findOrCreate({
                    where: { name: author }
                });
                authorInstance = foundAuthor;
            } else if (typeof author === 'object' && author.id) {
                // If author is an object with ID, use that ID
                authorInstance = await Author.findByPk(author.id);
            } else if (typeof author === 'object' && author.name) {
                // If author is an object with name but no ID, find or create
                const [foundAuthor] = await Author.findOrCreate({
                    where: { name: author.name }
                });
                authorInstance = foundAuthor;
            }

            if (authorInstance) {
                await book.setAuthor(authorInstance);
            }
        }

        return findById(book.id);
    }
    catch (error)
    {
        console.error('Error updating book:', error);
        throw error;
    }
}

const remove = async (id) => {
    try
    {
        const book = await Book.findByPk(id);
        if (!book) throw new Error('Book not found');

        await book.destroy();
        return true;
    }
    catch (error)
    {
        console.error('Error deleting book:', error);
        throw error;
    }
}

const findByGenre = async (genreId) => {
    try
    {
        const books = await Book.findAll({
            where: {genreId},
            include: [
                {
                    model: Genre,
                    as: 'genre',
                    attributes: ['id', 'name']
                },
                {
                    model: Author,
                    as: 'author',
                    attributes: ['id', 'name', 'birthYear', 'nationality']
                }
            ]
        });
        return books.map(transformBook);
    }
    catch (error)
    {
        console.error('Error fetching books by genre:', error);
        throw error;
    }
}

const getBookStatistics = async () => {
    try {
        // Get all books to calculate statistics
        const books = await Book.findAll({
            include: [
                {
                    model: Author,
                    as: 'author',
                    attributes: ['id', 'name']
                },
                {
                    model: Genre,
                    as: 'genre',
                    attributes: ['id', 'name']
                }
            ]
        });
        
        // Transform to plain objects for easier processing
        const plainBooks = books.map(transformBook);
        
        if (plainBooks.length === 0) {
            return {
                count: 0,
                mostExpensive: null,
                leastExpensive: null,
                averagePrice: 0,
                closestToAveragePrice: null
            };
        }
        
        // Find most expensive book
        const mostExpensive = plainBooks.reduce((max, book) => 
            parseFloat(book.price) > parseFloat(max.price) ? book : max
        , plainBooks[0]);
        
        // Find least expensive book
        const leastExpensive = plainBooks.reduce((min, book) => 
            parseFloat(book.price) < parseFloat(min.price) ? book : min
        , plainBooks[0]);
        
        // Calculate average price
        const totalPrice = plainBooks.reduce((sum, book) => 
            sum + parseFloat(book.price), 0);
        const averagePrice = totalPrice / plainBooks.length;
        
        // Find closest to average price
        const closestToAveragePrice = plainBooks.reduce((closest, book) => {
            const closestDiff = Math.abs(parseFloat(closest.price) - averagePrice);
            const currentDiff = Math.abs(parseFloat(book.price) - averagePrice);
            return currentDiff < closestDiff ? book : closest;
        }, plainBooks[0]);
        
        return {
            count: plainBooks.length,
            mostExpensive,
            leastExpensive,
            averagePrice,
            closestToAveragePrice
        };
    } catch (error) {
        console.error('Error getting book statistics:', error);
        throw error;
    }
};

// Don't forget to export the new function
module.exports = {
    findAll,
    findById,
    create,
    update,
    remove,
    findByGenre,
    getBookStatistics  // Add this to exports
};
