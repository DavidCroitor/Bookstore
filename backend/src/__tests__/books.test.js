const request = require('supertest');
const app = require('../app'); // Import the Express app instance from src/app.js
const bookRepository = require('../repositories/book.repository'); // Import the repository

// Make sure NODE_ENV is set to 'test' (Jest usually does this automatically)
// You can add this check for safety:
if (process.env.NODE_ENV !== 'test') {
  throw new Error('Tests must be run with NODE_ENV=test');
}

// Check if the reset function exists (it should in test env)
if (!bookRepository._resetDataForTesting) {
    throw new Error('Repository reset function (_resetDataForTesting) is not available. Ensure NODE_ENV=test.');
}

// Reset data before each test using the repository's reset function
beforeEach(() => {
  bookRepository._resetDataForTesting();
  // No need to load initialBooks here, the repo handles its own initial state.
});

describe('Books API (/api/books)', () => {

    // --- GET /api/books ---
    describe('GET /api/books', () => {
        it('should return all books', async () => {
            // Get current state from repo for comparison length if needed
            const currentBooks = bookRepository.findAll();
            const res = await request(app).get('/api/books'); // <--- Updated path

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toEqual(currentBooks.length); // Compare length against repo state
            // Add more specific checks if necessary
        });
        
        it('should filter books by title (case-insensitive)', async () => {
            const res = await request(app).get('/api/books?filter=dune'); // <--- Updated path
            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBeGreaterThanOrEqual(1); // Be flexible if data changes
            expect(res.body.some(b => b.title.toLowerCase().includes("dune"))).toBeTruthy();
        });

        it('should filter books by author (case-insensitive)', async () => {
            const res = await request(app).get('/api/books?filter=marcus'); // <--- Updated path
             expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
            expect(res.body.some(b => b.author.toLowerCase().includes("marcus"))).toBeTruthy();
        });

        it('should return empty array if filter matches nothing', async () => {
            const res = await request(app).get('/api/books?filter=nonexistentxyz'); // <--- Updated path
            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBe(0);
        });

        it('should sort books by price ascending', async () => {
            const res = await request(app).get('/api/books?sortBy=price&order=asc'); // <--- Updated path
            expect(res.statusCode).toEqual(200);
            if (res.body.length > 1) {
                expect(res.body[0].price).toBeLessThanOrEqual(res.body[1].price);
            }
        });

        it('should sort books by title descending', async () => {
            const res = await request(app).get('/api/books?sortBy=title&order=desc'); // <--- Updated path
            expect(res.statusCode).toEqual(200);
             if (res.body.length > 1) {
                // Using localeCompare for robust string comparison
                expect(res.body[0].title.localeCompare(res.body[1].title)).toBeGreaterThanOrEqual(0);
            }
        });

         it('should return 422 for invalid sortBy field', async () => { // <-- Status 422
            const res = await request(app).get('/api/books?sortBy=invalidField'); // <--- Updated path
            expect(res.statusCode).toEqual(422); // <-- Status 422
             // Check the new error format
            expect(res.body.message).toEqual('Validation failed');
            expect(res.body.errors).toHaveProperty('sortBy', 'Invalid sortBy field'); // <-- Updated check
        });

         it('should return 422 for invalid order field', async () => { // <-- Status 422
            const res = await request(app).get('/api/books?order=invalid'); // <--- Updated path
            expect(res.statusCode).toEqual(422); // <-- Status 422
            expect(res.body.message).toEqual('Validation failed');
            expect(res.body.errors).toHaveProperty('order', 'Invalid order value'); // <-- Updated check
        });
    });

     // --- GET /api/books/:id ---
    describe('GET /api/books/:id', () => {
        it('should return a single book if ID exists', async () => {
            const books = bookRepository.findAll(); // Get current books from repo
            if (books.length === 0) {
                console.warn("Skipping GET /:id test - no books in repository");
                return; // Skip test if repo is empty
            }
            const existingId = books[0].id;
            const res = await request(app).get(`/api/books/${existingId}`); // <--- Updated path
            expect(res.statusCode).toEqual(200);
            expect(res.body.id).toEqual(existingId);
            expect(res.body.title).toEqual(books[0].title);
        });

        it('should return 404 if ID does not exist', async () => {
            const nonExistentId = 99999;
            const res = await request(app).get(`/api/books/${nonExistentId}`); // <--- Updated path
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toEqual('Book not found'); // Message comes from service/http-errors
        });

         it('should return 422 for invalid ID format (non-integer)', async () => { // <-- Status 422
            const res = await request(app).get(`/api/books/invalid-id`); // <--- Updated path
            expect(res.statusCode).toEqual(422); // <-- Status 422
            expect(res.body.message).toEqual('Validation failed');
            expect(res.body.errors).toHaveProperty('id', 'ID must be a positive integer'); // <-- Updated check
        });

         it('should return 422 for invalid ID format (zero)', async () => { // <-- Status 422
            const res = await request(app).get(`/api/books/0`); // <--- Updated path
            expect(res.statusCode).toEqual(422); // <-- Status 422
            expect(res.body.message).toEqual('Validation failed');
            expect(res.body.errors).toHaveProperty('id', 'ID must be a positive integer'); // <-- Updated check
        });
    });


    // --- POST /api/books ---
    describe('POST /api/books', () => {
        it('should add a new book successfully', async () => {
            const newBookData = { title: 'Hyperion', author: 'Dan Simmons', genre:"Science Fiction", price: 18.50 };
            const initialCount = bookRepository.findAll().length;

            const res = await request(app)
                .post('/api/books') // <--- Updated path
                .send(newBookData);

            expect(res.statusCode).toEqual(201);
            expect(res.body.title).toBe(newBookData.title);
            expect(res.body.author).toBe(newBookData.author);
            expect(res.body.genre).toBe(newBookData.genre);
            expect(res.body.price).toBe(newBookData.price);
            expect(res.body.id).toBeDefined();
            expect(typeof res.body.id).toBe('number'); // ID should be a number

            // Verify it was actually added in the repository
            const currentBooks = bookRepository.findAll();
            expect(currentBooks.length).toBe(initialCount + 1);
            expect(currentBooks.find(b => b.id === res.body.id)).toMatchObject(newBookData);
        });

        it('should return 422 if title is missing', async () => { // <-- Status 422
            const invalidBook = { author: 'Dan Simmons', genre:"Science Fiction", price: 18.50 };
            const res = await request(app)
                .post('/api/books') // <--- Updated path
                .send(invalidBook);
            expect(res.statusCode).toEqual(422); // <-- Status 422
            expect(res.body.errors).toHaveProperty('title'); // Check if key exists
            expect(res.body.errors.title).toContain('required'); // Check message content
        });

         it('should return 422 if genre is too short', async () => { // <-- Status 422
            const invalidBook = { title: 'Valid Title', author: 'Valid Author', price: 10.0, genre: 'AB' };
            const res = await request(app).post('/api/books').send(invalidBook); // <--- Updated path
            expect(res.statusCode).toEqual(422); // <-- Status 422
            expect(res.body.errors).toHaveProperty('genre', 'Genre must be between 3 and 50 characters');
        });

        it('should return 422 if price is negative', async () => { // <-- Status 422
            const invalidBook = { title: 'Hyperion', author: 'Dan Simmons', genre:"Science Fiction", price: -5 };
            const res = await request(app)
                .post('/api/books') // <--- Updated path
                .send(invalidBook);
            expect(res.statusCode).toEqual(422); // <-- Status 422
            expect(res.body.errors).toHaveProperty('price');
            expect(res.body.errors.price).toContain('positive number');
        });

         it('should return 422 for multiple validation errors', async () => { // <-- Status 422
            const invalidBook = { title: '', author: '', genre:"AB", price: -5 }; // Multiple errors
            const res = await request(app)
                .post('/api/books') // <--- Updated path
                .send(invalidBook);
            expect(res.statusCode).toEqual(422); // <-- Status 422
            expect(res.body.errors).toHaveProperty('title');
            expect(res.body.errors).toHaveProperty('author');
            expect(res.body.errors).toHaveProperty('genre');
            expect(res.body.errors).toHaveProperty('price');
        });
    });

    // --- PATCH /api/books/:id ---
    describe('PATCH /api/books/:id', () => {
        it('should update an existing book successfully (only title)', async () => {
             const books = bookRepository.findAll();
             if (books.length === 0) { console.warn("Skipping PATCH test - no books"); return; }
             const existingBook = books[0];
             const updateData = { title: 'The Great Gatsby Revised' };

            const res = await request(app)
                .patch(`/api/books/${existingBook.id}`) // <--- Updated path
                .send(updateData);

            expect(res.statusCode).toEqual(200);
            expect(res.body.id).toBe(existingBook.id);
            expect(res.body.title).toBe(updateData.title); // Title updated
            expect(res.body.price).toBe(existingBook.price); // Price unchanged
            expect(res.body.author).toBe(existingBook.author); // Author unchanged

             // Verify change in repository
             const updatedRepoBook = bookRepository.findById(existingBook.id);
             expect(updatedRepoBook.title).toBe(updateData.title);
             expect(updatedRepoBook.price).toBe(existingBook.price); // Check repo state
        });

         it('should update an existing book successfully (only price)', async () => {
             const books = bookRepository.findAll();
             if (books.length === 0) { console.warn("Skipping PATCH test - no books"); return; }
             const existingBook = books[0];
             const updateData = { price: 99.99 };

            const res = await request(app)
                .patch(`/api/books/${existingBook.id}`) // <--- Updated path
                .send(updateData);

            expect(res.statusCode).toEqual(200);
            expect(res.body.id).toBe(existingBook.id);
            expect(res.body.title).toBe(existingBook.title); // Title unchanged
            expect(res.body.price).toBe(updateData.price); // Price updated

             // Verify change in repository
             const updatedRepoBook = bookRepository.findById(existingBook.id);
             expect(updatedRepoBook.price).toBe(updateData.price);
        });


        it('should return 404 if trying to update a non-existent book', async () => {
            const nonExistentId = 99999;
            const updateData = { title: 'Does not matter' };
            const res = await request(app)
                .patch(`/api/books/${nonExistentId}`) // <--- Updated path
                .send(updateData);
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toEqual('Book not found');
        });

         it('should return 422 if update data is invalid (negative price)', async () => { // <-- Status 422
            const books = bookRepository.findAll();
            if (books.length === 0) { console.warn("Skipping PATCH validation test - no books"); return; }
            const existingId = books[0].id;
            const updateData = { price: -10 };

            const res = await request(app)
                .patch(`/api/books/${existingId}`) // <--- Updated path
                .send(updateData);
             expect(res.statusCode).toEqual(422); // <-- Status 422
             expect(res.body.errors).toHaveProperty('price');
             expect(res.body.errors.price).toContain('positive number');
        });

          it('should return 422 for invalid ID format on PATCH', async () => { // <-- Status 422
            const updateData = { title: 'Valid title' };
            const res = await request(app)
                .patch(`/api/books/invalid-id`) // <--- Updated path
                .send(updateData);
            expect(res.statusCode).toEqual(422); // <-- Status 422
            expect(res.body.errors).toHaveProperty('id', 'ID must be a positive integer');
        });
    });

    // --- DELETE /api/books/:id ---
    describe('DELETE /api/books/:id', () => {
        it('should delete an existing book successfully', async () => {
            // Add a book specifically for deletion to avoid emptying the repo
            const bookToDeleteData = { title: 'ToDelete', author: 'Temp', genre: 'Test', price: 1 };
            const addedBook = bookRepository.create(bookToDeleteData); // Add directly via repo for test setup
            const existingId = addedBook.id;
            const initialCount = bookRepository.findAll().length;

            const res = await request(app).delete(`/api/books/${existingId}`); // <--- Updated path

            expect(res.statusCode).toEqual(204); // No Content
            expect(res.body).toEqual({}); // Body should be empty

            // Verify it's gone from the repository
            const deletedBook = bookRepository.findById(existingId);
            expect(deletedBook).toBeUndefined();
            expect(bookRepository.findAll().length).toBe(initialCount - 1);
        });

        it('should return 404 if trying to delete a non-existent book', async () => {
            const nonExistentId = 99999;
            const res = await request(app).delete(`/api/books/${nonExistentId}`); // <--- Updated path
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toEqual('Book not found');
        });

         it('should return 422 for invalid ID format on DELETE', async () => { // <-- Status 422
            const res = await request(app).delete(`/api/books/invalid-id`); // <--- Updated path
            expect(res.statusCode).toEqual(422); // <-- Status 422
            expect(res.body.errors).toHaveProperty('id', 'ID must be a positive integer');
        });
    });
});