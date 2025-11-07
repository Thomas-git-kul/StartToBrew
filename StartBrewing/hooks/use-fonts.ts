import { useFonts as useExpoFonts } from "expo-font";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export const useFonts = () => {
  // Ensure MaterialCommunityIcons font is registered (needed so react-native-paper
  // can render icons by name on web/native).
  // `loadFont` is a no-op on some platforms but safe to call.
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    MaterialCommunityIcons.loadFont?.();
  } catch (e) {
    // ignore if not available
  }

  const [fontsLoaded] = useExpoFonts({
    "BlackHanSans": require("../assets/fonts/BlackHanSans-Regular.ttf"),
    "Battambang_Thin": require("../assets/fonts/Battambang-Thin.ttf"),
    "Battambang": require("../assets/fonts/Battambang-Regular.ttf"),
    "Battambang_Light": require("../assets/fonts/Battambang-Light.ttf"),
    "Battambang_Black": require("../assets/fonts/Battambang-Black.ttf"),
    "Battambang_Bold": require("../assets/fonts/Battambang-Bold.ttf")
  });
  return fontsLoaded;
};
