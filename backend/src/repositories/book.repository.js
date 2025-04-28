const Book = require('../models/book.model');
const { connectToDatabase } = require('../utils/mongodb');

connectToDatabase().catch(console.error);

const transformBook = (book) => {
    if (!book) return null;

    const {_id, ...bookData} = book.toObject ? book.toObject() : book;
    return {
        id: _id,
        ...bookData,
    };
}

const findAll = async() => {
    try {
        const books = await Book.find({});
        return books.map(transformBook);
    } catch (error) {
        console.error('Error fetching books:', error);
        throw error;
    }
}

const findById = async(id) => {
    try {
        const book = await Book.findById(id);
        return transformBook(book);
    } catch (error) {
        console.error('Error fetching book by ID:', error);
        throw error;
    }
}

const create = async(bookData) => {
    try {
        const book = new Book({
            ...bookData,
            price: parseFloat(bookData.price)
        });
        await book.save();
        return transformBook(book);
    } catch (error) {
        console.error('Error creating book:', error);
        throw error;
    }
}

const update = async(id, bookData) => {
    try {
        if(bookData.price !== undefined) {
            bookData.price = parseFloat(bookData.price); 
        }

        const updatedBook = await Book.findByIdAndUpdate(id, bookData, { new: true, runValidators: true });

        return transformBook(updatedBook);
    }
    catch (error) {
        console.error('Error updating book:', error);
        throw error;
    }
};

const remove = async(id) => {  
    try {
        const result = await Book.findByIdAndDelete(id);
        return result !== null;
    }
    catch (error) {
        console.error('Error deleting book:', error);
        throw error;
    }
}



const resetDataForTesting = async () => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('Attempted to reset database outside of test environment');
      return;
    }
    
    try {
      console.log('Resetting MongoDB data for testing...');
      await Book.deleteMany({});
      
      // Optionally seed with initial test data
      if (process.env.SEED_TEST_DATA === 'true') {
        const seedData = require('../../data/test-seed-data.json');
        await Book.insertMany(seedData);
      }
      
      console.log('Test data reset complete');
    } catch (error) {
      console.error('Error resetting test data:', error);
      throw error;
    }
};   

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove,
    _resetDataForTesting : process.env.NODE_ENV === 'test' ? resetDataForTesting : undefined
};