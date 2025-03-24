const express = require('express');

const cors = require('cors');

const mongoose = require('mongoose');

const app = express();


Book.find({name });

app.use(cors({origin: 'http://localhost:3000'}));
app.use(express.json());

app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from the backend' });
});

const PORT = 5000
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
}); 