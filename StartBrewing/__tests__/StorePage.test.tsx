import React from "react";
import TestRenderer from "react-test-renderer";
const { act } = TestRenderer;
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import StorePage from "../app/(tabs)/Store";
import { supabase } from "../supabase";
import { useIsFocused, NavigationContainer } from "@react-navigation/native";

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
  return {
    SafeAreaProvider: ({ children }: any) => <View>{children}</View>,
    SafeAreaView: ({ children, style }: any) => <View style={style}>{children}</View>,
  };
});

interface StoreCardProps {
  id?: number;
  categoryId?: number;
  title: string;
  price: string;
  image?: any;
  onPress?: () => void;
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
    Searchbar: ({ placeholder, value, onChangeText, onClearIconPress }: any) => (
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        testID="searchbar"
      />
    ),
    Chip: ({ children, onPress }: any) => (
      <Pressable onPress={onPress}><Text>{children}</Text></Pressable>
    ),
    View,
    Text,
  };
});

jest.mock("../supabase", () => {
  return {
    supabase: {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: jest.fn(),
        // We'll resolve immediately
      })),
    },
  };
});

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useIsFocused: jest.fn(),
  };
});

const mockUseIsFocused = useIsFocused as jest.Mock;

(supabase.from as jest.Mock).mockImplementation((table: string) => {
  if (table === "category") {
    return {
      select: () => ({
        limit: () => Promise.resolve({
          data: [
            { id_category: 1, name: "Malt" },
            { id_category: 2, name: "Hops" },
          ],
          error: null,
        }),
      }),
    };
  }
  if (table === "store_items") {
    return {
      select: () => ({
        limit: () => Promise.resolve({
          data: [
            { id_store_item: 1, name: "Item 1", category_id: 1, price: 10 },
            { id_store_item: 2, name: "Item 2", category_id: 2, price: 20 },
          ],
          error: null,
        }),
      }),
    };
  }
  if (table === "starter_kits") {
    return {
      select: () => ({
        limit: () => Promise.resolve({
          data: [
            { id_starter_kit: 3, name: "Starter Kit", price: 50 },
          ],
          error: null,
        }),
      }),
    };
  }
  return { select: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) };
});

// --- 🧪 TESTS --- //
describe("<StorePage />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsFocused.mockReturnValue(true); // Simulate the page being focused
  });

  const renderWithNavigation = (ui: React.ReactElement) => {
    return render(<NavigationContainer>{ui}</NavigationContainer>);
  };

  it("renders main title", async () => {
    const { getByText } = renderWithNavigation(<StorePage />);
    await waitFor(() => {
      expect(getByText("Store")).toBeTruthy();
    });
  });

  it("renders correct number of StoreCard components", async () => {
    renderWithNavigation(<StorePage />);
    await waitFor(() => {
      expect(MockStoreCard).toHaveBeenCalledTimes(3); // 2 store_items + 1 starter kit
    });
  });

  it("passes correct props to the first StoreCard", async () => {
    renderWithNavigation(<StorePage />);
    await waitFor(() => {
      const firstCall = MockStoreCard.mock.calls[0][0] as StoreCardProps;
      expect(firstCall.title).toBe("Item 1");
      expect(firstCall.price).toBe("€10");
      expect(firstCall.categoryId).toBe(1);
    });
  });

  it("navigates to cart when cart button pressed", async () => {
    const { getByTestId } = renderWithNavigation(<StorePage />);
    await waitFor(() => {
      expect(getByTestId("cart-button")).toBeTruthy();
    });
    await act(async () => {
      fireEvent.press(getByTestId("cart-button")); // use testID, not text
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/ShoppingCart");
    });
  });

  it("does not fetch cart count when not focused", async () => {
    mockUseIsFocused.mockReturnValue(false); // Simulate the page not being focused
    renderWithNavigation(<StorePage />);

    await waitFor(() => {
      expect(supabase.from).not.toHaveBeenCalledWith("shopping_cart_items");
    });
  });
});
