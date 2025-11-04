import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import HomePage from "../app/(tabs)/HomePage";

// --- Mocks --- //
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => true,
}));

jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, style }: any) => <Text style={style}>{children}</Text>,
  };
});

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
  };
});

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

// --- Tests --- //
describe("<HomePage />", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders all main titles correctly", () => {
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

  it("navigates to /Recipes when the 'Here' button is pressed", () => {
    const { getByText } = render(<HomePage />);
    const button = getByText("Here");

    fireEvent.press(button);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/Recipes");
  });

  it("navigates to /Recipes when the FAB '+' is pressed", () => {
    const { getByText } = render(<HomePage />);
    const fabButton = getByText("+");

    fireEvent.press(fabButton);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/Recipes");
  });

  it("matches the snapshot", () => {
    const tree = render(<HomePage />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
