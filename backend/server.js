const app = require('./src/app'); // Import the configured Express app

// Use environment variable for port or default
const PORT = process.env.PORT || 5000;

let server;

// Only start server if not in test environment
// (Test runners often manage server lifecycle)
if (process.env.NODE_ENV !== 'test') {
    server = app.listen(PORT, () => {
        console.log(`Server listening on http://localhost:${PORT}`);
        console.log(`API available at http://localhost:${PORT}/api`);
    });
}

// Graceful shutdown (optional but good practice)
const shutdown = () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server closed.');
        // Add DB closing logic here if needed
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown); // Standard signal for termination
process.on('SIGINT', shutdown); // Signal for Ctrl+C

// Export the app instance *only if needed* for specific programmatic use or some test setups
// For typical supertest integration tests, you often import this server.js file.
module.exports = { app, server };