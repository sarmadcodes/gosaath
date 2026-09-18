import { Image, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "@/components/text";
import { makeStyles, radius, useColors } from "@/theme";

const sizes = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
} as const;

export type AvatarProps = {
  name: string;
  /** Optional profile photo. Falls back to initials when absent. */
  photoUrl?: string | null;
  size?: keyof typeof sizes;
  /** Draws the brand ring used to mark the driver within a commute group. */
  highlighted?: boolean;
  /** Sitting on the filled brand surface, where the usual border disappears. */
  onBrand?: boolean;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/**
 * Initials unless a photo is set. Photos are optional throughout the product,
 * and an initials mark degrades far better than a grey silhouette repeated
 * down a list.
 */
export function Avatar({
  name,
  photoUrl,
  size = "md",
  highlighted,
  onBrand,
}: AvatarProps) {
  const styles = useStyles();
  const colors = useColors();
  const dimension = sizes[size];
  const glyph = initials(name);

  return (
    <View
      accessible
      accessibilityLabel={name}
      style={[
        styles.base,
        {
          width: dimension,
          height: dimension,
          borderRadius: radius.full,
          borderWidth: highlighted ? 2 : 1,
          borderColor: onBrand
            ? "rgba(255,255,255,0.32)"
            : highlighted
              ? colors.brand
              : colors.border,
          backgroundColor: onBrand
            ? "rgba(255,255,255,0.16)"
            : undefined,
        },
      ]}
    >
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={{ width: dimension, height: dimension }}
          accessibilityIgnoresInvertColors
        />
      ) : glyph ? (
        <Text
          variant={size === "xl" ? "h2" : size === "lg" ? "h3" : "caption"}
          tone={onBrand ? "onBrand" : "secondary"}
        >
          {glyph}
        </Text>
      ) : (
        <Feather name="user" size={dimension * 0.45} color={colors.textTertiary} />
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  base: {
    backgroundColor: c.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
}));
