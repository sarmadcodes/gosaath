import { useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button } from "@/components/button";
import { Text } from "@/components/text";
import { Wordmark } from "@/components/wordmark";
import { makeStyles, radius, spacing, useColors } from "@/theme";
import { markOnboardingComplete } from "@/services/storage";

type Page = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  body: string;
  points: string[];
};

const PAGES: Page[] = [
  {
    icon: "sunrise",
    title: "Your campus. Your commute. Your people.",
    body: "GoSaath helps students and faculty find people from their own university who travel to campus around the same times.",
    points: [
      "Only people from your university",
      "Similar routes and timings",
      "Built for the same trip every week",
    ],
  },
  {
    icon: "repeat",
    title: "Find a ride, or share your empty seats.",
    body: "Whether you drive or not, you set your commute once and we keep matching you with people going the same way.",
    points: [
      "Find a ride to campus",
      "Offer seats in your car or bike",
      "Be a passenger some days, a driver on others",
    ],
  },
  {
    icon: "shield",
    title: "Built around your university.",
    body: "Your campus and general area are what we match on. Your exact address is never asked for, and never shown to anyone.",
    points: [
      "Confirmed with your university email",
      "Area-level location only",
      "No public profiles, no social feed",
    ],
  },
];

export default function Onboarding() {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const last = page === PAGES.length - 1;

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== page) setPage(next);
  }

  function goNext() {
    if (last) return finish();
    scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
  }

  async function finish() {
    // Remembered so the intro never interrupts a returning user, even if they
    // sign out later. It describes the product, not the account.
    await markOnboardingComplete();
    router.replace("/(auth)/user-type");
  }

  async function skip() {
    await markOnboardingComplete();
    router.replace("/(auth)/user-type");
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Wordmark size="sm" />
        {!last ? (
          <Pressable
            accessibilityRole="button"
            onPress={skip}
            hitSlop={12}
            style={styles.skip}
          >
            <Text variant="button" tone="secondary">
              Skip
            </Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={styles.flex}
      >
        {PAGES.map((item) => (
          <View key={item.title} style={[styles.page, { width }]}>
            <View style={styles.mark}>
              <Feather name={item.icon} size={26} color={colors.brand} />
            </View>

            <Text variant="display" style={styles.title}>
              {item.title}
            </Text>
            <Text variant="bodyLarge" tone="secondary">
              {item.body}
            </Text>

            <View style={styles.points}>
              {item.points.map((point) => (
                <View key={point} style={styles.point}>
                  <Feather name="check" size={16} color={colors.brand} />
                  <Text variant="body" tone="secondary" style={styles.flex}>
                    {point}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, spacing.base) },
        ]}
      >
        <View style={styles.dots} accessibilityLabel={`Page ${page + 1} of ${PAGES.length}`}>
          {PAGES.map((item, index) => (
            <View
              key={item.title}
              style={[styles.dot, index === page && styles.dotActive]}
            />
          ))}
        </View>

        <Button label={last ? "Get started" : "Next"} block onPress={goNext} />
        <Button
          label="I already have an account"
          variant="tertiary"
          block
          onPress={() => router.push("/(auth)/login")}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: {
    flex: 1,
    backgroundColor: c.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  skip: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  page: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing["2xl"],
    gap: spacing.base,
  },
  mark: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: c.brandSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: {
    marginBottom: spacing.xs,
  },
  points: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  point: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    gap: spacing.sm,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: c.border,
  },
  dotActive: {
    backgroundColor: c.brand,
    width: 22,
  },
}));
