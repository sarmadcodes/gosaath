import { View } from "react-native";
import { Text } from "@/components/text";
import { makeStyles, spacing, useColors } from "@/theme";

export type WordmarkProps = {
  size?: "sm" | "md" | "lg";
  /** Renders on a brand-filled surface, such as the splash screen. */
  inverted?: boolean;
  markOnly?: boolean;
};

const marks = { sm: 28, md: 36, lg: 48 } as const;

/**
 * The GoSaath mark: two dots riding one shared line, set on a diagonal.
 *
 * "Saath" is together, so the idea is two people on a single route rather
 * than one traveller going somewhere. Two equal dots say neither is the
 * driver and neither is the passenger, which is exactly how the product
 * treats them.
 *
 * Built from plain views so it needs no SVG dependency and stays crisp from
 * tab-bar size up to the splash screen.
 */
export function Mark({
  size,
  color,
  background,
}: {
  size: number;
  color: string;
  background: string;
}) {
  const styles = useStyles();

  const dot = Math.max(3, size * 0.17);
  const line = Math.max(1.5, size * 0.055);
  const railWidth = size * 0.62;

  return (
    <View
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: size * 0.29,
          backgroundColor: background,
        },
      ]}
    >
      <View style={[styles.rail, { width: railWidth, height: dot }]}>
        {/* The shared route sits behind, quieter than the people on it. */}
        <View
          style={[
            styles.line,
            {
              height: line,
              borderRadius: line,
              backgroundColor: color,
              opacity: 0.45,
            },
          ]}
        />
        <View style={styles.dots}>
          <View
            style={{
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: color,
            }}
          />
          <View
            style={{
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: color,
            }}
          />
        </View>
      </View>
    </View>
  );
}

export function Wordmark({ size = "md", inverted, markOnly }: WordmarkProps) {
  const styles = useStyles();
  const colors = useColors();

  const dimension = marks[size];
  const fg = inverted ? colors.brand : colors.onBrand;
  const bg = inverted ? colors.onBrand : colors.brand;

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="image"
      accessibilityLabel="GoSaath"
    >
      <Mark size={dimension} color={fg} background={bg} />

      {markOnly ? null : (
        <Text
          variant={size === "lg" ? "h1" : "h2"}
          tone={inverted ? "onBrand" : "primary"}
        >
          GoSaath
        </Text>
      )}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  mark: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  rail: {
    alignItems: "center",
    justifyContent: "center",
    // The diagonal is what turns two dots on a line into travel.
    transform: [{ rotate: "-32deg" }],
  },
  line: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
}));
