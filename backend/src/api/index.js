const express = require('express');
const bookRoutes = require('./books.routes');
// Import other route files here (e.g., userRoutes)

const router = express.Router();

// Mount the book routes under the /books path
router.use('/books', bookRoutes);

// Mount other routes here

module.exports = router;