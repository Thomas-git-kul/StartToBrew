// __tests__/PaymentSuccess.test.tsx
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import PaymentSuccess from "../app/PaymentSuccess";
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
  return { CheckCircle: () => <Text>CheckIcon</Text> };
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

/* ------------------------------
   TESTS
------------------------------- */

describe("<PaymentSuccess />", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ replace: replaceMock });
    replaceMock.mockClear();

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      email: "test@example.com",
      amount: "500",
      order_id: "ORDER123",
    });

    (emailjs.send as jest.Mock).mockClear();
  });

  it("renders essential UI elements", () => {
    const { getByText } = render(<PaymentSuccess />);

    expect(getByText("Payment Successful!")).toBeTruthy();
    expect(
      getByText("Thank you for your purchase! You can now return to the homepage!")
    ).toBeTruthy();
    expect(getByText("Back to Home")).toBeTruthy();
    expect(getByText("CheckIcon")).toBeTruthy();
  });

  it("calls emailjs.send with correct params", async () => {
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
        order_id: "ORDER123",
      },
      process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY
    );
  });

  it("navigates to /HomePage when button is pressed", () => {
    const { getByText } = render(<PaymentSuccess />);

    const button = getByText("Back to Home");
    fireEvent.press(button);

    expect(replaceMock).toHaveBeenCalledWith("/HomePage");
  });

  it("snapshot", () => {
    const tree = render(<PaymentSuccess />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
