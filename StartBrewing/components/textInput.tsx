import { TextInput } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";

interface textInputProps {
  label: string;
  value?: string;
  onChangeText?: (text: string) => void;
}

export default function textInput({ 
  label,
  value,
  onChangeText,
}: textInputProps) {

  return (
    <TextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      mode="outlined" 
      outlineColor={BASE_COLORS.STONE300}
      activeOutlineColor={BASE_COLORS.ACCENT_PRIMARY}
      textColor={BASE_COLORS.STONE900}
      className="mb-2"
      style={{
          backgroundColor: BASE_COLORS.WHITE
      }}
    >
    </TextInput>
  );
}