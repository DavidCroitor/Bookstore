const express = require('express');
const cors = require('cors');
const apiRouter = require('./api'); // Import the main router from api/index.js
const { NotFoundError } = require('http-errors'); // Or require('http-errors') directly

const app = express();


app.use(cors({ origin: 'http://localhost:3000' })); 

app.use(express.json());

// --- API Routes ---
// Mount the main API router under the /api prefix
app.use('/api', apiRouter);

app.use((req, res, next) => {
    next(new NotFoundError('Resource not found'));
});

app.use((err, req, res, next) => {
    console.error("ERROR:", err.message); // Log the error message
     // Log stack trace for non-http errors or during development
    if (process.env.NODE_ENV !== 'production' || !err.status) {
        console.error(err.stack);
    }

    const statusCode = err.status || 500;
    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        errors: err.errors || undefined
    });
});

module.exports = app; 