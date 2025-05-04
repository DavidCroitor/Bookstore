const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/dbConnection');

const Author = sequelize.define('Author', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    birthYear: {
        type: DataTypes.INTEGER,
    },
    nationality: {
        type: DataTypes.STRING,
    }
}, {
    timestamps: true
});

module.exports = Author;
