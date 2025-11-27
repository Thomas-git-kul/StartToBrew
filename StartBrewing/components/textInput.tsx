import { useState } from "react";
import { View, TextInput, Pressable, Dimensions } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BASE_SCREEN_WIDTH = 375;
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

interface textInputProps {
  placeholder: string;
  onChangeText: (text: string) => void;
  value?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  maxLength?: number;
  style?: object;
}

export default function CustomTextInput({
  placeholder,
  onChangeText,
  value,
  secureTextEntry = false,
  multiline = false,
  numberOfLines,
  keyboardType = "default",
  maxLength,
  style,
}: textInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const borderColor = focused
    ? BASE_COLORS.ACCENT_PRIMARY
    : BASE_COLORS.STONE300;

  return (
    <View 
      style={{ 
        marginBottom: 12,
      }}
    >
      <TextInput
        placeholder={placeholder}
        onChangeText={onChangeText}
        value={value}
        secureTextEntry={secureTextEntry && !showPassword}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        maxLength={maxLength}
        enterKeyHint="done"

        placeholderTextColor={BASE_COLORS.STONE400}
        selectionColor={BASE_COLORS.ACCENT_PRIMARY}
        style={{
          backgroundColor: BASE_COLORS.WHITE,
          borderRadius: 6,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: Math.min(14 * scale, 20),
          fontFamily: FontFamilies.BODY_LIGHT,
          color: BASE_COLORS.STONE700,
          borderWidth: 1,
          borderColor: borderColor,
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {secureTextEntry && (
        <Pressable
          onPress={() => setShowPassword((prev) => !prev)}

        >
          {showPassword ? (
            <EyeOff size={Math.min(20 * scale, 30)} color={BASE_COLORS.STONE300} />
          ) : (
            <Eye size={Math.min(20 * scale, 30)} color={BASE_COLORS.STONE300} />
          )}
        </Pressable>
      )}
    </View>
  );
}
