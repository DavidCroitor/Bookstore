require('dotenv').config();
const app = require('./src/app');
const http = require('http');
const websocketService = require('./src/services/websocket-service');
const bookGenerator = require('./src/services/book-generator');
const { sequelize } = require('./src/utils/dbConnection');

const server = http.createServer(app);

// Use environment variable for port or default
const PORT = process.env.PORT || 5000;

// Database initialization function
const initializeDatabase = async () => {
    try {
        // Test the connection
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        
        await sequelize.sync({ force: false });
        console.log('Database models synchronized successfully');
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
};

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
    // Initialize database before starting server
    initializeDatabase().then(() => {
        server.listen(PORT, () => {
            console.log(`Server listening on http://localhost:${PORT}`);
            console.log(`API available at http://localhost:${PORT}/api`);
            
            // Initialize WebSocket service with our HTTP server
            websocketService.initialize(server);
            
        });
    }).catch(err => {
        console.error('Failed to initialize application:', err);
        process.exit(1);
    });
}

const shutdown = () => {
    console.log('Shutting down server...');
    
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = { app, server };