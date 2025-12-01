import { View, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { Button } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useFonts } from "@/hooks/use-fonts";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

export default function NotFound() {
  useFonts();
  const router = useRouter();

  return (
    <SafeAreaView 
      className="flex-1 justify-center"
      style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}
    >
      <View className="mx-5 flex-column gap-3">
        <ThemedText type="titleBlack">Oops — page not found</ThemedText>
        <ThemedText type="defaultText">
          The page you are trying to reach doesn't exist or has been removed. Check the URL or go back to the home page.
        </ThemedText>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", width: "100%", marginTop: 8 }}>
          <Button
            mode="contained"
            onPress={() => router.replace("/(tabs)/HomePage")}
            labelStyle={{ 
              fontSize: Math.min(16 * scale, 24),
              color: BASE_COLORS.WHITE,
              fontFamily: FontFamilies.BODY,            
            }}
            style={{
              borderRadius: 20,
              backgroundColor: BASE_COLORS.TEXT_DARK,
            }}
          >Back to Home</Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
