import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import ShoppingCart from "../app/ShoppingCart";

// --- MOCKS --- //
// Mock Expo Router
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock useFonts hook
jest.mock("@/hooks/use-fonts", () => ({ useFonts: jest.fn() }));

// Mock SafeAreaView
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: ({ children }: any) => <View>{children}</View> };
});

// Mock Header
const MockHeader = jest.fn();
jest.mock("@/components/header", () => (props: any) => {
  MockHeader(props);
  return null;
});

// Mock ThemedText
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return { ThemedText: ({ children }: any) => <Text>{children}</Text> };
});

// Mock OrderCard
const MockOrderCard = jest.fn();
jest.mock("@/components/ui/OrderCard", () => (props: any) => {
  MockOrderCard(props);
  return null;
});

// Mock Supabase
jest.mock("../supabase", () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user123" } }, error: null }) },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === "shopping_cart") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          then: jest.fn((cb: any) => cb({ data: [{ store_item_id: 1, quantity: 2, starter_kit: false }], error: null })),
        };
      }
      if (table === "store_items") {
        return {
          select: jest.fn().mockReturnThis(),
          then: jest.fn((cb: any) => cb({ data: [{ id_store_item: 1, name: "Superior starter kit Base", price: 299 }], error: null })),
        };
      }
      if (table === "starter_kits") {
        return {
          select: jest.fn().mockReturnThis(),
          then: jest.fn((cb: any) => cb({ data: [{ id_starter_kit: 2, name: "Starter Kit", price: 50 }], error: null })),
        };
      }
      return { select: jest.fn().mockReturnThis(), then: jest.fn() };
    }),
  },
}));

// --- TESTS --- //
describe("<ShoppingCart /> minimal test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders main headers correctly", async () => {
    render(<ShoppingCart />);

    await waitFor(() => {
      const headerProps = MockHeader.mock.calls[0][0];
      expect(headerProps.title).toBe("Shopping Cart");
      expect(headerProps.iconName).toBe("ArrowRight");
      expect(headerProps.actionTestID).toBe("store-button");
      expect(typeof headerProps.onIconPress).toBe("function");
    });
  });

  it("renders OrderCard with correct props", async () => {
    render(<ShoppingCart />);

    await waitFor(() => {
      expect(MockOrderCard).toHaveBeenCalled();
      const props = MockOrderCard.mock.calls[0][0];
      expect(props.title).toBe("Superior starter kit Base");
      expect(props.price).toBe("€299.00");
      expect(props.quantity).toBe(2);
    });
  });

  it("calls router.push('/Store') when back button pressed", () => {
    render(<ShoppingCart />);
    expect(MockHeader).toHaveBeenCalled();
    const props = MockHeader.mock.calls[0][0];
    props.onIconPress();
    expect(mockPush).toHaveBeenCalledWith("/Store");
  });

  it("matches snapshot after loading orders", async () => {
    const { toJSON } = render(<ShoppingCart />);
    await waitFor(() => expect(MockOrderCard).toHaveBeenCalled());
    expect(toJSON()).toMatchSnapshot();
  });
});
