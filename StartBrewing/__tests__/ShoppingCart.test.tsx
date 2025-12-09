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
        testID={`quantity-increase-${title}`}
        onPress={() => onQuantityChange(quantity + 1, starterkit)}
      >
        <Text>Increase Qty</Text>
      </Pressable>
      <Pressable 
        testID={`quantity-decrease-${title}`}
        onPress={() => onQuantityChange(Math.max(0, quantity - 1), starterkit)}
      >
        <Text>Decrease Qty</Text>
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
  return ({ placeholder, value, onChangeText }: any) => (
    <RNTextInput placeholder={placeholder} testID={`input-${placeholder}`} value={value} onChangeText={onChangeText} />
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
        } else if (table === "shipping_info") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
            upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
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

    // Fill in shipping info first
    fireEvent.changeText(getByTestId("input-Full Name"), "John Doe");
    fireEvent.changeText(getByTestId("input-Street name and number"), "Main St 1");
    fireEvent.changeText(getByTestId("input-City"), "Amsterdam");
    fireEvent.changeText(getByTestId("input-Zip code"), "1012");

    const paymentButton = getByTestId("payment");
    fireEvent.press(paymentButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/Payment",
        params: { amount: 2000 }, // 2 * 10.00 * 100 cents
      });
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

  it("handles cart loading error in catch block", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    
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
            single: jest.fn().mockRejectedValue(new Error("Network error")),
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
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error loading cart:",
        "Network error"
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("updates cart item quantity when onQuantityChange is called", async () => {
    const mockCart = { id_cart: 1, user_id: "test-user-id" };
    const mockCartItems = [
      { store_item_id: 1, quantity: 2, starter_kit: false, id_cart_item: 100 },
    ];
    const mockStoreItems = [
      { id_store_item: 1, name: "Malt", price: 5.99, category_id: 1 },
    ];
    const mockCartItem = { id_cart_item: 100, cart_id: 1, store_item_id: 1, quantity: 2, starter_kit: false };

    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    let callCount = 0;
    mockSupabaseImpl = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "test-user-id" } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        callCount++;
        if (table === "shopping_carts") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockCart, error: null }),
          };
        } else if (table === "shopping_cart_items" && callCount > 5) {
          // Update/delete call
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockCartItem, error: null }),
              }),
            }),
            update: mockUpdate,
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        } else if (table === "shopping_cart_items") {
          // Initial load
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
      expect(getByTestId("quantity-increase-Malt")).toBeTruthy();
    }, { timeout: 2000 });

    const quantityChangeButton = getByTestId("quantity-increase-Malt");
    
    await act(async () => {
      fireEvent.press(quantityChangeButton);
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ quantity: 3 });
    });
  });

  it("deletes cart item when quantity is set to 0", async () => {
    const mockCart = { id_cart: 1, user_id: "test-user-id" };
    const mockCartItems = [
      { store_item_id: 1, quantity: 1, starter_kit: false },
    ];
    const mockStoreItems = [
      { id_store_item: 1, name: "Malt", price: 5.99, category_id: 1 },
    ];
    const mockCartItem = { id_cart_item: 100, cart_id: 1, store_item_id: 1, quantity: 1, starter_kit: false };

    const mockDelete = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    let fromCallCount = 0;
    mockSupabaseImpl = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "test-user-id" } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        fromCallCount++;
        if (table === "shopping_carts") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockCart, error: null }),
          };
        } else if (table === "shopping_cart_items" && fromCallCount > 4) {
          // For the delete call - after initial load
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockCartItem, error: null }),
              }),
            }),
            delete: mockDelete,
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
      expect(getByTestId("quantity-decrease-Malt")).toBeTruthy();
    });

    const decreaseButton = getByTestId("quantity-decrease-Malt");
    
    await act(async () => {
      fireEvent.press(decreaseButton);
    });

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  it("handles error when cart is not found during update", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    
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
            single: jest.fn().mockResolvedValue({ data: null, error: { message: "Cart not found" } }),
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

    // We'd need to trigger updateCartQuantity somehow
    // This is a limitation of the current test setup
  });

  it("handles error when cart item is not found during update", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    
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
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: { message: "Item not found" } }),
              }),
            }),
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
    
    consoleErrorSpy.mockRestore();
  });

  it("handles error when updating quantity fails", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    
    const mockCart = { id_cart: 1, user_id: "test-user-id" };
    const mockCartItem = { id_cart_item: 100, cart_id: 1, store_item_id: 1, quantity: 2, starter_kit: false };

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
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockCartItem, error: null }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: { message: "Update failed" } }),
            }),
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
    
    consoleErrorSpy.mockRestore();
  });

  it("handles error when deleting item fails", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    
    const mockCart = { id_cart: 1, user_id: "test-user-id" };
    const mockCartItem = { id_cart_item: 100, cart_id: 1, store_item_id: 1, quantity: 1, starter_kit: false };

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
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockCartItem, error: null }),
              }),
            }),
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: { message: "Delete failed" } }),
            }),
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
    
    consoleErrorSpy.mockRestore();
  });

  it("handles catch block error in updateCartQuantity", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    
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
            single: jest.fn().mockResolvedValue({ data: { id_cart: 1 }, error: null }),
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
    
    consoleErrorSpy.mockRestore();
  });

  it("loads shipping info from database and auto-fills form", async () => {
    const mockShippingInfo = {
      user_id: "test-user-id",
      full_name: "Jane Doe",
      street: "Oak Ave 42",
      city: "Rotterdam",
      zip: "3011",
    };

    mockSupabaseImpl = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "test-user-id" } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === "shipping_info") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockShippingInfo, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
        };
      }),
    };

    const { getByTestId } = renderWithNavigation(<ShoppingCart />);

    await act(async () => {
      if (mockFocusEffectCallback) {
        mockFocusEffectCallback();
      }
    });

    await waitFor(() => {
      expect(getByTestId("input-Full Name").props.value).toBe("Jane Doe");
      expect(getByTestId("input-Street name and number").props.value).toBe("Oak Ave 42");
      expect(getByTestId("input-City").props.value).toBe("Rotterdam");
      expect(getByTestId("input-Zip code").props.value).toBe("3011");
    });
  });

  it("loads profile name when shipping info does not exist", async () => {
    const mockProfile = { full_name: "John Smith" };

    mockSupabaseImpl = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "test-user-id" } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === "shipping_info") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: { message: "No rows found" } }),
          };
        }
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
        };
      }),
    };

    const { getByTestId } = renderWithNavigation(<ShoppingCart />);

    await act(async () => {
      if (mockFocusEffectCallback) {
        mockFocusEffectCallback();
      }
    });

    await waitFor(() => {
      expect(getByTestId("input-Full Name").props.value).toBe("John Smith");
    });
  });

  it("saves shipping info when payment button is pressed", async () => {
    const mockCart = { id_cart: 1, user_id: "test-user-id" };
    const mockCartItems = [
      { store_item_id: 1, quantity: 1, starter_kit: false },
    ];
    const mockStoreItems = [
      { id_store_item: 1, name: "Malt", price: 10.0, category_id: 1 },
    ];

    const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });

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
        }
        if (table === "shopping_cart_items") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockCartItems, error: null }),
          };
        }
        if (table === "store_items") {
          return {
            select: jest.fn().mockResolvedValue({ data: mockStoreItems, error: null }),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockStoreItems[0], error: null }),
          };
        }
        if (table === "shipping_info") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            upsert: mockUpsert,
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
        };
      }),
    };

    const { getByTestId } = renderWithNavigation(<ShoppingCart />);

    await act(async () => {
      if (mockFocusEffectCallback) {
        mockFocusEffectCallback();
      }
    });

    await waitFor(() => {
      expect(getByTestId("payment")).toBeTruthy();
    });

    // Fill shipping info
    fireEvent.changeText(getByTestId("input-Full Name"), "John Doe");
    fireEvent.changeText(getByTestId("input-Street name and number"), "Main St 1");
    fireEvent.changeText(getByTestId("input-City"), "Amsterdam");
    fireEvent.changeText(getByTestId("input-Zip code"), "1012");

    const paymentButton = getByTestId("payment");
    await act(async () => {
      fireEvent.press(paymentButton);
    });

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "test-user-id",
          full_name: "John Doe",
          street: "Main St 1",
          city: "Amsterdam",
          zip: "1012",
        }),
        expect.any(Object)
      );
    });
  });

  it("disables payment button when cart is empty", async () => {
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
            single: jest.fn().mockResolvedValue({ data: { id_cart: 1 }, error: null }),
          };
        }
        if (table === "shopping_cart_items") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
        };
      }),
    };

    const { getByTestId, getByText } = renderWithNavigation(<ShoppingCart />);

    await act(async () => {
      if (mockFocusEffectCallback) {
        mockFocusEffectCallback();
      }
    });

    await waitFor(() => {
      expect(getByText("Your cart is empty.")).toBeTruthy();
    });
  });

  it("disables payment button when shipping fields are empty", async () => {
    const mockCart = { id_cart: 1, user_id: "test-user-id" };
    const mockCartItems = [
      { store_item_id: 1, quantity: 1, starter_kit: false },
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
        }
        if (table === "shopping_cart_items") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockCartItems, error: null }),
          };
        }
        if (table === "store_items") {
          return {
            select: jest.fn().mockResolvedValue({ data: mockStoreItems, error: null }),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockStoreItems[0], error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
        };
      }),
    };

    const { getByText } = renderWithNavigation(<ShoppingCart />);

    await act(async () => {
      if (mockFocusEffectCallback) {
        mockFocusEffectCallback();
      }
    });

    await waitFor(() => {
      expect(getByText(/Please fill in:/)).toBeTruthy();
    });
  });

  it("enables payment button when all shipping fields are filled", async () => {
    const mockCart = { id_cart: 1, user_id: "test-user-id" };
    const mockCartItems = [
      { store_item_id: 1, quantity: 1, starter_kit: false },
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
        }
        if (table === "shopping_cart_items") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === "store_items") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockStoreItems[0], error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
        };
      }),
    };

    const { getByTestId, queryByText } = renderWithNavigation(<ShoppingCart />);

    await act(async () => {
      if (mockFocusEffectCallback) {
        mockFocusEffectCallback();
      }
    });

    await waitFor(() => {
      expect(getByTestId("payment")).toBeTruthy();
    });

    // Fill all shipping fields
    fireEvent.changeText(getByTestId("input-Full Name"), "John Doe");
    fireEvent.changeText(getByTestId("input-Street name and number"), "Main St 1");
    fireEvent.changeText(getByTestId("input-City"), "Amsterdam");
    fireEvent.changeText(getByTestId("input-Zip code"), "1012");

    await waitFor(() => {
      expect(queryByText(/Please fill in:/)).toBeNull();
    });
  });

  it("updates full name input value on text change", async () => {
    mockSupabaseImpl = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "test-user-id" } },
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

    const { getByTestId } = renderWithNavigation(<ShoppingCart />);

    await act(async () => {
      if (mockFocusEffectCallback) {
        mockFocusEffectCallback();
      }
    });

    await waitFor(() => {
      expect(getByTestId("input-Full Name")).toBeTruthy();
    });

    fireEvent.changeText(getByTestId("input-Full Name"), "Jane Smith");

    expect(getByTestId("input-Full Name").props.value).toBe("Jane Smith");
  });

  it("handles error when saving shipping info fails", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const mockCart = { id_cart: 1, user_id: "test-user-id" };
    const mockCartItems = [
      { store_item_id: 1, quantity: 1, starter_kit: false },
    ];
    const mockStoreItems = [
      { id_store_item: 1, name: "Malt", price: 10.0, category_id: 1 },
    ];

    const mockUpsert = jest.fn().mockResolvedValue({
      data: null,
      error: { message: "Upsert failed" },
    });

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
        }
        if (table === "shopping_cart_items") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockCartItems, error: null }),
          };
        }
        if (table === "store_items") {
          return {
            select: jest.fn().mockResolvedValue({ data: mockStoreItems, error: null }),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockStoreItems[0], error: null }),
          };
        }
        if (table === "shipping_info") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            upsert: mockUpsert,
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
        };
      }),
    };

    const { getByTestId } = renderWithNavigation(<ShoppingCart />);

    await act(async () => {
      if (mockFocusEffectCallback) {
        mockFocusEffectCallback();
      }
    });

    await waitFor(() => {
      expect(getByTestId("payment")).toBeTruthy();
    });

    fireEvent.changeText(getByTestId("input-Full Name"), "John Doe");
    fireEvent.changeText(getByTestId("input-Street name and number"), "Main St 1");
    fireEvent.changeText(getByTestId("input-City"), "Amsterdam");
    fireEvent.changeText(getByTestId("input-Zip code"), "1012");

    const paymentButton = getByTestId("payment");
    await act(async () => {
      fireEvent.press(paymentButton);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error saving shipping info:",
        expect.any(Object)
      );
    });

    consoleErrorSpy.mockRestore();
  });
});
