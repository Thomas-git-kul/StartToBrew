import { useState } from "react";
import { View, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "react-native-paper";
import CheckBox from "expo-checkbox";
import { router } from "expo-router";
import { supabase } from "@/supabase";
import { useFonts } from "@/hooks/use-fonts";

import { ThemedText } from "@/components/themed-text";
import TextInput from "@/components/textInput";
import { BASE_COLORS } from "@/constants/Colors";

import { FontFamilies } from "@/constants/Fonts";
import Header from "@/components/header";

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
  // const [submitChecked, setSubmitChecked] = useState(false);

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

    if (!day || !month || !year) {
      Alert.alert("Please enter your full birth date.");
      return;
    }

    const birthdate = `${year}-${month}-${day}`; // YYYY-MM-DD, Postgres kan dit parsen

    setLoading(true);

    // 1) User in auth.users
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      Alert.alert(error.message);
      return;
    }

    const { user, session } = data;

    if (!user) {
      setLoading(false);
      Alert.alert("User could not be created.");
      return;
    }

    const fullName = `${firstname} ${lastname}`.trim();

    // 2) Profiel bijwerken / aanmaken in public.profiles
    //    Gebruik upsert zodat we NIET tegen profiles_pkey botsen
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id, // PK + FK naar auth.users
        username: username || null,
        full_name: fullName || null,
        firstname: firstname || null,
        lastname: lastname || null,
        mail: email,
        date_of_birth: birthdate, // kolom is timestamptz
        avatar_url: null,
        updated_at: new Date().toISOString(),
        // level en bio laten we via defaults/null
      },
      {
        // niet strikt nodig, want PK = id, maar expliciet kan geen kwaad
        onConflict: "id",
      }
    );

    if (profileError) {
      setLoading(false);
      Alert.alert(profileError.message);
      return;
    }

    setLoading(false);

    if (!session) {
      Alert.alert("Check your inbox to verify your email.");
      router.replace("/Auth");
      return;
    }

    router.replace("/(tabs)/HomePage");
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{
        backgroundColor: BASE_COLORS.LIGHT_BG,
      }}
    >
      <Header
        title="No account yet?"
        iconName="ArrowRight"
        onIconPress={() => router.push("/Auth")}
        actionTestID="registration-button"
      />
      <ScrollView
        className="px-3"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="subTitle">Full Name</ThemedText>
        <View className="flex-row gap-3 w-full">
          <View className="flex-1">
            <TextInput
              value={lastname}
              onChangeText={setLastname}
              label="Lastname"
            />
          </View>
          <View style={{ width: "50%" }}>
            <View className="flex-1">
              <TextInput
                value={firstname}
                onChangeText={setFirstname}
                label="Firstname"
              />
            </View>
          </View>
        </View>

        <ThemedText type="subTitle" className="mt-6">
          Birth Date
        </ThemedText>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextInput value={day} onChangeText={setDay} label="DD" />
          </View>
          <View style={{ width: "25%" }}>
            <TextInput value={month} onChangeText={setMonth} label="MM" />
          </View>
          <View style={{ width: "50%" }}>
            <TextInput value={year} onChangeText={setYear} label="YYYY" />
          </View>
        </View>

        <ThemedText type="subTitle" className="mt-6">
          Contact information
        </ThemedText>
        <TextInput value={email} onChangeText={setEmail} label="Email" />

        <ThemedText type="subTitle" className="mt-6">
          Account
        </ThemedText>
        <TextInput
          value={username}
          onChangeText={setUsername}
          label="Username"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          label="Password"
          secureTextEntry
        />
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          label="Confirm Password"
          secureTextEntry
        />

        <View className="flex-row items-center my-4">
          <CheckBox
            value={agree}
            onValueChange={setAgree}
            color={BASE_COLORS.TEXT_DARK}
            style={{ marginRight: 8, height: 24, width: 24 }}
          />
          <ThemedText className="defaultText">
            I agree to the terms and conditions
          </ThemedText>
        </View>
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <Button
            mode="contained"
            onPress={signUpWithEmail}
            loading={loading}
            disabled={
              !agree ||
              loading ||
              !lastname.trim() ||
              !firstname.trim() ||
              !day.trim() ||
              !month.trim() ||
              !year.trim() ||
              !email.trim() ||
              !username.trim() ||
              !password.trim() ||
              !confirmPassword.trim()
            }
            style={{
              backgroundColor:
                agree && lastname.trim() && firstname.trim() && day.trim() && month.trim() && year.trim() && email.trim() && username.trim() && password.trim() && confirmPassword.trim()
                  ? BASE_COLORS.TEXT_DARK
                  : BASE_COLORS.STONE200,
              borderRadius: 20,
              width: 220,
            }}
            labelStyle={{
              fontSize: 14,
              fontFamily: FontFamilies.BODY,
              color: BASE_COLORS.WHITE,
            }}
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
