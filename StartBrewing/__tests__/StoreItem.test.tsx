// @ts-ignore
import TestRenderer from "react-test-renderer";
declare global {
  var __TEST_SPECIFICRECIPE__: boolean | undefined;
}
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock Supabase completely
jest.mock('../supabase/index', () => {
  return {
    supabase: {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }) },
      from: jest.fn().mockImplementation((table: string) => {
        // Helper for chaining
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { id_cart: 'cart-1' }, error: null }),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id_cart: 'cart-1' }, error: null }),
        };
        if (table === "starter_kits") {
          return {
            ...chain,
            single: jest.fn().mockResolvedValue({
              data: {
                id_starter_kit: "1",
                name: "Starter Brew Kit IPA",
                description: "Slightly bitter with a fruity undertone",
                price: 32.99,
              },
              error: null,
            }),
          };
        }
        if (table === "shopping_carts") {
          return {
            ...chain,
            maybeSingle: jest.fn().mockResolvedValue({ data: { id_cart: 'cart-1' }, error: null }),
          };
        }
        if (table === "shopping_cart_items") {
          return {
            ...chain,
            select: jest.fn().mockReturnThis(),
            eq: jest.fn(function(this: any) {
              // Return this to allow chaining multiple eq calls
              return this;
            }).mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
            update: jest.fn().mockResolvedValue({ data: null, error: null }),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
            then: (cb: any) => cb([{ id_cart_item: 'item-1', quantity: 1 }]),
          };
        }
        return chain;
      }),
    },
  };
});

import React from "react";
const { act } = TestRenderer;
import { render, fireEvent, waitFor, screen } from "@testing-library/react-native";
import StoreItem from "../app/(tabs)/StoreItem";

// --- MOCKS --- //
const mockPush = jest.fn();
let mockParams = { id: "1", categoryNumber: "4" };

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock("@/hooks/use-fonts", () => ({ useFonts: jest.fn() }));

jest.mock("@/context/AppRefreshContext", () => ({
  useAppRefresh: jest.fn(() => ({ triggerRefresh: jest.fn() })),
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});
// Mock Header and ThemedText
jest.mock("@/components/header", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");
  const MockHeader = jest.fn();

  return (props: any) => {
    MockHeader(props);
    return (
      <View>
        <Pressable testID="mock-header-button" onPress={props.onIconPress}>
          <Text>Header Button</Text>
        </Pressable>
        {props.onIconPressLeft && (
          <Pressable testID="back-button" onPress={props.onIconPressLeft}>
            <Text>Back Button</Text>
          </Pressable>
        )}
      </View>
    );
  };
});


jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return { ThemedText: ({ children }: any) => <Text>{children}</Text> };
});

jest.mock("react-native-paper", () => {
  const { View, Text, Pressable } = require("react-native");
  return {
    Button: ({ children, onPress, testID }: any) => (
      <Pressable testID={testID} onPress={onPress}>
        <Text>{children}</Text>
      </Pressable>
    ),
    Snackbar: ({ children, visible, testID }: any) => 
      visible ? <View testID={testID || "snackbar"}>{children}</View> : null,
    ActivityIndicator: () => <Text>Loading...</Text>,
  };
});

// Mock Supabase
import { supabase } from "../supabase/index";
(supabase.from as jest.Mock).mockImplementation((table: string) => {
  if (table === "starter_kits") {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id_starter_kit: "1",
          name: "Starter Brew Kit IPA",
          description: "Slightly bitter with a fruity undertone",
          price: 32.99,
        },
        error: null,
      }),
    };
  }
  return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: null }) };
});

