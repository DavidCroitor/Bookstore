import React from 'react';
import { act, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  localStorageMock,
  renderBooksHookWithProvider
} from './test-utils'; 

import initialBooksData from '../context/books.json';

describe('BooksProvider Add Operation (addBook)', () => {
  // Reset mocks before each test in this file
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    // Assume localStorage is empty for adding tests, triggering fallback
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should add a new book to the state and localStorage', () => {
    // Arrange: Render hook
    const { result } = renderBooksHookWithProvider();
    const initialLength = initialBooksData.length;
    const newBookData = {
        title: 'New Test Book',
        author: 'Test Author',
        price: '25.99',
        genre: 'Testing',
    };

    localStorageMock.setItem.mockClear(); // Clear initial save

    // Act
    act(() => {
        result.current.addBook(newBookData);
    });

    // Assert: Check updated state via result.current
    expect(result.current.books).toHaveLength(initialLength + 1);
    const addedBook = result.current.books.find(b => b.title === newBookData.title);
    expect(addedBook).toBeDefined();
    expect(addedBook).toEqual(
        expect.objectContaining({
            // ... other fields
            price: 25.99,
            id: initialLength + 1,
        })
    );

    // Assert: Check localStorage persistence
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'books.json',
        JSON.stringify(result.current.books)
    );

    // REMOVE THIS UI ASSERTION:
    // expect(screen.getByText(`Book Count: ${initialLength + 1}`)).toBeInTheDocument();
    });

   it('should correctly parse the price to float when adding', () => {
    renderBooksHookWithProvider();
    const { result } = renderBooksHookWithProvider();
      localStorageMock.setItem.mockClear(); // Clear initial save

      const bookWithStrPrice = { title: 'Priced Book', author: 'Tester', price: '100.50', genre: 'PriceTest' };

      act(() => {
        result.current.addBook(bookWithStrPrice);
      });

      const added = result.current.books.find(b => b.title === 'Priced Book');
      expect(added.price).toBe(100.50); // Ensure it's a number
      expect(typeof added.price).toBe('number');

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'books.json',
        expect.stringContaining('"price":100.5') // Check stringified number
      );
   });
});