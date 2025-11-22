import React, { useState } from "react";
import { TextInput } from "react-native-paper";
import { Eye, EyeOff } from "lucide-react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";

interface textInputProps {
  label: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  multiline?: boolean,
  numberOfLines?: number;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
}

export default function textInput({ 
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  multiline = false,
  numberOfLines,
  keyboardType = "default",
}: textInputProps) {

  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const iconColor = focused ? BASE_COLORS.STONE600 : BASE_COLORS.STONE300;
  const renderPasswordIcon = () => (
    showPassword ? (
      <EyeOff size={20} color={iconColor} />
    ) : (
      <Eye size={20} color={iconColor} />
    )
  );

  return (
    <TextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry && !showPassword}
      multiline={multiline}
      numberOfLines={numberOfLines}
      keyboardType={keyboardType}

      mode="outlined" 
      outlineColor={BASE_COLORS.STONE300}
      activeOutlineColor={BASE_COLORS.ACCENT_PRIMARY}
      textColor={BASE_COLORS.STONE900}
      style={{ backgroundColor: BASE_COLORS.WHITE }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      right={
        secureTextEntry
          ? (
            <TextInput.Icon
              icon={renderPasswordIcon}
              onPress={() => setShowPassword(prev => !prev)}
              forceTextInputFocus={false}
            />
          )
          : undefined
      }
    ></TextInput>
  );
}