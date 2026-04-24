/* global module */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'utils.js',
    'domUtils.js',
    'formHandler.js',
    'galleryManager.js',
    'reportGenerator.js',
    'script.js',
    'modules/storage.js',
    'modules/gps.js',
  ],
  coverageReporters: ['text-summary', 'lcov'],
};
