const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../../data/books.json');
let books = [];
let nextId = 1;
let initialBooksData = []; // Store the initially loaded data

const loadData = () => {
    try {
        const rawData = fs.readFileSync(dataPath, 'utf8');
        // Store the original data for resetting
        initialBooksData = JSON.parse(rawData);
        // Use a deep copy for the working array
        books = JSON.parse(JSON.stringify(initialBooksData));
        if (books.length > 0) {
            nextId = Math.max(...books.map(b => b.id)) + 1;
        } else {
            nextId = 1;
        }
        console.log(`Loaded ${books.length} books from ${dataPath}. Next ID: ${nextId}`);
    } catch (error) {
        console.error("Error reading or parsing books.json:", error);
        initialBooksData = [];
        books = [];
        nextId = 1;
    }
};

// Load data when the module is first required
loadData();

// ... (keep existing saveData, findAll, findById, create, update, remove functions)
// Note: The simple saveData function might cause issues if tests run in parallel
// In a real DB scenario, transactions or test-specific databases are used.

const findAll = () => {
    return [...books];
};

const findById = (id) => {
    const numericId = parseInt(id, 10);
    return books.find(book => book.id === numericId);
};

const create = (bookData) => {
    const newBook = {
        ...bookData,
        id: nextId++,
        price: parseFloat(bookData.price)
    };
    books.push(newBook);
    // saveData(); // Maybe skip saving during tests unless persistence is explicitly tested
    return newBook;
};

const update = (id, updateData) => {
    const numericId = parseInt(id, 10);
    const bookIndex = books.findIndex(book => book.id === numericId);
    if (bookIndex === -1) {
        return null;
    }
    const originalBook = books[bookIndex];
    const updatedBook = {
        ...originalBook,
        ...updateData,
        id: originalBook.id,
        price: updateData.price !== undefined ? parseFloat(updateData.price) : originalBook.price
    };
    books[bookIndex] = updatedBook;
    // saveData(); // Skip saving?
    return updatedBook;
};

const remove = (id) => {
    const numericId = parseInt(id, 10);
    const bookIndex = books.findIndex(book => book.id === numericId);
    if (bookIndex === -1) {
        return false;
    }
    books.splice(bookIndex, 1);
    // saveData(); // Skip saving?
    return true;
};

// --- Test Only Reset Function ---
// Resets the in-memory 'books' array to the initially loaded state
const resetDataForTesting = () => {
    console.log('Resetting repository data for test...');
    // Use deep copy to avoid modifying initialBooksData
    books = JSON.parse(JSON.stringify(initialBooksData));
    if (books.length > 0) {
        nextId = Math.max(...books.map(b => b.id)) + 1;
    } else {
        nextId = 1;
    }
    console.log(`Repository reset. ${books.length} books loaded. Next ID: ${nextId}`);
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove,
    // Conditionally export the reset function only during tests
    _resetDataForTesting: process.env.NODE_ENV === 'test' ? resetDataForTesting : undefined,
};