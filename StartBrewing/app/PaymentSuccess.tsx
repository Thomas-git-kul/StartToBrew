// app/PaymentSuccess.tsx
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Button } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { CheckCircle } from "lucide-react-native";
import emailjs from "@emailjs/browser"; // Make sure you installed emailjs-com or @emailjs/browser

export default function PaymentSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams(); // get info from query params if needed
  const email = params.email as string | undefined; // email passed from checkout
  const amount = params.amount as string | undefined; // amount passed from checkout
  const orderId = params.order_id as string | undefined;
  const amountInEuros = (Number(amount) / 100).toFixed(2);

  useEffect(() => {
    if (email && amountInEuros && orderId) {
      // Send email using EmailJS
      emailjs
        .send(
          process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID!,
          process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID!,
          {
            customer_email: email,
            amount: amountInEuros,
            order_id: orderId,
          },
          process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY!
        )
        .then((result) => {
          console.log("Email sent successfully:", result.text);
        })
        .catch((error) => {
          console.error("Failed to send email:", error.text || error);
        });
    } else {
      console.warn("Missing email, amount, or order ID, cannot send receipt.");
    }
  }, [email, amount, orderId]);

  return (
    <SafeAreaView className="flex-1 items-center justify-center px-6">
      <ThemedText
        type="title"
        style={{ textAlign: "center", width: "100%", maxWidth: 300, marginBottom: 12 }}
      >
        Payment Successful!
      </ThemedText>

      {/* Checkmark */}
      <View className="items-center mb-6">
        <CheckCircle
          size={120}
          color={"#22c55e"}
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
        Thank you for your purchase!
        {"\n"}
        You can now return to the homepage!
      </ThemedText>

      {/* Button */}
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