import { useState } from "react";
import { View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Checkbox, FAB } from "react-native-paper";
import { router } from "expo-router";
import { supabase } from "@/supabase";
import { useFonts } from "@/hooks/use-fonts";

import { ThemedText } from "@/components/themed-text";
import TextInput from "@/components/textInput"; // your wrapped RN Paper TextInput
import { BASE_COLORS } from "@/constants/Colors";
import { ScrollView } from "react-native";
import { FontFamilies } from "@/constants/Fonts";

export default function Registration() {
  useFonts();

  const [lastname, setLastname] = useState("");
  const [firstname, setFirstname] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    if (!agree) {
      Alert.alert("Please accept the terms and conditions.");
      return;
    }

    if (!email || !password) {
      Alert.alert("Email and password are required.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { data: { session }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          first_name: firstname,
          last_name: lastname,
          birthdate: `${year}-${month}-${day}`,
        },
      },
    });

    setLoading(false);

    if (error) {
      Alert.alert(error.message);
      return;
    }

    if (!session) {
      Alert.alert("Check your inbox to verify your email.");
      router.replace("/Auth");
      return;
    }

    router.replace("/(tabs)/HomePage");
  }

  return (
    <SafeAreaView className="flex-1"
      style={{
        backgroundColor: BASE_COLORS.LIGHT_BG
      }}
    >
      <ScrollView
        className="px-3"
        contentContainerStyle={{ paddingBottom: 80 }} // make space for FAB
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="titleBlack" className="mt-4">No account yet?</ThemedText>
        <ThemedText type="titleBlack" className="mb-3">Register here!</ThemedText>

        {/* Full Name */}
        <ThemedText type="subTitle">Full Name</ThemedText>
        <View className="flex-row gap-3 w-full">
          <View className="flex-1">
            <TextInput value={lastname} onChangeText={setLastname} label="Lastname" />
          </View>
          <View className="flex-1">
            <TextInput value={firstname} onChangeText={setFirstname} label="Firstname" />
          </View>
        </View>

        {/* Birthday */}
        <ThemedText type="subTitle" className="mt-6">Birth Date</ThemedText>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextInput value={day} onChangeText={setDay} label="DD" />
          </View>
          <View className="flex-1">
            <TextInput value={month} onChangeText={setMonth} label="MM" />
          </View>
          <View className="flex-1">
            <TextInput value={year} onChangeText={setYear} label="YYYY" />
          </View>
        </View>

        {/* Contact */}
        <ThemedText type="subTitle" className="mt-6">Contact information</ThemedText>
        <TextInput value={email} onChangeText={setEmail} label="Email" />

        {/* Account */}
        <ThemedText type="subTitle" className="mt-6">Account</ThemedText>
        <TextInput value={username} onChangeText={setUsername} label="Username" />
        <TextInput value={password} onChangeText={setPassword} label="Password" />
        <TextInput value={confirmPassword} onChangeText={setConfirmPassword} label="Confirm Password" />

        {/* Terms */}
        <View className="flex-row items-center my-4">
          <Checkbox
            status={agree ? "checked" : "unchecked"}
            onPress={() => setAgree(!agree)}
            color={BASE_COLORS.ACCENT_PRIMARY}
          />
          <ThemedText className="defaultText">I agree to the terms and conditions</ThemedText>
        </View>
      </ScrollView>

      {/* FAB overlay at bottom */}
      <View
        style={{
          position: "absolute",
          bottom: 20,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <FAB
          mode="elevated"
          label={loading ? "Creating account..." : "Create account"}
          onPress={signUpWithEmail}
          loading={loading}
          color={BASE_COLORS.WHITE}
          style={{
            backgroundColor: BASE_COLORS.TEXT_DARK,
          }}
          theme={{
            fonts: {
              labelLarge: {
                fontSize: 14,
                fontFamily: FontFamilies.BODY,
              },
            },
          }}
        />
      </View>
    </SafeAreaView>
  );
}
