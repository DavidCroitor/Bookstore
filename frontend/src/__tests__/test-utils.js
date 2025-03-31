import React from 'react';
// Use renderHook directly from @testing-library/react
import { renderHook, act } from '@testing-library/react';
import { BooksProvider, useBooks } from '../context/book-context'; // Adjust path

// --- Mocking localStorage ---
export const localStorageMock = (() => {
  let store = {};
  return {
    // Use jest.fn() for all methods to allow spying/mocking
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    // Helper to inspect the store (optional)
    __getStore: () => store,
  };
})();

// Assign the mock to the global window object *once*
// This is generally better placed in jest.setup.js, but can work here.
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
    });
}

// --- Helper function to render the hook within the provider ---
export const renderBooksHookWithProvider = () => {
    // Define the wrapper component that provides the context
    const wrapper = ({ children }) => <BooksProvider>{children}</BooksProvider>;

    // Render the hook using the wrapper
    // renderHook returns an object with { result, rerender, unmount }
    const hookResult = renderHook(() => useBooks(), { wrapper });

    // We return the whole result object from renderHook,
    // so tests can access hookResult.result.current for the hook's value
    // and potentially hookResult.rerender or hookResult.unmount if needed.
    return hookResult;
};