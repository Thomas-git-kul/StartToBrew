// __tests__/Payment.test.tsx
import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";

// Mock expo-router before importing the screen
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({ amount: "12345" }),
}));

// Mocks for components and safe-area
jest.mock("@/components/header", () => {
  const { Text } = require("react-native");
  return ({ title }: any) => <Text>{title}</Text>;
});

jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return { ThemedText: ({ children }: any) => <Text>{children}</Text> };
});

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Mock supabase
jest.mock("@/supabase", () => ({
  supabase: {
    auth: { getUser: jest.fn() },
  },
}));

import { supabase } from "@/supabase";
import PaymentScreen from "../app/Payment";

jest.spyOn(console, "error").mockImplementation(() => {});

describe("PaymentScreen", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    // default: user has an email
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { email: "test@example.com" } },
    });

    // mock Linking.openURL
    jest.spyOn(Linking, "openURL").mockImplementation(jest.fn());

    // default fetch -> returns object with url
    (global as any).fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ url: "https://checkout.test/session" }),
    });
  });

  it("renders header and basic UI", () => {
    const { getByText } = render(<PaymentScreen />);
    expect(getByText("Payment")).toBeTruthy();
  });

  it("initiates payment and opens checkout URL", async () => {
    render(<PaymentScreen />);

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        "https://checkout.test/session"
      );
    });
  });

  it("shows error when checkout session creation fails", async () => {
    // make fetch return no url
    (global as any).fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({}),
    });

    const { findByText } = render(<PaymentScreen />);

    const err = await findByText("Failed to create checkout session");
    expect(err).toBeTruthy();
  });
});
