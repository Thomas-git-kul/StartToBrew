import { Appbar } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import React from "react";

interface HeaderBarProps {
  title: string;
  iconName?: string; // optional icon name
  onIconPress?: () => void; // optional handler
}

export default function HeaderBar({ title, iconName, onIconPress }: HeaderBarProps) {
  return (
    <Appbar.Header style={{ backgroundColor: BASE_COLORS.LIGHT_BG, paddingTop: 8, paddingBottom: 8 }}>
      <Appbar.Content
        title={title}
        titleStyle={{ fontSize: 36, fontFamily: FontFamilies.HEADING, color: BASE_COLORS.TEXT_DARK }}
      />
      {iconName && onIconPress && (
        <Appbar.Action
          icon={() => <MaterialIcons name={iconName as any} size={28} color={BASE_COLORS.TEXT_DARK} />}
          onPress={onIconPress}
        />
      )}
    </Appbar.Header>
  );
}