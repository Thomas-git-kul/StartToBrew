import { render, fireEvent } from "@testing-library/react-native";
import React from "react";
import HomePage from "../app/(tabs)/HomePage";

// Mock Expo Router
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock themed text
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, style }: any) => <Text style={style}>{children}</Text>,
  };
});

// ✅ Correct: mock custom font hook
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => true,
}));

// Mock constants
jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    WHITE: "#fff",
    TEXT_DARK: "#000",
    ACCENT_PRIMARY: "#f00",
  },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: {
    HEADING: "System",
    BODY: "System",
    BODY_BOLD: "System",
  },
}));

// ✅ Mock SafeAreaView
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
  };
});

// The actual tests
describe("<HomePage />", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the main title and subtitles", () => {
    const { getByText } = render(<HomePage />);

    expect(getByText("StartToBrew")).toBeTruthy();
    expect(getByText("In progress")).toBeTruthy();
    expect(getByText("Start a new brew")).toBeTruthy();
    expect(getByText("Popular recipes")).toBeTruthy();
  });

  it("renders the button with label 'Here'", () => {
    const { getByText } = render(<HomePage />);
    const buttonText = getByText("Here");
    expect(buttonText).toBeTruthy();
  });

  it("navigates to /Recipes when the button is pressed", () => {
    const { getByText } = render(<HomePage />);
    const button = getByText("Here");

    fireEvent.press(button);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/Recipes");
  });

  it("matches snapshot (layout consistency)", () => {
    const tree = render(<HomePage />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});