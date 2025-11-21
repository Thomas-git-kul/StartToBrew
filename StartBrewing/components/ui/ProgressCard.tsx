import React from "react";
import { View, StyleSheet, Dimensions, Text, TouchableOpacity } from "react-native";
import { ProgressBar, TouchableRipple, Card } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

const IMAGE_WIDTH = Math.min(120, SCREEN_WIDTH * 0.20);
const IMAGE_HEIGHT = IMAGE_WIDTH * 1.5;

interface ProgressCardProps {
    title: string;
    progress: number;
    onPress?: () => void;
}

export default function ProgressCard({ title, progress, onPress }: ProgressCardProps) {
const navigation = useNavigation();
const percentage = Math.round(progress * 100);


return (
  <TouchableRipple
      onPress={onPress}
      rippleColor="rgba(0,0,0,0.08)"
      className="mb-3 rounded-xl overflow-hidden"
  >
    <Card
      mode="elevated"
      style={{ 
        borderRadius: 12,
        padding: 16,
        backgroundColor: BASE_COLORS.WHITE,
        marginBlock: 3,
        marginInline: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Text 
          style={{
              fontSize: Math.min(16 * scale, 24),
              fontFamily: FontFamilies.BODY,
              color: BASE_COLORS.STONE700,
              marginBottom: 6,
          }}
      >{title}</Text>
      <Text 
          style={{
              fontSize: Math.min(14 * scale, 18),
              fontFamily: FontFamilies.BODY_BOLD,
              color: BASE_COLORS.ACCENT_PRIMARY,
          }}
      >{percentage}%</Text>
      <ProgressBar
          progress={progress}
          color={BASE_COLORS.ACCENT_PRIMARY}
          style={{
              height: Math.min(10 * scale, 12),
              borderRadius: 6,
          }}
      />
    </Card>
    </TouchableRipple>
  );
}


const styles = StyleSheet.create({
container: {
backgroundColor: BASE_COLORS.WHITE,
padding: 16,
borderRadius: 12,
elevation: 3,
shadowColor: "#000",
shadowOpacity: 0.05,
shadowRadius: 3,
shadowOffset: { width: 0, height: 2 },
marginVertical: 10,
},
title: {
fontSize: 20,
fontFamily: FontFamilies.HEADING,
color: BASE_COLORS.TEXT_DARK,
marginBottom: 6,
},
percentage: {
fontSize: 14,
fontFamily: FontFamilies.BODY,
color: BASE_COLORS.TEXT_DARK,
marginBottom: 8,
},
progressBar: {
height: 10,
borderRadius: 6,
},
});
