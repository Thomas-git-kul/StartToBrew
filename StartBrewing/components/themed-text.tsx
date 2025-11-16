import { StyleSheet, Text, type TextProps, Dimensions } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_SCREEN_WIDTH = 375; 
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'defaultText' | 'title' | 'subTitle' | 'smallText' | 'darkAccent' | 'numbers' | 'titleBlack';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'defaultText',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'defaultText' ? styles.defaultText : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'subTitle' ? styles.subTitle : undefined,
        type === 'smallText' ? styles.smallText : undefined,
        type === 'darkAccent' ? styles.darkAccent : undefined,
        type === 'numbers' ? styles.numbers : undefined,
        type === 'titleBlack' ? styles.titleBlack : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  defaultText: {
    fontSize: 12 * scale,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.STONE700,
  },
  title: {
    fontSize: 17 * scale,
    fontFamily: FontFamilies.BODY_BOLD,
    color: BASE_COLORS.ACCENT_PRIMARY,
  },
  subTitle: {
    fontSize: 12 * scale,
    fontFamily: FontFamilies.BODY,
    color: BASE_COLORS.STONE950,
  },
  smallText: {
    fontSize: 10 * scale,
    fontFamily: FontFamilies.BODY_LIGHT,
    color: BASE_COLORS.STONE500,
  },
  darkAccent: {
    fontSize: 17 * scale,
    fontFamily: FontFamilies.BODY_BLACK,
    color: BASE_COLORS.TEXT_DARK,
  },
  numbers: {
    fontSize: 15 * scale,
    fontFamily: FontFamilies.BODY,
    color: BASE_COLORS.STONE600
  },
  titleBlack: {
    fontSize: 25 * scale,
    fontFamily: FontFamilies.BODY_BOLD,
    color: BASE_COLORS.TEXT_DARK
  },
});
