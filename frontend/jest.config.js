// jest.config.js
const nextJest = require('next/jest');

// Provide the path to your Next.js app to load next.config.js and .env files in your test environment
const createJestConfig = nextJest({
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  // Add more setup options before each test is run
  // if you have a setup file, configure it here:
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // <--- Important

  // Use jsdom as the test environment for React components
  testEnvironment: 'jsdom', // <--- Crucial for localStorage, window, DOM

  // If using TypeScript with a baseUrl set to the root directory then you need the below for aliases to work
  moduleDirectories: ['node_modules', '<rootDir>/'],


  testPathIgnorePatterns: [
    // Keep the default ignore pattern for node_modules
    '/node_modules/',
    // Add the pattern for your specific utils file
    '<rootDir>/src/__tests__/test-utils.js',
    // You can add other patterns here too if needed
    // Example: '/dist/'
  ],
  // Example moduleNameMapper if you use path aliases like @/components
  // moduleNameMapper: {
  //   '^@/components/(.*)$': '<rootDir>/components/$1',
  // },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);