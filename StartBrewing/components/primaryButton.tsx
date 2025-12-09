import { Button } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

interface ButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  size?: number;
  testID: string;
  disabled?: boolean
}

export default function DialogCustom({
  title,
  onPress,
  size = 16,
  testID,
  disabled = false,
}: ButtonProps) {
  return (
    <Button
      mode="contained"
      onPress={onPress}
      testID={testID}
      disabled={disabled}
      labelStyle={{
        fontSize: Math.min(size * scale, 24),
        color: BASE_COLORS.WHITE,
        fontFamily: FontFamilies.BODY,
      }}
      style={{
        borderRadius: 30,
        backgroundColor: disabled? BASE_COLORS.STONE300 : BASE_COLORS.TEXT_DARK,
      }}
    >{title}</Button>
  );
}