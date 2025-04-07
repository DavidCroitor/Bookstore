const BookService = require('./book.service');
const websocketService = require('./websocket-service');

class BookGenerator {
    constructor(bookService) {
        this.bookService = bookService;
        this.isRunning = false;
        this.interval = null;
    }

    // Generate a random book
    generateRandomBook() {
        const titles = ['The Great Journey', 'Silent Echo', 'Beyond the Horizon', 'Midnight Tales', 
                       'Lost in Time', 'The Hidden Door', 'Eternal Shadows', 'Whispers of the Past'];
        const authors = ['Emma Mitchell', 'Robert Johnson', 'Sarah Williams', 'Michael Brown', 
                        'Jennifer Davis', 'Daniel Wilson', 'Olivia Thompson', 'Matthew Anderson'];
        const genres = ['Fiction', 'Mystery', 'Science Fiction', 'Fantasy', 'Romance', 'Thriller', 
                       'Historical Fiction', 'Biography'];
                       
        return {
            title: titles[Math.floor(Math.random() * titles.length)],
            author: authors[Math.floor(Math.random() * authors.length)],
            genre: genres[Math.floor(Math.random() * genres.length)],
            price: parseFloat((Math.random() * 50 + 10).toFixed(2)),
            rating: Math.floor(Math.random() * 5) + 1
        };
    }

    // Start generating books periodically
    start(intervalMs = 10000) { // Default: generate a book every 10 seconds
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.interval = setInterval(async () => {
            try {
                const newBook = this.generateRandomBook();
                const savedBook = await this.bookService.createBook(newBook);
                
                console.log('Generated new book:', savedBook);
                
                // Broadcast the new book to all connected clients
                websocketService.broadcast({
                    type: 'new_book',
                    data: savedBook
                });
            } catch (error) {
                console.error('Error generating book:', error);
            }
        }, intervalMs);
        
        console.log(`Book generator started. Generating books every ${intervalMs/1000} seconds.`);
    }

    // Stop generating books
    stop() {
        if (!this.isRunning) return;
        
        clearInterval(this.interval);
        this.isRunning = false;
        console.log('Book generator stopped.');
    }
}

// Use the imported BookService directly instead of trying to instantiate it
const bookGenerator = new BookGenerator(BookService);

// Add signal handler for Ctrl+C (SIGINT)
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT (Ctrl+C). Shutting down gracefully...');
    bookGenerator.stop();
    process.exit(0);
});

module.exports = bookGenerator;
