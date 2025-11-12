import { useState, useEffect } from "react";
import { Alert, AppState, View } from "react-native";
import { Button, useTheme } from "react-native-paper";
import { supabase } from "../supabase";
import "../global.css";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { router } from "expo-router";
import { useFonts } from "@/hooks/use-fonts";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import TextInput from "@/components/textInput"

export default function Auth() {
  useFonts();

  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh?.();
      } else {
        supabase.auth.stopAutoRefresh?.();
      }
    });

    return () => subscription.remove();
  }, []);

  async function signInWithEmail() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert(error.message);
      return;
    }

    router.replace("/(tabs)/HomePage");
  }

  async function signInAsTestUser() {
    const { error } = await supabase.auth.signInWithPassword({
      email: "test@user.com",
      password: "testuser",
    });

    if (error) {
      Alert.alert(error.message);
      return;
    }

    router.replace("/(tabs)/HomePage");
  }

  return (
    <SafeAreaView className="flex-1 justify-center"
      style={{
        backgroundColor: BASE_COLORS.LIGHT_BG,
      }}
    >
      <ThemedText type="titleBlack" className="text-center mb-10">Welcome</ThemedText>

      <View className="gap-1 mx-5 mb-5">
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View className="grid grid-col-1 gap-2 mx-5">
        <Button
          mode="contained"
          onPress={signInWithEmail}
          buttonColor={BASE_COLORS.TEXT_DARK}
          textColor={BASE_COLORS.WHITE}
          contentStyle={{ paddingHorizontal: 12, paddingVertical: 6 }}
          labelStyle={{
            fontSize: 16,
            color: BASE_COLORS.WHITE,
            fontFamily: FontFamilies.BODY
          }}
          style={{
            alignSelf: "flex-start"
          }}
        >Sign In</Button>
        <Button
          mode="contained"
          onPress={() => router.push("../Registration")}
          buttonColor={BASE_COLORS.TEXT_DARK}
          textColor={BASE_COLORS.WHITE}
          contentStyle={{ paddingHorizontal: 12, paddingVertical: 6 }}
          labelStyle={{
            fontSize: 16,
            color: BASE_COLORS.WHITE,
            fontFamily: FontFamilies.BODY
          }}
          style={{
            alignSelf: "flex-start"
          }}
        >Sign Up</Button>
        <Button
          mode="contained"
          onPress={signInAsTestUser}
          buttonColor={BASE_COLORS.STONE950}
          textColor={BASE_COLORS.WHITE}
          contentStyle={{ paddingHorizontal: 12, paddingVertical: 6 }}
          labelStyle={{
            fontSize: 16,
            color: BASE_COLORS.WHITE,
            fontFamily: FontFamilies.BODY
          }}
          style={{
            alignSelf: "flex-start"
          }}
        >Sign In as Test User</Button>
      </View>
    </SafeAreaView>
  );
}