import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { router, usePathname } from "expo-router";

/**
 * Swiping left and right between the four tabs.
 *
 * Bottom tabs do not swipe. The alternative was a top-tab navigator with a
 * pager underneath, which means a new native dependency, a different tab bar
 * and a rebuild — a lot of moving parts for one gesture. This recognises the
 * fling with the gesture handler already in the project and navigates, which
 * leaves everything else exactly as it was.
 *
 * What it does not do is drag the screen under your finger. That is the one
 * thing a real pager gives you that this cannot, and it is the reason to
 * revisit this if the app ever grows a pager for another reason.
 */

/** Left to right, matching the order in the tab bar. */
const TABS = ["/", "/commute", "/rides", "/profile"] as const;

/**
 * How far, and how fast, before it counts.
 *
 * Both are required rather than either. Distance alone fires on a slow drag
 * that was meant to be a scroll; velocity alone fires on a twitch.
 */
const DISTANCE = 60;
const VELOCITY = 400;

export function TabSwipe({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const go = (direction: -1 | 1) => {
    const current = TABS.indexOf(pathname as (typeof TABS)[number]);
    if (current === -1) return;

    const next = current + direction;
    // Stops at the ends rather than wrapping. Wrapping from Profile back to
    // Home makes the four tabs feel like a carousel with no edges, and you
    // lose track of where you are.
    if (next < 0 || next >= TABS.length) return;

    // Confirms the swipe took, which matters more here than on a button:
    // there is no pressed state on a gesture, so without it a swipe that
    // lands and one that falls short feel identical until the screen changes.
    void Haptics.selectionAsync();

    // navigate, not push: tabs are places, and pushing would build a back
    // stack of them that the hardware back button then walks through.
    router.navigate(TABS[next]!);
  };

  const pan = Gesture.Pan()
    // The handler navigates, which is a JS-thread concern. Asking the gesture
    // to deliver its callbacks there is simpler than marshalling out of a
    // worklet, and this fires once at the end of a fling rather than every
    // frame, so there is nothing to gain from the UI thread.
    .runOnJS(true)
    // Horizontal intent has to be established before this takes the gesture,
    // or a vertical scroll inside the screen gets stolen on its first few
    // pixels and the list stutters.
    .activeOffsetX([-20, 20])
    .failOffsetY([-18, 18])
    .onEnd((event) => {
      if (Math.abs(event.translationX) < DISTANCE) return;
      if (Math.abs(event.velocityX) < VELOCITY) return;
      // Vertical movement that dominates was a scroll that drifted, not a
      // swipe.
      if (Math.abs(event.translationY) > Math.abs(event.translationX)) return;

      go(event.translationX < 0 ? 1 : -1);
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.fill}>{children}</View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
