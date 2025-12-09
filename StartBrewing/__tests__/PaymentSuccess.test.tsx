// __tests__/PaymentSuccess.test.tsx
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import PaymentSuccess from "../app/PaymentSuccess";
import emailjs from "@emailjs/browser";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/supabase";

/* Silence console */
jest.spyOn(console, "error").mockImplementation(() => {});
jest.spyOn(console, "warn").mockImplementation(() => {});
jest.spyOn(console, "log").mockImplementation(() => {});

/* ------------------------------
   ROUTER MOCK
------------------------------- */
const replaceMock = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

/* ------------------------------
   EMAILJS MOCK
------------------------------- */
jest.mock("@emailjs/browser", () => ({
  send: jest.fn(() => Promise.resolve({ text: "ok" })),
}));

/* ------------------------------
   SAFE AREA MOCK
------------------------------- */
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: ({ children }: any) => <View>{children}</View> };
});

/* ------------------------------
   UI MOCKS
------------------------------- */
jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return { ThemedText: ({ children }: any) => <Text>{children}</Text> };
});

jest.mock("lucide-react-native", () => {
  const { Text } = require("react-native");
  return { CheckCircle: () => <Text>CheckIcon</Text> };
});

jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: { TEXT_DARK: "#000", LIGHT_BG: "#fff" },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: { BODY: "System" },
}));

/* ------------------------------
   SUPABASE MOCK (single source of truth)
------------------------------- */
const mockFrom = jest.fn();

jest.mock("@/supabase", () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "test-user" } },
        error: null,
      }),
    },
    from: (...args: any[]) => mockFrom(...args),
  },
}));

/* ------------------------------
   SUPABASE TABLE BEHAVIOR
------------------------------- */
let orderItemsInsertMock: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();

  (useRouter as jest.Mock).mockReturnValue({ replace: replaceMock });

  (useLocalSearchParams as jest.Mock).mockReturnValue({
    email: "test@example.com",
    amount: "500",
    order_id: "123",
  });

  orderItemsInsertMock = jest.fn().mockResolvedValue({ error: null });

  mockFrom.mockImplementation((table: string) => {
    switch (table) {
      case "shopping_carts":
        return {
          select: () => ({
            eq: () => ({
              single: jest.fn().mockResolvedValue({
                data: { id_cart: 55 },
                error: null,
              }),
            }),
          }),
          delete: () => ({ eq: jest.fn().mockResolvedValue({ error: null }) }),
        };

      case "shopping_cart_items":
        return {
          select: () => ({
            eq: () => ({
              data: [
                {
                  store_item_id: 99,
                  quantity: 2,
                  starter_kit: true,
                },
              ],
              error: null,
            }),
          }),
          delete: () => ({ eq: jest.fn().mockResolvedValue({ error: null }) }),
        };

      case "orders":
        return {
          select: () => ({
            eq: () => ({
              single: jest.fn().mockResolvedValue({
                data: null, // not found → should create new order
                error: { message: "not found" },
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: jest.fn().mockResolvedValue({
                data: { id_order: 123 },
                error: null,
              }),
            }),
          }),
        };

      case "order_items":
        return {
          insert: orderItemsInsertMock,
        };

      default:
        return {};
    }
  });
});

/* ------------------------------
   TESTS
------------------------------- */

