import '@testing-library/jest-native/extend-expect';

// mock safe-area insets
jest.mock('react-native-safe-area-context', () => {
  return {
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }) => children,
  };
});

// optional: a tiny mock for expo-router if tests throw about Link/Redirect
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    Link: ({ children }) => React.createElement('div', null, children),
    Redirect: () => null,
  };
});
