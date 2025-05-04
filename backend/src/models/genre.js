const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../utils/dbConnection');

const Genre = sequelize.define('Genre', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
}, {
    timestamps: true
});

module.exports = Genre;