import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, ScrollView, Alert } from "react-native";
import { Button } from "react-native-paper";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { BASE_COLORS } from "@/constants/Colors";
import { useFonts } from "@/hooks/use-fonts";
import TextInput from "@/components/textInput";
import Header from '@/components/header';
import { FontFamilies } from "@/constants/Fonts";

export default function Settings() {
  useFonts();

  const router = useRouter();

  const [lastname, setLastname] = useState("");
  const [firstname, setFirstname] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangeInformation = () => {
    Alert.alert("Button Pressed!", "Information would be saved here.");
  };

  return (
    <SafeAreaView className="flex-1"
      style={{
        backgroundColor: BASE_COLORS.LIGHT_BG
      }}
    >
      <Header
        title='Settings'
        iconName="ArrowRight"
        onIconPress={() => router.push("/Account" as any)}
        actionTestID="account-button"
      />

      <ScrollView
        className="px-3"
        contentContainerStyle={{ paddingBottom: 80 }} // make space for FAB
        showsVerticalScrollIndicator={false}
      >        
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

        <View className="items-center mt-7">
          <Button
            mode="contained"
            onPress={handleChangeInformation}
            loading={loading}
            buttonColor={BASE_COLORS.TEXT_DARK}
            textColor={BASE_COLORS.WHITE}
            contentStyle={{ paddingHorizontal: 12, paddingVertical: 6 }}
            labelStyle={{
              fontSize: 16,
              color: BASE_COLORS.WHITE,
              fontFamily: FontFamilies.BODY
            }}
          >
            Change Information
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
