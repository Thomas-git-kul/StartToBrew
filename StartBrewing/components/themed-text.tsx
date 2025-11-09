import { StyleSheet, Text, type TextProps, Dimensions } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BASE_COLORS } from "@/constants/Colors";
import { FontFamilies } from "@/constants/Fonts";

// Get screen width
const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Base width that your original font sizes were designed for
const BASE_SCREEN_WIDTH = 375; 
// Scale factor
const scale = SCREEN_WIDTH / BASE_SCREEN_WIDTH;

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'defaultText' | 'title' | 'subTitle' | 'small' | 'link';
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
        type === 'small' ? styles.small : undefined,
        type === 'link' ? styles.link : undefined,
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
    paddingTop: 10,
    fontSize: 17 * scale,
    fontFamily: FontFamilies.BODY,
    color: BASE_COLORS.ACCENT_PRIMARY,
  },
  subTitle: {
    fontSize: 12 * scale,
    fontFamily: FontFamilies.BODY_LIGHT,
    color: BASE_COLORS.STONE950,
  },
  small: {
    fontSize: 10 * scale,
    fontFamily: FontFamilies.HEADING,
    color: BASE_COLORS.STONE500,
  },
  link: {
    lineHeight: 30 * scale,
    fontSize: 16 * scale,
    color: '#0a7ea4',
  },
});
