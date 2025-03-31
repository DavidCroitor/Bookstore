import React from 'react';
import { act, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import from your utils file
import {
    localStorageMock,
    renderBooksHookWithProvider
} from './test-utils'; // Adjust path

// Import the original data for checking length etc.
import initialBooksData from '../context/books.json';

describe('BooksProvider Edit Operation (updateBook)', () => {
  // Reset mocks before each test in this file
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    // Assume localStorage is empty initially, so initialBooksData is loaded
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should update an existing book in state and localStorage', () => {
    // Arrange: Render provider, get initial data loaded
    renderBooksHookWithProvider();
    const { result } = renderBooksHookWithProvider();
    const bookToUpdate = result.current.books[0]; // Get the first book from initial data
    if (!bookToUpdate) throw new Error("Initial book data is empty, cannot run update test.");

    const updatedBookData = {
      ...bookToUpdate, // Keep the same ID and other fields
      title: 'Updated Title',
      price: '99.99', // Update price as string
    };

    // Clear mock calls from the initial render/save
    localStorageMock.setItem.mockClear();

    // Act: Call updateBook
    act(() => {
      result.current.updateBook(updatedBookData);
    });

    // Assert: Check updated state
    const updatedBookInState = result.current.books.find(b => b.id === bookToUpdate.id);
    expect(updatedBookInState).toBeDefined();
    expect(updatedBookInState.title).toBe('Updated Title');
    expect(updatedBookInState.price).toBe(99.99); // Check parsed price
    expect(updatedBookInState.author).toBe(bookToUpdate.author); // Ensure other fields remain
    expect(result.current.books).toHaveLength(initialBooksData.length); // Length shouldn't change

    // Assert: Check localStorage persistence
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1); // Called once since clear
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'books.json',
      JSON.stringify(result.current.books) // Called with the updated array
    );
  });

  it('should not change state or persistence content if book ID does not exist', () => {
    // Arrange: Render provider
    renderBooksHookWithProvider();
    const { result } = renderBooksHookWithProvider();
    const originalBooks = [...result.current.books]; // Copy original state
    const nonExistentUpdate = {
      id: 9999, // Non-existent ID
      title: 'Phantom Book',
      price: '10.00',
      author: 'Nobody',
      genre: 'Mystery'
    };

     // Clear mock calls from the initial render/save
    localStorageMock.setItem.mockClear();

    // Act: Attempt to update with non-existent ID
    act(() => {
        result.current.updateBook(nonExistentUpdate);
    });

    // Assert: State should be unchanged
    expect(result.current.books).toEqual(originalBooks);
    expect(result.current.books).toHaveLength(initialBooksData.length);

    // Assert: localStorage should have been called (due to setBooks)
    // but the content passed should be the *same* as the original.
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'books.json',
      JSON.stringify(originalBooks) // Content is unchanged
    );
  });

  it('should correctly parse the price to float when updating', () => {
    // Arrange
    const { result } = renderBooksHookWithProvider();
    const bookToUpdate = result.current.books[0];
    if (!bookToUpdate) throw new Error("Initial data empty");

    localStorageMock.setItem.mockClear(); // Clear initial save

    const updateData = { ...bookToUpdate, price: '0.99' }; // Update with string price

    // Act
    act(() => {
        result.current.updateBook(updateData);
    });

    // Assert: Check the state directly first
    const updatedInState = result.current.books.find(b => b.id === bookToUpdate.id);
    expect(updatedInState.price).toBe(0.99); // Check state price is number
    expect(typeof updatedInState.price).toBe('number');

    // Assert: Check that setItem was called once
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);

    // Assert: Check the *content* passed to setItem
    // 1. Get the arguments of the first (and only) call to setItem
    const setItemArgs = localStorageMock.setItem.mock.calls[0];
    expect(setItemArgs[0]).toBe('books.json'); // Check the key

    // 2. Parse the stringified data that was passed
    const savedBooks = JSON.parse(setItemArgs[1]);

    // 3. Find the specific book within the saved data and check its price
    const savedUpdatedBook = savedBooks.find(b => b.id === bookToUpdate.id);
    expect(savedUpdatedBook).toBeDefined();
    expect(savedUpdatedBook.price).toBe(0.99); // Ensure the price was saved correctly as a number
    // Optionally check other fields haven't changed unexpectedly
    expect(savedUpdatedBook.title).toBe(bookToUpdate.title);
    expect(savedUpdatedBook.author).toBe(bookToUpdate.author);
});
});