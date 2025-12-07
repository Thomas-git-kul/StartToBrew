import React from "react";
import { render, waitFor, fireEvent, act } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";

// Mock Expo router to avoid loading expo packages during tests
const mockPush = jest.fn();
let mockParams = {};
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => mockParams,
}));

// Mock supabase
let mockSupabaseImpl: any;
jest.mock("@/supabase", () => ({
  get supabase() {
    return mockSupabaseImpl;
  },
}));

import ShoppingCart from "../app/(tabs)/ShoppingCart";

// Keep header/themed-text mocks minimal so the title renders
jest.mock("@/components/header", () => (props: any) => {
  const { Pressable, Text } = require("react-native");
  return (
    <Pressable testID="mock-header-button" onPress={props.onIconPressLeft}>
      <Text>{props.title}</Text>
    </Pressable>
  );
});
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return { ThemedText: ({ children }: any) => <Text>{children}</Text> };
});

// Mock OrderCard to simplify testing
jest.mock("@/components/ui/OrderCard", () => {
  const { View, Text, Pressable } = require("react-native");
  return ({ title, quantity, price, onPress, onQuantityChange, starterkit }: any) => (
    <View testID="order-card">
      <Pressable onPress={onPress} testID={`order-card-press-${title}`}>
        <Text>{title}</Text>
        <Text>{quantity}</Text>
        <Text>{price}</Text>
      </Pressable>
      <Pressable 
        testID={`quantity-change-${title}`}
        onPress={() => onQuantityChange(quantity + 1, starterkit)}
      >
        <Text>Change Qty</Text>
      </Pressable>
    </View>
  );
});

// Mock PrimaryButton
jest.mock("@/components/primaryButton", () => {
  const { Pressable, Text } = require("react-native");
  return ({ title, onPress, testID, disabled }: any) => (
    <Pressable onPress={onPress} testID={testID} disabled={disabled}>
      <Text>{title}</Text>
    </Pressable>
  );
});

// Mock Spinner
jest.mock("@/components/spinner", () => {
  const { View, Text } = require("react-native");
  return ({ title }: any) => (
    <View testID="spinner">
      <Text>{title}</Text>
    </View>
  );
});

// Mock TextInput
jest.mock("@/components/textInput", () => {
  const { TextInput: RNTextInput } = require("react-native");
  return ({ placeholder }: any) => (
    <RNTextInput placeholder={placeholder} testID={`input-${placeholder}`} />
  );
});

// Make useFocusEffect a no-op in tests so loadCart() is not triggered.
let mockFocusEffectCallback: any = null;
jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useFocusEffect: (cb: any) => {
      mockFocusEffectCallback = cb;
    },
    NavigationContainer: ({ children }: any) => children,
  };
});

