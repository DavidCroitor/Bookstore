const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/dbConnection');

const Book = sequelize.define('Book', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    authorId: {
        type: DataTypes.UUID,
        references: {
            model: 'Authors',
            key: 'id',
        },
    },
    genreId: {
        type: DataTypes.UUID,
        references: {
            model: 'Genres',
            key: 'id',
        },
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    rating: {
        type: DataTypes.DECIMAL(2, 1),
        allowNull: false,
        defaultValue: 0.0,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    year: {
        type: DataTypes.INTEGER,
    }
}, {
    timestamps: true
});

module.exports = Book;