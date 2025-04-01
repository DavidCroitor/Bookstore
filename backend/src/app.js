const express = require('express');
const cors = require('cors');
const apiRouter = require('./api'); // Import the main router from api/index.js
const { NotFoundError } = require('http-errors'); // Or require('http-errors') directly

const app = express();

// --- Core Middleware ---
// Allow requests from your frontend development server
app.use(cors({ origin: 'http://localhost:3000' })); // Make origin configurable via .env later
// Parse JSON request bodies
app.use(express.json());
// Optional: Parse URL-encoded bodies (if using forms)
// app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
// Mount the main API router under the /api prefix
app.use('/api', apiRouter);

// --- Catch 404 and forward to error handler ---
// If no route matched by now, it's a 404
app.use((req, res, next) => {
    next(new NotFoundError('Resource not found')); // Use http-errors for consistency
});

// --- Central Error Handler ---
// Must have 4 arguments (err, req, res, next)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error("ERROR:", err.message); // Log the error message
     // Log stack trace for non-http errors or during development
    if (process.env.NODE_ENV !== 'production' || !err.status) {
        console.error(err.stack);
    }

    // Respond with the error status code or 500 Internal Server Error
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        // Optionally include stack trace in development
        // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        // Optionally include specific validation errors if passed through
        errors: err.errors || undefined
    });
});

module.exports = app; // Export the configured app instance