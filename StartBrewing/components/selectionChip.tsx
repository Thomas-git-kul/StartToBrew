import React from "react";
import { Dimensions } from "react-native";
import { Chip } from "react-native-paper";
import { Check } from "lucide-react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

interface SelectionChipProps {
  text: string;
  testID: string;
  isActive?: boolean;
  onPress: () => void;
}

export default function SelectionChip({ 
  text,
  testID,
  isActive=false,
  onPress,
}: SelectionChipProps) {
  return (
    <Chip
      mode="flat"
      testID={testID}
      selected={isActive}
      onPress={onPress}
      icon={
        isActive ? () => (<Check size={Math.min(14 * scale, 20)} color={BASE_COLORS.WHITE}/>) : undefined
      }
      textStyle={{
        color: isActive
          ? BASE_COLORS.WHITE
          : BASE_COLORS.STONE500,
        fontFamily: FontFamilies.BODY,
        fontSize: Math.min(14 * scale, 16),
      }}
      style={{
        backgroundColor: isActive
          ? BASE_COLORS.ACCENT_PRIMARY
          : BASE_COLORS.WHITE,
        borderColor: isActive
          ? BASE_COLORS.WHITE
          : BASE_COLORS.STONE300,
        borderWidth: 1,
        height: Math.min(40 * scale, 50),
        paddingVertical: 0,
        marginVertical: 5,
        alignItems: "center",
      }}
    >{text}</Chip>
  );
}