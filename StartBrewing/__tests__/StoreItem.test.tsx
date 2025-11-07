import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { TouchableOpacity, Text } from "react-native";
import StoreItem from "../app/StoreItem"; // adjust path if needed

// --- 🧩 MOCKS --- //

// Mock Expo Router
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock react-native-paper components to use RN touchables so fireEvent.press works
jest.mock("react-native-paper", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");
  return {
    IconButton: ({ onPress, testID }: any) =>
      React.createElement(
        TouchableOpacity,
        { onPress, testID },
        React.createElement(Text, null, "Back")
      ),
  };
});

// Mock Colors & Fonts constants
jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    LIGHT_BG: "#f0f0f0",
    TEXT_DARK: "#000000",
    WHITE: "#ffffff",
    STONE_DARK: "#333333",
    ACCENT_PRIMARY: "#FF6600",
    TEXT_BODY: "#555555",
  },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: {
    HEADING: "System",
    BODY: "System",
    BODY_BOLD: "System-Bold",
  },
}));

// Mock image imports
jest.mock("@/assets/images/Starterkit.png", () => 1);
jest.mock("@/assets/images/starterkit2.png", () => 2);

// --- 🧪 TESTS --- //
describe("<StoreItem />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title and price correctly", async () => {
    const { getByText } = render(<StoreItem />);

    await waitFor(() => {
      expect(getByText("Starter Brew Kit IPA")).toBeTruthy();
      expect(getByText("€32.99")).toBeTruthy();
    });
  });

  it("shows description text", async () => {
    const { getByText } = render(<StoreItem />);
    await waitFor(() => {
      expect(getByText(/Slightly bitter with a fruity undertone/i)).toBeTruthy();
    });
  });

  it("navigates back to store when back button is pressed", () => {
    const { getByTestId } = render(<StoreItem />);
    const backButton = getByTestId("back-button");
    fireEvent.press(backButton);
    expect(mockPush).toHaveBeenCalledWith("/Store");
  });

  it("increments and decrements quantity correctly", () => {
    const { getByText } = render(<StoreItem />);

    const plusButton = getByText("+");
    const minusButton = getByText("-");
    // initial quantity 1
    expect(getByText("1")).toBeTruthy();

    // Increment
    fireEvent.press(plusButton);
    expect(getByText("2")).toBeTruthy();

    // Decrement (should not go below 1)
    fireEvent.press(minusButton);
    expect(getByText("1")).toBeTruthy();
  });

  it("navigates to cart when 'Add to order' button is pressed", () => {
    const { getByText } = render(<StoreItem />);
    const addButton = getByText("Add to order");
    fireEvent.press(addButton);
    expect(mockPush).toHaveBeenCalledWith("/cart");
  });

  it("matches snapshot for layout consistency", () => {
    const tree = render(<StoreItem />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
