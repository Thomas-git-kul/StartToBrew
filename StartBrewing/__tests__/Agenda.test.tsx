import React, { FC, ReactNode } from 'react';
import { Text, TextProps } from "react-native";
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Agenda from "../app/(tabs)/Agenda";

// Mocks
// Mock Expo Router
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock react-native-paper components
jest.mock("react-native-paper", () => {
  const React = require("react");
  return {
    List: {
      Accordion: ({ children, onPress, expanded, testID }: any) =>
        React.createElement(
          "View",
          { onClick: onPress, "data-expanded": expanded, "data-testid": testID },
          children
        ),
    },
  };
});

// Mock SafeAreaView and View
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
  };
});

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

// Mock navigation hooks
jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback: any) => callback(),
}));

// Mock Colors & Fonts
jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: { WHITE: "#fff", LIGHT_BG: "#eee", ACCENT_PRIMARY: "#00f" },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: { BODY_BOLD: "System" },
}));

// Mock components
jest.mock("@/components/header", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ title }: any) => <Text>{title}</Text>;
});

jest.mock("@/components/themed-text", () => {
  const React = require("react");
  const { Text } = require("react-native");
  const ThemedText = ({ children, testID }: any) => <Text testID={testID}>{children}</Text>;
  return { ThemedText };
});

jest.mock("react-native-calendars", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Calendar: (props: any) => React.createElement(Text, { testID: props.testID }, "Calendar"),
  };
});

// Mock fonts hook
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: jest.fn(),
}));

describe('Agenda Screen', () => {
  it('renders the header', () => {
    const { getByText } = render(<Agenda />);
    expect(getByText('Agenda')).toBeTruthy();
  });

  /*
  it('renders the calendar container', () => {
    const { getByTestId } = render(<Agenda />);
    expect(getByTestId('calendar-container')).toBeTruthy();
  });
  */
 
  it('shows "No tasks for this day" if no tasks exist', async () => {
    const { getByText } = render(<Agenda />);
    await waitFor(() => {
      expect(getByText('No tasks for this day.')).toBeTruthy();
    });
  });

  /*
  it('toggles accordion when clicked', async () => {
    const { getByTestId } = render(<Agenda />);
    
    const accordion = getByTestId('accordion-0');
    expect(accordion.props['data-expanded']).toBe(false);

    // Simulate click
    fireEvent.press(accordion);
    expect(accordion.props['data-expanded']).toBe(true);
  });
  */
 
  it('renders correctly and matches snapshot', () => {
    const tree = render(<Agenda />);
    expect(tree.toJSON()).toMatchSnapshot();
  });
});