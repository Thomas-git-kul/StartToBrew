/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.preload.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  moduleNameMapper: {
    // 👇 This line forces Jest to never import the real CSS interop library
    '^react-native-css-interop$': '<rootDir>/__mocks__/react-native-css-interop.js',
  },

  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?|@expo-google-fonts|react-clone-referenced-element|react-navigation|@react-navigation|@testing-library)',
  ],
};