import { useFonts as useExpoFonts } from "expo-font";

export const useFonts = () => {
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
