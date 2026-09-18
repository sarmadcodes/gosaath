import { ReactNode, useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/text";
import { makeStyles, radius, spacing } from "@/theme";

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** Short line under the title explaining the consequence of the choice. */
  caption?: string;
  children: ReactNode;
};

/**
 * Bottom sheet for contextual choices: skipping a day, picking a time,
 * acting on a ride. Actions live here rather than in a nested screen so the
 * user keeps sight of what they were looking at.
 */
/**
 * The panel rises a short, fixed distance rather than sliding the full screen
 * height. Animating by window height means seeding the value from
 * useWindowDimensions, and that initial value goes stale whenever the window
 * changes size, which strands the sheet off-screen. A fixed offset cannot.
 */
const RISE = 28;

export function Sheet({ visible, onClose, title, caption, children }: SheetProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Short, eased travel. The motion confirms where the panel came from and
    // then gets out of the way.
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 200 : 150,
      useNativeDriver: true,
    }).start();
  }, [visible, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [RISE, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        accessibilityLabel="Close"
        accessibilityRole="button"
        onPress={onClose}
      />
      <Animated.View
        style={[
          styles.sheet,
          {
            // Capped so tall content — the time picker's columns, a long
            // option list — cannot run off the bottom of a short Android
            // screen with no way to reach the confirm button.
            maxHeight: height * 0.85,
            paddingBottom: Math.max(insets.bottom, spacing.base),
            opacity: progress,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.grabber} />
        {title ? (
          <View style={styles.header}>
            <Text variant="h3">{title}</Text>
            {caption ? (
              <Text variant="body" tone="secondary">
                {caption}
              </Text>
            ) : null}
          </View>
        ) : null}
        <View style={styles.body}>{children}</View>
      </Animated.View>
    </Modal>
  );
}

const useStyles = makeStyles((c) => ({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: c.overlay,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: c.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: c.border,
    marginBottom: spacing.base,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  body: {
    paddingBottom: spacing.sm,
  },
}));
