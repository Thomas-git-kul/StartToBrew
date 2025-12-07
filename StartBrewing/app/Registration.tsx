import { useState } from "react";
import { View, Alert, ScrollView, Dimensions } from "react-native";
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
import ErrorChip from "@/components/errorChip";
import Spinner from "@/components/spinner";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;
const MIN_YEAR = 1900;
const MAX_YEAR = 2025;

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

    const yrNum = parseInt(year, 10);
    if (isNaN(yrNum) || yrNum < MIN_YEAR || yrNum > MAX_YEAR) {
      Alert.alert(`Please enter a valid birth year between ${MIN_YEAR} and ${MAX_YEAR}.`);
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

  if (loading) {
    return (
      <Spinner 
        title="Loading registration..."
      />
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{
        backgroundColor: BASE_COLORS.LIGHT_BG,
      }}
    >
      <Header
        title="Sign Up to StartToBrew"
        iconNameLeft="ArrowLeft"
        onIconPressLeft={() => router.back()}
        actionTestIDLeft="registration-button"
      />
      <ScrollView
        className="px-3"
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="subTitle">Full Name</ThemedText>
        <View className="flex-row gap-3 w-full">
          <View style={{ width: "47%" }}>
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

        <ThemedText type="subTitle" className="mt-2">Birth Date</ThemedText>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextInput value={day} onChangeText={setDay} placeholder="DD" keyboardType="numeric"/>
          </View>
          <View style={{ width: "25%" }}>
            <TextInput value={month} onChangeText={setMonth} placeholder="MM" keyboardType="numeric"/>
          </View>
          <View style={{ width: "50%" }}>
            <TextInput value={year} onChangeText={setYear} placeholder="YYYY" keyboardType="numeric"/>
          </View>
        </View>
        <View className="mb-3">
          {day.length > 0 && (!/^([0-2][0-9]|3[01])$/.test(day)) && (
            <ErrorChip text="Invalid day (01-31)"/>
          )}
          {month.length > 0 && (!/^(0[1-9]|1[0-2])$/.test(month)) && (
            <ErrorChip text="Invalid month (01-12)"/>
          )}
          {year.length > 0 && (!/^\d{4}$/.test(year)) && (
            <ErrorChip text="Invalid year (e.g. 1990)"/>
          )}
          {year.length > 0 && (/^\d{4}$/.test(year)) && (Number(year) < MIN_YEAR || Number(year) > MAX_YEAR) && (
            <ErrorChip text={`Year must be between ${MIN_YEAR} and ${MAX_YEAR}`}/>
          )}
        </View>

        <ThemedText type="subTitle" className="mt-2">
          Contact information
        </ThemedText>
        <TextInput value={email} onChangeText={text => { setEmail(text); setEmailInUseError(false); }} placeholder="Email" keyboardType="email-address"/>
        {email.length > 0 && (!/^\S+@\S+\.\S+$/.test(email)) && (
          <ErrorChip text="Invalid email address"/>
        )}
        {emailInUseError && (
          <ErrorChip text="This email is already in use"/>
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
          <View className="mb-5">
            <ErrorChip text="This username is already in use"/>
          </View>
        )}
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
        />
        {password.length > 0 && (password.length < 6 || !/[A-Z]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) && (
          <View className="mb-5">
            {password.length < 6 && (
              <ErrorChip text="Enter at least 6 characters" />
            )}
            {!/[A-Z]/.test(password) && (
              <ErrorChip text="Enter at least 1 capital letter" />
            )}
            {!/[!@#$%^&*(),.?":{}|<>]/.test(password) && (
              <ErrorChip text="Enter at least 1 special character" />
            )}
          </View>
        )}
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm Password"
          secureTextEntry
        />
        {confirmPassword.length > 0 && password !== confirmPassword && (
          <View className="mb-5">
            <ErrorChip text="Passwords don't match"/>
          </View>
        )}

        <View className="flex-row items-center mt-4 mb-10">
          <CheckBox
            value={agree}
            onValueChange={setAgree}
            color={BASE_COLORS.ACCENT_PRIMARY}
            style={{ marginLeft: 2, marginRight: 8, height: 24, width: 24 }}
          />
          <ThemedText className="defaultText">I agree to the terms and conditions</ThemedText>
        </View>
        <View style={{ alignItems: "center", marginBottom: 25 }}>
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
              !/^\d{4}$/.test(year) || Number(year) < MIN_YEAR || Number(year) > MAX_YEAR ||
              !/^\S+@\S+\.\S+$/.test(email) ||
              password.length < 6 ||
              !/[A-Z]/.test(password) ||
              !/[!@#$%^&*(),.?":{}|<>]/.test(password)
            }
            style={{
              backgroundColor:
                agree && lastname.trim() && firstname.trim() && day.trim() && month.trim() && year.trim() && email.trim() && username.trim() && password.trim() && confirmPassword.trim()
                  ? BASE_COLORS.TEXT_DARK
                  : BASE_COLORS.STONE300,
              borderRadius: 20,
            }}
            labelStyle={{
              fontSize: Math.min(16 * scale, 24),
              fontFamily: FontFamilies.BODY,
              color: BASE_COLORS.WHITE,
            }}
          >{"Create account"}</Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
