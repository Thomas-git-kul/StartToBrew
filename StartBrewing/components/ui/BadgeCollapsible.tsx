import React, { useState } from "react";
import { View, Pressable, Dimensions, StyleSheet } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { BASE_COLORS } from "@/constants/Colors";
import Badge from "@/components/ui/Badge";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GAP = 8; // Gap between badges
const COLUMNS = 3;
const badgeWidth = (SCREEN_WIDTH - GAP * (COLUMNS - 1)) / COLUMNS;

export type BadgeWithEarned = {
  id_badge: number;
  code: string;
  name: string;
  description: string | null;
  category: string;
  icon_url: string | null;
  earned_at: string;
};

type Props = {
  badges: BadgeWithEarned[];
  onBadgePress: (badge: BadgeWithEarned) => void;
};

export default function BadgeGridCollapsible({ badges, onBadgePress }: Props) {
  const [expanded, setExpanded] = useState(false);

  const visibleBadges = expanded ? badges : badges.slice(0, 3);

  return (
    <View style={{ marginVertical: 12 }}>
      <View style={styles.grid}>
        {visibleBadges.map((badge) => (
          <Badge
            key={badge.id_badge}
            badge={badge}
            size={badgeWidth}
            onPress={() => onBadgePress(badge)}
          />
        ))}
      </View>

      {badges.length > 3 && (
        <Pressable
          onPress={() => setExpanded(!expanded)}
          style={styles.chevronContainer}
        >
          {expanded ? (
            <ChevronUp size={24} color={BASE_COLORS.ACCENT_PRIMARY} />
          ) : (
            <ChevronDown size={24} color={BASE_COLORS.ACCENT_PRIMARY} />
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  chevronContainer: {
    alignSelf: "center",
    marginTop: 8,
  },
});
