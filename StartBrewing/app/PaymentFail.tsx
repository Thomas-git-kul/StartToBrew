'use client';

import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { BASE_COLORS } from "@/constants/Colors";
import { ThemedText } from "@/components/themed-text";
import { XCircle } from "lucide-react-native";
import emailjs from "@emailjs/browser";
import { useFonts } from "@/hooks/use-fonts";
import PrimaryButton from "@/components/primaryButton";

export default function PaymentFail() {
  useFonts();
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string | undefined;
  const amount = params.amount as string | undefined;
  const orderId = params.order_id as string | undefined;
  const amountInEuros = amount ? (Number(amount) / 100).toFixed(2) : "0.00";

  useEffect(() => {
    if (email && amountInEuros && orderId) {
      // Optionally send a failed payment email
      emailjs
        .send(
          process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID!,
          process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID!,
          {
            customer_email: email,
            amount: amountInEuros,
            order_id: orderId,
            status: "failed",
          },
          process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY!
        )
        .then((result) => {
          console.log("Failure email sent:", result.text);
        })
        .catch((error) => {
          console.error("Failed to send failure email:", error.text || error);
        });
    }
  }, [email, amount, orderId]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: BASE_COLORS.LIGHT_BG,
        justifyContent: "center",
      }}
    >
      <View className="mx-3 items-center">
        <ThemedText type="title" className="mb-2">Payment Failed</ThemedText>

        {/* Red cross icon */}
        <XCircle
          size={120}
          color={BASE_COLORS.RED600}
          strokeWidth={1.5}
          className="mb-3"
        />

        <ThemedText type="defaultText" className="text-center mb-6">
          Unfortunately, your payment could not be completed.
          {"\n"}
          Please try again or contact support.
        </ThemedText>

        {/* Back to Home Button */}
        <PrimaryButton
          title="Back to shoppingcart"
          testID="back-button"
          onPress={() => router.replace("/ShoppingCart")}
        />
      </View>
    </SafeAreaView>
  );
}
