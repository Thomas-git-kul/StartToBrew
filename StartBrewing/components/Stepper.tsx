import React from "react";
import { View, Text } from "react-native";
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
            color: step <= 1 ? BASE_COLORS.STONE300 : BASE_COLORS.STONE600,
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
        mode="text"
        onPress={onNext}
        disabled={!isCompleted || step >= total}
        labelStyle={{
          fontSize: 16,
          fontFamily: FontFamilies.BODY,
          color: isCompleted ? BASE_COLORS.STONE600 : BASE_COLORS.STONE300,
        }}
      >
        <View className="flex-row items-center justify-content"
          style={{
            marginRight: -8,
          }}
        >
          <Text>Next</Text>
          <ChevronRight/>
        </View>
      </Button>
    </View>
  );
}