describe("<PaymentSuccess />", () => {
  it("renders essential UI", () => {
    const { getByText } = render(<PaymentSuccess />);

    expect(getByText("Payment Successful!")).toBeTruthy();
    expect(getByText("Thank you for your purchase! You can now return to the homepage!")).toBeTruthy();
    expect(getByText("Back to Home")).toBeTruthy();
    expect(getByText("CheckIcon")).toBeTruthy();
  });

  it("sends email with correct parameters", async () => {
    render(<PaymentSuccess />);

    await waitFor(() => {
      expect(emailjs.send).toHaveBeenCalledTimes(1);
    });

    expect(emailjs.send).toHaveBeenCalledWith(
      process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID,
      process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID,
      {
        customer_email: "test@example.com",
        amount: "5.00",
        order_id: "123",
      },
      process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY
    );
  });

  it("inserts order_items including starter_kit", async () => {
    render(<PaymentSuccess />);

    await waitFor(() => {
      expect(orderItemsInsertMock).toHaveBeenCalled();
    });

    expect(orderItemsInsertMock).toHaveBeenCalledWith([
      {
        order_id: 123,
        store_item_id: 99,
        quantity: 2,
        starter_kit: true,
      },
    ]);
  });

  it("navigates to HomePage", () => {
    const { getByText } = render(<PaymentSuccess />);

    fireEvent.press(getByText("Back to Home"));

    expect(replaceMock).toHaveBeenCalledWith("/HomePage");
  });

  it("creates a new order when orderId is missing and skips email", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValueOnce({
      email: "test@example.com",
      amount: "500",
    });

    render(<PaymentSuccess />);

    await waitFor(() => {
      expect(orderItemsInsertMock).toHaveBeenCalled();
    });

    expect(orderItemsInsertMock).toHaveBeenCalledWith([
      {
        order_id: 123,
        store_item_id: 99,
        quantity: 2,
        starter_kit: true,
      },
    ]);

    expect(emailjs.send).not.toHaveBeenCalled();
  });

  it("defaults starter_kit to false when missing", async () => {
    mockFrom.mockImplementation((table: string) => {
      switch (table) {
        case "shopping_carts":
          return {
            select: () => ({
              eq: () => ({
                single: jest.fn().mockResolvedValue({
                  data: { id_cart: 55 },
                  error: null,
                }),
              }),
            }),
            delete: () => ({ eq: jest.fn().mockResolvedValue({ error: null }) }),
          };

        case "shopping_cart_items":
          return {
            select: () => ({
              eq: () => ({
                data: [
                  {
                    store_item_id: 77,
                    quantity: 1,
                  },
                ],
                error: null,
              }),
            }),
            delete: () => ({ eq: jest.fn().mockResolvedValue({ error: null }) }),
          };

        case "orders":
          return {
            select: () => ({
              eq: () => ({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: "not found" },
                }),
              }),
            }),
            insert: () => ({
              select: () => ({
                single: jest.fn().mockResolvedValue({
                  data: { id_order: 123 },
                  error: null,
                }),
              }),
            }),
          };

        case "order_items":
          return {
            insert: orderItemsInsertMock,
          };

        default:
          return {};
      }
    });

    render(<PaymentSuccess />);

    await waitFor(() => {
      expect(orderItemsInsertMock).toHaveBeenCalled();
    });

    expect(orderItemsInsertMock).toHaveBeenCalledWith([
      {
        order_id: 123,
        store_item_id: 77,
        quantity: 1,
        starter_kit: false,
      },
    ]);
  });

  it("stops processing when no shopping cart is found", async () => {
    mockFrom.mockImplementation((table: string) => {
      switch (table) {
        case "shopping_carts":
          return {
            select: () => ({
              eq: () => ({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: "not found" },
                }),
              }),
            }),
            delete: () => ({ eq: jest.fn().mockResolvedValue({ error: null }) }),
          };

        case "shopping_cart_items":
          return {
            select: () => ({
              eq: () => ({ data: [], error: null }),
            }),
            delete: () => ({ eq: jest.fn().mockResolvedValue({ error: null }) }),
          };

        case "orders":
          return {
            select: () => ({
              eq: () => ({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: "not found" },
                }),
              }),
            }),
            insert: () => ({
              select: () => ({
                single: jest.fn().mockResolvedValue({
                  data: { id_order: 456 },
                  error: null,
                }),
              }),
            }),
          };

        case "order_items":
          return {
            insert: orderItemsInsertMock,
          };

        default:
          return {};
      }
    });

    render(<PaymentSuccess />);

    await waitFor(() => {
      expect(console.warn).toHaveBeenCalledWith("No shopping cart found for user.");
    });

    expect(orderItemsInsertMock).not.toHaveBeenCalled();
    expect(emailjs.send).not.toHaveBeenCalled();
  });

  it("matches snapshot", () => {
    const tree = render(<PaymentSuccess />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
