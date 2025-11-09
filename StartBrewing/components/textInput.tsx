import { TextInput } from "react-native-paper";
import { BASE_COLORS } from "@/constants/Colors";

interface textInputProps {
  label: string;
}

export default function textInput({ label }: textInputProps) {
  return (
    <TextInput
        label={label} 
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