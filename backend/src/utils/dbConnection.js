const { Sequelize } = require('sequelize');

// Create Sequelize instance with PostgreSQL configuration
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5555,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres', // Use your actual password in production
  database: process.env.DB_NAME || 'bookstore',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false, // Enable logging based on environment variable
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = {
  sequelize,
  Sequelize
};
