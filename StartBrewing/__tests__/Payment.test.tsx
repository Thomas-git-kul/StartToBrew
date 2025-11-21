import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import PaymentScreen from "../app/Payment";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as StripeModule from "../Stripe";
import { Platform } from "react-native";

/* ------------------------------
✅ MOCKS
------------------------------- */

// Use proper types for Jest mocks
const pushMock = jest.fn() as jest.MockedFunction<() => void>;
const backMock = jest.fn() as jest.MockedFunction<() => void>;

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@/hooks/use-fonts", () => ({
  useFonts: () => true,
}));

jest.mock("@/components/themed-text", () => {
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, style }: any) => <Text style={style}>{children}</Text>,
  };
});

jest.mock("@/components/header", () => {
  const { View, Text, Pressable } = require("react-native");
  return ({ title, onIconPress }: any) => (
    <View>
      <Text>{title}</Text>
      <Pressable testID="header-back-button" onPress={onIconPress} />
    </View>
  );
});

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock("@/constants/Colors", () => ({
  BASE_COLORS: {
    WHITE: "#fff",
    TEXT_DARK: "#000",
    LIGHT_BG: "#eee",
  },
}));
jest.mock("@/constants/Fonts", () => ({
  FontFamilies: { BODY: "System", HEADING: "System" },
}));

jest.mock("../Stripe", () => ({
  StripeWrapper: ({ children }: any) => <>{children}</>,
  createPaymentIntent: jest.fn().mockResolvedValue({ clientSecret: "test_secret" }),
}));

jest.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: any) => <>{children}</>,
  CardElement: () => <></>,
  useStripe: () => ({
    confirmCardPayment: jest.fn().mockResolvedValue({ paymentIntent: { status: "succeeded" } }),
  }),
  useElements: () => ({ getElement: () => ({}) }),
}));

jest.mock("@stripe/stripe-js", () => ({ loadStripe: jest.fn() }));

/* ------------------------------
✅ TESTS
------------------------------- */

describe("<PaymentScreen />", () => {
  beforeEach(() => {
    // Force web UI to render
    (Platform as any).OS = "web";

    (useRouter as jest.Mock).mockReturnValue({ push: pushMock, back: backMock });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ amount: "30049" });
    pushMock.mockClear();
    backMock.mockClear();
  });

  it("renders main titles correctly", async () => {
    const { getByText } = render(<PaymentScreen />);
    await waitFor(() => getByText("Complete Your Purchase"));

    expect(getByText("Complete Your Purchase")).toBeTruthy();
    expect(getByText("Order Summary")).toBeTruthy();
    expect(getByText(/Total Amount:/)).toBeTruthy();
    expect(getByText("Payment Method")).toBeTruthy();
  });

  it("navigates back when header back button is pressed", async () => {
    const { getByTestId } = render(<PaymentScreen />);
    const backButton = await waitFor(() => getByTestId("header-back-button"));

    fireEvent.press(backButton);
    expect(backMock).toHaveBeenCalled();
  });

  it("processes payment and shows success screen after Pay Now button is pressed", async () => {
    const { getByText } = render(<PaymentScreen />);
    
    const payButton = await waitFor(() => getByText(/Pay Now/));
    fireEvent.press(payButton);

    await waitFor(() => getByText("Payment Successful!"));
    expect(getByText("Payment Successful!")).toBeTruthy();
    expect(getByText("Thank you for your purchase.")).toBeTruthy();

    const homeButton = getByText("Return to Home");
    fireEvent.press(homeButton);
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("matches snapshot", async () => {
    const tree = render(<PaymentScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
