// __tests__/PaymentFail.test.tsx
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import PaymentFail from "../app/PaymentFail";
import { useRouter, useLocalSearchParams } from "expo-router";
import emailjs from "@emailjs/browser";

jest.spyOn(console, "error").mockImplementation(() => {});
jest.spyOn(console, "warn").mockImplementation(() => {});
jest.spyOn(console, "log").mockImplementation(() => {});

/* ------------------------------
   MOCKS
------------------------------- */

const replaceMock = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@emailjs/browser", () => ({
  send: jest.fn(() => Promise.resolve({ text: "ok" })),
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock("@/components/header", () => {
  const { View, Text } = require("react-native");
  return ({ title }: any) => (
    <View>
      <Text>{title}</Text>
    </View>
  );
});

jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return { ThemedText: ({ children }: any) => <Text>{children}</Text> };
});

jest.mock("lucide-react-native", () => {
  const { Text } = require("react-native");
  return { XCircle: () => <Text>XIcon</Text> };
});

/* Colors & Fonts (light mocks) */
jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    TEXT_BODY: "#000",
    TEXT_DARK: "#000",
  },
}));

jest.mock("@/constants/Fonts", () => ({
  FontFamilies: {
    BODY: "System",
    BODY_LIGHT: "System",
  },
}));

jest.mock("@/hooks/use-fonts", () => ({
  useFonts: jest.fn(() => true),
}));

/* ------------------------------
   TESTS
------------------------------- */

describe("<PaymentFail />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({ replace: replaceMock });

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      email: "test@example.com",
      amount: "500",
      order_id: "ORDER123",
    });

    (emailjs.send as jest.Mock).mockResolvedValue({ text: "ok" });
  });

  it("renders essential UI elements", () => {
    const { getByText } = render(<PaymentFail />);

    expect(getByText("Payment Failed")).toBeTruthy();
    expect(
      getByText("Unfortunately, your payment could not be completed.\nPlease try again or contact support.")
    ).toBeTruthy();
    expect(getByText("Back to shoppingcart")).toBeTruthy();
    expect(getByText("XIcon")).toBeTruthy();
  });

  it("calls emailjs.send with correct params", async () => {
    render(<PaymentFail />);

    await waitFor(() => {
      expect(emailjs.send).toHaveBeenCalledTimes(1);
    });

    expect(emailjs.send).toHaveBeenCalledWith(
      process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID,
      process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID,
      {
        customer_email: "test@example.com",
        amount: "5.00",
        order_id: "ORDER123",
        status: "failed",
      },
      process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY
    );
  });

  it("navigates to shoppingcart when button is pressed", () => {
    const { getByText } = render(<PaymentFail />);

    const button = getByText("Back to shoppingcart");
    fireEvent.press(button);

    expect(replaceMock).toHaveBeenCalledWith("/ShoppingCart");
  });

  it("does not send email when params are missing", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    render(<PaymentFail />);

    // Wait a bit to ensure useEffect has run
    await waitFor(() => {
      expect(emailjs.send).not.toHaveBeenCalled();
    }, { timeout: 100 });
  });

  it("handles emailjs.send error", async () => {
    const mockError = new Error("Email service unavailable");
    (emailjs.send as jest.Mock).mockRejectedValueOnce(mockError);

    render(<PaymentFail />);

    await waitFor(() => {
      expect(emailjs.send).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Failed to send failure email:",
        mockError
      );
    });
  });

  it("snapshot", () => {
    const tree = render(<PaymentFail />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
