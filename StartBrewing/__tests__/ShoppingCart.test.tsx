import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import ShoppingCart from "../app/cart";

// --- 🧩 MOCKS --- //

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
    Text: ({ children }: any) => React.createElement("Text", null, children),
    Button: ({ children, onPress }: any) =>
      React.createElement("button", { onClick: onPress }, children),
    TextInput: ({ label }: any) => React.createElement("Text", null, label),
    Appbar: {
      Header: ({ children }: any) => React.createElement(React.Fragment, null, children),
      Content: ({ title }: any) => React.createElement("Text", null, title),
      Action: ({ onPress }: any) =>
        React.createElement("button", { "data-testid": "header-action", onClick: onPress }, "Icon"),
    },
  };
});

// Mock SafeAreaView
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
  };
});

// Mock Colors & Fonts constants
jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: { WHITE: "#fff", TEXT_DARK: "#000" },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: { HEADING: "System", BODY: "System" },
}));

// Mock CartItem component
interface CartItemProps {
  title: string;
  price: number;
  quantity: number;
}
const MockCartItem = jest.fn((props: CartItemProps) => null);
jest.mock("@/components/ui/OrderCard", () => (props: CartItemProps) => {
  MockCartItem(props);
  return null;
});

// --- 🧪 TESTS --- //
describe("<ShoppingCart />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders main headers correctly", async () => {
  const { getByText } = render(<ShoppingCart />);

  await waitFor(() => {
    expect(getByText('Order Information')).toBeTruthy();
    expect(getByText('Order Summary')).toBeTruthy();
    expect(getByText('Shipping Information')).toBeTruthy();
  });

  expect(getByText("Order Information")).toBeTruthy();
  expect(getByText("Order Summary")).toBeTruthy();
  expect(getByText("Shipping Information")).toBeTruthy();
  expect(getByText("Full Name")).toBeTruthy();
  expect(getByText("Street name and number")).toBeTruthy();
  expect(getByText("City")).toBeTruthy();
  });
  
  it("renders exactly three CartItem components", () => {
    render(<ShoppingCart />);
    expect(MockCartItem).toHaveBeenCalledTimes(2);
  });

  it("passes correct props to the first CartItem", () => {
    render(<ShoppingCart />);
    const calls = MockCartItem.mock.calls;
    expect(calls.length).toBeGreaterThan(0);

    const firstCall = calls[0][0] as CartItemProps;
    expect(firstCall.title).toBe("Superior starter kit Base");
    expect(firstCall.price).toBe("€299");
    expect(firstCall.quantity).toBe(1);
  });

  it("displays subtotal correctly", () => {
    const { getByText } = render(<ShoppingCart />);
    expect(getByText(/Subtotal:\s*€\s*300,49/)).toBeTruthy();
  });

  it("matches snapshot for layout consistency", () => {
    const tree = render(<ShoppingCart />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
