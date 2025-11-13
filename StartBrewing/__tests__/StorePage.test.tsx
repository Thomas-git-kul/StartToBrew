import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import StorePage from "../app/(tabs)/Store";

// --- 🧩 MOCKS --- //

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => [true],
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaProvider: ({ children }: any) => <View>{children}</View> };
});

interface StoreCardProps {
  title: string;
  price: string;
  description?: string;
}
const MockStoreCard = jest.fn((props: StoreCardProps) => null);
jest.mock("@/components/ui/StoreCard", () => (props: StoreCardProps) => {
  MockStoreCard(props);
  return null;
});

jest.mock("react-native-paper", () => {
  const React = require("react");
  const { View, Text, TextInput, Pressable } = require("react-native");
  return {
    Appbar: {
      Header: ({ children }: any) => <View>{children}</View>,
      Content: ({ title }: any) => <Text>{title}</Text>,
      Action: ({ testID, onPress }: any) => (
        <Pressable testID={testID} onPress={onPress}>
          <Text>Action</Text>
        </Pressable>
      ),
    },
    Searchbar: ({ placeholder, value, onChangeText, testID }: any) => (
      <TextInput placeholder={placeholder} value={value} onChangeText={onChangeText} testID={testID} />
    ),
    Card: ({ children }: any) => <View>{children}</View>,
    Text,
    View,
  };
});

// --- 🧪 TESTS --- //
describe("<StorePage />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders main title", () => {
    const { getByText } = render(<StorePage />);
    expect(getByText("Store")).toBeTruthy();
  });

  it("renders correct number of StoreCard components", () => {
    render(<StorePage />);
    expect(MockStoreCard).toHaveBeenCalledTimes(4); // Adjust to your actual number of items
  });

  it("passes correct props to the first StoreCard", () => {
    render(<StorePage />);
    const firstCall = MockStoreCard.mock.calls[0][0] as StoreCardProps;
    expect(firstCall.title).toBe("Superior starter kit Base");
    expect(firstCall.price).toBeDefined();
  });

  it("navigates to cart when cart button pressed", () => {
    const { getByTestId } = render(<StorePage />);
    fireEvent.press(getByTestId("cart-button"));
    expect(mockPush).toHaveBeenCalledWith("/ShoppingCart");
  });
});
