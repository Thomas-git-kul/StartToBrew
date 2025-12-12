'use client';
export const prerender = false;

import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { BASE_COLORS } from "@/constants/Colors";
import { ThemedText } from "@/components/themed-text";
import { XCircle } from "lucide-react-native";
import { useFonts } from "@/hooks/use-fonts";
import PrimaryButton from "@/components/primaryButton";
import Spinner from "@/components/spinner";
import { supabase } from "@/supabase";

export default function PaymentFail() {
  useFonts();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [button, setButton] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFeedback() {
      const { data, error } = await supabase
        .from("payment_feedback")
        .select("id, title, text, button")
        .eq("id", 1)
        .single();

      if (!error && data) {
        setTitle(data.title || "Failed to load");
        setText(data.text || "Failed to load");
        setButton(data.button || "Failed to load");
      }
      setIsLoading(false);
    }
    fetchFeedback();
  }, []);

  // Show spinner while fonts or data is loading
  if (isLoading) {
    return (
      <Spinner
        title="Loading..."
      />
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: BASE_COLORS.LIGHT_BG,
        justifyContent: "center",
      }}
    >
      <View className="mx-3 items-center">
        <ThemedText type="title" className="mb-2">{title}</ThemedText>

        {/* Red cross icon */}
        <XCircle
          size={120}
          color={BASE_COLORS.RED600}
          strokeWidth={1.5}
          className="mb-3"
        />

        <ThemedText type="defaultText" className="text-center mb-6">{text}
        </ThemedText>

        {/* Back to Home Button */}
        <PrimaryButton
          title={button}
          testID="back-button"
          onPress={() => router.replace("/ShoppingCart")}
        />
      </View>
    </SafeAreaView>
  );
}
