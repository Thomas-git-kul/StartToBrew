import { ActivityIndicator } from "react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "./themed-text";

interface SpinnerProps {
  title: string;
  size?: "small" | "large" | number;
}

export default function Spinner({ title, size="large" }: SpinnerProps) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: BASE_COLORS.LIGHT_BG }}>
      <ActivityIndicator 
        animating
        size={size}
        color={BASE_COLORS.ACCENT_PRIMARY}
      />
      <ThemedText type="defaultText" className="mt-3">{title}</ThemedText>
    </SafeAreaView>
  );
}
