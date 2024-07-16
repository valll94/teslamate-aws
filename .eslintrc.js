module.exports = {
    root: true, // Indicates this file is the root ESLint configuration
    env: {
      node: true, // Enables Node.js global variables and Node.js scoping
      es6: true, // Enables ES6 features such as modules
    },
    extends: [
      'eslint:recommended', // Use ESLint's recommended rules
      // Add more configurations or plugins as needed
    ],
    parserOptions: {
      ecmaVersion: 2021, // Use ECMAScript 2021 syntax
      sourceType: 'module', // Allow the use of imports
    },
    rules: {
      // Define your project-specific rules here
      // Example:
      'no-console': 'error', // Disallow the use of console statements
      // Add more rules as needed
    },
  };
  