/** @type {import('jest').Config} */

module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-native-community|expo(nent)?|@expo(nent)?/.*|@expo/.*|expo-modules-core|expo-router)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1', 
  },
};