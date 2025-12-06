import { Button } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

interface ButtonProps {
  title: string;
  onPress: () => void;
  size?: number;
  testID: string;
}

export default function DialogCustom({
  title,
  onPress,
  size = 16,
  testID,
}: ButtonProps) {
  return (
    <Button
      mode="text"
      testID={testID}
      onPress={onPress}
      labelStyle={{
          fontSize: Math.min(size * scale, 24),
          fontFamily: FontFamilies.BODY,
          color: BASE_COLORS.TEXT_DARK,
      }}
      >{title}</Button>
  );
}