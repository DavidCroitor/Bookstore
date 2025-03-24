import React, { createContext, useState, useContext } from 'react';
import { books as mockBooks } from "../context/mock-data.js"; // Make sure this is from the correct location

const BooksContext = createContext();

export const BooksProvider = ({ children }) => {
    const [books, setBooks] = useState(mockBooks); // Ensure this is your initial state

    // Add new book
    const addBook = (newBook) => {
        setBooks((prevBooks) => [
            ...prevBooks, 
            { ...newBook, id: prevBooks.length + 1 } // Make sure this is properly handled for new books
        ]);
    };

    // Update existing book
    const updateBook = (updatedBook) => {
        setBooks((prevBooks) =>
            prevBooks.map((book) =>
                book.id === updatedBook.id ? updatedBook : book
            )
        );
    };

    const sortBooksByPrice = (order = 'asc') => {
        const sortedBooks = [...books].sort((a, b) => {
            const priceA = parseFloat(a.price);
            const priceB = parseFloat(b.price)
            if (order === 'asc') {
                return priceA-priceB; // Ascending order
            } else {
                return priceB - priceA; // Descending order
            }
        });
        setBooks(sortedBooks); // Update the books state with sorted books
    };

    const deleteBook = (id) => {
        setBooks((prevBooks) => prevBooks.filter((book) => book.id !== id));
    };



    return (
        <BooksContext.Provider value={{ books, addBook, updateBook, deleteBook, sortBooksByPrice }}>
            {children}
        </BooksContext.Provider>
    );
};

export const useBooks = () => useContext(BooksContext);
