jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock Supabase completely
jest.mock('../supabase', () => {
  return {
    supabase: {
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
import { render, fireEvent, waitFor, screen } from "@testing-library/react-native";
import StoreItem from "../app/StoreItem";

// --- MOCKS --- //
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({ id: "1", categoryNumber: "4" }),
}));

jest.mock("@/hooks/use-fonts", () => ({ useFonts: jest.fn() }));
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: ({ children }: any) => <View>{children}</View> };
});

// Mock Header and ThemedText
const MockHeader = jest.fn() as jest.Mock<any, any>;
jest.mock("@/components/header", () => (props: any) => {
  MockHeader(props);
  return null;
});
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return { ThemedText: ({ children }: any) => <Text>{children}</Text> };
});

// Mock Supabase
import { supabase } from "../supabase";
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

  it("calls router.push('/Store') when back button pressed", async () => {
    render(<StoreItem />);

    expect(MockHeader).toHaveBeenCalled();
    const props = MockHeader.mock.calls[0][0];
    props.onIconPress();
    expect(mockPush).toHaveBeenCalledWith("/Store");
  });

  
  it("increments and decrements quantity and updates total price", async () => {
    render(<StoreItem />);

    const minusBtn = screen.getByTestId("quantity-minus");
    const plusBtn = screen.getByTestId("quantity-plus");

    await waitFor(() => {
      expect(screen.getByText("1")).toBeTruthy();
      expect(screen.getByText(/€\s?32[,\.]99/)).toBeTruthy();
    });

    // Increase quantity
    fireEvent.press(plusBtn);
    await waitFor(() => {
      expect(screen.getByText("2")).toBeTruthy();
      expect(screen.getByText(/€\s?65[,\.]98/)).toBeTruthy();
    });

    // Decrease quantity
    fireEvent.press(minusBtn);
    await waitFor(() => {
      expect(screen.getByText("1")).toBeTruthy();
      expect(screen.getByText(/€\s?32[,\.]99/)).toBeTruthy();
    });
  });

  /*
  it("navigates to Store when 'Add to order' FAB pressed", async () => {
    render(<StoreItem />);
    const fab = screen.getByTestId("fab-add-to-order");
    fireEvent.press(fab);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/Store");
    });
  });
  */

  it("matches snapshot after loading item", async () => {
    const { toJSON } = render(<StoreItem />);

    // Wait for the item data to load
    await waitFor(() => {
      expect(screen.getByText(/Slightly bitter with a fruity undertone/i)).toBeTruthy();
    });

    expect(toJSON()).toMatchSnapshot();
  });
});
