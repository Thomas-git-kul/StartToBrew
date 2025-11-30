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
  isCompleted?: boolean;
}

export default function Stepper({ step, total, onNext, onPrev, isCompleted = false }: StepperProps) {
  return (
    <View className="flex-row items-center justify-between">
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
      >
        <View className="flex-row items-center justify-content"
          style={{
            marginLeft: -8,
          }}
        >
          <ChevronLeft/>
          <Text>Previous</Text>
        </View>
      </Button>

      {/* Step Display */}
      <Text
        style={{
          fontSize: 16,
          fontFamily: isCompleted ? FontFamilies.BODY : FontFamilies.BODY_BOLD,
          color: BASE_COLORS.STONE600,
        }}
      >
        Step {step} / {total}
      </Text>

      {/* Next */}
      <Button
        mode="contained"
        onPress={onNext}
        disabled={!isCompleted || step >= total}
        labelStyle={{
          fontSize: 16,
          color: BASE_COLORS.WHITE,
          fontFamily: FontFamilies.BODY,
        }}
        style={{
          borderRadius: 30,
          backgroundColor: isCompleted ? BASE_COLORS.TEXT_DARK : BASE_COLORS.STONE200,
        }}
      >Next</Button>
    </View>
  );
}
