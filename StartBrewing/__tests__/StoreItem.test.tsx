import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import StoreItem from "../app/StoreItem";

// --- 🧩 MOCKS --- //

// Mock Expo Router
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock react-native-paper FAB
jest.mock("react-native-paper", () => {
  const React = require("react");
  return {
    FAB: ({ label, onPress, testID }: any) =>
      React.createElement(
        "button",
        { onClick: onPress, testID: testID || "fab-add-to-order" },
        label
      ),
  };
});


// Mock SafeAreaView
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
  };
});


// Mock constants
jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    WHITE: "#fff",
    TEXT_DARK: "#000",
    LIGHT_BG: "#f8f8f8",
    ACCENT_PRIMARY: "#ff9900",
    STONE_DARK: "#333",
  },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: {
    BODY_BOLD: "System-Bold",
    BODY: "System-Regular",
  },
}));

// Mock useFonts hook
jest.mock("@/hooks/use-fonts", () => ({
  useFonts: jest.fn(() => ({})),
}));

// Mock Header
const MockHeader = jest.fn((props) => null);
jest.mock("@/components/header", () => (props: any) => {
  MockHeader(props);
  return null;
});


// --- 🧪 TESTS --- //
describe("<StoreItem />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders main product title and price", async () => {
    const { getByText } = render(<StoreItem />);

    await waitFor(() => {
      expect(getByText("Starter Brew Kit IPA")).toBeTruthy();
      expect(getByText("€32.99")).toBeTruthy();
    });
  });

  it("calls router.push('/Store') when back button pressed", async () => {
    render(<StoreItem />);

    expect(MockHeader).toHaveBeenCalled();
    const props = MockHeader.mock.calls[0][0];
    props.onIconPress();

    expect(mockPush).toHaveBeenCalledWith("/Store");
  });

  it("increments and decrements quantity properly", async () => {
    const { getByText } = render(<StoreItem />);

    const plusBtn = getByText("+");
    const minusBtn = getByText("-");
    const quantityText = getByText("1");

    // Increase
    fireEvent.press(plusBtn);
    await waitFor(() => {
      expect(getByText("2")).toBeTruthy();
    });

    // Decrease
    fireEvent.press(minusBtn);
    await waitFor(() => {
      expect(getByText("1")).toBeTruthy();
    });
  });

  it("navigates to /ShoppingCart when 'Add to order' FAB is pressed", () => {
    const { getByTestId } = render(<StoreItem />);
    const fab = getByTestId("fab-add-to-order");

    fireEvent.press(fab);
    expect(mockPush).toHaveBeenCalledWith("/ShoppingCart");
  });

  it("matches snapshot layout", () => {
    const tree = render(<StoreItem />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
