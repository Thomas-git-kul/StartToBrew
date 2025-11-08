import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import HomePage from "../app/(tabs)/HomePage";
import { RenderAPI } from "@testing-library/react-native";

// --- Mocks --- //

// Mock navigation
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fonts hook
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => true,
}));

// Mock ThemedText
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, style }: any) => <Text style={style}>{children}</Text>,
  };
});

// Mock Safe Area Context
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Mock constants
jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    WHITE: "#fff",
    TEXT_DARK: "#000",
    ACCENT_PRIMARY: "#f00",
    LIGHT_BG: "#eee",
  },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: {
    HEADING: "System",
    BODY: "System",
    BODY_BOLD: "System",
  },
}));

// Mock Header component
jest.mock("@/components/header", () => {
  const { Text, View } = require("react-native");
  return ({ title }: any) => <View><Text>{title}</Text></View>;
});

// Mock BeerCard component
jest.mock("@/components/ui/IPAcomponent", () => {
  const { View, Text } = require("react-native");
  return ({ name }: any) => <View><Text>{name}</Text></View>;
});

// --- Tests --- //

describe("<HomePage />", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders all main titles correctly", () => {
    const { getByText } = render(<HomePage />);

    expect(getByText("StartToBrew")).toBeTruthy();
    expect(getByText("In progress")).toBeTruthy();
    expect(getByText("Popular recipes")).toBeTruthy();
  });

  it("renders beer cards", () => {
    const { getByText } = render(<HomePage />);

    expect(getByText("IJ IPA")).toBeTruthy();
    expect(getByText("Voodoo Ranger")).toBeTruthy();
    expect(getByText("Two Hearted IPA")).toBeTruthy();
  });

  it("navigates to /Recipes when FAB is pressed", () => {
    const { getByTestId } = render(<HomePage />);

    const fabButton = getByTestId("fab");
    fireEvent.press(fabButton);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/Recipes");
  });


  it("matches the snapshot", () => {
    const tree = render(<HomePage />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
