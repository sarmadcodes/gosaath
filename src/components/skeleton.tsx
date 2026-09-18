import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  View,
  ViewStyle,
} from "react-native";
import { Card } from "@/components/card";
import { makeStyles, radius, spacing, useColors } from "@/theme";

type BlockProps = {
  width?: number | `${number}%`;
  height?: number;
  /** Fully rounded, for avatars and chips. */
  circle?: boolean;
  style?: ViewStyle;
};

/** Slices making up the soft highlight. Odd count keeps it symmetrical. */
const SLICES = 9;
const SWEEP_MS = 1150;
const BREATHE_MS = 900;
const REST_MS = 420;

/**
 * Bell-shaped opacity across the sweep, so the highlight has soft edges
 * instead of reading as a bright bar sliding past.
 */
const FALLOFF = Array.from({ length: SLICES }, (_, i) => {
  const t = (i / (SLICES - 1)) * 2 - 1;
  return Math.exp(-(t * t) * 2.2);
});

function useLoop(active: boolean, duration: number) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    // A small random offset per block so placeholders do not all move in
    // lockstep, which is what makes a loading screen look mechanical.
    const stagger = Math.random() * 320;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(stagger),
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(REST_MS),
      ]),
      { resetBeforeIteration: true },
    );
    loop.start();
    return () => loop.stop();
  }, [value, active, duration]);

  return value;
}

function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      cancelled = true;
      sub?.remove?.();
    };
  }, []);

  return reduceMotion;
}

/**
 * One placeholder shape.
 *
 * A soft highlight sweeps across a flat base. That needs the block's width in
 * pixels, and `onLayout` does not fire for these views on React Native Web —
 * so where no measurement arrives, it falls back to a slow breathe rather than
 * sitting there completely static. Both paths use the native driver.
 */
export function SkeletonBlock({
  width = "100%",
  height = 14,
  circle,
  style,
}: BlockProps) {
  const styles = useStyles();
  const colors = useColors();
  const reduceMotion = useReduceMotion();
  const [measured, setMeasured] = useState(0);

  const canSweep = measured > 0 && !reduceMotion;
  const progress = useLoop(!reduceMotion, canSweep ? SWEEP_MS : BREATHE_MS);

  const sweepWidth = Math.max(40, measured * 0.55);
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-sweepWidth, measured + sweepWidth],
  });
  const breathe = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.62, 1, 0.62],
  });

  return (
    <Animated.View
      onLayout={(event) => {
        const next = event.nativeEvent.layout.width;
        if (next && Math.abs(next - measured) > 0.5) setMeasured(next);
      }}
      style={[
        styles.block,
        { width, height },
        circle && { borderRadius: height / 2 },
        !canSweep && !reduceMotion && { opacity: breathe },
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {canSweep ? (
        <Animated.View
          style={[
            styles.sweep,
            { width: sweepWidth, transform: [{ translateX }] },
          ]}
        >
          {FALLOFF.map((opacity, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                opacity,
                backgroundColor: colors.skeletonHighlight,
              }}
            />
          ))}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

/** A run of text lines, with the last one short like real wrapped copy. */
export function SkeletonText({
  lines = 2,
  height = 13,
  gap = spacing.sm,
}: {
  lines?: number;
  height?: number;
  gap?: number;
}) {
  const widths: `${number}%`[] = ["100%", "92%", "96%", "88%"];
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonBlock
          key={i}
          height={height}
          width={i === lines - 1 ? "62%" : widths[i % widths.length]}
        />
      ))}
    </View>
  );
}

/** Avatar plus two lines: the shape of every person row in the product. */
export function SkeletonPerson({ size = 40 }: { size?: number }) {
  const styles = useStyles();
  return (
    <View style={styles.header}>
      <SkeletonBlock width={size} height={size} circle />
      <View style={styles.headerCopy}>
        <SkeletonBlock width="46%" height={15} />
        <SkeletonBlock width="32%" height={12} />
      </View>
    </View>
  );
}

/** Generic card placeholder: a heading and a couple of detail lines. */
export function SkeletonCard({
  lines = 2,
  tone,
}: {
  lines?: number;
  tone?: "ride" | "default";
}) {
  const styles = useStyles();
  return (
    <Card tone={tone === "ride" ? "ride" : undefined} padding="regular">
      <SkeletonBlock width="54%" height={17} />
      <View style={styles.body}>
        <SkeletonText lines={lines} />
      </View>
    </Card>
  );
}

/** Matches the shape of a ride card so the layout does not jump on load. */
export function RideCardSkeleton() {
  const styles = useStyles();
  return (
    <Card tone="ride" accessibilityLabel="Loading rides">
      <SkeletonPerson />
      <View style={styles.body}>
        <SkeletonBlock width="70%" height={13} />
        <SkeletonBlock width="55%" height={13} />
      </View>
      <View style={styles.footer}>
        <SkeletonBlock width={82} height={20} />
        <SkeletonBlock width={68} height={20} />
      </View>
    </Card>
  );
}

/** Rows inside a grouped Card, as used for settings and pickers. */
export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  const styles = useStyles();
  return (
    <Card padding="none">
      {Array.from({ length: rows }, (_, i) => (
        <View
          key={i}
          style={[styles.row, i !== rows - 1 && styles.rowDivider]}
        >
          <SkeletonBlock width={20} height={20} circle />
          <SkeletonBlock width={`${52 - i * 6}%`} height={14} />
        </View>
      ))}
    </Card>
  );
}

/**
 * The Home screen body while it resolves.
 *
 * Mirrors the real hierarchy — the tall card that carries today, the match
 * card, then the two action tiles — so nothing shifts position once the data
 * lands. The header is not included: Home renders its real one above this,
 * and duplicating it would show two greetings at once.
 */
export function HomeSkeleton() {
  const styles = useStyles();
  return (
    <View style={styles.stack}>
      <SkeletonBlock height={214} style={styles.tall} />
      <SkeletonBlock height={96} style={styles.tall} />
      <View style={styles.tiles}>
        <SkeletonBlock height={88} style={styles.tile} />
        <SkeletonBlock height={88} style={styles.tile} />
      </View>
    </View>
  );
}

/** A form while its account data loads: a short intro, then grouped fields. */
export function SkeletonForm({ groups = 2 }: { groups?: number }) {
  const styles = useStyles();
  return (
    <View style={styles.stack}>
      <SkeletonText lines={2} />
      {Array.from({ length: groups }, (_, i) => (
        <View key={i} style={styles.group}>
          <SkeletonBlock width="38%" height={14} />
          <SkeletonBlock height={i === 0 ? 132 : 96} style={styles.tall} />
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  block: {
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  sweep: {
    position: "absolute",
    top: 0,
    bottom: 0,
    flexDirection: "row",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  body: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  stack: {
    gap: spacing.lg,
  },
  group: {
    gap: spacing.md,
  },
  tall: {
    borderRadius: radius.lg,
  },
  tiles: {
    flexDirection: "row",
    gap: spacing.md,
  },
  tile: {
    flex: 1,
    borderRadius: radius.lg,
  },
}));
