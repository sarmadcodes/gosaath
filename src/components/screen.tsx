import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { makeStyles, spacing, useColors } from "@/theme";
import { usePullToRefresh } from "@/hooks/refresh-scope";

export type ScreenProps = {
  children: ReactNode;
  /** Pinned footer content, typically the primary action. Sits above the home indicator. */
  footer?: ReactNode;
  scroll?: boolean;
  /** Removes the default horizontal gutter for edge-to-edge content such as maps. */
  bleed?: boolean;
  background?: "background" | "surface";
  contentStyle?: StyleProp<ViewStyle>;
  /** Pull to refresh. On by default: it reloads every fetch on the screen. */
  refreshable?: boolean;
};

export const GUTTER = spacing.base;

/**
 * Every screen goes through here so that safe areas, the keyboard, and the
 * footer gutter behave identically across iOS and Android rather than being
 * re-solved per screen.
 */
export function Screen({
  children,
  footer,
  scroll = true,
  bleed,
  background = "background",
  contentStyle,
  refreshable = true,
}: ScreenProps) {
  const { refresh, refreshing } = usePullToRefresh();
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const backgroundColor =
    background === "surface" ? colors.surface : colors.background;

  const padding: ViewStyle = {
    paddingHorizontal: bleed ? 0 : GUTTER,
  };

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        padding,
        // Generous tail padding keeps the last row clear of the footer and the
        // home indicator on tall devices.
        { paddingBottom: footer ? spacing.base : insets.bottom + spacing["2xl"] },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        refreshable ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padding, contentStyle]}>{children}</View>
  );

  return (
    <View style={[styles.flex, { backgroundColor }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {body}
        {footer ? (
          <View
            style={[
              styles.footer,
              padding,
              { paddingBottom: Math.max(insets.bottom, spacing.base) },
            ]}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  flex: {
    flex: 1,
  },
  footer: {
    paddingTop: spacing.md,
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderTopColor: c.border,
    gap: spacing.sm,
  },
}));
