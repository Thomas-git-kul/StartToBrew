import { useEffect, useState } from "react";
import { View, Platform, Linking } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { supabase } from "@/supabase";
import Spinner from "@/components/spinner";

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const amount = params.amount ? Number(params.amount) : 30049;
  const SUPABASE_FUNCTION_URL =
    "https://neeqemudecnuayqlvohk.supabase.co/functions/v1/create-checkout-session";

  // Auto-start payment immediately
  useEffect(() => {
    const initiatePayment = async () => {
      try {
        setError(null);

        // 1. Get logged-in user
        const { data: userData } = await supabase.auth.getUser();
        const email = userData?.user?.email;

        if (!email) {
          setError("No logged-in user email found.");
          setLoading(false);
          return;
        }

        // 2. Request checkout session
        const res = await fetch(SUPABASE_FUNCTION_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount, customer_email: email }),
        });

        const data = await res.json();

        if (!data.url) {
          throw new Error("Failed to create checkout session");
        }

        // 3. Redirect immediately
        if (Platform.OS === "web") {
          window.location.href = data.url;
        } else {
          Linking.openURL(data.url);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initiatePayment();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BASE_COLORS.LIGHT_BG }}>
      <Header title="Payment" />
      {loading ? (
        <Spinner title="Loading payment information..." />
      ) : error ? (
        <ThemedText>{error}</ThemedText>
      ) : null}
    </SafeAreaView>
  );
}