describe("<ShoppingCart />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    mockFocusEffectCallback = null;
    
    // Default mock - returns no user to avoid triggering loadCart
    mockSupabaseImpl = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
      }),
    };
  });

  const renderWithNavigation = (ui: React.ReactElement) =>
    render(<NavigationContainer>{ui}</NavigationContainer>);

  it("renders header and initial loading state", () => {
    const { getByText } = renderWithNavigation(<ShoppingCart />);
    expect(getByText("Shopping Cart")).toBeTruthy();
    expect(getByText("Loading shoppingcart...")).toBeTruthy();
  });

  it("navigates back to Store when from param is not 'storeitem'", () => {
    const { getByTestId } = renderWithNavigation(<ShoppingCart />);
    const backButton = getByTestId("mock-header-button");
    
    fireEvent.press(backButton);
    
    expect(mockPush).toHaveBeenCalledWith("/Store");
  });

  it("navigates back to StoreItem when from param is 'storeitem'", () => {
    mockParams = { 
      from: "storeitem", 
      beforeFrom: "recipes",
      id: 5,
      categoryId: 2
    };

    const { getByTestId } = renderWithNavigation(<ShoppingCart />);
    const backButton = getByTestId("mock-header-button");
    
    fireEvent.press(backButton);
    
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/StoreItem",
      params: {
        id: 5,
        categoryNumber: 2,
        from: "recipes",
      },
    });
  });

  it("loads cart with store items and renders them", async () => {
    const mockCart = { id_cart: 1, user_id: "test-user-id" };
    const mockCartItems = [
      { store_item_id: 1, quantity: 2, starter_kit: false },
      { store_item_id: 4, quantity: 1, starter_kit: true },
    ];
    const mockStoreItems = [
      { id_store_item: 1, name: "Malt", price: 5.99, category_id: 1, starterkit: false },
    ];
    const mockStarterKits = [
      { id_starter_kit: 4, name: "Basic Kit", price: 49.99, category_id: 4 },
    ];

    mockSupabaseImpl = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "test-user-id" } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === "shopping_carts") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockCart, error: null }),
          };
        } else if (table === "shopping_cart_items") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockCartItems, error: null }),
          };
        } else if (table === "store_items") {
          return {
            select: jest.fn().mockResolvedValue({ data: mockStoreItems, error: null }),
          };
        } else if (table === "starter_kits") {
          return {
            select: jest.fn().mockResolvedValue({ data: mockStarterKits, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    const { getByText, queryByText } = renderWithNavigation(<ShoppingCart />);

    await act(async () => {
      if (mockFocusEffectCallback) {
        await mockFocusEffectCallback();
      }
    });

    await waitFor(() => {
      expect(queryByText("Loading shoppingcart...")).toBeNull();
    });

    await waitFor(() => {
      expect(getByText("Order Summary")).toBeTruthy();
      expect(getByText("Malt")).toBeTruthy();
      expect(getByText("Basic Kit")).toBeTruthy();
    });
  });

  it("creates a new cart if none exists", async () => {
    const mockNewCart = { id_cart: 2, user_id: "test-user-id" };

    mockSupabaseImpl = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "test-user-id" } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === "shopping_carts") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValueOnce({ data: null, error: null }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: mockNewCart, error: null }),
            }),
          };
        } else if (table === "shopping_cart_items") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        } else if (table === "store_items") {
          return {
            select: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        } else if (table === "starter_kits") {
          return {
            select: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    renderWithNavigation(<ShoppingCart />);

    await act(async () => {
      if (mockFocusEffectCallback) {
        await mockFocusEffectCallback();
      }
    });

    await waitFor(() => {
      expect(mockSupabaseImpl.from).toHaveBeenCalledWith("shopping_carts");
    });
  });

  it("handles cart loading errors gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    
    mockSupabaseImpl = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "User not found" },
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };

    renderWithNavigation(<ShoppingCart />);

    await act(async () => {
      if (mockFocusEffectCallback) {
        await mockFocusEffectCallback();
      }
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching user:",
        "User not found"
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("navigates to payment with correct amount", async () => {
    const mockCart = { id_cart: 1, user_id: "test-user-id" };
    const mockCartItems = [
      { store_item_id: 1, quantity: 2, starter_kit: false },
    ];
    const mockStoreItems = [
      { id_store_item: 1, name: "Malt", price: 10.0, category_id: 1 },
    ];

    mockSupabaseImpl = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "test-user-id" } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === "shopping_carts") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockCart, error: null }),
          };
        } else if (table === "shopping_cart_items") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockCartItems, error: null }),
          };
        } else if (table === "store_items") {
          return {
            select: jest.fn().mockResolvedValue({ data: mockStoreItems, error: null }),
          };
        } else if (table === "starter_kits") {
          return {
            select: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    const { getByTestId } = renderWithNavigation(<ShoppingCart />);

    await act(async () => {
      if (mockFocusEffectCallback) {
        await mockFocusEffectCallback();
      }
    });

    await waitFor(() => {
      expect(getByTestId("payment")).toBeTruthy();
    });

    const paymentButton = getByTestId("payment");
    fireEvent.press(paymentButton);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/Payment",
      params: { amount: 2000 }, // 2 * 10.00 * 100 cents
    });
  });

  it("renders shipping information form", async () => {
    const mockCart = { id_cart: 1, user_id: "test-user-id" };

    mockSupabaseImpl = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "test-user-id" } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === "shopping_carts") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockCart, error: null }),
          };
        } else if (table === "shopping_cart_items") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        } else if (table === "store_items") {
          return {
            select: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        } else if (table === "starter_kits") {
          return {
            select: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    const { getByText, getByTestId } = renderWithNavigation(<ShoppingCart />);

    await act(async () => {
      if (mockFocusEffectCallback) {
        await mockFocusEffectCallback();
      }
    });

    await waitFor(() => {
      expect(getByText("Shipping Information")).toBeTruthy();
    });

    expect(getByTestId("input-Full Name")).toBeTruthy();
    expect(getByTestId("input-Street name and number")).toBeTruthy();
    expect(getByTestId("input-City")).toBeTruthy();
    expect(getByTestId("input-Zip code")).toBeTruthy();
  });

  it("navigates to StoreItem when order card is pressed", async () => {
    const mockCart = { id_cart: 1, user_id: "test-user-id" };
    const mockCartItems = [
      { store_item_id: 1, quantity: 2, starter_kit: false },
    ];
    const mockStoreItems = [
      { id_store_item: 1, name: "Malt", price: 5.99, category_id: 2 },
    ];

    mockSupabaseImpl = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "test-user-id" } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === "shopping_carts") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockCart, error: null }),
          };
        } else if (table === "shopping_cart_items") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockCartItems, error: null }),
          };
        } else if (table === "store_items") {
          return {
            select: jest.fn().mockResolvedValue({ data: mockStoreItems, error: null }),
          };
        } else if (table === "starter_kits") {
          return {
            select: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    const { getByTestId } = renderWithNavigation(<ShoppingCart />);

    await act(async () => {
      if (mockFocusEffectCallback) {
        await mockFocusEffectCallback();
      }
    });

    await waitFor(() => {
      expect(getByTestId("order-card-press-Malt")).toBeTruthy();
    });

    const orderCard = getByTestId("order-card-press-Malt");
    fireEvent.press(orderCard);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/StoreItem",
      params: {
        id: 1,
        categoryNumber: "2",
        from: "cart",
      },
    });
  });

  it("displays correct subtotal for multiple items", async () => {
    const mockCart = { id_cart: 1, user_id: "test-user-id" };
    const mockCartItems = [
      { store_item_id: 1, quantity: 2, starter_kit: false },
      { store_item_id: 2, quantity: 3, starter_kit: false },
    ];
    const mockStoreItems = [
      { id_store_item: 1, name: "Malt", price: 10.0, category_id: 1 },
      { id_store_item: 2, name: "Hops", price: 5.0, category_id: 2 },
    ];

    mockSupabaseImpl = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "test-user-id" } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === "shopping_carts") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockCart, error: null }),
          };
        } else if (table === "shopping_cart_items") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockCartItems, error: null }),
          };
        } else if (table === "store_items") {
          return {
            select: jest.fn().mockResolvedValue({ data: mockStoreItems, error: null }),
          };
        } else if (table === "starter_kits") {
          return {
            select: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    const { getByText } = renderWithNavigation(<ShoppingCart />);

    await act(async () => {
      if (mockFocusEffectCallback) {
        await mockFocusEffectCallback();
      }
    });

    await waitFor(() => {
      // Total should be (2 * 10.0) + (3 * 5.0) = 35.00
      expect(getByText(/35,00/)).toBeTruthy();
    });
  });
});
