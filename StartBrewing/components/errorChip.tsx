import React from "react";
import { View, Dimensions } from "react-native";
import { Chip } from "react-native-paper";
import { CircleAlert } from "lucide-react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import StoreCard from "@/components/ui/StoreCard";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

const RED = "#bc1f2fff"
const LIGHT_RED="#f1c1c4ff"

interface ErrorProps {
  text: string;
}

export default function HeaderBar({ text }: ErrorProps) {
  return (
    <Chip
      mode="flat"
      icon={() => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
            <CircleAlert size={Math.min(18 * scale, 25)} color={RED} />
        </View>
      )}
      textStyle={{
          color: RED,
          fontFamily: FontFamilies.BODY,
          fontSize: Math.min(13 * scale, 20),
          marginTop: 8,
      }}
      style={{
        backgroundColor: LIGHT_RED,
        marginBottom: 6,
        alignItems: "center",
        alignSelf: "flex-start",
      }}
    >{text}</Chip>
  );
}