import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import { useClickCounter } from "@/context/ClickCounterContext";

export function HapticTab(props: BottomTabBarButtonProps) {
  const { increment } = useClickCounter();

  const handlePress = async (ev: any) => {
    try {
      await increment("haptic_tab");
    } catch (e) {
      // ignore
    }
    props.onPress?.(ev);
  };

  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === "ios") {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        props.onPressIn?.(ev);
      }}
      onPress={handlePress}
    />
  );
}
