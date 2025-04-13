const app = require('./src/app');
const http = require('http');
const websocketService = require('./src/services/websocket-service');
const bookGenerator = require('./src/services/book-generator');

const server = http.createServer(app);

// Use environment variable for port or default
const PORT = process.env.PORT || 5000;


// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, () => {
        console.log(`Server listening on http://localhost:${PORT}`);
        console.log(`API available at http://localhost:${PORT}/api`);
        
        // Initialize WebSocket service with our HTTP server
        websocketService.initialize(server);
        console.log('WebSocket server initialized');
        
        // Start the book generator
        // bookGenerator.start(5000); // Generate a new book every 15 seconds
    });
}

// Graceful shutdown (optional but good practice)
const shutdown = () => {
    console.log('Shutting down server...');
    
    // Stop the book generator
    // bookGenerator.stop();
    
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = { app, server };