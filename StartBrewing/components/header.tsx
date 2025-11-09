import { Appbar } from "react-native-paper";
import * as Icons from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";

interface HeaderBarProps {
  title: string;
  iconName?: keyof typeof Icons;
  onIconPress?: () => void;
  actionTestID?: string;
}

export default function HeaderBar({ title, iconName, onIconPress, actionTestID }: HeaderBarProps) {
  const IconComponent: LucideIcon | null = iconName
    ? (Icons[iconName] as LucideIcon)
    : null;

  return (
    <Appbar.Header style={{ backgroundColor: BASE_COLORS.LIGHT_BG }} mode="center-aligned">
      <Appbar.Content
        title={title}
        titleStyle={{ fontFamily: FontFamilies.BODY_BOLD, color: BASE_COLORS.TEXT_DARK }}
      />

      {IconComponent && onIconPress && (
        <Appbar.Action
          icon={() => (
            <IconComponent size={28} color={BASE_COLORS.TEXT_DARK} strokeWidth={2} />
          )}
          onPress={onIconPress}
          testID={actionTestID}
        />
      )}
    </Appbar.Header>
  );
}
