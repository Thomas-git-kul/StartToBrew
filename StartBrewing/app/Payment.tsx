// Payment.tsx
import { useState, useEffect } from "react";
import { View, ScrollView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StripeWrapper, createPaymentIntent } from "../Stripe";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, ActivityIndicator } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const WebPaymentForm = ({
  clientSecret,
  amount,
  onSuccess,
}: {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!stripe || !elements) return;
    setProcessing(true);
    const card = elements.getElement(CardElement);
    if (!card) {
      alert("Payment form not ready");
      setProcessing(false);
      return;
    }
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });
    setProcessing(false);
    if (result.error) {
      alert(result.error.message);
    } else {
      onSuccess();
    }
  };

  const formattedAmount = new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
  }).format(amount / 100);

  

  return (
    <View className="mt-4">
      <View className="bg-white rounded-lg border border-gray-200 p-4 min-h-[60px]">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: BASE_COLORS.TEXT_DARK,
                fontFamily: FontFamilies.BODY,
              },
              invalid: { color: "#fa755a" },
            },
          }}
        />
      </View>

      <View className="flex-row items-center mt-4">
        <Ionicons name="lock-closed" size={16} color={BASE_COLORS.TEXT_DARK} />
        <ThemedText type="defaultText" style={{ marginLeft: 8 }}>
          Your payment information is processed securely.
        </ThemedText>
      </View>

      <View className="mt-6 items-center">
        <Button
          mode="contained"
          onPress={handlePayment}
          disabled={processing}
          style={{
            backgroundColor: BASE_COLORS.TEXT_DARK,
            alignSelf: "center",
            borderRadius: 8,
          }}
          contentStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
          labelStyle={{
            fontSize: 16,
            color: BASE_COLORS.WHITE,
            fontFamily: FontFamilies.BODY,
          }}
        >
          {processing ? "Processing..." : `Pay Now ${formattedAmount}`}
        </Button>
      </View>
    </View>
  );
};

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const amount = params.amount ? Number(params.amount) : 30049;

  useEffect(() => {
    const fetchIntent = async () => {
      try {
        setLoading(true);
        const data = await createPaymentIntent(amount);
        if (!data?.clientSecret) throw new Error("Supabase did not return a clientSecret");
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchIntent();
  }, [amount]);

  if (showSuccess) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50 px-5">
        <View className="w-24 h-24 rounded-full bg-green-500 justify-center items-center mb-5">
          <Ionicons name="checkmark" size={60} color="white" />
        </View>

        <ThemedText type="title" className="text-center mb-2">
          Payment Successful!
        </ThemedText>
        <ThemedText type="defaultText" className="text-center mb-8">
          Thank you for your purchase.
        </ThemedText>

        <Button
          mode="contained"
          onPress={() => router.push("/")}
          style={{
            backgroundColor: BASE_COLORS.TEXT_DARK,
            borderRadius: 8,
          }}
          contentStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
          labelStyle={{ fontSize: 16, color: BASE_COLORS.WHITE, fontFamily: FontFamilies.BODY }}
        >
          Return to Home
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <StripeWrapper>
      {Platform.OS === "web" ? (
        clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SafeAreaView className="flex-1 bg-gray-50">
              <Header
                title="Payment"
                iconName="ArrowLeft"
                onIconPress={() => router.back()}
              />

              <ScrollView className="mx-3">
                <ThemedText type="title" className="mt-3">
                  Complete Your Purchase
                </ThemedText>

                <View className="bg-white rounded-lg p-4 mt-4">
                  <ThemedText type="subTitle" className="mb-2">
                    Order Summary
                  </ThemedText>
                  <ThemedText type="accentDark">
                    Total Amount:{" "}
                    {new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }).format(amount / 100)}
                  </ThemedText>
                </View>

                <View className="mt-6">
                  <ThemedText type="subTitle" className="mb-2">
                    Payment Method
                  </ThemedText>

                  <WebPaymentForm
                    clientSecret={clientSecret}
                    amount={amount}
                    onSuccess={() => setShowSuccess(true)}
                  />

                  {error && (
                    <ThemedText type="defaultText" style={{ color: "red", marginTop: 10 }}>
                      {error}
                    </ThemedText>
                  )}
                </View>
              </ScrollView>
            </SafeAreaView>
          </Elements>
        ) : (
          <View className="p-5">
            <ThemedText type="defaultText">Loading payment...</ThemedText>
            {error && <ThemedText type="defaultText" style={{ color: "red" }}>{error}</ThemedText>}
          </View>
        )
      ) : (
        <SafeAreaView>
          {/* Native flow unchanged */}
        </SafeAreaView>
      )}
    </StripeWrapper>
  );
}
