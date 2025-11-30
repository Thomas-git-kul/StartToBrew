import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Button } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";

interface StepperProps {
  step: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
}

export default function Stepper({ step, total, onNext, onPrev }: StepperProps) {
  return (
    <View className="flex-row items-center justify-between"
    
    >
      {/* Previous */}
      <Button
        mode="text"
        onPress={onPrev}
        disabled={step <= 1}
        labelStyle={{
            fontSize: 16,
            fontFamily: FontFamilies.BODY,
            color: BASE_COLORS.STONE600,
        }}
      >Previous</Button>

      {/* Step Display */}
      <Text
        style={{
          fontSize: 16,
          fontFamily: FontFamilies.BODY_BOLD,
          color: BASE_COLORS.STONE600,
        }}
      >
        Step {step} / {total}
      </Text>

      {/* Next */}
      <Button
        mode="contained"
        onPress={onNext}
        disabled={step >= total}
        labelStyle={{
          fontSize: 16,
          color: BASE_COLORS.WHITE,
          fontFamily: FontFamilies.BODY,
        }}
        style={{
          borderRadius: 30,
          backgroundColor: BASE_COLORS.TEXT_DARK,
        }}
      >Next</Button>
    </View>
  );
}
