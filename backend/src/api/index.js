const express = require('express');
const bookRoutes = require('./books.routes');

const router = express.Router();

// Mount the book routes under the /books path
router.use('/books', bookRoutes);

module.exports = router;