// app/PaymentFail.tsx
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Button } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { XCircle } from "lucide-react-native"; // red cross icon
import emailjs from "@emailjs/browser";

export default function PaymentFail() {
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
    <SafeAreaView className="flex-1 items-center justify-center px-6">
      <ThemedText
        type="title"
        style={{ textAlign: "center", width: "100%", maxWidth: 300, marginBottom: 12 }}
      >
        Payment Failed
      </ThemedText>

      {/* Red cross icon */}
      <View className="items-center mb-6">
        <XCircle
          size={120}
          color={"#ef4444"} // red color
          strokeWidth={1.5}
        />
      </View>

      <ThemedText
        type="defaultText"
        style={{
          textAlign: "center",
          width: "100%",
          maxWidth: 300,
          marginTop: 8,
          marginBottom: 8,
        }}
      >
        Unfortunately, your payment could not be completed.
        {"\n"}
        Please try again or contact support.
      </ThemedText>

      {/* Back to Home Button */}
      <Button
        mode="contained"
        onPress={() => router.replace("/HomePage")}
        style={{
          marginTop: 40,
          borderRadius: 20,
          backgroundColor: BASE_COLORS.TEXT_DARK,
          paddingVertical: 6,
        }}
        labelStyle={{
          fontFamily: FontFamilies.BODY_LIGHT,
          fontSize: 18,
        }}
      >
        Back to Home
      </Button>
    </SafeAreaView>
  );
}
