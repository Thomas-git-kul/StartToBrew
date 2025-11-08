import { Appbar } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";

interface HeaderBarProps {
  title: string;
  iconName?: string;
  onIconPress?: () => void;
}

export default function HeaderBar({ title, iconName, onIconPress }: HeaderBarProps) {
  return (
    <Appbar.Header style={{ backgroundColor: BASE_COLORS.LIGHT_BG}} mode="center-aligned">
      <Appbar.Content  className="text-xl"
        title={title}
        titleStyle={{ fontFamily: FontFamilies.BODY_BOLD, color: BASE_COLORS.TEXT_DARK }}
      />
      {iconName && onIconPress && (
        <Appbar.Action
          icon={() => <MaterialIcons name={iconName as any} size={28} color={BASE_COLORS.TEXT_DARK} />}
          onPress={onIconPress}
        />
      )}
    </Appbar.Header>
  );
}