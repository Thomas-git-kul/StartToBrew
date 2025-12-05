import React from "react";
import { render } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
// Mock Expo router to avoid loading expo packages during tests
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({}),
}));

// Mock supabase to avoid native AsyncStorage import in native client
jest.mock("@/supabase", () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: null }) }),
  },
}));

import ShoppingCart from "../app/(tabs)/ShoppingCart";

// Keep header/themed-text mocks minimal so the title renders
jest.mock("@/components/header", () => (props: any) => {
  const { Pressable, Text } = require("react-native");
  return (
    <Pressable testID="mock-header-button">
      <Text>{props.title}</Text>
    </Pressable>
  );
});
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return { ThemedText: ({ children }: any) => <Text>{children}</Text> };
});

// Make useFocusEffect a no-op in tests so loadCart() is not triggered.
jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useFocusEffect: (_cb: any) => {},
    NavigationContainer: ({ children }: any) => children,
  };
});

describe("<ShoppingCart /> minimal test", () => {
  beforeEach(() => jest.clearAllMocks());

  const renderWithNavigation = (ui: React.ReactElement) =>
    render(<NavigationContainer>{ui}</NavigationContainer>);

  it("renders header and initial loading state", () => {
    const { getByText } = renderWithNavigation(<ShoppingCart />);
    expect(getByText("Shopping Cart")).toBeTruthy();
    expect(getByText("Loading shoppingcart...")).toBeTruthy();
  });
});
