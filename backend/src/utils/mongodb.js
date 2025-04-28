const mongoose = require('mongoose');
require('dotenv').config();

const connectToDatabase = async () => {
    try{
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
        const mongoDb = process.env.MONGO_DB || 'Bookstore';
        const connectionString = `${mongoUri}/${mongoDb}`;

        const conn = await mongoose.connect(connectionString);
        
        console.log('MongoDB connected:', conn.connection.host);
        return conn;
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = {
    connectToDatabase,
};