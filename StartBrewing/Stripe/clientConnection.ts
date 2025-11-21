// StartBrewing/Stripe/clientConnection.ts
import { Platform } from "react-native";

export const createPaymentIntent = async (amount: number) => {
  if (Platform.OS === "web") {
    const url = "https://neeqemudecnuayqlvohk.supabase.co/functions/v1/create-payment-intent"; // replace with your deployed function URL

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Supabase anon key for authentication
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ amount, currency: "eur" }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Failed to create payment intent");

    return data; // { clientSecret: "pi_..." }
  } else {
    // Native mock stays for now
    return { clientSecret: "pi_MOCK_SECRET_FOR_UI_TESTING_ONLY" };
  }
};

