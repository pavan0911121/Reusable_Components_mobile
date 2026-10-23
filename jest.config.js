module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-redux|@reduxjs|redux|redux-thunk|reselect|immer)/)',
  ],
  setupFiles: ['<rootDir>/node_modules/react-native/jest/setup.js'],
};
