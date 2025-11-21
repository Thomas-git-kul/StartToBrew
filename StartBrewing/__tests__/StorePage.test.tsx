import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import StorePage from "../app/(tabs)/Store";
import { supabase } from "../supabase";

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
  });

  it("renders main title", async () => {
    const { getByText } = render(<StorePage />);
    await waitFor(() => {
      expect(getByText("Store")).toBeTruthy();
    });
  });

  it("renders correct number of StoreCard components", async () => {
    render(<StorePage />);
    await waitFor(() => {
      expect(MockStoreCard).toHaveBeenCalledTimes(3); // 2 store_items + 1 starter kit
    });
  });

  it("passes correct props to the first StoreCard", async () => {
    render(<StorePage />);
    await waitFor(() => {
      const firstCall = MockStoreCard.mock.calls[0][0] as StoreCardProps;
      expect(firstCall.title).toBe("Item 1");
      expect(firstCall.price).toBe("€10");
      expect(firstCall.categoryId).toBe(1);
    });
  });

  it("navigates to cart when cart button pressed", async () => {
    const { getByTestId } = render(<StorePage />);
    await waitFor(() => {
      fireEvent.press(getByTestId("cart-button")); // use testID, not text
      expect(mockPush).toHaveBeenCalledWith("/ShoppingCart");
    });
  });
});
