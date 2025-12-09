import React from "react";
import { View, Text } from "react-native";
import { Card } from "react-native-paper"
import { Image } from "expo-image";
import { BASE_COLORS } from "@/constants/Colors";

type BadgeProps = {
  id_badge: number;
  icon_url?: string | null;
  code?: string;
  onPress: () => void;
};

export default function Badge({ 
  id_badge, icon_url, onPress 
}: BadgeProps) {
  return (
    <Card
      key={id_badge}
      mode="contained"
      style={{
        backgroundColor: BASE_COLORS.WHITE,
        borderRadius: 12,
        width: "100%",
        height: "100%",
        alignItems: "center",
        overflow: "hidden",
        /*
        shadowColor: BASE_COLORS.STONE700,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        */
        borderWidth: 1,
        borderColor: BASE_COLORS.STONE300,
      }}
      onPress={onPress}
    >
      {icon_url ? (
        <Image
          source={{ uri: icon_url }}
          style={{
            width: 95,
            height: 95,
          }}
        />
      ) : (
        <View>
          <Text>★</Text>
        </View>
      )}
    </Card>
  );
}
