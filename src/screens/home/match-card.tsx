import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Avatar } from "@/components/avatar";
import { Card } from "@/components/card";
import { Text } from "@/components/text";
import { makeStyles, radius, spacing, useColors } from "@/theme";
import type { MatchSummary, PublicUser } from "@/data/types";

export type MatchCardProps = {
  summary: MatchSummary;
  /** Faces of the people who matched. Shown instead of a generic icon. */
  people: PublicUser[];
  /**
   * Omitted when the card is an explainer rather than a destination — with no
   * commute yet there is nothing to open, and a second button pointing at the
   * setup flow would just repeat the card above it.
   */
  onPress?: () => void;
};

type Copy = { title: string; body: string };

/**
 * One component, five states. None of them is an error: "nobody yet" is the
 * expected experience early in a campus, and the copy says so rather than
 * reading like a failed search.
 */
function copyFor(summary: MatchSummary): Copy {
  const campus = summary.campusName || "your campus";

  switch (summary.state) {
    case "matches":
      return {
        title:
          summary.count === 1
            ? "1 person matches your commute"
            : `${summary.count} people match your commute`,
        body: "Same campus, similar days and times",
      };
    case "noDayMatch":
      return {
        title: "Nobody on your days yet",
        body: `People at ${campus} are travelling, but not on the days you picked.`,
      };
    case "noTimeMatch":
      return {
        title: "Same days, different times",
        body: "Your commute days overlap, but the travel times do not.",
      };
    case "noCommute":
      return {
        title: "Find your commute people",
        body: `Once your commute is set up, we look for ${campus} students and faculty travelling on similar days and times.`,
      };
    default:
      return {
        title: "You're early here",
        body: `Nobody at ${campus} matches your commute yet. We keep looking as more people join.`,
      };
  }
}

/**
 * The whole card is the control, with a chevron on the right. A button inside
 * a card gives two tap targets for one action and makes the card look busier
 * than the thing it is announcing.
 *
 * The headline sits top-left and the faces sit under it, so the sentence is
 * the first thing read and the people are the evidence for it.
 */
export function MatchCard({ summary, people, onPress }: MatchCardProps) {
  const styles = useStyles();
  const colors = useColors();
  const copy = copyFor(summary);

  const faces = people.slice(0, 5);
  const extra = Math.max(0, summary.count - faces.length);
  const showFaces = summary.state === "matches" && faces.length > 0;

  return (
    <Card tone="ride" padding="regular" onPress={onPress}>
      <View style={styles.headRow}>
        <View style={styles.copy}>
          <Text variant="h4">{copy.title}</Text>
          <Text variant="bodySmall" tone="secondary">
            {copy.body}
          </Text>
        </View>
        {onPress ? (
          <Feather name="chevron-right" size={20} color={colors.textTertiary} />
        ) : null}
      </View>

      {showFaces ? (
        <View style={styles.faces}>
          {faces.map((person, index) => (
            <View
              key={person.id}
              style={[styles.face, index > 0 && styles.faceOverlap]}
            >
              <Avatar
                name={person.firstName}
                photoUrl={person.photoUrl}
                size="sm"
              />
            </View>
          ))}
          {extra > 0 ? (
            <View style={[styles.face, styles.faceOverlap, styles.more]}>
              <Text variant="caption" tone="secondary">
                +{extra}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const FACE = 32;

const useStyles = makeStyles((c) => ({
  headRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  faces: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.base,
  },
  face: {
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: c.rideCard,
  },
  faceOverlap: {
    marginLeft: -10,
  },
  more: {
    width: FACE,
    height: FACE,
    borderRadius: radius.full,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
  },
}));
