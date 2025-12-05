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
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    },
  };
});

import React from "react";
import { render, fireEvent, waitFor, screen, act } from "@testing-library/react-native";
import StoreItem from "../app/(tabs)/StoreItem";

// --- MOCKS --- //
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({ id: "1", categoryNumber: "4" }),
}));

jest.mock("@/hooks/use-fonts", () => ({ useFonts: jest.fn() }));

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
  const { Pressable, Text } = require("react-native");
  const MockHeader = jest.fn();

  return (props: any) => {
    MockHeader(props);
    return (
      <Pressable testID="mock-header-button" onPress={props.onIconPress}>
        <Text>Header Button</Text>
      </Pressable>
    );
  };
});


jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return { ThemedText: ({ children }: any) => <Text>{children}</Text> };
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing and shows loading initially", async () => {
    render(<StoreItem />);
    
    // Loading text should appear first
    expect(screen.getByText(/Loading/)).toBeTruthy();

    // After fetch resolves, item name should appear
    await waitFor(() => {
      expect(screen.getByText(/Slightly bitter with a fruity undertone/i)).toBeTruthy();
      expect(screen.getByText(/€\s?32[,\.]99/)).toBeTruthy();
    });
  });

  it("calls router.push when back button pressed", async () => {
    render(<StoreItem />);

    // Wait for the header button to appear
    const headerButton = await screen.findByTestId("mock-header-button");

    await act(async () => {
      fireEvent.press(headerButton);
    });
    // Update expectation to match actual behavior (object with pathname + params)
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/ShoppingCart",
        params: expect.objectContaining({ id: "1", from: "storeitem" }),
      })
    );
  });

  it("increments and decrements quantity and updates total price", async () => {
    render(<StoreItem />);

    const minusBtn = await screen.findByTestId("quantity-minus");
    const plusBtn = await screen.findByTestId("quantity-plus");

    // Wait for the initial value in TextInput
    const quantityInput = await screen.findByDisplayValue("1");
    expect(quantityInput).toBeTruthy();

    const priceText = screen.getByText(/€\s?32[,\.]99/);
    expect(priceText).toBeTruthy();

    // Increase quantity
    await act(async () => {
      fireEvent.press(plusBtn);
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue("2")).toBeTruthy();
      expect(screen.getByText(/€\s?65[,\.]98/)).toBeTruthy();
    });

    // Decrease quantity
    await act(async () => {
      fireEvent.press(minusBtn);
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue("1")).toBeTruthy();
      expect(screen.getByText(/€\s?32[,\.]99/)).toBeTruthy();
    });
  });

  it("matches snapshot after loading item", async () => {
    const { toJSON } = render(<StoreItem />);

    // Wait for the item data to load
    await waitFor(() => {
      expect(screen.getByText(/Slightly bitter with a fruity undertone/i)).toBeTruthy();
    });

    expect(toJSON()).toMatchSnapshot();
  });
});
