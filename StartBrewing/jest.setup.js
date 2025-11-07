import '@testing-library/jest-native/extend-expect';

jest.mock('react-native-safe-area-context', () => {
  return {
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }) => children,
  };
});

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    Link: ({ children }) => React.createElement('div', null, children),
    Redirect: () => null,
  };
});

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  return {
    MaterialCommunityIcons: (props) => React.createElement("Icon", props),
    Ionicons: (props) => React.createElement("Icon", props),
    FontAwesome: (props) => React.createElement("Icon", props),
  };
});
