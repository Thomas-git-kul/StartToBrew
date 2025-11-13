import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react-native";
import StoreItem from "../app/StoreItem";

// --- MOCKS --- //

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
    STONE500: "#777",
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

// Mock ThemedText
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, ...props }: any) => <Text {...props}>{children}</Text>,
  };
});

// --- TESTS --- //
describe("<StoreItem />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders price and description correctly", async () => {
    render(<StoreItem />);

    await waitFor(() => {
      // Price (handles both comma and dot decimal styles)
      expect(screen.getByText(/€\s?32[,\.]99/)).toBeTruthy();
      // Description snippet
      expect(
        screen.getByText(/Slightly bitter with a fruity undertone/i)
      ).toBeTruthy();
    });
  });

  it("calls router.push('/Store') when back button pressed", async () => {
    render(<StoreItem />);
    expect(MockHeader).toHaveBeenCalled();
    const props = MockHeader.mock.calls[0][0];
    props.onIconPress();
    expect(mockPush).toHaveBeenCalledWith("/Store");
  });

  it("increments and decrements quantity properly and updates total price", async () => {
    render(<StoreItem />);

    const minusBtn = screen.getByTestId("quantity-minus");
    const plusBtn = screen.getByTestId("quantity-plus");

    // Initial quantity = 1, price = €32.99
    await waitFor(() => {
      expect(screen.getByText("1")).toBeTruthy();
      expect(screen.getByText(/€\s?32[,\.]99/)).toBeTruthy();
    });

    // Increase quantity
    fireEvent.press(plusBtn);
    await waitFor(() => {
      expect(screen.getByText("2")).toBeTruthy();
      expect(screen.getByText(/€\s?65[,\.]98/)).toBeTruthy();
    });

    // Decrease quantity
    fireEvent.press(minusBtn);
    await waitFor(() => {
      expect(screen.getByText("1")).toBeTruthy();
      expect(screen.getByText(/€\s?32[,\.]99/)).toBeTruthy();
    });
  });

  it("navigates with correct params when 'Add to order' FAB is pressed", async () => {
    render(<StoreItem />);
    const fab = screen.getByTestId("fab-add-to-order");
    fireEvent.press(fab);

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/Store",
        params: expect.objectContaining({
          title: "Starter Brew Kit IPA",
          quantity: 1,
          price: 32.99,
        }),
      })
    );
  });

  it("matches snapshot layout", () => {
    const tree = render(<StoreItem />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
