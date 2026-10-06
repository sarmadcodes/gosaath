import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/button";
import { Segmented } from "@/components/segmented";
import { Sheet } from "@/components/sheet";
import { Text } from "@/components/text";
import { makeStyles, spacing } from "@/theme";
import { api } from "@/services";
import { ApiError } from "@/services/http";
import type { Commute, User } from "@/data/types";

/**
 * Finding a ride, or offering one.
 *
 * Two tabs rather than a question with three answers. "Both" existed as an
 * option and was the source of most of the confusion: it quietly required a
 * car to set up a commute at all, and nobody could say what it meant for a
 * person who drives on Mondays and rides on Thursdays. One mode at a time is
 * something a person can hold in their head, and switching is a tap.
 *
 * The switch is deliberately not optimistic. Three things can refuse it —
 * verification, a missing car, and people already relying on this commute —
 * and two of them are refusals the server makes. Flipping the tab first and
 * flipping it back on failure would be a UI that lies for a second, about
 * exactly the state somebody is trying to change.
 */

type Mode = "find" | "offer";

/** Legacy commutes carry "both"; they behave as offering, which is what they do. */
function modeOf(commute: Commute | null): Mode {
  return commute && commute.intent !== "find" ? "offer" : "find";
}

export function ModeToggle({
  me,
  commute,
  hasVehicle,
  onChanged,
}: {
  me: User;
  commute: Commute | null;
  hasVehicle: boolean;
  onChanged: () => void;
}) {
  const styles = useStyles();
  const mode = modeOf(commute);

  const [switching, setSwitching] = useState(false);
  const [blocked, setBlocked] = useState<{
    title: string;
    body: string;
    action?: { label: string; go: () => void };
  } | null>(null);

  async function choose(next: Mode) {
    if (next === mode || switching) return;

    // No commute yet: there is nothing to switch, so this is just a way in.
    if (!commute) {
      router.push(next === "offer" ? "/driver/offer" : "/commute/create");
      return;
    }

    if (next === "offer") {
      // Checked here so the person is told which step they are missing, in a
      // sheet that takes them to it. The server enforces the same two rules —
      // this is the explanation, not the enforcement.
      if (me.badgeStatus !== "approved") {
        setBlocked(
          me.badgeStatus === "pending"
            ? {
                title: "Your verification is being reviewed",
                body: "You can offer seats as soon as it is approved. We will let you know.",
              }
            : {
                title: "Verify your account first",
                body: "Offering seats means people get into your car. We verify every driver before that happens — it takes a minute.",
                action: {
                  label: "Verify now",
                  go: () => router.push("/verification"),
                },
              },
        );
        return;
      }

      if (!hasVehicle) {
        setBlocked({
          title: "Add your car first",
          body: "Passengers see the make, colour and number plate so they know which car to get into.",
          action: {
            label: "Add a car",
            go: () => router.push("/vehicles/edit"),
          },
        });
        return;
      }
    }

    setSwitching(true);
    try {
      await api.commutes.update(commute.id, { intent: next });
      onChanged();
    } catch (error) {
      // The server refuses a switch that would strand somebody, and its
      // message names how many people are affected. Shown as it is written
      // rather than replaced with something vaguer.
      setBlocked({
        title: next === "find" ? "People are counting on this ride" : "You have a seat booked",
        body:
          error instanceof ApiError
            ? error.message
            : "That change could not be saved. Try again.",
        action: {
          label: "See my rides",
          go: () => router.push("/(tabs)/rides"),
        },
      });
    } finally {
      setSwitching(false);
    }
  }

  return (
    <>
      <View style={styles.wrap}>
        <Segmented<Mode>
          value={mode}
          onChange={(next) => void choose(next)}
          options={[
            { value: "find", label: "Find a ride" },
            { value: "offer", label: "Offer a ride" },
          ]}
        />
        <Text variant="caption" tone="tertiary" style={styles.caption}>
          {mode === "find"
            ? "You are looking for a seat on someone's commute."
            : "You are offering seats on your commute."}
        </Text>
      </View>

      <Sheet
        visible={blocked !== null}
        onClose={() => setBlocked(null)}
        title={blocked?.title ?? ""}
        caption={blocked?.body ?? ""}
      >

        {blocked?.action ? (
          <Button
            label={blocked.action.label}
            block
            style={styles.action}
            onPress={() => {
              const go = blocked.action!.go;
              setBlocked(null);
              go();
            }}
          />
        ) : null}
      </Sheet>
    </>
  );
}

const useStyles = makeStyles(() => ({
  wrap: {
    gap: spacing.xs,
  },
  caption: {
    paddingHorizontal: spacing.xs,
  },
  action: {
    marginTop: spacing.md,
  },
}));