// --- TESTS --- //
describe("<StoreItem /> minimal test", () => {
    it("renders with no price and handles quantity", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id_starter_kit: "2",
            name: "No Price Kit",
            description: "No price available",
          },
          error: null,
        }),
      }));
      render(<StoreItem />);
      await waitFor(() => {
        expect(screen.getByText(/No price available/i)).toBeTruthy();
        expect(screen.getByDisplayValue("1")).toBeTruthy();
      });
      const plusBtn = await screen.findByTestId("quantity-plus");
      await act(async () => {
        fireEvent.press(plusBtn);
      });
      await waitFor(() => {
        expect(screen.getByDisplayValue("2")).toBeTruthy();
      });
      const minusBtn = await screen.findByTestId("quantity-minus");
      await act(async () => {
        fireEvent.press(minusBtn);
      });
      await waitFor(() => {
        expect(screen.getByDisplayValue("1")).toBeTruthy();
      });
    });

    it("does not decrement quantity below 1", async () => {
      render(<StoreItem />);
      const minusBtn = await screen.findByTestId("quantity-minus");
      const quantityInput = await screen.findByDisplayValue("1");
      await act(async () => {
        fireEvent.press(minusBtn);
      });
      await waitFor(() => {
        expect(screen.getByDisplayValue("1")).toBeTruthy();
      });
    });

    it("renders spinner when loading", async () => {
      // Patch supabase mock to simulate loading
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }));
      render(<StoreItem />);
      expect(screen.getByText(/Loading product/i)).toBeTruthy();
    });

    it("renders header and all main UI elements", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id_starter_kit: "1",
            name: "Starter Brew Kit IPA",
            description: "Slightly bitter with a fruity undertone",
            price: 32.99,
          },
          error: null,
        }),
      }));
      render(<StoreItem />);
      await waitFor(() => {
        expect(screen.getByTestId("mock-header-button")).toBeTruthy();
        expect(screen.getByDisplayValue("1")).toBeTruthy();
        expect(screen.getByTestId("quantity-plus")).toBeTruthy();
        expect(screen.getByTestId("quantity-minus")).toBeTruthy();
      });
    });

    it("handles add-to-order button press", async () => {
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id_starter_kit: "1",
            name: "Starter Brew Kit IPA",
            description: "Slightly bitter with a fruity undertone",
            price: 32.99,
          },
          error: null,
        }),
      }));
      render(<StoreItem />);
      const addBtn = await screen.findByTestId("add-to-order");
      await act(async () => {
        fireEvent.press(addBtn);
      });
      expect(addBtn).toBeTruthy();
    });
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { id: "1", categoryNumber: "4" };
    global.__TEST_SPECIFICRECIPE__ = false;
  });

  it("renders without crashing and shows loading initially", async () => {
    render(<StoreItem />);
    expect(screen.getByText(/Loading/)).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText(/Slightly bitter with a fruity undertone/i)).toBeTruthy();
      expect(screen.getByText(/€\s?32[,\.]99/)).toBeTruthy();
    });
  });

  it("calls router.push when back button pressed", async () => {
    render(<StoreItem />);
    const headerButton = await screen.findByTestId("mock-header-button");
    await act(async () => {
      fireEvent.press(headerButton);
    });
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/ShoppingCart",
        params: expect.objectContaining({ id: "1", from: "storeitem" }),
      })
    );
  });

  it("handles quantity input change and sanitization", async () => {
    render(<StoreItem />);
    const quantityInput = await screen.findByDisplayValue("1");
    await act(async () => {
      fireEvent.changeText(quantityInput, "abc2");
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue("2")).toBeTruthy();
    });
    await act(async () => {
      fireEvent.changeText(quantityInput, "");
    });
    // After clearing, the input should be empty
    await waitFor(() => {
      expect(screen.getByDisplayValue("")).toBeTruthy();
    });
    // Now blur the input to trigger the reset to "1"
    await act(async () => {
      fireEvent(quantityInput, 'blur');
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue("1")).toBeTruthy();
    });
  })

  it("shows fallback image if no images present", async () => {
    // Patch supabase mock to return no images
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id_starter_kit: "1",
          name: "No Image Kit",
          description: "No image available",
          price: 10,
        },
        error: null,
      }),
    }));
    render(<StoreItem />);
    await waitFor(() => {
      expect(screen.getByText(/No image available/i)).toBeTruthy();
    });
  });

  it("handles loading and error states gracefully", async () => {
    // Patch supabase mock to return error
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: "error" } }),
    }));
    render(<StoreItem />);
    await waitFor(() => {
      expect(screen.getByText(/Loading/)).toBeTruthy();
    });
  });

  it("matches snapshot after loading item", async () => {
    const { toJSON } = render(<StoreItem />);
    await waitFor(() => {
      expect(screen.getByText(/Slightly bitter with a fruity undertone/i)).toBeTruthy();
    });
    expect(toJSON()).toMatchSnapshot();
  });

  it("fetches and renders a regular store item (non-starter kit)", async () => {
    // Mock useLocalSearchParams to return categoryNumber != 4
    mockParams = { id: "5", categoryNumber: "2" };

    (supabase.from as jest.Mock).mockImplementationOnce((table: string) => {
      if (table === "store_items") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id_store_item: "5",
              name: "Regular Item",
              category_id: "2",
              price: 15.5,
            },
            error: null,
          }),
        };
      }
      return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: null }) };
    });

    render(<StoreItem />);
    await waitFor(() => {
      expect(screen.getByText(/Regular Item/i)).toBeTruthy();
    });
  });

  it("handles exception during fetch", async () => {
    (supabase.from as jest.Mock).mockImplementationOnce(() => {
      throw new Error("Network error");
    });

    render(<StoreItem />);
    await waitFor(() => {
      expect(screen.getByText(/Loading/)).toBeTruthy();
    });
  });

  it("handles back button press from cart", async () => {
    mockParams = { id: "1", categoryNumber: "4", from: "cart" };

    render(<StoreItem />);
    await waitFor(() => {
      expect(screen.getByText(/Slightly bitter with a fruity undertone/i)).toBeTruthy();
    });

    const backButton = await screen.findByTestId("back-button");
    await act(async () => {
      fireEvent.press(backButton);
    });

    expect(mockPush).toHaveBeenCalledWith("/ShoppingCart");
  });

  it("handles back button press from specificrecipe", async () => {
    mockParams = { id: "1", categoryNumber: "4", from: "specificrecipe", recipe_slug: "test-recipe" };

    render(<StoreItem />);
    await waitFor(() => {
      expect(screen.getByText(/Slightly bitter with a fruity undertone/i)).toBeTruthy();
    });

    const backButton = await screen.findByTestId("back-button");
    await act(async () => {
      fireEvent.press(backButton);
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/SpecificRecipe",
      params: { recipe_slug: "test-recipe" },
    });
  });

  it("handles back button press from store (default)", async () => {
    mockParams = { id: "1", categoryNumber: "4" };

    render(<StoreItem />);
    await waitFor(() => {
      expect(screen.getByText(/Slightly bitter with a fruity undertone/i)).toBeTruthy();
    });

    const backButton = await screen.findByTestId("back-button");
    await act(async () => {
      fireEvent.press(backButton);
    });

    expect(mockPush).toHaveBeenCalledWith("/Store");
  });

  it("handles error fetching shopping cart", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: 'test-user' } },
      error: null,
    });

    let callNumber = 0;
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      callNumber++;
      if (table === "starter_kits") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id_starter_kit: "1",
              name: "Test Kit",
              description: "Test desc",
              price: 10,
            },
            error: null,
          }),
        };
      }
      if (table === "shopping_carts") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Cart fetch error" },
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    render(<StoreItem />);
    await waitFor(() => {
      expect(screen.getByText(/Test Kit/i)).toBeTruthy();
    });

    const addBtn = await screen.findByTestId("add-to-order");
    await act(async () => {
      fireEvent.press(addBtn);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching shopping cart:",
        "Cart fetch error"
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("creates new cart when none exists", async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: 'test-user' } },
      error: null,
    });

    let fromCallCount = 0;
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      fromCallCount++;
      if (table === "starter_kits") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id_starter_kit: "1",
              name: "Test Kit",
              description: "Test desc",
              price: 10,
            },
            error: null,
          }),
        };
      }
      if (table === "shopping_carts") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id_cart: 'new-cart-123' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "shopping_cart_items") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { id_cart: 'cart-1' }, error: null }),
      };
    });

    render(<StoreItem />);
    await waitFor(() => {
      expect(screen.getByText(/Test Kit/i)).toBeTruthy();
    });

    const addBtn = await screen.findByTestId("add-to-order");
    await act(async () => {
      fireEvent.press(addBtn);
    });

    await waitFor(() => {
      expect(screen.queryByTestId("snackbar")).toBeTruthy();
    });
  });

  it("handles error creating shopping cart", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: 'test-user' } },
      error: null,
    });

    let callCount = 0;
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      callCount++;
      if (table === "starter_kits") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id_starter_kit: "1",
              name: "Test Kit",
              description: "Test",
              price: 10,
            },
            error: null,
          }),
        };
      }
      if (table === "shopping_carts") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Failed to create cart" },
              }),
            }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    render(<StoreItem />);
    await waitFor(() => {
      expect(screen.getByText(/Test Kit/i)).toBeTruthy();
    });

    const addBtn = await screen.findByTestId("add-to-order");
    await act(async () => {
      fireEvent.press(addBtn);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error creating shopping cart:",
        "Failed to create cart"
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("handles error checking existing cart item", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: 'test-user' } },
      error: null,
    });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "starter_kits") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id_starter_kit: "1",
              name: "Test Kit",
              description: "Test",
              price: 10,
            },
            error: null,
          }),
        };
      }
      if (table === "shopping_carts") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { id_cart: 'cart-1' }, error: null }),
        };
      }
      if (table === "shopping_cart_items") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Item check error", code: "PGRST500" },
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    render(<StoreItem />);
    await waitFor(() => {
      expect(screen.getByText(/Test Kit/i)).toBeTruthy();
    });

    const addBtn = await screen.findByTestId("add-to-order");
    await act(async () => {
      fireEvent.press(addBtn);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error checking existing cart item:",
        "Item check error"
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("updates existing cart item quantity", async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: 'test-user' } },
      error: null,
    });

    const mockUpdate = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "starter_kits") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id_starter_kit: "1",
              name: "Test Kit",
              description: "Test",
              price: 10,
            },
            error: null,
          }),
        };
      }
      if (table === "shopping_carts") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { id_cart: 'cart-1' }, error: null }),
        };
      }
      if (table === "shopping_cart_items") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id_cart_item: 'item-1', quantity: 2 },
            error: null,
          }),
          update: jest.fn().mockReturnValue({
            eq: mockUpdate,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    render(<StoreItem />);
    await waitFor(() => {
      expect(screen.getByText(/Test Kit/i)).toBeTruthy();
    });

    const addBtn = await screen.findByTestId("add-to-order");
    await act(async () => {
      fireEvent.press(addBtn);
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
      expect(screen.queryByTestId("snackbar")).toBeTruthy();
    });
  });

  it("handles error updating cart item quantity", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: 'test-user' } },
      error: null,
    });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "starter_kits") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id_starter_kit: "1",
              name: "Test Kit",
              description: "Test",
              price: 10,
            },
            error: null,
          }),
        };
      }
      if (table === "shopping_carts") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { id_cart: 'cart-1' }, error: null }),
        };
      }
      if (table === "shopping_cart_items") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id_cart_item: 'item-1', quantity: 2 },
            error: null,
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: { message: "Update failed" } }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    render(<StoreItem />);
    await waitFor(() => {
      expect(screen.getByText(/Test Kit/i)).toBeTruthy();
    });

    const addBtn = await screen.findByTestId("add-to-order");
    await act(async () => {
      fireEvent.press(addBtn);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error updating cart quantity:",
        "Update failed"
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("inserts new cart item when not existing", async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: 'test-user' } },
      error: null,
    });

    const mockInsert = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "starter_kits") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id_starter_kit: "1",
              name: "Test Kit",
              description: "Test",
              price: 10,
            },
            error: null,
          }),
        };
      }
      if (table === "shopping_carts") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { id_cart: 'cart-1' }, error: null }),
        };
      }
      if (table === "shopping_cart_items") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: mockInsert,
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    render(<StoreItem />);
    await waitFor(() => {
      expect(screen.getByText(/Test Kit/i)).toBeTruthy();
    });

    const addBtn = await screen.findByTestId("add-to-order");
    await act(async () => {
      fireEvent.press(addBtn);
    });

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        cart_id: 'cart-1',
        store_item_id: "1",
        quantity: 1,
        starter_kit: true,
      });
      expect(screen.queryByTestId("snackbar")).toBeTruthy();
    });
  });

  it("handles error inserting cart item", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: 'test-user' } },
      error: null,
    });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "starter_kits") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id_starter_kit: "1",
              name: "Test Kit",
              description: "Test",
              price: 10,
            },
            error: null,
          }),
        };
      }
      if (table === "shopping_carts") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { id_cart: 'cart-1' }, error: null }),
        };
      }
      if (table === "shopping_cart_items") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockResolvedValue({ error: { message: "Insert failed" } }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    render(<StoreItem />);
    await waitFor(() => {
      expect(screen.getByText(/Test Kit/i)).toBeTruthy();
    });

    const addBtn = await screen.findByTestId("add-to-order");
    await act(async () => {
      fireEvent.press(addBtn);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error inserting cart item:",
        "Insert failed"
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("renders when id is not provided", async () => {
    mockParams = { id: undefined, categoryNumber: "4" };

    render(<StoreItem />);
    
    await waitFor(() => {
      expect(screen.getByText(/Loading product/i)).toBeTruthy();
    });
  });

  it("shows snackbar and resets quantity after successful add to cart", async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: 'test-user' } },
      error: null,
    });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "starter_kits") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id_starter_kit: "1",
              name: "Test Kit",
              description: "Test",
              price: 10,
            },
            error: null,
          }),
        };
      }
      if (table === "shopping_carts") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { id_cart: 'cart-1' }, error: null }),
        };
      }
      if (table === "shopping_cart_items") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    render(<StoreItem />);
    await waitFor(() => {
      expect(screen.getByText(/Test Kit/i)).toBeTruthy();
    });

    // Change quantity to 3
    const quantityInput = await screen.findByDisplayValue("1");
    await act(async () => {
      fireEvent.changeText(quantityInput, "3");
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("3")).toBeTruthy();
    });

    const addBtn = await screen.findByTestId("add-to-order");
    await act(async () => {
      fireEvent.press(addBtn);
    });

    // Verify snackbar is shown and quantity resets to 1
    await waitFor(() => {
      expect(screen.queryByTestId("snackbar")).toBeTruthy();
      expect(screen.getByText("Item added to cart")).toBeTruthy();
      expect(screen.getByDisplayValue("1")).toBeTruthy();
    });
  });

  it("navigates back from snackbar button to cart", async () => {
    mockParams = { id: "1", categoryNumber: "4", from: "cart" };

    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: 'test-user' } },
      error: null,
    });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "starter_kits") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id_starter_kit: "1",
              name: "Test Kit",
              description: "Test",
              price: 10,
            },
            error: null,
          }),
        };
      }
      if (table === "shopping_carts") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { id_cart: 'cart-1' }, error: null }),
        };
      }
      if (table === "shopping_cart_items") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    render(<StoreItem />);
    await waitFor(() => {
      expect(screen.getByText(/Test Kit/i)).toBeTruthy();
    });

    const addBtn = await screen.findByTestId("add-to-order");
    await act(async () => {
      fireEvent.press(addBtn);
    });

    await waitFor(() => {
      expect(screen.queryByTestId("snackbar")).toBeTruthy();
    });

    const backBtn = await screen.findByTestId("added-back");
    await act(async () => {
      fireEvent.press(backBtn);
    });

    expect(mockPush).toHaveBeenCalledWith("/ShoppingCart");
  });

  it("navigates back from snackbar button to specificrecipe", async () => {
    mockParams = { id: "1", categoryNumber: "4", from: "specificrecipe", recipe_slug: "test-recipe" };

    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: 'test-user' } },
      error: null,
    });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "starter_kits") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id_starter_kit: "1",
              name: "Test Kit",
              description: "Test",
              price: 10,
            },
            error: null,
          }),
        };
      }
      if (table === "shopping_carts") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { id_cart: 'cart-1' }, error: null }),
        };
      }
      if (table === "shopping_cart_items") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    render(<StoreItem />);
    await waitFor(() => {
      expect(screen.getByText(/Test Kit/i)).toBeTruthy();
    });

    const addBtn = await screen.findByTestId("add-to-order");
    await act(async () => {
      fireEvent.press(addBtn);
    });

    await waitFor(() => {
      expect(screen.queryByTestId("snackbar")).toBeTruthy();
    });

    const backBtn = await screen.findByTestId("added-back");
    await act(async () => {
      fireEvent.press(backBtn);
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/SpecificRecipe",
      params: { recipe_slug: "test-recipe" },
    });
  });

  it("navigates back from snackbar button to store (default)", async () => {
    mockParams = { id: "1", categoryNumber: "4" };

    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: 'test-user' } },
      error: null,
    });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "starter_kits") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id_starter_kit: "1",
              name: "Test Kit",
              description: "Test",
              price: 10,
            },
            error: null,
          }),
        };
      }
      if (table === "shopping_carts") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { id_cart: 'cart-1' }, error: null }),
        };
      }
      if (table === "shopping_cart_items") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    render(<StoreItem />);
    await waitFor(() => {
      expect(screen.getByText(/Test Kit/i)).toBeTruthy();
    });

    const addBtn = await screen.findByTestId("add-to-order");
    await act(async () => {
      fireEvent.press(addBtn);
    });

    await waitFor(() => {
      expect(screen.queryByTestId("snackbar")).toBeTruthy();
    });

    const backBtn = await screen.findByTestId("added-back");
    await act(async () => {
      fireEvent.press(backBtn);
    });

    expect(mockPush).toHaveBeenCalledWith("/Store");
  });

});
