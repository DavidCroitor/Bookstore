import React from 'react';
import { act } from '@testing-library/react'; // Import act
import '@testing-library/jest-dom';

// Import from your *UPDATED* utils file
import {
    localStorageMock,
    renderBooksHookWithProvider // Use the new hook rendering function
} from './test-utils'; // Adjust path if needed

import initialBooksData from '../context/books.json'; // Adjust path

describe('BooksProvider Delete Operation (deleteBook)', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.getItem.mockReturnValue(null); // Start empty
  });

  it('should delete an existing book from state and localStorage', () => {
    // Arrange: Render the hook - this also renders the provider
    // result.current initially holds the value after initial useEffects
    const { result } = renderBooksHookWithProvider();

    // Now result.current = { books, addBook, deleteBook, ... }
    const initialLength = result.current.books.length;
    if (initialLength === 0) throw new Error("Initial data empty");
    const bookToDelete = result.current.books[0];
    const idToDelete = bookToDelete.id;

    // Clear mock from initial render/save (if provider was changed to save empty)
     localStorageMock.setItem.mockClear(); // Keep this clear step

    // Act: Call deleteBook via result.current
    // Use act for updates triggered by hook interactions
    act(() => {
      result.current.deleteBook(idToDelete);
    });

    // Assert: Check updated state via result.current
    expect(result.current.books).toHaveLength(initialLength - 1);
    expect(result.current.books.find(b => b.id === idToDelete)).toBeUndefined();

    // Assert: Check localStorage persistence
    // This assertion depends on whether you removed the `if (books.length > 0)` check
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1); // Assumes you removed the 'if'
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'books.json',
      JSON.stringify(result.current.books)
    );
  });

  it('should not change state or persistence content if book ID does not exist', () => {
    // Arrange
    const { result } = renderBooksHookWithProvider();
    const originalBooks = [...result.current.books]; // Get initial state
    const idToDelete = 9999;

    // Check initial length right after render
    expect(result.current.books).toHaveLength(initialBooksData.length); // Should be 4 now

    localStorageMock.setItem.mockClear(); // Clear initial save

    // Act
    act(() => {
      result.current.deleteBook(idToDelete);
    });

    // Assert State
    expect(result.current.books).toEqual(originalBooks);
    expect(result.current.books).toHaveLength(initialBooksData.length); // Should still be 4

    // Assert LocalStorage
    // This assertion depends on whether you removed the `if (books.length > 0)` check
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1); // Assumes you removed the 'if'
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'books.json',
      JSON.stringify(originalBooks) // Content is unchanged
    );
  });
});