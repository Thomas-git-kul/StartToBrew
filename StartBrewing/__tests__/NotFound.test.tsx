import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import NotFound from "../app/+not-found";
import { useRouter } from "expo-router";

// --------------------------
// Mock expo-router
// --------------------------
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// --------------------------
// Mock hooks and components
// --------------------------
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => true,
}));

jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children }: any) => <Text>{children}</Text>,
  };
});

jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    LIGHT_BG: "#fafafa",
    WHITE: "#ffffff",
    TEXT_DARK: "#000000",
  },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: { BODY: "System" },
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: ({ children }: any) => <View>{children}</View> };
});

jest.mock("react-native-paper", () => {
  const { Text, TouchableOpacity } = require("react-native");
  return {
    Button: ({ onPress, children }: any) => (
      <TouchableOpacity onPress={onPress}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
  };
});

// --------------------------
// Tests
// --------------------------
describe("<NotFound />", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("renders the title and message", () => {
    const { getByText } = render(<NotFound />);
    
    expect(getByText("Oops — page not found")).toBeTruthy();
    expect(
      getByText(
        "The page you are trying to reach doesn't exist or has been removed. Check the URL or go back to the home page."
      )
    ).toBeTruthy();
  });

  it("renders the Back to Home button and triggers router.replace on press", () => {
    const { getByText } = render(<NotFound />);
    
    const button = getByText("Back to Home");
    expect(button).toBeTruthy();

    fireEvent.press(button);
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/HomePage");
  });
});
