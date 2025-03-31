const request = require('supertest');
const { app } = require('../api/server'); // Import the Express app

// Use a copy of the initial data for tests to avoid interference
let initialBooks = require('../../books.json');
let testBooks; // This will hold the mutable data for each test

// Reset data before each test
beforeEach(() => {
  // Deep copy initial books to reset state for each test
  testBooks = JSON.parse(JSON.stringify(initialBooks));
  // NOTE: This simple reset only works because the server.js `books` array
  // is exported and modified directly. In a real app with a database or
  // more complex state management, you'd need a proper reset mechanism
  // (e.g., clearing DB tables, resetting service state).
  // For this example, we directly manipulate the exported 'books' array reference.
  require('../api/server').books.length = 0; // Clear the server's array
  testBooks.forEach(b => require('../api/server').books.push(b)); // Repopulate server's array
  require('../api/server').nextId = testBooks.length > 0 ? Math.max(...testBooks.map(b => b.id)) + 1 : 1; // Reset nextId
});


describe('Books API', () => {

    // --- GET /books ---
    describe('GET /books', () => {
        it('should return all books', async () => {
            const res = await request(app).get('/books');
            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toEqual(testBooks.length);
            // Check if IDs match (simple check)
            const responseIds = res.body.map(b => b.id);
            const initialIds = testBooks.map(b => b.id);
            expect(responseIds.sort()).toEqual(initialIds.sort());
        });

        it('should filter books by title (case-insensitive)', async () => {
            const res = await request(app).get('/books?filter=dune');
            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].title).toEqual("Dune");
        });

        it('should filter books by author (case-insensitive)', async () => {
            const res = await request(app).get('/books?filter=marcus');
            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].author).toEqual("Marcus Aurelius");
        });

        it('should return empty array if filter matches nothing', async () => {
            const res = await request(app).get('/books?filter=nonexistent');
            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBe(0);
        });

        it('should sort books by price ascending', async () => {
            const res = await request(app).get('/books?sortBy=price&order=asc');
            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBeGreaterThan(1);
            expect(res.body[0].price).toBeLessThanOrEqual(res.body[1].price);
            expect(res.body[0].title).toBe('Animal Farm'); // Assuming 1984 is the cheapest
        });

        it('should sort books by title descending', async () => {
            const res = await request(app).get('/books?sortBy=title&order=desc');
            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBeGreaterThan(1);
            expect(res.body[0].title > res.body[1].title).toBeTruthy();
             expect(res.body[0].title).toBe('To Kill a Mockingbird'); // Assuming this comes first alphabetically desc
        });

         it('should return 400 for invalid sortBy field', async () => {
            const res = await request(app).get('/books?sortBy=invalidField');
            expect(res.statusCode).toEqual(400);
            expect(res.body.errors).toEqual(expect.arrayContaining([
                expect.objectContaining({ 'sortBy': 'Invalid sortBy field' })
            ]));
        });
    });

     // --- GET /books/:id ---
    describe('GET /books/:id', () => {
        it('should return a single book if ID exists', async () => {
            const existingId = testBooks[0].id;
            const res = await request(app).get(`/books/${existingId}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.id).toEqual(existingId);
            expect(res.body.title).toEqual(testBooks[0].title);
        });

        it('should return 404 if ID does not exist', async () => {
            const nonExistentId = 9999;
            const res = await request(app).get(`/books/${nonExistentId}`);
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toEqual('Book not found');
        });

         it('should return 400 for invalid ID format', async () => {
            const res = await request(app).get(`/books/invalid-id`);
            expect(res.statusCode).toEqual(400);
             expect(res.body.errors).toEqual(expect.arrayContaining([
                 expect.objectContaining({ 'id': 'ID must be a positive integer' })
             ]));
        });
    });


    // --- POST /books ---
    describe('POST /books', () => {
        it('should add a new book successfully', async () => {
            const newBook = { title: 'Dune', author: 'Frank Herbert', genre:"Science Fiction",  price: 15.99 };
            const res = await request(app)
                .post('/books')
                .send(newBook);

            expect(res.statusCode).toEqual(201);
            expect(res.body.title).toBe(newBook.title);
            expect(res.body.author).toBe(newBook.author);
            expect(res.body.price).toBe(newBook.price);
            expect(res.body.id).toBeDefined();

            // Verify it was actually added (check via GET)
            const getRes = await request(app).get('/books');
            expect(getRes.body.length).toBe(testBooks.length + 1);
            expect(getRes.body.find(b => b.id === res.body.id)).toBeDefined();
        });

        it('should return 400 if title is missing', async () => {
            const invalidBook = { author: 'Frank Herbert', genre:"Science Fiction", price: 15.99 };
            const res = await request(app)
                .post('/books')
                .send(invalidBook);
            expect(res.statusCode).toEqual(400);
            expect(res.body.errors).toEqual(expect.arrayContaining([
                expect.objectContaining({ title: 'Title is required' })
            ]));
        });

        it('should return 400 if author is missing', async () => {
            const invalidBook = { title: 'Dune',genre:"Science Fiction", price: 15.99 };
            const res = await request(app)
                .post('/books')
                .send(invalidBook);
            expect(res.statusCode).toEqual(400);
             expect(res.body.errors).toEqual(expect.arrayContaining([
                 expect.objectContaining({ author: 'Author is required' })
             ]));
        });

        it('should return 400 if genre is missing', async () => {
            const invalidBook = { title: 'Valid Title', author: 'Valid Author', price: 10.0 }; // NO genre
            const res = await request(app).post('/books').send(invalidBook);
            expect(res.statusCode).toEqual(400);
            expect(res.body.errors).toEqual(expect.arrayContaining([
                expect.objectContaining({ genre: 'Genre is required' }) // Or whatever your message is
            ]));
        });
        
        it('should return 400 if genre is not a string', async () => {
            const invalidBook = { title: 'Valid Title', author: 'Valid Author', price: 10.0, genre: 123 }; // Genre is a number
            const res = await request(app).post('/books').send(invalidBook);
            expect(res.statusCode).toEqual(400);
            expect(res.body.errors).toEqual(expect.arrayContaining([
                expect.objectContaining({ genre: 'Genre must be a string' })
            ]));
        });
        
         it('should return 400 if genre is too short', async () => {
            const invalidBook = { title: 'Valid Title', author: 'Valid Author', price: 10.0, genre: 'AB' }; // Genre too short
            const res = await request(app).post('/books').send(invalidBook);
            expect(res.statusCode).toEqual(400);
            expect(res.body.errors).toEqual(expect.arrayContaining([
                expect.objectContaining({ genre: 'Genre must be between 3 and 50 characters' })
            ]));
        });

         it('should return 400 if price is not a positive number', async () => {
            const invalidBook = { title: 'Dune', author: 'Frank Herbert', genre:"Science Fiction", price: -5 };
            const res = await request(app)
                .post('/books')
                .send(invalidBook);
            expect(res.statusCode).toEqual(400);
             expect(res.body.errors).toEqual(expect.arrayContaining([
                expect.objectContaining({ price: 'Price must be a positive number' })
            ]));
        });

        it('should return 400 if price is not a number', async () => {
            const invalidBook = { title: 'Valid Title', author: 'Valid Author', genre: 'Valid Genre', price: "not-a-price" }; // Invalid type
            const res = await request(app).post('/books').send(invalidBook);
            expect(res.statusCode).toEqual(400);
            expect(res.body.errors).toEqual(expect.arrayContaining([
                 expect.objectContaining({ price: expect.stringContaining('Price must be a positive number') }) // Or a more specific type error message
            ]));
        });
    });

    // --- PATCH /books/:id ---
    describe('PATCH /books/:id', () => {
        it('should update an existing book successfully', async () => {
            const existingId = testBooks[1].id;
            const updateData = { title: 'Pride and Prejudice (Revised)', price: 11.50 };
            const res = await request(app)
                .patch(`/books/${existingId}`)
                .send(updateData);

            expect(res.statusCode).toEqual(200);
            expect(res.body.id).toBe(existingId);
            expect(res.body.title).toBe(updateData.title);
            expect(res.body.price).toBe(updateData.price);
            expect(res.body.author).toBe(testBooks[1].author); // Author should remain unchanged

             // Verify change persisted
            const getRes = await request(app).get(`/books/${existingId}`);
            expect(getRes.body.title).toBe(updateData.title);
            expect(getRes.body.price).toBe(updateData.price);

        });

        it('should return 404 if trying to update a non-existent book', async () => {
            const nonExistentId = 9999;
            const updateData = { title: 'Does not matter' };
            const res = await request(app)
                .patch(`/books/${nonExistentId}`)
                .send(updateData);
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toEqual('Book not found');
        });

         it('should return 400 if update data is invalid (e.g., negative price)', async () => {
            const existingId = testBooks[0].id;
            const updateData = { price: -10 };
            const res = await request(app)
                .patch(`/books/${existingId}`)
                .send(updateData);
             expect(res.statusCode).toEqual(400);
             expect(res.body.errors).toEqual(expect.arrayContaining([
                 expect.objectContaining({ price: 'Price must be a positive number' })
             ]));
        });

          it('should return 400 for invalid ID format', async () => {
            const updateData = { title: 'Valid title' };
            const res = await request(app)
                .patch(`/books/invalid-id`)
                .send(updateData);
            expect(res.statusCode).toEqual(400);
              expect(res.body.errors).toEqual(expect.arrayContaining([
                 expect.objectContaining({ id: 'ID must be a positive integer' })
             ]));
        });
    });

    // --- DELETE /books/:id ---
    describe('DELETE /books/:id', () => {
        it('should delete an existing book successfully', async () => {
            const existingId = testBooks[2].id;
            const res = await request(app).delete(`/books/${existingId}`);

            expect(res.statusCode).toEqual(204); // No Content

            // Verify it's gone
            const getRes = await request(app).get(`/books/${existingId}`);
            expect(getRes.statusCode).toEqual(404);

            const getAllRes = await request(app).get('/books');
            expect(getAllRes.body.length).toBe(testBooks.length - 1);
        });

        it('should return 404 if trying to delete a non-existent book', async () => {
            const nonExistentId = 9999;
            const res = await request(app).delete(`/books/${nonExistentId}`);
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toEqual('Book not found');
        });

         it('should return 400 for invalid ID format', async () => {
            const res = await request(app).delete(`/books/invalid-id`);
            expect(res.statusCode).toEqual(400);
              expect(res.body.errors).toEqual(expect.arrayContaining([
                 expect.objectContaining({ id: 'ID must be a positive integer' })
             ]));
        });
    });
});