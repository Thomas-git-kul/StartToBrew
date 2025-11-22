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
  const [emailInUseError, setEmailInUseError] = useState(false);
  const [usernameInUseError, setUsernameInUseError] = useState(false);

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

    // Check if email or username already exists in profiles
    setLoading(true);
    setEmailInUseError(false);
    setUsernameInUseError(false);
    // Check email
    const { data: existingEmail, error: emailError } = await supabase
      .from("profiles")
      .select("id")
      .eq("mail", email)
      .single();

    if (emailError && emailError.code !== 'PGRST116') { // PGRST116 = no rows found
      setLoading(false);
      Alert.alert("Error checking email: " + emailError.message);
      return;
    }

    if (existingEmail) {
      setLoading(false);
      setEmailInUseError(true);
      return;
    }

    // Check username
    const { data: existingUsername, error: usernameError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (usernameError && usernameError.code !== 'PGRST116') {
      setLoading(false);
      Alert.alert("Error checking username: " + usernameError.message);
      return;
    }

    if (existingUsername) {
      setLoading(false);
      setUsernameInUseError(true);
      return;
    }

    const birthdate = `${year}-${month}-${day}`; // YYYY-MM-DD, Postgres kan dit parsen

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
          <View style={{ width: "50%" }}>
            <View className="flex-1">
              <TextInput
                value={firstname}
                onChangeText={setFirstname}
                placeholder="Firstname"
              />
            </View>
          </View>
          <View className="flex-1">
            <TextInput
              value={lastname}
              onChangeText={setLastname}
              placeholder="Lastname"
            />
          </View>
        </View>

        <ThemedText type="subTitle" className="mt-6">
          Birth Date
        </ThemedText>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextInput value={day} onChangeText={setDay} placeholder="DD" />
            {day.length > 0 && (!/^([0-2][0-9]|3[01])$/.test(day)) && (
              <ThemedText style={{ color: 'red', marginBottom: 8 }}>
                Invalid day (01-31)
              </ThemedText>
            )}
          </View>
          <View style={{ width: "25%" }}>
            <TextInput value={month} onChangeText={setMonth} placeholder="MM" />
            {month.length > 0 && (!/^(0[1-9]|1[0-2])$/.test(month)) && (
              <ThemedText style={{ color: 'red', marginBottom: 8 }}>
                Invalid month (01-12)
              </ThemedText>
            )}
          </View>
          <View style={{ width: "50%" }}>
            <TextInput value={year} onChangeText={setYear} placeholder="YYYY" />
            {year.length > 0 && (!/^\d{4}$/.test(year)) && (
              <ThemedText style={{ color: 'red', marginBottom: 8 }}>
                Invalid year (e.g. 1990)
              </ThemedText>
            )}
          </View>
        </View>

        <ThemedText type="subTitle" className="mt-6">
          Contact information
        </ThemedText>
        <TextInput value={email} onChangeText={text => { setEmail(text); setEmailInUseError(false); }} placeholder="Email" />
        {email.length > 0 && (!/^\S+@\S+\.\S+$/.test(email)) && (
          <ThemedText style={{ color: 'red', marginBottom: 8 }}>
            Invalid email format
          </ThemedText>
        )}
        {emailInUseError && (
          <ThemedText style={{ color: 'red', marginBottom: 8 }}>
            This email is already in use
          </ThemedText>
        )}

        <ThemedText type="subTitle" className="mt-6">
          Account
        </ThemedText>
        <TextInput
          value={username}
          onChangeText={text => { setUsername(text); setUsernameInUseError(false); }}
          placeholder="Username"
        />
        {usernameInUseError && (
          <ThemedText style={{ color: 'red', marginBottom: 8 }}>
            This username is already in use
          </ThemedText>
        )}
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
        />
        {password.length > 0 && password.length < 6 && (
          <ThemedText style={{ color: 'red', marginBottom: 4 }}>
            Password must be at least 6 characters
          </ThemedText>
        )}
        {password.length > 0 && !/[A-Z]/.test(password) && (
          <ThemedText style={{ color: 'red', marginBottom: 4 }}>
            Password must contain at least one uppercase letter
          </ThemedText>
        )}
        {password.length > 0 && !/[!@#$%^&*(),.?":{}|<>]/.test(password) && (
          <ThemedText style={{ color: 'red', marginBottom: 8 }}>
            Password must contain at least one special character
          </ThemedText>
        )}
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm Password"
          secureTextEntry
        />
        {confirmPassword.length > 0 && password !== confirmPassword && (
          <ThemedText style={{ color: 'red', marginBottom: 8 }}>
            Passwords do not match
          </ThemedText>
        )}

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
              !confirmPassword.trim() ||
              password !== confirmPassword ||
              !/^([0-2][0-9]|3[01])$/.test(day) ||
              !/^(0[1-9]|1[0-2])$/.test(month) ||
              !/^\d{4}$/.test(year) ||
              !/^\S+@\S+\.\S+$/.test(email) ||
              password.length < 6 ||
              !/[A-Z]/.test(password) ||
              !/[!@#$%^&*(),.?":{}|<>]/.test(password)
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
