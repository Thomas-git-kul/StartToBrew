import { TextInput } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";

interface textInputProps {
  label: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
}

export default function textInput({ 
  label,
  value,
  onChangeText,
  secureTextEntry = false,
}: textInputProps) {

  return (
    <TextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      mode="outlined" 
      outlineColor={BASE_COLORS.STONE300}
      activeOutlineColor={BASE_COLORS.ACCENT_PRIMARY}
      textColor={BASE_COLORS.STONE900}
      className="mb-2"
      theme={{
        colors: {
          text: BASE_COLORS.STONE300, // Suggestion color
        },
        fonts: {
          regular: {
            fontFamily: FontFamilies.BODY, // Font family
          },
        },
      }}
      style={{
          backgroundColor: BASE_COLORS.WHITE,
      }}
    >
    </TextInput>
  );
}